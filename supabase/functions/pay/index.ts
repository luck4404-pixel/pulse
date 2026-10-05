// Pulse — payments (Pulse Pro subscriptions) via Razorpay
// Deploy: supabase functions deploy pay --project-ref mvbojueciwemmjohxvyh --no-verify-jwt
// Secrets: supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
//
// Security notes:
//  * the price is decided HERE, never by the app
//  * the payment signature is verified HERE with the secret key
//  * only this function (service role) can write to the subscriptions table
import { createClient } from 'npm:@supabase/supabase-js@2';

const PLANS: Record<string, { amount: number; days: number }> = {
  pro_monthly: { amount: 9900,  days: 30 },   // ₹99
  pro_yearly:  { amount: 79900, days: 365 },  // ₹799
  pro_trial:   { amount: 100,   days: 1 },    // ₹1 limited-time trial
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    // not configured yet -> tell the app politely instead of failing
    if (!keyId || !keySecret) return json({ error: 'payments_not_configured' });

    // who is asking?
    const auth = req.headers.get('Authorization') || '';
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData } = await admin.auth.getUser(auth.replace('Bearer ', ''));
    const user = userData && userData.user;
    if (!user) return json({ error: 'not_signed_in' });

    if (action === 'create_order') {
      const plan = PLANS[String(body.plan || '')];
      if (!plan) return json({ error: 'unknown_plan' });
      const r = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(keyId + ':' + keySecret),
        },
        body: JSON.stringify({
          amount: plan.amount,
          currency: 'INR',
          receipt: 'pulse_' + Date.now(),
          notes: { user_id: user.id, plan: String(body.plan) },
        }),
      });
      const order = await r.json();
      if (!r.ok) {
        console.error('razorpay order failed', order);
        return json({ error: 'order_failed' });
      }
      return json({ order_id: order.id, amount: plan.amount, key_id: keyId, plan: String(body.plan) });
    }

    if (action === 'verify') {
      const plan = PLANS[String(body.plan || '')];
      if (!plan) return json({ error: 'unknown_plan' });
      const orderId = String(body.order_id || '');
      const paymentId = String(body.payment_id || '');
      const signature = String(body.signature || '');
      if (!orderId || !paymentId || !signature) return json({ error: 'missing_fields' });

      const expected = await hmacSha256Hex(keySecret, orderId + '|' + paymentId);
      if (expected !== signature) {
        console.error('signature mismatch for', paymentId);
        return json({ ok: false, error: 'bad_signature' });
      }

      const until = new Date(Date.now() + plan.days * 86400000).toISOString();
      const up = await admin.from('subscriptions').upsert({
        user_id: user.id,
        plan: String(body.plan),
        status: 'active',
        provider: 'razorpay',
        provider_ref: paymentId,
        amount: plan.amount,
        started_at: new Date().toISOString(),
        current_period_end: until,
      }, { onConflict: 'user_id' });
      if (up.error) {
        console.error('subscription save failed', up.error);
        return json({ ok: false, error: 'save_failed' });
      }
      await admin.from('profiles').update({ is_pro: true }).eq('id', user.id);
      return json({ ok: true, until });
    }

    return json({ error: 'unknown_action' });
  } catch (e) {
    console.error('pay error', e);
    return json({ error: 'server_error' });
  }
});
