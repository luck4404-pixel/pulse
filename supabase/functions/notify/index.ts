// Pulse — push notification sender (Supabase Edge Function)
// Called when a row is inserted into "notifications".
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = 'BDx1LdMq6yeq4vvmybIoJkS2FEDI8bx8iUT0V-vWqXLPkRR2fiY8DKMbX6816i823yIIr_P1fvEOgx6gPtu-P_Q';

// CORS headers so the browser is allowed to read the replies
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    webpush.setVapidDetails(
      'mailto:luckychouhan4404@gmail.com',
      VAPID_PUBLIC_KEY,
      Deno.env.get('VAPID_PRIVATE_KEY') || ''
    );
    const payload = await req.json();
    const n = (payload && payload.record) ? payload.record : payload;
    if (!n || !n.user_id) return new Response('no target', { status: 200, headers: CORS });

    const api = Deno.env.get('SUPABASE_URL') || '';
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const res = await fetch(api + '/rest/v1/push_subscriptions?select=sub&user_id=eq.' + n.user_id, {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const subs = await res.json();
    if (!Array.isArray(subs)) return new Response('no subs', { status: 200, headers: CORS });

    console.log('notify: user', n.user_id, 'type', n.type, 'subs', subs.length);

    let text = 'You have a new notification';
    if (n.type === 'like') text = 'Someone liked your post';
    else if (n.type === 'comment') text = 'Someone commented on your post';
    else if (n.type === 'follow') text = 'Someone started following you';
    else if (n.type === 'story_like') text = 'Someone liked your story';

    let sent = 0;
    await Promise.allSettled(subs.map((row) =>
      webpush.sendNotification(row.sub, JSON.stringify({
        title: 'Pulse', body: text, tag: 'pulse'
      })).then(() => { sent++; }).catch(() => {})
    ));
    console.log('notify: pushed to', sent, 'device(s)');
    return new Response('ok', { status: 200, headers: CORS });
  } catch (e) {
    console.error('notify error', e);
    return new Response('error', { status: 200, headers: CORS });
  }
});
