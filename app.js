/* ==================================================================
   PULSE — live multi-user setup
   Backend: Supabase (realtime feed, profiles, DMs, stories, follows)
   ================================================================== */
const SUPABASE_URL = "https://mvbojueciwemmjohxvyh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Ym9qdWVjaXdlbW1qb2h4dnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDE5MDYsImV4cCI6MjEwNjAxNzkwNn0.uJCHxZXvJOXZ9fO70bu4sTa0VP94DKf0jSncAEKpm2Q";

const CONFIGURED = !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
let supa = null;
if (CONFIGURED && window.supabase) {
  supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 5 } } });
} else {
  document.getElementById('connect-banner').style.display = 'block';
}

/* ---------------- Icons ---------------- */
const heartOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 8.6a5.5 5.5 0 0 0-9.3-4A5.5 5.5 0 0 0 2.7 11c1.6 4 8.8 9 9.3 9.3.5-.3 7.7-5.3 9.3-9.3.5-1 .5-1.7.5-2.4Z"/></svg>';
const heartFilled = '<svg viewBox="0 0 24 24"><path d="M12.1 21.3S3 15.5 3 9.9C3 6.6 5.5 4 8.6 4c1.9 0 3.2 1 3.5 1.4C12.4 5 13.7 4 15.6 4C18.7 4 21 6.6 21 9.9c0 5.6-8.9 11.4-8.9 11.4Z"/></svg>';
const commentIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4A8.9 8.9 0 0 1 8 19L3 20l1.1-4.5A8.4 8.4 0 1 1 21 11.5Z"/></svg>';
const shareIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
const bookmarkOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>';
const bookmarkFilled = '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>';
const moreIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
const speakerIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const downloadIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const photoPlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='#262626'/><circle cx='300' cy='272' r='70' fill='#4b4b4b'/><rect x='210' y='360' width='180' height='16' rx='8' fill='#4b4b4b'/><text x='300' y='290' font-size='56' font-family='Arial' fill='#666' text-anchor='middle'>📷</text></svg>");

/* ---------------- Helpers ---------------- */
function esc(s){
  var map = {};
  map['&'] = '&' + 'amp;';
  map['<'] = '&' + 'lt;';
  map['>'] = '&' + 'gt;';
  map['"'] = '&' + 'quot;';
  map["'"] = '&' + '#39;';
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return map[c];
  });
}
function timeAgo(iso){
  if(!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime())/1000);
  if(isNaN(s) || s < 0) return 'now';
  if(s < 60) return 'now';
  if(s < 3600) return Math.floor(s/60) + 'm';
  if(s < 86400) return Math.floor(s/3600) + 'h';
  if(s < 604800) return Math.floor(s/86400) + 'd';
  return new Date(iso).toLocaleDateString();
}
function initialsAvatar(name){
  const colors = ['#F58529','#DD2A7B','#8134AF','#515BD4','#0EA5E9','#10B981','#F59E0B','#EF4444'];
  let h = 0;
  const n = String(name || '?');
  for(let i=0;i<n.length;i++) h = (h*31 + n.charCodeAt(i)) >>> 0;
  const bg = colors[h % colors.length];
  const letter = (n[0] || '?').toUpperCase();
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='112' height='112'><rect width='112' height='112' fill='" + bg + "'/><text x='56' y='72' font-size='54' font-family='Arial' fill='#fff' text-anchor='middle' font-weight='700'>" + letter + "</text></svg>";
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function avatarOf(profile){
  if(!profile) return initialsAvatar('?');
  const url = profile.avatar_url || profile.avatar;
  if(url) return url;
  return initialsAvatar(profile.username || profile.user || profile.u || '?');
}
let toastTimer = null;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2600);
}
function debounce(fn, ms){
  let t = null;
  return function(){
    const args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(self, args); }, ms);
  };
}
function multiBadge(p){
  return (p.media && p.media.length > 1)
    ? '<div class="cell-multi-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 4H6a2 2 0 0 0-2 2v10"/></svg></div>'
    : '';
}

/* ---------------- State ---------------- */
let me = null;              // my profile row {id, username, display_name, avatar_url, bio}
let authUid = null;
let currentView = 'feed';
let posts = [];             // enriched feed posts
let explorePool = [];
let postIndex = {};
let storiesByUser = {};     // username -> {uid, avatar, items:[{id,img,time}]}
let storyOrder = [];
let conversations = [];
let notifications = [];
let activeChat = null;      // partner uid
let chatThread = [];
let myFollows = new Set();
let mySaved = new Set();
let suggestionsData = [];
let presenceMap = new Set();
let seenStoryIds = new Set();
try { seenStoryIds = new Set(JSON.parse(localStorage.getItem('pulse-seen-stories') || '[]')); } catch(e){}
let profileTab = 'posts';
let exploreSearch = '';
let exploreSearchMode = 'posts';   // 'posts' | 'people'
let peopleCache = { term: null, list: null };
let postModalOpenId = null;
let lastViewedProfile = null;
let returnView = 'feed';
let theme = 'light';
let pendingImages = [];    // up to 5 photos per post: [{file, dataUrl, edit}]
let curImgIdx = 0;         // which photo is currently in the editor
let createTab = 'post';
let pendingSong = null;    // {url, title, artist} — song selected from the library
let musicReady = null;     // whether the audio columns exist in the DB
let songsCache = [];       // shared song library
let songsReady = null;     // whether the songs table exists
let songListShown = [];    // filtered list currently rendered in the picker
let previewAudio = null;
let previewingKey = null;
let musicStartReady = null;  // audio_start column exists
let storyLikesReady = null;  // story_likes table exists
let mediaMsgReady = null;    // media columns on messages exist
let mediaMsgV2Ready = null;  // file_bytes + hidden_for columns exist
let mediaUrlsReady = null;   // posts.media_urls column exists (multi-photo posts)
let storyTextReady = null;   // stories.text_overlays column exists (text on stories)
let badgesReady = null;      // profiles.badge + profiles.is_pro exist (ticks)
var storyTexts = [];         // text items on the story being composed
var stSel = -1;              // which text item is selected in the composer
let pendingChatFile = null;  // file staged via the paperclip — sent only when Send is tapped
let msgMenuId = null;        // options-menu open for this message id
let msgMenuMedia = null;     // media url of the message whose menu is open
let pendingPostId = null;    // ?post=<id> link waiting to be opened
var follow5People = [];      // people shown on the follow-a-few screen
var proInfo = null;          // this account's subscription row (null = not loaded / no plan)
var proPlanChosen = 'pro_monthly';  // plan selected on the Pulse Pro screen
let msgMenuMine = false;
let svILiked = false;       // do I like the current story item
let svLikeCount = 0;
let pendingAvatarFile = null;   // edit-profile avatar
let pendingObAvatarFile = null; // onboarding avatar
let emailAuthMode = 'signup';  // 'signup' | 'login'
let myEmail = null;          // email attached to this account (null = quick/anonymous account)
let refreshing = false;
let feedLoaded = false;    // has the feed been painted at least once
let probeCache = null;     // cached feature-probe results (localStorage)
let presenceChannel = null;

/* ---------------- Auth & boot ---------------- */
async function boot(){
  captureInvite(); // pick up ?invite=<username> and ?post=<id> before anything else
  loadVolume();
  document.getElementById('main-col').innerHTML = '<div class="empty-note">Loading your feed…</div>';
  if(!supa){
    document.getElementById('main-col').innerHTML = '<div class="empty-note">This app is not connected to a backend yet.<br>The site owner needs to add the Supabase keys.</div>';
    return;
  }
  try {
    const res = await supa.auth.getSession();
    if(res.data && res.data.session){
      authUid = res.data.session.user.id;
      myEmail = (res.data.session.user && res.data.session.user.email) || null;
    } else {
      const r = await supa.auth.signInAnonymously();
      if(r.error) throw r.error;
      authUid = r.data.user.id;
      myEmail = null;
    }
    const q = await supa.from('profiles').select('*').eq('id', authUid).maybeSingle();
    if(q.error) throw q.error;
    if(q.data){ me = q.data; }
    if(me){
      document.getElementById('onboarding-overlay').classList.remove('open');
      await afterLogin();
    } else {
      // only NOW show the entry screen: showing it earlier made it flash
      // for a second in front of a user who is already signed in
      document.getElementById('onboarding-overlay').classList.add('open');
      populateEntryCollage();
    }
  } catch(e){
    console.error(e);
    document.getElementById('main-col').innerHTML =
      '<div class="empty-note">Could not reach the server.<br>Make sure Anonymous sign-in is enabled in Supabase (Authentication -> Providers), then reload.</div>';
    document.getElementById('onboarding-overlay').classList.remove('open');
  }
}

async function afterLogin(){
  updateMeUI();
  loadProbeCache();
  var fc = loadFeedCache(); // returning visit: paint the last feed instantly
  if(fc){
    posts = fc.posts;
    storiesByUser = fc.stories || {};
    feedLoaded = true;
    indexPosts();
  }
  showView('feed'); // paint the feed area instantly while data loads
  if(probeCache){
    const probeBefore = [musicReady, songsReady, musicStartReady, storyLikesReady, mediaMsgReady, mediaMsgV2Ready, mediaUrlsReady, storyTextReady, badgesReady].join(',');
    runProbes().then(function(){
      const probeAfter = [musicReady, songsReady, musicStartReady, storyLikesReady, mediaMsgReady, mediaMsgV2Ready, mediaUrlsReady, storyTextReady, badgesReady].join(',');
      if(probeBefore !== probeAfter) scheduleRefresh();
    });
  } else {
    await runProbes(); // first visit: one parallel round of probes
  }
  await Promise.all([loadFollows(), loadSavedIds(), loadPro()]);
  loadSuggestions(); // side column — never blocks the feed
  await refreshData();
  setupRealtime();
  setupPresence();
  applyInvite();
  if(pendingPostId){ var pid = pendingPostId; pendingPostId = null; openPostFromUrl(pid); }
  try { if(myFollows.size === 0 && !localStorage.getItem('pulse-follow5-done')) setTimeout(openFollow5, 800); } catch(e){}
  if(!localStorage.getItem('pulse-push-on')){
    var nb = document.getElementById('notif-enable-btn');
    if(nb) nb.style.display = 'flex';
    var ntop = document.getElementById('notif-enable-top');
    if(ntop) ntop.style.display = 'flex';
  }
}

function updateMeUI(){
  document.getElementById('topbar-avatar').src = avatarOf(me);
  document.getElementById('bottomnav-avatar').src = avatarOf(me);
  document.getElementById('sidecol-avatar').src = avatarOf(me);
  document.getElementById('sidecol-uname').textContent = me.username;
  document.getElementById('sidecol-name').textContent = me.display_name || me.username;
  document.getElementById('ob-avatar-preview').src = avatarOf(me);
}

/* ---------------- Onboarding ---------------- */
document.getElementById('ob-file-input').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingObAvatarFile = file;
  const reader = new FileReader();
  reader.onload = function(ev){
    document.getElementById('ob-avatar-preview').src = ev.target.result;
    var ph = document.getElementById('ob-photo-btn');
    if(ph) ph.classList.add('has-img');
  };
  reader.readAsDataURL(file);
});

async function finishOnboarding(skip){
  const btn = document.getElementById('ob-continue-btn');
  var agreeCb = document.getElementById('ob-agree');
  if(agreeCb && !agreeCb.checked){ toast('Please agree to the Privacy Policy first'); return; }
  btn.disabled = true; btn.textContent = 'Setting up...';
  try {
    let username = document.getElementById('ob-username-input').value.trim().toLowerCase();
    if(skip || !username){
      username = 'user_' + Math.random().toString(36).slice(2, 8);
    }
    if(!/^[a-z0-9._]{3,20}$/.test(username)){
      toast('Username must be 3-20 chars: letters, numbers, dot, underscore');
      btn.disabled = false; btn.textContent = 'Continue';
      return;
    }
    const name = document.getElementById('ob-name-input').value.trim();
    const bio = document.getElementById('ob-bio-input').value.trim();
    let avatarUrl = null;
    if(pendingObAvatarFile){
      try { avatarUrl = await uploadImage(pendingObAvatarFile); } catch(err){ console.error(err); }
    }
    const ins = await supa.from('profiles').insert({
      id: authUid, username: username,
      display_name: name || username,
      bio: bio || null,
      avatar_url: avatarUrl
    });
    if(ins.error){
      if(ins.error.code === '23505') toast('That username is already taken');
      else toast('Could not create your profile');
      btn.disabled = false; btn.textContent = 'Continue';
      return;
    }
    const q = await supa.from('profiles').select('*').eq('id', authUid).single();
    me = q.data;
    try { localStorage.setItem('pulse-agreed-v1', '1'); } catch(e2){}
    document.getElementById('onboarding-overlay').classList.remove('open');
    await afterLogin();
    toast('Welcome to Pulse, ' + esc(me.username) + '!');
  } finally {
    btn.disabled = false; btn.textContent = 'Continue';
  }
}

/* ---------------- Email sign-up / log-in ---------------- */
function showEmailAuth(mode){
  setEmailAuthTab(mode || 'signup');
  document.getElementById('email-auth-modal').classList.add('open');
}
function closeEmailAuth(){
  document.getElementById('email-auth-modal').classList.remove('open');
}
function setEmailAuthTab(mode){
  emailAuthMode = mode;
  document.getElementById('ea-tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('ea-tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('email-auth-title').textContent = mode === 'signup' ? 'Sign up with email' : 'Log in with email';
  document.getElementById('ea-submit').textContent = mode === 'signup' ? 'Sign up' : 'Log in';
}
async function submitEmailAuth(){
  var email = (document.getElementById('ea-email').value || '').trim();
  var password = document.getElementById('ea-password').value || '';
  if(!email || email.indexOf('@') < 1){ toast('Please enter a valid email address'); return; }
  if(password.length < 6){ toast('Password must be at least 6 characters'); return; }
  var btn = document.getElementById('ea-submit');
  btn.disabled = true;
  try {
    if(emailAuthMode === 'signup'){
      var r = await supa.auth.signUp({ email: email, password: password });
      if(r.error){
        var msg = String(r.error.message || '');
        if(msg.indexOf('already') !== -1) toast('That email is already registered — try Log in');
        else if(msg.indexOf('rate') !== -1) toast('Too many tries — wait a minute and try again');
        else toast(msg || 'Could not sign up');
        return;
      }
      authUid = r.data.user.id;
      if(r.data.session){
        myEmail = email;
        closeEmailAuth();
        toast('Account created! Now pick your username');
        // the onboarding screen stays open — username step happens there
      } else {
        toast('Check your email inbox, click the confirmation link, then come back and Log in');
        setEmailAuthTab('login');
      }
    } else {
      var r2 = await supa.auth.signInWithPassword({ email: email, password: password });
      if(r2.error){ toast('Wrong email or password'); return; }
      authUid = r2.data.user.id;
      myEmail = email;
      var q = await supa.from('profiles').select('*').eq('id', authUid).maybeSingle();
      if(q.error) throw q.error;
      if(q.data){
        me = q.data;
        closeEmailAuth();
        document.getElementById('onboarding-overlay').classList.remove('open');
        await afterLogin();
        toast('Welcome back, ' + esc(me.username) + '!');
      } else {
        closeEmailAuth();
        toast('Almost done — pick your username');
        // onboarding screen is open — username step happens there
      }
    }
  } catch(e){
    console.error(e);
    toast('Something went wrong — please try again');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- Add email to a quick account ---------------- */
function openAddEmail(){
  document.getElementById('ae-email').value = '';
  document.getElementById('ae-password').value = '';
  document.getElementById('add-email-modal').classList.add('open');
}
function closeAddEmail(){
  document.getElementById('add-email-modal').classList.remove('open');
}
async function submitAddEmail(){
  var email = (document.getElementById('ae-email').value || '').trim();
  var password = document.getElementById('ae-password').value || '';
  if(!email || email.indexOf('@') < 1){ toast('Please enter a valid email address'); return; }
  if(password.length < 6){ toast('Password must be at least 6 characters'); return; }
  var btn = document.getElementById('ae-submit');
  btn.disabled = true;
  try {
    var r = await supa.auth.updateUser({ email: email, password: password });
    if(r.error){
      var msg = String(r.error.message || '');
      if(msg.indexOf('already') !== -1) toast('That email is already used by another account');
      else if(msg.indexOf('same') !== -1) toast('That email is already on this account');
      else if(msg.indexOf('different') !== -1) toast('Wait a bit before trying another email change');
      else toast(msg || 'Could not add the email');
      return;
    }
    var u = r.data && r.data.user ? r.data.user : null;
    if(u && u.new_email && (!u.email || u.email !== email)){
      closeAddEmail();
      toast('Almost done — open your email inbox and click the confirmation link');
    } else {
      myEmail = email;
      closeAddEmail();
      renderProfile();
      toast('Email added! You can now log back in with it anytime');
    }
  } catch(e){
    console.error(e);
    toast('Something went wrong — please try again');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- Continue with Google ---------------- */
async function googleSignIn(){
  var redirectTo = location.origin + location.pathname;
  try {
    if(me && !myEmail){
      // already signed in as a quick (no-email) account with a profile —
      // attach Google to THIS account so all posts, messages and follows are kept
      var link = await supa.auth.linkIdentity({ provider: 'google', options: { redirectTo: redirectTo } });
      if(link.error){
        var lm = String(link.error.message || '') + String(link.error.code || '');
        if(lm.toLowerCase().indexOf('already') !== -1){
          toast('That Google account is already linked to another Pulse account');
        } else if(lm.toLowerCase().indexOf('enabled') !== -1 || lm.toLowerCase().indexOf('provider') !== -1){
          toast('Google sign-in is not enabled yet — finish the setup in Supabase (Authentication \u2192 Sign In / Providers \u2192 Google)');
        } else {
          toast(lm || 'Could not sign in with Google');
        }
        return;
      }
      // the browser redirects away to Google and comes back — nothing else to do
    } else {
      var r = await supa.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo } });
      if(r.error){
        var m = String(r.error.message || '');
        if(m.toLowerCase().indexOf('enabled') !== -1 || m.toLowerCase().indexOf('provider') !== -1 || m.toLowerCase().indexOf('support') !== -1){
          toast('Google sign-in is not enabled yet — finish the setup in Supabase (Authentication \u2192 Sign In / Providers \u2192 Google)');
        } else {
          toast(m || 'Could not sign in with Google');
        }
        return;
      }
      // redirected to Google — on return the app logs in automatically
    }
  } catch(e){
    console.error(e);
    toast('Could not start Google sign-in');
  }
}

/* ---------------- Entry page (log in / quick account) ---------------- */
async function entrySubmit(){
  var idEl = document.getElementById('ob-username-input');
  var id = (idEl ? idEl.value : '').trim().toLowerCase();
  var pwEl = document.getElementById('ob-password-input');
  var pw = pwEl ? pwEl.value : '';
  if(!id){ toast('Please enter your username or email'); return; }
  if(id.indexOf('@') > 0){
    if(!pw){ toast('Enter the password for this email account'); return; }
    emailAuthMode = 'login';
    document.getElementById('ea-email').value = id;
    document.getElementById('ea-password').value = pw;
    await submitEmailAuth();
    if(pwEl) pwEl.value = '';
  } else {
    // username only — creates the quick account (no password needed)
    finishOnboarding(false);
  }
}

/* fill the entry-page collage with real photos from the app */
function populateEntryCollage(){
  if(!supa) return;
  supa.from('posts').select('image_url').order('created_at', { ascending: false }).limit(3)
    .then(function(r){
      if(!r.data || !r.data.length) return;
      var imgs = document.querySelectorAll('.collage-img');
      for(var i=0;i<imgs.length;i++){
        var p = r.data[i % r.data.length];
        if(p && p.image_url) imgs[i].src = p.image_url;
      }
    }, function(){});
}

/* ---------------- Privacy policy ---------------- */
function openPrivacy(){
  document.getElementById('privacy-modal').classList.add('open');
}
function closePrivacy(){
  document.getElementById('privacy-modal').classList.remove('open');
}
function agreePrivacy(){
  var cb = document.getElementById('ob-agree');
  if(cb) cb.checked = true;
  try { localStorage.setItem('pulse-agreed-v1', '1'); } catch(e){}
  closePrivacy();
}

/* ---------------- Storage upload ---------------- */
async function uploadImage(file, maxDim){
  var proUser = (typeof isPro === 'function') && isPro();
  file = await compressImage(file, maxDim || (proUser ? 2560 : 1440), proUser ? 0.92 : 0.82);
  const safeName = (file && file.name ? file.name : 'photo').replace(/[^a-zA-Z0-9._-]/g, '').slice(-40) || 'photo';
  const path = me.id + '/' + Date.now() + '_' + safeName;
  const up = await supa.storage.from('media').upload(path, file);
  if(up.error) throw up.error;
  const pub = supa.storage.from('media').getPublicUrl(path);
  return pub.data.publicUrl;
}

async function uploadAudioFile(file){
  const safeName = (file && file.name ? file.name : 'audio').replace(/[^a-zA-Z0-9._-]/g, '').slice(-40) || 'audio';
  const path = me.id + '/' + Date.now() + '_' + safeName;
  const up = await supa.storage.from('media').upload(path, file, { contentType: (file && file.type) || 'audio/mpeg' });
  if(up.error) throw up.error;
  const pub = supa.storage.from('media').getPublicUrl(path);
  return pub.data.publicUrl;
}

/* music columns appear only after the owner runs music-setup.sql — probe once */
async function checkMusicColumns(){
  try {
    const q = await supa.from('posts').select('audio_url').limit(1);
    musicReady = !(q.error && (q.error.code === 'PGRST204' || String(q.error.message || '').indexOf('column') !== -1));
  } catch(e){ musicReady = false; }
}
function audioFields(){
  if(!musicReady) return '';
  return ',audio_url,audio_title,audio_artist' + (musicStartReady ? ',audio_start' : '');
}
function mediaField(){
  if(!mediaUrlsReady) return '';
  return ',media_urls';
}
function storyTextField(){
  if(!storyTextReady) return '';
  return ',text_overlays';
}
function profileExtra(){
  return badgesReady ? ',badge,is_pro' : '';
}

async function checkSongTable(){
  try {
    const q = await supa.from('songs').select('id').limit(1);
    songsReady = !q.error;
  } catch(e){ songsReady = false; }
}

async function checkMusicStart(){
  try {
    const q = await supa.from('posts').select('audio_start').limit(1);
    musicStartReady = !q.error;
  } catch(e){ musicStartReady = false; }
}
async function checkBadges(){
  try {
    const q = await supa.from('profiles').select('badge,is_pro').limit(1);
    badgesReady = !q.error;
  } catch(e){ badgesReady = false; }
}
async function checkStoryText(){
  try {
    const q = await supa.from('stories').select('text_overlays').limit(1);
    storyTextReady = !q.error;
  } catch(e){ storyTextReady = false; }
}
async function checkMediaUrls(){
  try {
    const q = await supa.from('posts').select('media_urls').limit(1);
    mediaUrlsReady = !q.error;
  } catch(e){ mediaUrlsReady = false; }
}
async function checkStoryLikes(){
  try {
    const q = await supa.from('story_likes').select('story_id').limit(1);
    storyLikesReady = !q.error;
  } catch(e){ storyLikesReady = false; }
}
async function checkMediaMsg(){
  try {
    const q = await supa.from('messages').select('media_url').limit(1);
    mediaMsgReady = !q.error;
  } catch(e){ mediaMsgReady = false; }
}
async function checkMediaMsgV2(){
  try {
    const q = await supa.from('messages').select('file_bytes,hidden_for').limit(1);
    mediaMsgV2Ready = !q.error;
  } catch(e){ mediaMsgV2Ready = false; }
}

/* ---- one parallel probe round instead of 7 sequential ones ---- */
async function runProbes(){
  await Promise.all([
    checkMusicColumns(), checkSongTable(), checkMusicStart(), checkMediaUrls(),
    checkStoryLikes(), checkMediaMsg(), checkMediaMsgV2(), checkStoryText(), checkBadges()
  ]);
  saveProbeCache();
}
/* returning users skip the probe round-trip entirely (cached in localStorage),
   the probes quietly re-verify in the background */
function loadProbeCache(){
  try { probeCache = JSON.parse(localStorage.getItem('pulse-probes-v1') || 'null'); } catch(e){ probeCache = null; }
  if(probeCache){
    musicReady = probeCache.musicReady;
    songsReady = probeCache.songsReady;
    musicStartReady = probeCache.musicStartReady;
    storyLikesReady = probeCache.storyLikesReady;
    mediaMsgReady = probeCache.mediaMsgReady;
    mediaMsgV2Ready = probeCache.mediaMsgV2Ready;
    mediaUrlsReady = probeCache.mediaUrlsReady;
    storyTextReady = probeCache.storyTextReady;
    badgesReady = probeCache.badgesReady;
  }
}
function saveProbeCache(){
  try {
    localStorage.setItem('pulse-probes-v1', JSON.stringify({
      musicReady: musicReady, songsReady: songsReady,
      musicStartReady: musicStartReady, storyLikesReady: storyLikesReady,
      mediaMsgReady: mediaMsgReady, mediaMsgV2Ready: mediaMsgV2Ready,
      mediaUrlsReady: mediaUrlsReady,
      storyTextReady: storyTextReady,
      badgesReady: badgesReady
    }));
  } catch(e){}
}

/* the last feed is cached on the device so a returning visit paints instantly,
   then fresh data quietly replaces it */
function loadFeedCache(){
  var c = null;
  try { c = JSON.parse(localStorage.getItem('pulse-feed-cache-v1') || 'null'); } catch(e){ c = null; }
  if(c && c.uid === me.id && c.posts && c.posts.length && (Date.now() - c.t) < 15*60*1000) return c;
  return null;
}
function saveFeedCache(){
  try {
    localStorage.setItem('pulse-feed-cache-v1', JSON.stringify({ t: Date.now(), uid: me.id, posts: posts.slice(0, 12), stories: storiesByUser }));
  } catch(e){}
}

/* ---------------- Data fetchers ---------------- */
function mapPost(p){
  return {
    id: p.id,
    uid: p.user_id,
    user: (p.profiles && p.profiles.username) || 'user',
    avatar: p.profiles ? p.profiles.avatar_url : null,
    badge: (p.profiles && p.profiles.badge) || null,
    is_pro: p.profiles ? !!p.profiles.is_pro : null,
    img: p.image_url,
    media: (p.media_urls && p.media_urls.length ? p.media_urls : [p.image_url]),
    caption: p.caption || '',
    audio: p.audio_url || null,
    audioTitle: p.audio_title || '',
    audioArtist: p.audio_artist || '',
    audioStart: Number(p.audio_start) || 0,
    time: p.created_at,
    likes: (p.likes || []).map(function(l){ return l.user_id; }),
    comments: (p.comments || []).map(function(c){
      return {
        id: c.id, uid: c.user_id,
        user: (c.profiles && c.profiles.username) || 'user',
        t: c.text, time: c.created_at
      };
    }).sort(function(a,b){ return new Date(a.time) - new Date(b.time); })
  };
}

async function fetchFeed(limit){
  const q = await supa.from('posts')
    .select('id,user_id,image_url,caption,created_at' + mediaField() + audioFields() + ',profiles!posts_user_id_fkey(id,username,avatar_url' + profileExtra() + ',likes(user_id),comments(id,user_id,text,created_at,profiles!comments_user_id_fkey(id,username,avatar_url))')
    .order('created_at', { ascending: false })
    .limit(limit || 40);
  if(q.error){ console.error(q.error); return []; }
  return q.data.map(mapPost);
}

/* Explore ranking: likes + a gentle freshness boost; your own posts are
   shown less often so Explore feels like discovery, not your own grid */
function rankExplore(list){
  const now = Date.now();
  const scored = list.map(function(p){
    const ageH = Math.max(1, (now - new Date(p.time).getTime()) / 3600000);
    const engagement = p.likes.length + ((p.comments ? p.comments.length : 0) * 2);
    var score = (1 + engagement) / Math.pow(ageH, 0.3);
    if(p.uid === me.id) score *= 0.35;
    return { p: p, s: score };
  });
  scored.sort(function(a, b){ return b.s - a.s; });
  return scored.map(function(x){ return x.p; });
}

async function fetchExplorePool(){
  const q = await supa.from('posts')
    .select('id,user_id,image_url,caption,created_at' + mediaField() + audioFields() + ',profiles!posts_user_id_fkey(id,username,avatar_url' + profileExtra() + ',likes(user_id)')
    .order('created_at', { ascending: false })
    .limit(200);
  if(q.error){ console.error(q.error); return []; }
  return rankExplore(q.data.map(mapPost));
}

async function fetchSavedPosts(){
  const q = await supa.from('saved')
    .select('posts(id,user_id,image_url,caption,created_at' + mediaField() + audioFields() + ',profiles!posts_user_id_fkey(id,username,avatar_url' + profileExtra() + ',likes(user_id))')
    .eq('user_id', me.id);
  if(q.error){ console.error(q.error); return []; }
  return (q.data || []).map(function(r){ return r.posts ? mapPost(r.posts) : null; }).filter(Boolean);
}

async function fetchStories(){
  const since = new Date(Date.now() - 24*3600*1000).toISOString();
  const q = await supa.from('stories')
    .select('id,user_id,image_url,created_at' + audioFields() + storyTextField() + ',profiles!stories_user_id_fkey(id,username,avatar_url)')
    .gt('created_at', since)
    .order('created_at', { ascending: true })
    .limit(300);
  if(q.error){ console.error(q.error); return {}; }
  const map = {};
  (q.data || []).forEach(function(s){
    const uname = (s.profiles && s.profiles.username) || 'user';
    if(!map[uname]) map[uname] = { uid: s.user_id, avatar: s.profiles ? s.profiles.avatar_url : null, items: [] };
    map[uname].items.push({ id: s.id, img: s.image_url, time: s.created_at, audio: s.audio_url || null, audioTitle: s.audio_title || '', audioArtist: s.audio_artist || '', audioStart: Number(s.audio_start) || 0, texts: Array.isArray(s.text_overlays) ? s.text_overlays : [] });
  });
  return map;
}

async function fetchConversations(){
  const q = await supa.from('messages')
    .select('id,sender_id,recipient_id,text,read_at,created_at' + (mediaMsgReady ? ',media_url,media_type,media_name' : '') + ',sender:profiles!messages_sender_id_fkey(id,username,avatar_url),recipient:profiles!messages_recipient_id_fkey(id,username,avatar_url)')
    .or('sender_id.eq.' + me.id + ',recipient_id.eq.' + me.id)
    .order('created_at', { ascending: false })
    .limit(300);
  if(q.error){ console.error(q.error); return []; }
  const byPartner = {};
  (q.data || []).forEach(function(m){
    if(m.hidden_for && m.hidden_for.indexOf(me.id) !== -1) return;
    const partner = m.sender_id === me.id ? m.recipient_id : m.sender_id;
    const partnerProfile = m.sender_id === me.id ? m.recipient : m.sender;
    if(!byPartner[partner]){
      byPartner[partner] = {
        uid: partner,
        user: (partnerProfile && partnerProfile.username) || 'user',
        avatar: partnerProfile ? partnerProfile.avatar_url : null,
        last: convLastText(m),
        lastTime: m.created_at,
        lastFromMe: m.sender_id === me.id,
        unread: m.recipient_id === me.id && !m.read_at
      };
    } else if(m.recipient_id === me.id && !m.read_at){
      byPartner[partner].unread = true;
    }
  });
  return Object.keys(byPartner).map(function(k){ return byPartner[k]; })
    .sort(function(a,b){ return new Date(b.lastTime) - new Date(a.lastTime); });
}

async function fetchNotifications(){
  const q = await supa.from('notifications')
    .select('id,type,created_at,read,actor:profiles!notifications_actor_id_fkey(id,username,avatar_url),post:posts(id,image_url)')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if(q.error){ console.error(q.error); return []; }
  return q.data || [];
}

async function loadFollows(){
  const q = await supa.from('follows').select('following_id').eq('follower_id', me.id).limit(1000);
  myFollows = new Set((q.data || []).map(function(r){ return r.following_id; }));
}

async function loadSavedIds(){
  const q = await supa.from('saved').select('post_id').eq('user_id', me.id).limit(1000);
  mySaved = new Set((q.data || []).map(function(r){ return r.post_id; }));
}

async function loadSuggestions(){
  const q = await supa.from('profiles')
    .select('id,username,avatar_url')
    .neq('id', me.id)
    .order('created_at', { ascending: false })
    .limit(5);
  suggestionsData = q.data || [];
  renderSuggestions();
}

async function countRows(table, col, val){
  const q = await supa.from(table).select('*', { count: 'exact', head: true }).eq(col, val);
  return q.count || 0;
}

async function updateBadges(){
  if(!me) return;
  const a = await supa.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', me.id).eq('read', false);
  const b = await supa.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', me.id).is('read_at', null);
  document.getElementById('notif-dot').style.display = (a.count > 0) ? 'block' : 'none';
  document.getElementById('msg-dot').style.display = (b.count > 0) ? 'block' : 'none';
}

function indexPosts(){
  postIndex = {};
  posts.forEach(function(p){ postIndex[p.id] = p; });
  explorePool.forEach(function(p){ if(!postIndex[p.id]) postIndex[p.id] = p; });
}

/* master refresh — called on load and after realtime changes */
async function refreshData(){
  if(!me || refreshing) return;
  refreshing = true;
  try {
    if(!feedLoaded){
      // fast first paint: a small feed batch shows right away,
      // the full data load continues right after
      posts = await fetchFeed(12);
      feedLoaded = true;
      indexPosts();
      if(currentView === 'feed') renderFeed();
    }
    const results = await Promise.all([
      fetchFeed(40), fetchExplorePool(), fetchStories(), fetchConversations(), fetchNotifications()
    ]);
    posts = results[0];
    explorePool = results[1];
    storiesByUser = results[2];
    conversations = results[3];
    notifications = results[4];
    indexPosts();
    updateBadges();
    renderView();
    renderSuggestions();
    saveFeedCache();
  } catch(e){
    console.error(e);
  } finally {
    refreshing = false;
  }
}

/* ---------------- Rendering: stories rail ---------------- */
function storySeen(uname){
  const s = storiesByUser[uname];
  if(!s) return false;
  return s.items.every(function(it){ return seenStoryIds.has(it.id); });
}
function renderStories(){
  const others = Object.keys(storiesByUser).filter(function(u){ return u !== me.username; });
  let html = '<div class="stories">';
  const mineEntry = storiesByUser[me.username];
  const mine = !!(mineEntry && mineEntry.items.length);
  html += '<button class="story" onclick="' + (mine ? "openStoryViewer('" + me.username + "')" : "openCreateModal('story')") + '">'
    + '<div class="story-ring ' + (mine ? '' : 'empty') + '" style="position:relative">'
    + '<div class="story-ring-inner"><img src="' + avatarOf(me) + '"></div>'
    + '<div class="plus-badge" onclick="event.stopPropagation();openCreateModal(\'story\')">+</div>'
    + '</div>'
    + '<span>Your story</span>'
    + '</button>';
  html += others.map(function(u){
    const s = storiesByUser[u];
    return '<button class="story" onclick="openStoryViewer(\'' + u + '\')">'
      + '<div class="story-ring ' + (storySeen(u) ? 'seen' : '') + '">'
      + '<div class="story-ring-inner"><img src="' + avatarOf(s) + '"></div>'
      + '</div>'
      + '<span>' + esc(u) + '</span>'
      + '</button>';
  }).join('');
  html += '</div>';
  return html;
}

/* ---------------- Rendering: post card ---------------- */
function renderPost(p){
  const liked = p.likes.indexOf(me.id) !== -1;
  const saved = mySaved.has(p.id);
  const showAll = p.commentsExpanded;
  const commentsToShow = showAll ? p.comments : p.comments.slice(-2);
  const mediaList = (p.media && p.media.length ? p.media : [p.img]);
  const multi = mediaList.length > 1;
  return ''
  + '<div class="post" id="post-' + p.id + '">'
    + '<div class="post-head">'
      + '<div class="post-user" style="cursor:pointer" onclick="viewProfile(\'' + p.user + '\')">'
        + '<img src="' + avatarOf(p) + '">'
        + '<div class="names">'
          + '<span class="uname">' + esc(p.user) + tickFor(p, p.uid === me.id) + '</span>'
          + (presenceMap.has(p.uid) ? '<span class="loc" style="color:#22c55e;">Active now</span>' : '')
        + '</div>'
      + '</div>'
      + '<button class="more-btn" onclick="postMenu(\'' + p.id + '\')">' + moreIcon + '</button>'
    + '</div>'
    + '<div class="post-media' + (multi ? ' carousel' : '') + '" ondblclick="likePost(\'' + p.id + '\', true)">'
      + (multi
        ? '<div class="car-track" onscroll="carScrolled(this)" ontouchstart="carTouchStart(event)" ontouchmove="carTouchMove(event)" ontouchend="carTouchEnd()">'
          + mediaList.map(function(u){
              return '<img src="' + u + '" loading="lazy" decoding="async" draggable="false" style="cursor:zoom-in" onclick="imgTap(\'' + p.id + '\')" onerror="this.onerror=null;this.src=photoPlaceholder">';
            }).join('')
          + '</div>'
          + '<button class="car-btn left" style="display:none" onclick="event.stopPropagation();carGo(this,-1)" ondblclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>'
          + '<button class="car-btn right" onclick="event.stopPropagation();carGo(this,1)" ondblclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg></button>'
          + '<div class="car-count">1/' + mediaList.length + '</div>'
          + '<div class="car-dots">'
          + mediaList.map(function(_, mi){
              return '<button class="car-dot' + (mi === 0 ? ' on' : '') + '" onclick="event.stopPropagation();carDot(this,' + mi + ')" ondblclick="event.stopPropagation()"></button>';
            }).join('')
          + '</div>'
        : '<img src="' + p.img + '" loading="lazy" decoding="async" style="cursor:zoom-in" onclick="imgTap(\'' + p.id + '\')" onerror="this.onerror=null;this.src=photoPlaceholder">')
      + (p.audio ? '<button class="post-speaker" id="spk-' + p.id + '" title="Play song" onclick="event.stopPropagation();togglePostAudio(\'' + p.id + '\')" ondblclick="event.stopPropagation()">' + speakerIcon + '<span class="eq"><i></i><i></i><i></i></span></button>' : '')
      + '<div class="burst" id="burst-' + p.id + '">' + heartFilled + '</div>'
    + '</div>'
    + '<div class="post-actions">'
      + '<div class="action-left">'
        + '<button class="action-btn ' + (liked ? 'liked' : '') + '" onclick="likePost(\'' + p.id + '\')">' + (liked ? heartFilled : heartOutline) + '</button>'
        + '<button class="action-btn" onclick="focusComment(\'' + p.id + '\')">' + commentIcon + '</button>'
        + '<button class="action-btn" onclick="sharePost(\'' + p.id + '\')">' + shareIcon + '</button>'
        + '<button class="action-btn" onclick="downloadPost(\'' + p.id + '\')" title="Download">' + downloadIcon + '</button>'
      + '</div>'
      + '<button class="action-btn ' + (saved ? 'saved' : '') + '" onclick="savePost(\'' + p.id + '\')">' + (saved ? bookmarkFilled : bookmarkOutline) + '</button>'
    + '</div>'
    + '<div class="post-likes">' + p.likes.length.toLocaleString() + ' like' + (p.likes.length === 1 ? '' : 's') + '</div>'
    + '<div class="post-caption"><span class="cap-uname" style="cursor:pointer" onclick="viewProfile(\'' + p.user + '\')">' + esc(p.user) + '</span>' + esc(p.caption) + '</div>'
    + (p.audio ? '<div class="music-chip" id="mc-' + p.id + '" data-post="' + p.id + '"><span class="eq"><i></i><i></i><i></i></span><span class="mtitle">' + esc((p.audioTitle || 'audio') + (p.audioArtist ? ' · ' + p.audioArtist : '')) + '</span><span class="vol" onclick="event.stopPropagation()"><input type="range" min="0" max="100" value="' + Math.round(audioVolume * 100) + '" oninput="setVolume(this.value/100)" aria-label="Volume"></span></div>' : '')
    + (p.comments.length ? (
        (!showAll && p.comments.length > 2 ? '<button class="post-comments-link" onclick="expandComments(\'' + p.id + '\')">View all ' + p.comments.length + ' comments</button>' : '')
        + '<div class="post-comment-list">'
        + commentsToShow.map(function(c){
            return '<div class="c"><b style="cursor:pointer" onclick="viewProfile(\'' + c.user + '\')">' + esc(c.user) + '</b>' + esc(c.t) + '</div>';
          }).join('')
        + '</div>'
      ) : '')
    + '<div class="post-time">' + timeAgo(p.time) + '</div>'
    + '<div class="add-comment">'
      + '<input id="comment-input-' + p.id + '" placeholder="Add a comment..." oninput="toggleCommentBtn(\'' + p.id + '\')">'
      + '<button id="comment-btn-' + p.id + '" onclick="addComment(\'' + p.id + '\')">Post</button>'
    + '</div>'
  + '</div>';
}

function expandComments(id){
  const p = postIndex[id];
  if(!p) return;
  p.commentsExpanded = true;
  refresh();
}

/* ---- multi-photo carousel (up to 5 photos per post) ---- */
function carGo(btn, dir){
  var media = btn.closest('.post-media');
  var track = media ? media.querySelector('.car-track') : null;
  if(track) track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
}
function carDot(el, i){
  var media = el.closest('.post-media');
  var track = media ? media.querySelector('.car-track') : null;
  if(track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
}
function carScrolled(trackEl){
  var idx = Math.round(trackEl.scrollLeft / Math.max(1, trackEl.clientWidth));
  var media = trackEl.closest('.post-media');
  if(!media) return;
  var dots = media.querySelectorAll('.car-dot');
  for(var i=0;i<dots.length;i++) dots[i].classList.toggle('on', i === idx);
  var c = media.querySelector('.car-count');
  if(c && dots.length) c.textContent = (idx + 1) + '/' + dots.length;
  var l = media.querySelector('.car-btn.left');
  var r = media.querySelector('.car-btn.right');
  if(l) l.style.display = idx > 0 ? 'flex' : 'none';
  if(r) r.style.display = idx < dots.length - 1 ? 'flex' : 'none';
}

/* ---------------- Audio playback (one song at a time) ---------------- */
let currentAudio = null;
let playingAudioPostId = null;
/* keeps a horizontal photo swipe from being treated as a tap (which would
   otherwise open the full-screen viewer in the middle of the swipe) */
var carSwipeMoved = false, carSwipeX = 0, carSwipeY = 0;
function carTouchStart(e){
  var t = e.touches && e.touches[0]; if(!t) return;
  carSwipeMoved = false; carSwipeX = t.clientX; carSwipeY = t.clientY;
}
function carTouchMove(e){
  var t = e.touches && e.touches[0]; if(!t) return;
  var dx = Math.abs(t.clientX - carSwipeX), dy = Math.abs(t.clientY - carSwipeY);
  if(dx > 8 && dx > dy) carSwipeMoved = true;
}
function carTouchEnd(){ setTimeout(function(){ carSwipeMoved = false; }, 350); }

/* ---------------- Sound volume ---------------- */
var audioVolume = 1;
function loadVolume(){
  try {
    var v = parseFloat(localStorage.getItem('pulse-volume'));
    if(!isNaN(v)) audioVolume = Math.max(0, Math.min(1, v));
  } catch(e){}
}
function applyVol(a){ try { if(a) a.volume = audioVolume; } catch(e){} return a; }
function setVolume(v){
  audioVolume = Math.max(0, Math.min(1, Number(v) || 0));
  try { localStorage.setItem('pulse-volume', String(audioVolume)); } catch(e){}
  applyVol(currentAudio);
  applyVol(svAudio);
  applyVol(previewAudio);
  var pct = Math.round(audioVolume * 100);
  var lbl = document.getElementById('vol-label'); if(lbl) lbl.textContent = pct + '%';
  var sl = document.getElementById('vol-slider'); if(sl && Number(sl.value) !== pct) sl.value = pct;
  var chips = document.querySelectorAll('.music-chip .vol input, .reel-music-chip .vol input');
  for(var i=0;i<chips.length;i++){ if(Number(chips[i].value) !== pct) chips[i].value = pct; }
}
function stopAudio(){
  if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio = null; }
  playingAudioPostId = null;
  var chips = document.querySelectorAll('.music-chip, .post-speaker, #shorts-scroller .reel-music-chip, #shorts-scroller .short-song');
  for(var i=0;i<chips.length;i++) chips[i].classList.remove('playing');
}
function togglePostAudio(id){
  var p = postIndex[id];
  if(!p || !p.audio) return;
  if(playingAudioPostId === id){ stopAudio(); return; }
  stopAudio();
  try { currentAudio = applyVol(new Audio(p.audio)); }
  catch(e){ toast('Could not play this audio'); return; }
  currentAudio.onended = stopAudio;
  currentAudio.onerror = function(){ toast('Could not play this audio'); stopAudio(); };
  currentAudio.play().then(function(){
    playingAudioPostId = id;
    if(p.audioStart > 0){ try{ currentAudio.currentTime = p.audioStart; }catch(e){} }
    var chips = document.querySelectorAll('#mc-' + id);
    for(var ci=0;ci<chips.length;ci++) chips[ci].classList.add('playing');
    var spks = document.querySelectorAll('#spk-' + id);
    for(var si=0;si<spks.length;si++) spks[si].classList.add('playing');
    var sChips = document.querySelectorAll('#shorts-scroller .short-slide[data-post="' + id + '"] .reel-music-chip');
    for(var sci=0;sci<sChips.length;sci++) sChips[sci].classList.add('playing');
    var rBtns = document.querySelectorAll('#shorts-scroller .short-song');
    for(var rbi=0;rbi<rBtns.length;rbi++) rBtns[rbi].classList.remove('playing');
    var rBtn = document.getElementById('sr-' + id);
    if(rBtn) rBtn.classList.add('playing');
  }).catch(function(){ toast('Could not play this audio'); stopAudio(); });
}

var lastFeedSig = null;
function feedSignature(){
  var s = (me ? me.username : '') + '|' + mySaved.size + '|';
  s += (posts || []).map(function(p){
    return p.id + ':' + p.user + ':' + (p.likes ? p.likes.length : 0) + ':' + (p.comments ? p.comments.length : 0) + ':' + (p.badge || '') + ':' + (p.is_pro ? 1 : 0);
  }).join(',');
  s += '|' + Object.keys(storiesByUser || {}).map(function(u){
    var st = storiesByUser[u];
    return u + ':' + (st && st.items ? st.items.length : 0) + ':' + (st && st.items && st.items[0] ? st.items[0].id : '');
  }).join(',');
  return s;
}
/* Live updates used to redraw the whole feed on every single change, which made
   the screen flicker while scrolling. Now the feed is only redrawn when the
   content actually changed. */
function renderFeed(force){
  var col = document.getElementById('main-col');
  if(!col) return;
  var sig = feedSignature();
  if(!force && sig === lastFeedSig && col.querySelector('.post')) return;
  lastFeedSig = sig;
  col.innerHTML =
    renderStories() + (posts.length ? posts.map(renderPost).join('') :
    (feedLoaded
      ? '<div class="empty-note">No posts yet.<br>Be the first — tap the + button!</div>'
      : '<div class="empty-note">Loading your feed…</div>'));
}

/* ---------------- Explore ---------------- */
function onSearch(v, source){
  exploreSearch = v;
  const top = document.getElementById('search-top');
  const inGrid = document.getElementById('explore-search-input');
  if(top && top !== source) top.value = v;
  if(inGrid && inGrid !== source) inGrid.value = v;
  if(currentView === 'explore'){
    if(document.getElementById('explore-results')) renderExploreResults();
    else renderExplore();
  }
}

function renderExplore(){
  document.getElementById('main-col').innerHTML =
    '<div class="explore-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + '<input id="explore-search-input" placeholder="Search people and posts" value="' + esc(exploreSearch) + '" oninput="onSearch(this.value,this)"></div>'
    + '<div class="explore-tabs">'
      + '<button class="explore-tab ' + (exploreSearchMode === 'posts' ? 'active' : '') + '" onclick="setExploreMode(\'posts\')">Posts</button>'
      + '<button class="explore-tab ' + (exploreSearchMode === 'people' ? 'active' : '') + '" onclick="setExploreMode(\'people\')">People</button>'
    + '</div>'
    + '<div id="explore-results"></div>';
  renderExploreResults();
}
function setExploreMode(m){
  exploreSearchMode = m;
  renderExplore();
}
function renderExploreResults(){
  var res = document.getElementById('explore-results');
  if(!res) return;
  if(exploreSearchMode === 'people'){
    renderPeopleResults();
    return;
  }
  res.innerHTML = '<div class="explore-grid" id="explore-grid"></div>';
  renderExploreGrid();
}

/* People tab: matching users + follow buttons */
async function renderPeopleResults(){
  var res = document.getElementById('explore-results');
  if(!res) return;
  var term = exploreSearch.trim();
  if(peopleCache.term === term && peopleCache.list){
    paintPeople(peopleCache.list);
    return;
  }
  res.innerHTML = '<div class="empty-note">Searching people\u2026</div>';
  try {
    var q;
    if(term){
      q = await supa.from('profiles').select('id,username,display_name,avatar_url').ilike('username', '%' + term + '%').limit(30);
    } else {
      q = await supa.from('profiles').select('id,username,display_name,avatar_url').neq('id', me.id).order('created_at', { ascending: false }).limit(12);
    }
    if(q.error) throw q.error;
    var list = (q.data || []).filter(function(p){ return p.id !== me.id; });
    peopleCache = { term: term, list: list };
    if(document.getElementById('explore-results')) paintPeople(list);
  } catch(e){
    console.error(e);
    if(document.getElementById('explore-results')) document.getElementById('explore-results').innerHTML = '<div class="empty-note">Could not load people.</div>';
  }
}
function paintPeople(list){
  var res = document.getElementById('explore-results');
  if(!res) return;
  if(!list.length){
    res.innerHTML = '<div class="empty-note">No people found' + (exploreSearch ? ' for that search.' : ' yet.') + '</div>';
    return;
  }
  res.innerHTML = list.map(function(p){
    var following = myFollows.has(p.id);
    return '<div class="person-row" onclick="viewProfile(\'' + p.username + '\')">'
      + '<img src="' + avatarOf(p) + '">'
      + '<div class="pr-meta"><div class="pr-u">' + esc(p.username) + '</div><div class="pr-n">' + esc(p.display_name || '') + '</div></div>'
      + '<button class="primary-btn" id="follow-btn-' + p.id + '" onclick="event.stopPropagation();toggleFollow(\'' + p.id + '\')">' + (following ? 'Following' : 'Follow') + '</button>'
    + '</div>';
  }).join('');
}

function renderExploreGrid(){
  const term = exploreSearch.trim().toLowerCase();
  let pool = explorePool;
  if(term){
    pool = pool.filter(function(p){
      return p.user.toLowerCase().indexOf(term) !== -1
        || (p.caption || '').toLowerCase().indexOf(term) !== -1
        || ((p.audioTitle || '') + ' ' + (p.audioArtist || '')).toLowerCase().indexOf(term) !== -1;
    });
  }
  document.getElementById('explore-grid').innerHTML =
    (pool.length ? pool.map(function(p){
      return '<div class="cell" onclick="openPostModal(\'' + p.id + '\')"><img src="' + p.img + '" loading="lazy">' + (p.audio ? '<div class="cell-music-badge">♪</div>' : '') + multiBadge(p) + '</div>';
    }).join('') : '<div class="empty-note" style="grid-column:1/-1;">No results' + (term ? ' for that search' : '') + '.</div>');
}

/* ---------------- Post modal (lightbox) ---------------- */
function openPostModal(id){
  const p = postIndex[id];
  if(!p) return;
  postModalOpenId = id;
  document.getElementById('post-modal-content').innerHTML = renderPost(p);
  document.getElementById('post-modal').classList.add('open');
}
function closePostModal(){
  postModalOpenId = null;
  document.getElementById('post-modal').classList.remove('open');
}

/* ---------------- Full-screen photo viewer ---------------- */
var imgTapTimer = null;
var shortsObserver = null;
var activeShortId = null;
function imgTap(id){
  if(carSwipeMoved) return; // that was a swipe, not a tap
  if(imgTapTimer){ clearTimeout(imgTapTimer); imgTapTimer = null; return; }
  imgTapTimer = setTimeout(function(){ imgTapTimer = null; openShorts(id); }, 260);
}
function openImageViewer(id){
  var p = postIndex[id];
  if(!p) return;
  var img = document.getElementById('img-viewer-img');
  if(!img) return;
  img.src = p.img;
  document.getElementById('img-viewer').classList.add('open');
}
function closeImageViewer(){
  document.getElementById('img-viewer').classList.remove('open');
  var img = document.getElementById('img-viewer-img');
  if(img) img.src = '';
}

/* ---------------- Shorts-style post viewer ---------------- */
function openShorts(startId){
  var pool = posts;
  if(!pool.some(function(p){ return p.id === startId; })) pool = explorePool;
  if(!pool.some(function(p){ return p.id === startId; }) && postIndex[startId]){
    pool = [postIndex[startId]].concat(pool);
  }
  if(!pool.length) return;
  var startIdx = 0;
  for(var i=0;i<pool.length;i++){ if(pool[i].id === startId){ startIdx = i; break; } }
  var sc = document.getElementById('shorts-scroller');
  sc.innerHTML = pool.map(renderShortSlide).join('');
  document.getElementById('shorts-viewer').classList.add('open');
  stopAudio();
  var slides = sc.querySelectorAll('.short-slide');
  if(slides[startIdx]) slides[startIdx].scrollIntoView();
  if(shortsObserver){ try{ shortsObserver.disconnect(); }catch(e){} shortsObserver = null; }
  try {
    shortsObserver = new IntersectionObserver(function(entries){
      for(var i=0;i<entries.length;i++){
        var en = entries[i];
        if(en.isIntersecting && en.intersectionRatio >= 0.6){
          shortsActive(en.target.getAttribute('data-post'));
        }
      }
    }, { root: sc, threshold: [0.6] });
    for(var j=0;j<slides.length;j++) shortsObserver.observe(slides[j]);
  } catch(e){ shortsObserver = null; }
  shortsActive(pool[startIdx].id);
}

function renderShortSlide(p){
  const liked = p.likes.indexOf(me.id) !== -1;
  return '<div class="short-slide" data-post="' + p.id + '">'
    + '<img class="short-bg" src="' + p.img + '" alt="">'
    + (p.audio ? '<button class="short-song" id="sr-' + p.id + '" title="Play or pause song" onclick="shortAudioToggle(\'' + p.id + '\')">' + speakerIcon + '<span class="eq"><i></i><i></i><i></i></span></button>' : '')
    + shortMediaHtml(p)
    + '<div class="short-overlay-bottom">'
      + '<div class="u" style="cursor:pointer" onclick="closeShorts();viewProfile(\'' + p.user + '\')"><img src="' + avatarOf(p) + '">' + esc(p.user) + '</div>'
      + (p.caption ? '<div class="cap">' + esc(p.caption) + '</div>' : '')
      + (p.audio ? '<div class="reel-music-chip"><span class="eq"><i></i><i></i><i></i></span><span class="mtitle">' + esc((p.audioTitle || 'audio') + (p.audioArtist ? ' · ' + p.audioArtist : '')) + '</span></div>' : '')
    + '</div>'
    + '<div class="short-rail">'
      + '<button id="sl-' + p.id + '" class="' + (liked ? 'liked' : '') + '" onclick="shortLike(\'' + p.id + '\')">' + (liked ? heartFilled : heartOutline) + '<span id="slc-' + p.id + '">' + p.likes.length + '</span></button>'
      + '<button onclick="shortComment(\'' + p.id + '\')">' + commentIcon + '<span>' + p.comments.length + '</span></button>'
      + '<button onclick="shortDownload(\'' + p.id + '\')">' + downloadIcon + '<span>Save</span></button>'
      + '<button onclick="sharePost()">' + shareIcon + '<span>Share</span></button>'
    + '</div>'
  + '</div>';
}

/* multi-photo posts get a left/right swiper inside the full-screen viewer */
function shortMediaHtml(p){
  var media = (p.media && p.media.length ? p.media : [p.img]);
  if(media.length < 2){
    return '<img class="short-img" src="' + p.img + '" alt="" decoding="async" ondblclick="shortLike(\'' + p.id + '\', true)">';
  }
  return '<div class="post-media carousel short-car">'
    + '<div class="car-track" onscroll="carScrolled(this)" ontouchstart="carTouchStart(event)" ontouchmove="carTouchMove(event)" ontouchend="carTouchEnd()">'
    + media.map(function(u){
        return '<img src="' + u + '" alt="" decoding="async" draggable="false" ondblclick="shortLike(\'' + p.id + '\', true)">';
      }).join('')
    + '</div>'
    + '<button class="car-btn left" style="display:none" onclick="event.stopPropagation();carGo(this,-1)" ondblclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<button class="car-btn right" onclick="event.stopPropagation();carGo(this,1)" ondblclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg></button>'
    + '<div class="car-count">1/' + media.length + '</div>'
    + '<div class="car-dots">' + media.map(function(_, mi){
        return '<button class="car-dot' + (mi === 0 ? ' on' : '') + '" onclick="event.stopPropagation();carDot(this,' + mi + ')" ondblclick="event.stopPropagation()"></button>';
      }).join('') + '</div>'
    + '</div>';
}

function shortsActive(id){
  activeShortId = id;
  var p = postIndex[id];
  if(!p) return;
  if(p.audio){
    if(playingAudioPostId !== id) togglePostAudio(id);
  } else if(playingAudioPostId){
    stopAudio();
  }
}

function shortAudioToggle(id){
  if(playingAudioPostId === id){ stopAudio(); return; }
  togglePostAudio(id);
}

function shortsGo(dir){
  var sc = document.getElementById('shorts-scroller');
  var slides = sc ? sc.querySelectorAll('.short-slide') : [];
  if(!slides.length) return;
  var idx = 0;
  for(var i=0;i<slides.length;i++){ if(slides[i].getAttribute('data-post') === activeShortId){ idx = i; break; } }
  var n = idx + dir;
  if(n < 0) n = 0;
  if(n > slides.length - 1) n = slides.length - 1;
  if(slides[n]) slides[n].scrollIntoView({ behavior: 'smooth' });
}

function shortLike(id, fromDbl){
  likePost(id, fromDbl).then(function(){
    var p = postIndex[id];
    var btn = document.getElementById('sl-' + id);
    if(!p || !btn) return;
    var liked = p.likes.indexOf(me.id) !== -1;
    btn.classList.toggle('liked', liked);
    btn.innerHTML = (liked ? heartFilled : heartOutline) + '<span id="slc-' + id + '">' + p.likes.length + '</span>';
  });
}

function shortComment(id){
  closeShorts();
  openPostModal(id);
}

function shortDownload(id){
  var p = postIndex[id];
  if(!p || !p.img) return;
  var a = document.createElement('a');
  a.href = p.img;
  a.download = 'pulse-' + id + '.jpg';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Saving photo\u2026');
}

function closeShorts(){
  stopAudio();
  if(shortsObserver){ try{ shortsObserver.disconnect(); }catch(e){} shortsObserver = null; }
  var sc = document.getElementById('shorts-scroller');
  if(sc) sc.innerHTML = '';
  document.getElementById('shorts-viewer').classList.remove('open');
}

/* ---------------- Reels ---------------- */
function renderReels(){
  const rl = explorePool.slice(0, 30);
  document.getElementById('main-col').innerHTML =
    '<div class="reels-wrap">'
    + (rl.length ? rl.map(function(p){
        const liked = p.likes.indexOf(me.id) !== -1;
        return '<div class="reel">'
          + '<img src="' + p.img + '" loading="lazy">'
          + (p.audio ? '<button class="post-speaker" id="spk-' + p.id + '" title="Play song" onclick="event.stopPropagation();togglePostAudio(\'' + p.id + '\')" ondblclick="event.stopPropagation()">' + speakerIcon + '<span class="eq"><i></i><i></i><i></i></span></button>' : '')
          + '<div class="reel-overlay-bottom">'
            + '<div class="u" style="cursor:pointer" onclick="viewProfile(\'' + p.user + '\')"><img src="' + avatarOf(p) + '">' + esc(p.user) + '</div>'
            + '<div class="cap">' + esc(p.caption) + '</div>'
            + (p.audio ? '<div class="reel-music-chip"><span class="eq"><i></i><i></i><i></i></span><span class="mtitle">' + esc((p.audioTitle || 'audio') + (p.audioArtist ? ' · ' + p.audioArtist : '')) + '</span></div>' : '')
          + '</div>'
          + '<div class="reel-rail">'
            + '<button class="' + (liked ? 'liked' : '') + '" onclick="likePost(\'' + p.id + '\')">' + (liked ? heartFilled : heartOutline) + '<span>' + p.likes.length + '</span></button>'
            + '<button onclick="openPostModal(\'' + p.id + '\')">' + commentIcon + '<span>' + (p.comments ? p.comments.length : 0) + '</span></button>'
            + '<button onclick="sharePost()">' + shareIcon + '<span>Share</span></button>'
            + '<button onclick="savePost(\'' + p.id + '\')">' + bookmarkOutline + '</button>'
          + '</div>'
        + '</div>';
      }).join('') : '<div class="empty-note" style="color:#fff;">No reels yet.</div>')
    + '</div>';
}

/* ---------------- Messages ---------------- */
function renderMessages(){
  document.getElementById('main-col').innerHTML =
    '<h2 style="font-size:18px;margin:10px 4px 6px;">Messages</h2>'
    + (conversations.length ? conversations.map(function(c){
        return '<div class="msg-row ' + (c.unread ? 'unread' : '') + '" onclick="openChat(\'' + c.uid + '\')">'
          + '<span class="av-wrap"><img src="' + avatarOf(c) + '"><span class="presence-dot" data-uid="' + c.uid + '"></span></span>'
          + '<div class="body"><div class="u">' + esc(c.user) + '</div><div class="last">' + (c.lastFromMe ? 'You: ' : '') + esc(c.last) + '</div></div>'
          + (c.unread ? '<div class="dot"></div>' : '')
        + '</div>';
      }).join('') : '<div class="empty-note">No messages yet.<br>Open someone\'s profile and tap Message.</div>');
  updatePresenceDots();
}

async function openChat(uid){
  activeChat = uid;
  if(!conversations.some(function(c){ return c.uid === uid; })){
    try {
      var q = await supa.from('profiles').select('id,username,avatar_url').eq('id', uid).maybeSingle();
      if(q.data){
        conversations.push({ uid: uid, user: q.data.username, avatar: q.data.avatar_url, last: '', lastTime: new Date().toISOString(), lastFromMe: false, unread: false });
      }
    } catch(e){}
  }
  await markChatRead(uid);
  await fetchThread();
  renderChat();
  scheduleConvRefresh();
  updateBadges();
}

async function markChatRead(uid){
  try {
    await supa.from('messages')
      .update({ read_at: new Date().toISOString() })
      .match({ recipient_id: me.id, sender_id: uid })
      .is('read_at', null);
  } catch(e){ console.error(e); }
}

async function fetchThread(){
  if(!activeChat) return;
  const q = await supa.from('messages')
    .select('*')
    .or('and(sender_id.eq.' + me.id + ',recipient_id.eq.' + activeChat + '),and(sender_id.eq.' + activeChat + ',recipient_id.eq.' + me.id + '))')
    .order('created_at', { ascending: true })
    .limit(300);
  chatThread = q.error ? [] : (q.data || []).filter(function(m){
    return !(m.hidden_for && m.hidden_for.indexOf(me.id) !== -1);
  });
}

function partnerProfile(uid){
  const c = conversations.find(function(x){ return x.uid === uid; });
  return c || { username: 'user', uid: uid };
}

function renderChat(){
  const c = partnerProfile(activeChat);
  var prevInput = document.getElementById('chat-input');
  var prevText = prevInput ? prevInput.value : '';
  document.getElementById('main-col').innerHTML =
    '<div class="chat-head">'
      + '<button onclick="activeChat=null;renderMessages();updateBadges();"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
      + '<span class="av-wrap"><img src="' + avatarOf(c) + '"><span class="presence-dot" data-uid="' + c.uid + '"></span></span>'
      + '<span class="u" style="cursor:pointer" onclick="viewProfile(\'' + c.user + '\')">' + esc(c.user) + '</span>'
    + '</div>'
    + '<div class="chat-thread" id="chat-thread">'
    + (chatThread.length ? chatThread.map(function(m){
        var mine = m.sender_id === me.id;
        return '<div class="msg-wrap ' + (mine ? 'me' : 'them') + '">'
          + '<div class="bubble ' + (mine ? 'me' : 'them') + '">' + renderMsgBody(m) + '</div>'
          + (m.id ? '<button class="msg-del" title="More options" onclick="openMsgMenu(\'' + m.id + '\')">&#8943;</button>' : '')
        + '</div>';
      }).join('') : '<div class="empty-note">Say hi!</div>')
    + '</div>'
    + '<div class="staged-file-row" id="staged-file-row" style="' + (pendingChatFile ? 'display:flex' : 'display:none') + '">'
      + '<span class="sf-chip">'
        + '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>'
        + '<span class="sf-name">' + esc(pendingChatFile ? (pendingChatFile.name || 'File') : '') + '</span>'
        + '<button class="sf-x" title="Remove" onclick="clearStagedFile()">&times;</button>'
      + '</span>'
      + '<span class="sf-hint">Tap Send to deliver</span>'
    + '</div>'
    + '<div class="chat-input-row">'
      + '<button class="attach-btn" title="Send a photo, video, audio or file" onclick="document.getElementById(\'chat-file-input\').click()">'
        + '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.4 11.1 12.3 20a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>'
      + '</button>'
      + '<input id="chat-input" placeholder="Message..." onkeydown="if(event.key===\'Enter\')sendChat()">'
      + '<button onclick="sendChat()">Send</button>'
    + '</div>'
    + '<input type="file" id="chat-file-input" style="display:none" onchange="onChatFile()">'
    + (msgMenuId ? '<div class="modal-overlay open" id="msg-menu" style="z-index:350;" onclick="if(event.target===this)closeMsgMenu()">'
      + '<div class="modal" style="max-width:300px;"><div class="modal-body" style="display:flex;flex-direction:column;gap:10px;padding:18px 16px;">'
        + (msgMenuMedia ? '<button class="share-btn" style="margin-top:0;background:#0095F6;" onclick="downloadMsgMedia(msgMenuId)">Download file</button>' : '')
        + '<div style="font-size:13.5px;color:var(--text-soft);text-align:center;">Delete this message?</div>'
        + (msgMenuMine ? '<button class="share-btn" style="margin-top:0;background:var(--like);" onclick="deleteMsgForEveryone(msgMenuId)">Delete for everyone</button>' : '')
        + '<button class="share-btn" style="margin-top:0;" onclick="deleteMsgForMe(msgMenuId)">Delete for me</button>'
        + '<button class="ghost-btn" style="margin-top:0;" onclick="closeMsgMenu()">Cancel</button>'
      + '</div></div></div>' : '');
  var ci = document.getElementById('chat-input');
  if(ci && prevText) ci.value = prevText;
  updatePresenceDots();
  const thread = document.getElementById('chat-thread');
  if(thread) thread.scrollTop = thread.scrollHeight;
}

function sendChat(){
  const input = document.getElementById('chat-input');
  const text = (input.value || '').trim();
  if(!pendingChatFile && !text) return;
  if(pendingChatFile){
    sendChatFile(pendingChatFile, text);
    return;
  }
  input.value = '';
  sendMessage(activeChat, text);
}
function clearStagedFile(){
  pendingChatFile = null;
  renderChat();
}

async function sendMessage(partnerId, text){
  text = (text || '').trim();
  if(!text) return;
  if(activeChat === partnerId){
    chatThread.push({ sender_id: me.id, recipient_id: partnerId, text: text, created_at: new Date().toISOString() });
    renderChat();
  }
  const r = await supa.from('messages').insert({ sender_id: me.id, recipient_id: partnerId, text: text });
  if(r.error){ toast('Could not send the message'); }
  else if(partnerId !== me.id){ supa.from('notifications').insert({ user_id: partnerId, actor_id: me.id, type: 'message' }); }
  scheduleConvRefresh();
}

/* ---------------- File / media messages ---------------- */
function convLastText(m){
  if(m && m.media_url){
    if(m.media_type === 'image') return '\ud83d\udcf7 Photo';
    if(m.media_type === 'video') return '\ud83c\udfac Video';
    if(m.media_type === 'audio') return '\ud83c\udfb5 Audio';
    if(m.text) return m.text;
    return '\ud83d\udcce ' + (m.media_name || 'File');
  }
  return m ? m.text : '';
}
function renderMsgBody(m){
  if(m.media_url){
    var inner = '';
    if(m.media_type === 'image'){
      inner = '<img class="msg-media" src="' + esc(m.media_url) + '" loading="lazy" onclick="openUrlViewer(\'' + m.media_url + '\')">';
    } else if(m.media_type === 'video'){
      inner = '<video class="msg-media" src="' + esc(m.media_url) + '" controls preload="metadata"></video>';
    } else if(m.media_type === 'audio'){
      inner = '<audio class="msg-audio" src="' + esc(m.media_url) + '" controls preload="metadata"></audio>';
    } else {
      inner = '<a class="msg-file" href="' + esc(m.media_url) + '" target="_blank" onclick="event.preventDefault();downloadMedia(\'' + m.media_url + '\')"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg><span>' + esc(m.media_name || 'Download file') + '</span></a>';
    }
    return inner + (m.text ? '<div>' + esc(m.text) + '</div>' : '');
  }
  return esc(m.text);
}
function openUrlViewer(url){
  var img = document.getElementById('img-viewer-img');
  if(!img) return;
  img.src = url;
  document.getElementById('img-viewer').classList.add('open');
}
async function uploadMsgFile(file){
  file = await compressImage(file, 1440, 0.82);
  var safeName = (file && file.name ? file.name : 'file').replace(/[^a-zA-Z0-9._-]/g, '').slice(-40) || 'file';
  var path = me.id + '/msg_' + Date.now() + '_' + safeName;
  var up = await supa.storage.from('media').upload(path, file, { contentType: (file && file.type) || 'application/octet-stream' });
  if(up.error) throw up.error;
  var pub = supa.storage.from('media').getPublicUrl(path);
  return pub.data.publicUrl;
}
function onChatFile(){
  var f = document.getElementById('chat-file-input');
  var file = f && f.files ? f.files[0] : null;
  if(f) f.value = '';
  if(!file || !activeChat) return;
  if(!mediaMsgReady){ toast('File messages need a one-time SQL update — see media-messages.sql'); return; }
  if(file.size > 12.5 * 1024 * 1024){
    toast('"' + (file.name || 'File') + '" is too big — the limit is 12.5 MB. It was not attached.');
    return;
  }
  pendingChatFile = file;
  renderChat();
  toast('File attached — tap Send to deliver it');
}
async function sendChatFile(file, text){
  var t = (file.type || '').split('/')[0];
  var mediaType = 'file';
  if(t === 'image') mediaType = 'image';
  else if(t === 'video') mediaType = 'video';
  else if(t === 'audio') mediaType = 'audio';
  var inputEl = document.getElementById('chat-input');
  if(inputEl) inputEl.value = '';
  pendingChatFile = null;
  text = (text || '').trim();
  toast('Uploading ' + (file.name || 'file') + '\u2026');
  try {
    var url = await uploadMsgFile(file);
    var payload = {
      sender_id: me.id, recipient_id: activeChat, text: text || '',
      media_url: url, media_type: mediaType,
      media_name: (file.name || '').slice(0, 120) || null
    };
    if(mediaMsgV2Ready) payload.file_bytes = file.size || null;
    var r = await supa.from('messages').insert(payload);
    if(r.error) throw r.error;
    if(activeChat !== me.id) supa.from('notifications').insert({ user_id: activeChat, actor_id: me.id, type: 'message' });
    await fetchThread();
    renderChat();
    scheduleConvRefresh();
  } catch(err){
    console.error(err);
    toast('Could not send the file');
  }
}

/* ---- message delete menu (for everyone / for me) ---- */
function openMsgMenu(id){
  var m = null;
  for(var i=0;i<chatThread.length;i++){ if(chatThread[i].id === id){ m = chatThread[i]; break; } }
  if(!m) return;
  msgMenuId = id;
  msgMenuMine = m.sender_id === me.id;
  msgMenuMedia = m.media_url || null;
  renderChat();
}
function closeMsgMenu(){
  msgMenuId = null;
  renderChat();
}
async function deleteMsgForEveryone(id){
  msgMenuId = null;
  var r = await supa.from('messages').delete().eq('id', id);
  if(r.error){ toast('Could not delete the message'); renderChat(); return; }
  await fetchThread();
  renderChat();
  scheduleConvRefresh();
  toast('Deleted for everyone');
}
async function deleteMsgForMe(id){
  msgMenuId = null;
  if(!mediaMsgV2Ready){ toast('Needs a one-time SQL update — see media-messages-v2.sql'); renderChat(); return; }
  var r = await supa.rpc('hide_message_for_me', { msg_id: id });
  if(r.error){ toast('Could not delete the message'); renderChat(); return; }
  await fetchThread();
  renderChat();
  scheduleConvRefresh();
  toast('Deleted for you');
}

/* ---------------- Notifications ---------------- */
function renderNotifications(){
  document.getElementById('notif-dot').style.display = 'none';
  markNotificationsRead();
  const rows = notifications.map(function(n){
    const actor = n.actor || { username: 'someone' };
    let text;
    if(n.type === 'like') text = 'liked your post.';
    else if(n.type === 'comment') text = 'commented on your post.';
    else if(n.type === 'follow') text = 'started following you.';
    else if(n.type === 'story_like') text = 'liked your story.';
    else if(n.type === 'message') text = 'sent you a message.';
    else text = 'interacted with you.';
    const icon = n.type === 'like' ? heartFilled : (n.type === 'message' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3 3 10.5l7 3 3 7L21 3Z"/></svg>' : commentIcon);
    return '<div class="notif-row">'
      + '<div style="display:flex;align-items:center;gap:12px;flex:1;cursor:pointer" onclick="' + (n.type === 'message' && n.actor && n.actor.id ? 'openChat(\'' + n.actor.id + '\')' : 'viewProfile(\'' + actor.username + '\')') + '">'
      + (n.type === 'follow' ? '<img class="avt" src="' + avatarOf(actor) + '">' : '<div class="notif-icon">' + icon + '</div>')
      + '<div class="text"><b>' + esc(actor.username) + '</b> ' + text + ' <span class="time">' + timeAgo(n.created_at) + '</span></div>'
      + '</div>'
      + (n.post && n.post.image_url ? '<img class="thumb" src="' + n.post.image_url + '">' : '')
    + '</div>';
  }).join('');
  document.getElementById('main-col').innerHTML =
    '<h2 style="font-size:18px;margin:10px 4px 14px;">Notifications</h2>'
    + (notifications.length ? rows : '<div class="empty-note">No notifications yet.</div>');
}

function markNotificationsRead(){
  supa.from('notifications').update({ read: true })
    .eq('user_id', me.id).eq('read', false)
    .then(function(){}, function(err){ console.error(err); });
}

/* ---------------- My profile ---------------- */
async function renderProfile(){
  const myPosts = explorePool.filter(function(p){ return p.uid === me.id; }).sort(function(a,b){ return new Date(b.time) - new Date(a.time); });
  let savedPosts = [];
  document.getElementById('main-col').innerHTML = '<div class="empty-note">Loading profile…</div>';
  const results = await Promise.all([
    countRows('posts', 'user_id', me.id),
    countRows('follows', 'following_id', me.id),
    countRows('follows', 'follower_id', me.id),
    fetchSavedPosts()
  ]);
  const postCount = results[0], followers = results[1], following = results[2];
  savedPosts = results[3];
  savedPosts.forEach(function(p){ if(!postIndex[p.id]) postIndex[p.id] = p; });
  const shown = profileTab === 'posts' ? myPosts : savedPosts;
  document.getElementById('main-col').innerHTML =
    '<div class="profile-header">'
      + '<img class="pfp" src="' + avatarOf(me) + '">'
      + '<div>'
        + '<h2>' + esc(me.username) + tickFor(me, true)
          + ' <button class="toggle-theme" onclick="openEditProfile()">Edit profile</button>'
          + ' <button class="toggle-theme" onclick="showView(\'settings\')">⚙ Settings</button>'
          + (!myEmail ? ' <button class="toggle-theme" style="color:var(--accent-d);font-weight:600;" onclick="openAddEmail()">✉ Add email</button>' : '')
        + '</h2>'
        + '<div class="profile-stats">'
          + '<span><b>' + postCount + '</b> posts</span>'
          + '<span><b>' + followers + '</b> followers</span>'
          + '<span><b>' + following + '</b> following</span>'
        + '</div>'
        + '<div class="profile-bio"><b>' + esc(me.display_name || me.username) + '</b>' + esc(me.bio || '') + '</div>'
      + '</div>'
    + '</div>'
    + '<div class="profile-tabs">'
      + '<button class="' + (profileTab === 'posts' ? 'active' : '') + '" onclick="setProfileTab(\'posts\')">POSTS</button>'
      + '<button class="' + (profileTab === 'saved' ? 'active' : '') + '" onclick="setProfileTab(\'saved\')">SAVED</button>'
    + '</div>'
    + '<div class="grid">'
    + (shown.length ? shown.map(function(p){
        return '<div class="cell" onclick="openPostModal(\'' + p.id + '\')"><img src="' + p.img + '" loading="lazy">' + (p.audio ? '<div class="cell-music-badge">♪</div>' : '') + multiBadge(p) + '</div>';
      }).join('') : '<div class="empty-note" style="grid-column:1/-1;">' + (profileTab === 'posts' ? 'No posts yet.' : 'Nothing saved yet.') + '</div>')
    + '</div>';
}
function setProfileTab(t){ profileTab = t; renderProfile(); }

/* ---------------- Other users' profiles ---------------- */
function viewProfile(username){
  closePostModal();
  if(document.getElementById('story-viewer').classList.contains('open')) closeStoryViewer();
  if(me && username === me.username){ showView('profile'); return; }
  if(currentView !== 'otherProfile') returnView = currentView;
  currentView = 'otherProfile';
  lastViewedProfile = username;
  document.getElementById('app').classList.remove('full','wide');
  ['nav-feed','nav-explore','nav-reels','nav-profile'].forEach(function(id){
    const el = document.getElementById(id);
    if(el) el.classList.remove('active');
  });
  renderOtherProfile(username);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backFromProfile(){
  showView(returnView);
}

async function renderOtherProfile(username){
  document.getElementById('main-col').innerHTML = '<div class="empty-note">Loading profile…</div>';
  const q = await supa.from('profiles').select('*').eq('username', username).maybeSingle();
  if(q.error || !q.data){
    document.getElementById('main-col').innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;padding:14px 4px;">'
      + '<button onclick="backFromProfile()" style="background:none;border:none;color:var(--text);"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
      + '</div><div class="empty-note">User not found.</div>';
    return;
  }
  const prof = q.data;
  const results = await Promise.all([
    supa.from('posts').select('id,user_id,image_url,caption,created_at' + mediaField() + audioFields() + ',profiles!posts_user_id_fkey(id,username,avatar_url' + profileExtra() + ',likes(user_id)').eq('user_id', prof.id).order('created_at', { ascending: false }).limit(60),
    countRows('posts', 'user_id', prof.id),
    countRows('follows', 'following_id', prof.id),
    countRows('follows', 'follower_id', prof.id)
  ]);
  const theirPosts = (results[0].data || []).map(mapPost);
  const postCount = results[1], followers = results[2], following = results[3];
  const iFollow = myFollows.has(prof.id);
  document.getElementById('main-col').innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;padding:14px 4px;">'
      + '<button onclick="backFromProfile()" style="background:none;border:none;color:var(--text);"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
      + '<span style="font-weight:600;font-size:15px;">' + esc(prof.username) + tickFor(prof, false) + '</span>'
    + '</div>'
    + '<div class="profile-header">'
      + '<span class="av-wrap"><img class="pfp" src="' + avatarOf(prof) + '"><span class="presence-dot" data-uid="' + prof.id + '"></span></span>'
      + '<div>'
        + '<h2>' + esc(prof.username) + tickFor(prof, false)
          + ' <button class="primary-btn" id="follow-btn-' + prof.id + '" onclick="toggleFollow(\'' + prof.id + '\')">' + (iFollow ? 'Following' : 'Follow') + '</button>'
          + ' <button class="toggle-theme" onclick="messageUser(\'' + prof.id + '\')">Message</button>'
          + (me.is_admin ? ' <button class="toggle-theme" style="color:#0095F6;font-weight:600;" onclick="toggleBlueTick(\'' + prof.id + '\',\'' + prof.username + '\',' + (prof.badge === 'blue' ? 'true' : 'false') + ')">' + (prof.badge === 'blue' ? 'Remove blue tick' : 'Give blue tick') + '</button>' : '')
        + '</h2>'
        + '<div class="profile-stats">'
          + '<span><b>' + postCount + '</b> posts</span>'
          + '<span><b>' + followers + '</b> followers</span>'
          + '<span><b>' + following + '</b> following</span>'
        + '</div>'
        + '<div class="profile-bio"><b>' + esc(prof.display_name || prof.username) + '</b>' + esc(prof.bio || '') + '</div>'
      + '</div>'
    + '</div>'
    + '<div class="grid">'
    + (theirPosts.length ? theirPosts.map(function(p){
        return '<div class="cell" onclick="openPostModal(\'' + p.id + '\')"><img src="' + p.img + '" loading="lazy">' + (p.audio ? '<div class="cell-music-badge">♪</div>' : '') + multiBadge(p) + '</div>';
      }).join('') : '<div class="empty-note" style="grid-column:1/-1;">No posts yet.</div>')
    + '</div>';
  theirPosts.forEach(function(p){ postIndex[p.id] = p; });
  updatePresenceDots();
}

function messageUser(uid){
  showView('messages');
  openChat(uid);
}

/* ---------------- Suggestions (side col) ---------------- */
function renderSuggestions(){
  const el = document.getElementById('suggestions');
  if(!el) return;
  el.innerHTML = suggestionsData.map(function(s){
    const following = myFollows.has(s.id);
    return '<div class="suggestion">'
      + '<div class="l" style="cursor:pointer" onclick="viewProfile(\'' + s.username + '\')"><img src="' + avatarOf(s) + '"><div><div class="u">' + esc(s.username) + '</div></div></div>'
      + '<button class="' + (following ? 'following' : '') + '" onclick="event.stopPropagation();toggleFollow(\'' + s.id + '\')">' + (following ? 'Following' : 'Follow') + '</button>'
    + '</div>';
  }).join('');
}

/* ---------------- View switching ---------------- */
function showView(v){
  currentView = v;
  activeChat = null;
  document.body.classList.toggle('view-settings', v === 'settings' || v === 'pro');
  const app = document.getElementById('app');
  app.classList.remove('full','wide');
  ['nav-feed','nav-explore','nav-reels','nav-profile'].forEach(function(id){
    const el = document.getElementById(id);
    if(el) el.classList.remove('active');
  });
  if(v === 'feed'){ renderFeed(true); markNav('nav-feed'); }
  else if(v === 'explore'){ renderExplore(); markNav('nav-explore'); }
  else if(v === 'reels'){ app.classList.add('full'); renderReels(); markNav('nav-reels'); }
  else if(v === 'messages'){ app.classList.add('wide'); renderMessages(); }
  else if(v === 'notifications'){ renderNotifications(); }
  else if(v === 'profile'){ renderProfile(); markNav('nav-profile'); }
  else if(v === 'settings'){ renderSettings(); }
  else if(v === 'pro'){ renderPro(); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function markNav(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

function renderView(){
  if(currentView === 'feed') renderFeed();
  else if(currentView === 'explore') renderExplore();
  else if(currentView === 'reels') renderReels();
  else if(currentView === 'messages'){ if(activeChat) renderChat(); else renderMessages(); }
  else if(currentView === 'notifications') renderNotifications();
  else if(currentView === 'profile') renderProfile();
  else if(currentView === 'otherProfile' && lastViewedProfile) renderOtherProfile(lastViewedProfile);
  if(postModalOpenId){
    const p = postIndex[postModalOpenId];
    if(p) document.getElementById('post-modal-content').innerHTML = renderPost(p);
  }
}

function refresh(){
  renderView();
  renderSuggestions();
}

/* ---------------- Post interactions ---------------- */
async function likePost(id, fromDbl){
  const p = postIndex[id];
  if(!p) return;
  const liked = p.likes.indexOf(me.id) !== -1;
  if(fromDbl && liked) return;
  if(liked){
    p.likes = p.likes.filter(function(u){ return u !== me.id; });
  } else {
    p.likes.push(me.id);
    const b = document.getElementById('burst-' + id);
    if(b){ b.classList.remove('play'); void b.offsetWidth; b.classList.add('play'); }
  }
  refresh();
  const r = liked
    ? await supa.from('likes').delete().match({ post_id: id, user_id: me.id })
    : await supa.from('likes').insert({ post_id: id, user_id: me.id });
  if(r.error){ toast('Could not update the like'); }
  else if(!liked && p.uid !== me.id){
    supa.from('notifications').insert({ user_id: p.uid, actor_id: me.id, type: 'like', post_id: id })
      .then(function(){}, function(err){ console.error(err); });
  }
}

async function savePost(id){
  const p = postIndex[id];
  if(!p) return;
  const wasSaved = mySaved.has(id);
  if(wasSaved){ mySaved.delete(id); } else { mySaved.add(id); }
  refresh();
  const r = wasSaved
    ? await supa.from('saved').delete().match({ post_id: id, user_id: me.id })
    : await supa.from('saved').insert({ post_id: id, user_id: me.id });
  if(r.error){ toast('Could not save the post'); if(wasSaved) mySaved.add(id); else mySaved.delete(id); }
}

function sharePost(id){
  var url = location.origin + location.pathname + (id ? ('?post=' + encodeURIComponent(id)) : '');
  var text = 'Look at this on Pulse';
  if(navigator.share){
    navigator.share({ title: 'Pulse', text: text, url: url }).catch(function(){});
    return;
  }
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){ toast('Link copied - paste it anywhere'); }, function(){ toast(url); });
    return;
  }
  toast(url);
}
async function openPostFromUrl(id){
  if(!me || !id) return;
  if(!postIndex[id]){
    var q = await supa.from('posts')
      .select('id,user_id,image_url,caption,created_at' + mediaField() + audioFields() + ',profiles!posts_user_id_fkey(id,username,avatar_url' + profileExtra() + ',likes(user_id),comments(id,user_id,text,created_at,profiles!comments_user_id_fkey(id,username,avatar_url))')
      .eq('id', id).maybeSingle();
    if(q.error || !q.data) return;
    posts.unshift(mapPost(q.data));
    indexPosts();
  }
  openPostModal(id);
}

function focusComment(id){
  const el = document.getElementById('comment-input-' + id);
  if(el) el.focus();
}
function toggleCommentBtn(id){
  const input = document.getElementById('comment-input-' + id);
  const btn = document.getElementById('comment-btn-' + id);
  if(input && btn) btn.classList.toggle('enabled', input.value.trim().length > 0);
}
async function addComment(id){
  const input = document.getElementById('comment-input-' + id);
  const text = (input.value || '').trim();
  if(!text) return;
  input.value = '';
  const p = postIndex[id];
  if(!p) return;
  const tmpId = 'tmp' + Date.now();
  p.comments.push({ id: tmpId, uid: me.id, user: me.username, t: text, time: new Date().toISOString() });
  p.commentsExpanded = true;
  refresh();
  const r = await supa.from('comments').insert({ post_id: id, user_id: me.id, text: text });
  if(r.error){
    toast('Could not post the comment');
    p.comments = p.comments.filter(function(c){ return c.id !== tmpId; });
    refresh();
  } else if(p.uid !== me.id){
    supa.from('notifications').insert({ user_id: p.uid, actor_id: me.id, type: 'comment', post_id: id })
      .then(function(){}, function(err){ console.error(err); });
  }
}

/* ---------------- Follow ---------------- */
async function toggleFollow(uid){
  if(uid === me.id) return;
  const was = myFollows.has(uid);
  if(was){ myFollows.delete(uid); } else { myFollows.add(uid); }
  refresh();
  const r = was
    ? await supa.from('follows').delete().match({ follower_id: me.id, following_id: uid })
    : await supa.from('follows').insert({ follower_id: me.id, following_id: uid });
  if(r.error){ toast('Could not update follow'); if(was) myFollows.add(uid); else myFollows.delete(uid); return; }
  if(!was){
    supa.from('notifications').insert({ user_id: uid, actor_id: me.id, type: 'follow' })
      .then(function(){}, function(err){ console.error(err); });
  }
  const btn = document.getElementById('follow-btn-' + uid);
  if(btn) btn.textContent = was ? 'Follow' : 'Following';
}

/* ---------------- Story viewer ---------------- */
let svUser = null, svIndex = 0, svTimer = null;
let svAudio = null;
const SV_DURATION = 4500;
const SV_MUSIC_DURATION = 8000;

function stopStoryAudio(){
  if(svAudio){ try{ svAudio.pause(); }catch(e){} svAudio = null; }
  var st = document.getElementById('sv-music-sticker');
  if(st){ st.style.display = 'none'; st.classList.remove('playing'); }
}

function getStoryUser(u){
  if(me && u === me.username){
    const entry = storiesByUser[u] || { avatar: me.avatar_url, items: [] };
    return { u: u, uid: me.id, avatar: entry.avatar || me.avatar_url, items: entry.items, mine: true };
  }
  const s = storiesByUser[u];
  return s ? { u: u, uid: s.uid, avatar: s.avatar, items: s.items, mine: false } : { items: [] };
}

function svPaintHeader(){
  if(!svUser) return;
  document.getElementById('sv-uname').textContent = svUser.u;
  document.getElementById('sv-avatar').src = avatarOf(svUser.mine ? me : svUser);
  document.getElementById('sv-delete').style.display = svUser.mine ? 'flex' : 'none';
  document.getElementById('sv-reply').value = '';
}
function svShowUser(u){
  svUser = getStoryUser(u);
  if(!svUser || !svUser.items || svUser.items.length === 0) return false;
  svIndex = 0;
  svPaintHeader();
  playStory();
  return true;
}
function openStoryViewer(u){
  document.getElementById('story-viewer').classList.add('open');
  if(!svShowUser(u)){ closeStoryViewer(); return; }
  document.addEventListener('keydown', svKeyHandler);
}
// tray order, same order as the story rail (your own story is not included)
function storyUserOrder(){
  return Object.keys(storiesByUser).filter(function(u){
    var s = storiesByUser[u];
    return u !== me.username && s && s.items && s.items.length;
  });
}

function svKeyHandler(e){
  var t = e.target;
  if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  if(e.key === 'ArrowRight') storyNext();
  else if(e.key === 'ArrowLeft') storyPrev();
  else if(e.key === 'Escape') closeStoryViewer();
}

function renderSvBars(){
  document.getElementById('sv-bars').innerHTML = svUser.items.map(function(_, i){
    return '<div class="sv-bar"><div class="sv-bar-fill ' + (i < svIndex ? 'done' : '') + '" id="sv-fill-' + i + '"></div></div>';
  }).join('');
}

function playStory(){
  clearTimeout(svTimer);
  stopAudio();
  stopStoryAudio();
  renderSvBars();
  loadStoryLikeState();
  const item = svUser.items[svIndex];
  document.getElementById('sv-image').src = item.img;
  stRenderStoryTexts(item.texts || []);
  document.getElementById('sv-time').textContent = timeAgo(item.time);
  const sticker = document.getElementById('sv-music-sticker');
  if(item.audio){
    if(sticker){
      sticker.style.display = 'flex';
      sticker.querySelector('.mtitle').textContent = (item.audioTitle || 'audio') + (item.audioArtist ? ' · ' + item.audioArtist : '');
    }
    try {
      svAudio = applyVol(new Audio(item.audio));
      svAudio.play().then(function(){
        if(item.audioStart > 0){ try{ svAudio.currentTime = item.audioStart; }catch(e){} }
        if(sticker) sticker.classList.add('playing');
      }).catch(function(){});
    } catch(e){ svAudio = null; }
  } else if(sticker){
    sticker.style.display = 'none';
  }
  const dur = item.audio ? SV_MUSIC_DURATION : SV_DURATION;
  const fill = document.getElementById('sv-fill-' + svIndex);
  if(fill){
    fill.style.animationDuration = dur + 'ms';
    fill.classList.add('playing');
  }
  svTimer = setTimeout(storyNext, dur);
}

function storyNext(){
  if(!svUser || !svUser.items) { closeStoryViewer(); return; }
  if(svIndex < svUser.items.length - 1){ svIndex++; playStory(); return; }
  // finished this person's story: move on to the next person, like Instagram
  markCurrentStorySeen();
  var order = storyUserOrder();
  if(!order.length){ closeStoryViewer(); return; }
  var i = order.indexOf(svUser.u);
  var next = (i === -1) ? order[0] : (i + 1 < order.length ? order[i + 1] : null);
  if(next){ svShowUser(next); }
  else { closeStoryViewer(); }
}
function storyPrev(){
  if(!svUser || !svUser.items) return;
  if(svIndex > 0){ svIndex--; playStory(); return; }
  // step back into the previous person's last story
  var order = storyUserOrder();
  var i = order.indexOf(svUser.u);
  if(i > 0){
    var prev = getStoryUser(order[i - 1]);
    if(prev && prev.items && prev.items.length){
      svUser = prev;
      svIndex = prev.items.length - 1;
      svPaintHeader();
      playStory();
    }
  }
}
function markCurrentStorySeen(){
  if(!svUser || !svUser.items || !svUser.items[svIndex]) return;
  const item = svUser.items[svIndex];
  if(item && !seenStoryIds.has(item.id)){
    seenStoryIds.add(item.id);
    try { localStorage.setItem('pulse-seen-stories', JSON.stringify(Array.from(seenStoryIds).slice(-500))); } catch(e){}
    if(currentView === 'feed') renderFeed();
  }
}
function closeStoryViewer(){
  clearTimeout(svTimer);
  stopStoryAudio();
  markCurrentStorySeen();
  document.getElementById('story-viewer').classList.remove('open');
  document.removeEventListener('keydown', svKeyHandler);
}

function sendStoryReply(){
  const input = document.getElementById('sv-reply');
  const text = (input.value || '').trim();
  if(!text) return;
  input.value = '';
  if(svUser && svUser.uid && svUser.uid !== me.id){
    sendMessage(svUser.uid, text);
    toast('Reply sent');
  }
  storyNext();
}

async function loadStoryLikeState(){
  svILiked = false;
  svLikeCount = 0;
  var item = svUser && svUser.items && svUser.items[svIndex] ? svUser.items[svIndex] : null;
  updateStoryLikeUI();
  if(!item || !storyLikesReady) return;
  try {
    var q = await supa.from('story_likes').select('user_id').eq('story_id', item.id);
    if(q.error) return;
    var rows = q.data || [];
    svLikeCount = rows.length;
    svILiked = rows.some(function(r){ return r.user_id === me.id; });
    updateStoryLikeUI();
  } catch(e){}
}
function updateStoryLikeUI(){
  var btn = document.getElementById('sv-like-btn');
  var cnt = document.getElementById('sv-like-count');
  if(!btn || !cnt) return;
  if(svUser && svUser.mine){
    btn.style.display = 'none';
    cnt.style.display = svLikeCount > 0 ? 'inline' : 'none';
    cnt.textContent = '\u2665 ' + svLikeCount;
  } else {
    cnt.style.display = 'none';
    btn.style.display = 'flex';
    btn.classList.toggle('liked', svILiked);
  }
}
async function storyLikeTap(){
  var item = svUser && svUser.items && svUser.items[svIndex] ? svUser.items[svIndex] : null;
  if(!item || !svUser || svUser.mine) return;
  if(!storyLikesReady){ toast('Story likes need a one-time SQL update in Supabase — see story-likes-timeline.sql'); return; }
  if(svILiked){
    var d = await supa.from('story_likes').delete().match({ story_id: item.id, user_id: me.id });
    if(d.error){ toast('Could not remove the like'); return; }
    svILiked = false;
    svLikeCount = Math.max(0, svLikeCount - 1);
    updateStoryLikeUI();
    toast('Like removed');
  } else {
    var r = await supa.from('story_likes').insert({ story_id: item.id, user_id: me.id });
    if(r.error){ toast('Could not like the story'); return; }
    svILiked = true;
    svLikeCount += 1;
    updateStoryLikeUI();
    toast('Liked!');
    if(svUser.uid && svUser.uid !== me.id){
      supa.from('notifications').insert({ user_id: svUser.uid, actor_id: me.id, type: 'story_like' })
        .then(function(){}, function(err){ console.error(err); });
    }
  }
}

async function deleteStoryItem(){
  if(!svUser || !svUser.mine) return;
  if(!confirm('Delete this story?')) return;
  const item = svUser.items[svIndex];
  const r = await supa.from('stories').delete().eq('id', item.id);
  if(r.error){ toast('Could not delete the story'); return; }
  svUser.items.splice(svIndex, 1);
  if(svUser.items.length === 0){
    delete storiesByUser[me.username];
    closeStoryViewer();
    renderFeed();
    return;
  }
  if(svIndex >= svUser.items.length) svIndex = svUser.items.length - 1;
  playStory();
}

/* ---------------- Create modal (post or story) ---------------- */
function openCreateModal(tab){
  if(!me){ toast('Finish signing up first'); return; }
  setCreateTab(tab || 'post');
  renderMusicRow();
  document.getElementById('create-modal').classList.add('open');
}
function setCreateTab(tab){
  createTab = tab;
  stShowTools();
  document.getElementById('tab-post').classList.toggle('active', tab === 'post');
  document.getElementById('tab-story').classList.toggle('active', tab === 'story');
  document.getElementById('create-title').textContent = tab === 'post' ? 'Create new post' : 'Add to your story';
  document.getElementById('caption-input').style.display = tab === 'post' ? 'block' : 'none';
  document.getElementById('share-btn').textContent = tab === 'post' ? 'Share' : 'Add to story';
}
function stShowTools(){
  var tools = document.getElementById('story-text-tools');
  if(!tools) return;
  var hasImage = document.getElementById('preview-wrap').style.display === 'block';
  var show = (createTab === 'story') && hasImage;
  tools.style.display = show ? 'block' : 'none';
  if(show) stRender(); else { storyTexts = []; stSel = -1; stRender(); }
}
function closeCreateModal(){
  stopPreview();
  document.getElementById('create-modal').classList.remove('open');
  document.getElementById('drop-zone').style.display = 'flex';
  document.getElementById('preview-wrap').style.display = 'none';
  document.getElementById('caption-input').value = '';
  document.getElementById('file-input').value = '';
  document.getElementById('share-btn').disabled = true;
  pendingImages = [];
  curImgIdx = 0;
  document.getElementById('multi-thumbs').style.display = 'none';
  document.getElementById('multi-thumbs').innerHTML = '';
  pendingSong = null;
  document.getElementById('editor-tools').style.display = 'none';
  document.getElementById('crop-tools').style.display = 'none';
  var cb = document.getElementById('crop-box');
  if(cb) cb.style.display = 'none';
  cropMode = false;
  edSource = null;
  edOriginal = null;
  edReset();
  renderMusicRow();
}
document.getElementById('file-input').addEventListener('change', function(e){
  var files = Array.prototype.slice.call(e.target.files || []);
  e.target.value = '';
  if(!files.length) return;
  if(files.length + pendingImages.length > 5) toast('Up to 5 photos per post — extra photos were not added');
  var added = [];
  for(var i=0;i<files.length && pendingImages.length + added.length < 5;i++){
    if(files[i].type && files[i].type.indexOf('image/') !== 0) continue;
    added.push({ file: files[i], dataUrl: null, edit: null });
  }
  if(!added.length) return;
  Promise.all(added.map(function(item){
    return new Promise(function(res){
      var r = new FileReader();
      r.onload = function(ev){ item.dataUrl = ev.target.result; res(); };
      r.onerror = function(){ res(); };
      r.readAsDataURL(item.file);
    });
  })).then(function(){
    if(pendingImages.length) snapEdit();
    var startIdx = pendingImages.length;
    pendingImages = pendingImages.concat(added);
    selectPick(startIdx, true);
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('share-btn').disabled = false;
    renderThumbs();
    stShowTools();
  });
});

/* ---- multi-photo picker: switch / remove / thumbnails ---- */
function snapEdit(){
  if(!pendingImages[curImgIdx]) return;
  if(!edSource && !edOriginal) return; // nothing loaded yet — don't overwrite the photo's saved state
  pendingImages[curImgIdx].edit = {
    ed: Object.assign({}, ed),
    edSource: edSource,
    edOriginal: edOriginal,
    edCropOff: Object.assign({}, edCropOff)
  };
}
function restoreEdit(item){
  if(item.edit && item.edit.edSource){
    ed = Object.assign({}, item.edit.ed);
    edSource = item.edit.edSource;
    edOriginal = item.edit.edOriginal;
    edCropOff = Object.assign({}, item.edit.edCropOff);
    edSyncSliders();
    edApplyPreview();
  } else {
    edInit(document.getElementById('preview-img'));
  }
}
function selectPick(i, force){
  if(i < 0 || i >= pendingImages.length) return;
  if(!force && i === curImgIdx) return;
  if(cropMode) cropCancel();
  snapEdit();
  curImgIdx = i;
  var item = pendingImages[i];
  var img = document.getElementById('preview-img');
  img.style.display = 'block';
  img.src = item.dataUrl;
  restoreEdit(item);
  renderThumbs();
}
function removePick(i){
  if(i < 0 || i >= pendingImages.length) return;
  pendingImages.splice(i, 1);
  if(cropMode) cropCancel();
  if(!pendingImages.length){
    curImgIdx = 0;
    document.getElementById('preview-wrap').style.display = 'none';
    document.getElementById('multi-thumbs').style.display = 'none';
    document.getElementById('drop-zone').style.display = 'flex';
    document.getElementById('share-btn').disabled = true;
    document.getElementById('editor-tools').style.display = 'none';
    edSource = null; edOriginal = null; edReset();
    return;
  }
  if(curImgIdx >= pendingImages.length) curImgIdx = pendingImages.length - 1;
  else if(i < curImgIdx) curImgIdx -= 1;
  else if(i > curImgIdx){ renderThumbs(); return; }
  var item = pendingImages[curImgIdx];
  var img = document.getElementById('preview-img');
  img.src = item.dataUrl;
  restoreEdit(item);
  renderThumbs();
}
function renderThumbs(){
  var t = document.getElementById('multi-thumbs');
  if(!t) return;
  if(!pendingImages.length){ t.style.display = 'none'; t.innerHTML = ''; return; }
  t.style.display = 'flex';
  var html = pendingImages.map(function(it, i){
    return '<div class="mthumb' + (i === curImgIdx ? ' active' : '') + '" onclick="selectPick(' + i + ')">'
      + '<img src="' + it.dataUrl + '">'
      + (i === 0 ? '<span class="mthumb-cov">Cover</span>' : '')
      + '<button class="mthumb-x" title="Remove" onclick="event.stopPropagation();removePick(' + i + ')">&times;</button>'
    + '</div>';
  }).join('');
  if(pendingImages.length < 5){
    html += '<button class="mthumb add" title="Add another photo" onclick="document.getElementById(\'file-input\').click()">+</button>';
  }
  t.innerHTML = html;
}

/* ---------------- Photo editor (brightness / color / zoom) ---------------- */
var ed = { bright: 100, contrast: 100, sat: 100, zoom: 100, x: 0, y: 0, edited: false };
var edSource = null;   // {img, w, h} — the current (possibly cropped) image
var edDrag = null;
var edOriginal = null;          // untouched original {img, w, h}
var edCropOff = { x: 0, y: 0 }; // where the current source sits inside the original
var cropMode = false;
var edRatio = 0;        // 0 = free, else width/height
var cropBox = null;     // {x, y, w, h} in display pixels

function edDispRect(){
  var wrap = document.getElementById('preview-wrap');
  var img = document.getElementById('preview-img');
  if(!wrap || !img || !edSource || !edSource.w || !edSource.h) return null;
  var elW = wrap.clientWidth;
  var elH = img.clientHeight;
  if(!elW || !elH) return null;
  var ar = edSource.w / edSource.h;
  var dispW, dispH;
  if(elW / elH > ar){ dispH = elH; dispW = elH * ar; }
  else { dispW = elW; dispH = elW / ar; }
  return { x: (elW - dispW) / 2, y: (elH - dispH) / 2, w: dispW, h: dispH };
}
function edDisplayRatio(){
  var rc = edDispRect();
  return rc ? rc.w / edSource.w : 1;
}
function edClampPan(){
  if(!edSource) return;
  var z = ed.zoom / 100;
  var mx = Math.max(0, (z - 1) * edSource.w / 2);
  var my = Math.max(0, (z - 1) * edSource.h / 2);
  ed.x = Math.max(-mx, Math.min(mx, ed.x));
  ed.y = Math.max(-my, Math.min(my, ed.y));
}
function edApplyPreview(){
  var img = document.getElementById('preview-img');
  if(!img) return;
  img.style.filter = 'brightness(' + ed.bright + '%) contrast(' + ed.contrast + '%) saturate(' + ed.sat + '%)';
  var r = edDisplayRatio();
  img.style.transform = 'translate(' + (ed.x * r).toFixed(2) + 'px,' + (ed.y * r).toFixed(2) + 'px) scale(' + (ed.zoom / 100) + ')';
  img.style.cursor = ed.zoom > 100 ? 'grab' : 'default';
}
function edSyncSliders(){
  ['bright','contrast','sat','zoom'].forEach(function(k){
    var s = document.getElementById('ed-' + k);
    if(s) s.value = ed[k];
    var lbl = document.getElementById('ed-' + k + '-v');
    if(lbl) lbl.textContent = Math.round(ed[k]);
  });
}
function onEdSlider(key, val){
  ed[key] = parseFloat(val) || 100;
  if(key === 'zoom') edClampPan();
  ed.edited = true;
  edSyncSliders();
  edApplyPreview();
}
function edEnhance(){
  ed.bright = 106; ed.contrast = 112; ed.sat = 118;
  ed.edited = true;
  edSyncSliders();
  edApplyPreview();
  toast('Enhanced ✨');
}
function edReset(){
  ed.bright = 100; ed.contrast = 100; ed.sat = 100; ed.zoom = 100; ed.x = 0; ed.y = 0; ed.edited = false;
  if(edOriginal){
    edCropOff = { x: 0, y: 0 };
    edSource = { img: edOriginal.img, w: edOriginal.w, h: edOriginal.h };
  }
  edSyncSliders();
  edApplyPreview();
}
function edInit(imgEl){
  edOriginal = null;
  edSource = null;
  edReset();
  var img = new Image();
  img.onload = function(){
    edOriginal = { img: img, w: img.naturalWidth, h: img.naturalHeight };
    edSource = { img: img, w: img.naturalWidth, h: img.naturalHeight };
    edCropOff = { x: 0, y: 0 };
    edApplyPreview();
  };
  img.src = imgEl.src;
  var tools = document.getElementById('editor-tools');
  if(tools) tools.style.display = 'block';
}
(function(){
  var img = document.getElementById('preview-img');
  if(!img) return;
  function endDrag(){ edDrag = null; img.style.cursor = ed.zoom > 100 ? 'grab' : 'default'; }
  img.addEventListener('pointerdown', function(e){
    if(cropMode || !edSource || ed.zoom <= 100) return;
    edDrag = { sx: e.clientX, sy: e.clientY, x0: ed.x, y0: ed.y };
    try { img.setPointerCapture(e.pointerId); } catch(err){}
    img.style.cursor = 'grabbing';
    e.preventDefault();
  });
  img.addEventListener('pointermove', function(e){
    if(!edDrag) return;
    var r = edDisplayRatio();
    if(!r) return;
    ed.x = edDrag.x0 + (e.clientX - edDrag.sx) / r;
    ed.y = edDrag.y0 + (e.clientY - edDrag.sy) / r;
    edClampPan();
    ed.edited = true;
    edApplyPreview();
  });
  img.addEventListener('pointerup', endDrag);
  img.addEventListener('pointercancel', endDrag);
})();

/* ---------------- Crop (ratio presets + freehand area selection) ---------------- */
function cropZoneHit(px, py){
  var T = 24;
  var b = cropBox;
  var nearL = Math.abs(px - b.x) <= T, nearR = Math.abs(px - (b.x + b.w)) <= T;
  var nearT = Math.abs(py - b.y) <= T, nearB = Math.abs(py - (b.y + b.h)) <= T;
  if(nearT && nearL) return 'nw';
  if(nearT && nearR) return 'ne';
  if(nearB && nearL) return 'sw';
  if(nearB && nearR) return 'se';
  if(nearT) return 'n';
  if(nearB) return 's';
  if(nearL) return 'w';
  if(nearR) return 'e';
  if(px > b.x && px < b.x + b.w && py > b.y && py < b.y + b.h) return 'move';
  return 'new';
}
function renderCropBox(){
  var el = document.getElementById('crop-box');
  if(!el || !cropBox) return;
  var rc = edDispRect();
  if(!rc) return;
  el.style.left = (rc.x + cropBox.x) + 'px';
  el.style.top = (rc.y + cropBox.y) + 'px';
  el.style.width = cropBox.w + 'px';
  el.style.height = cropBox.h + 'px';
}
function edCropStart(){
  if(!edSource){ toast('Pick a photo first'); return; }
  var rc = edDispRect();
  if(!rc) return;
  cropMode = true;
  edRatio = 0;
  var img = document.getElementById('preview-img');
  img.style.transform = '';
  img.style.cursor = 'default';
  document.getElementById('editor-tools').style.display = 'none';
  document.getElementById('crop-tools').style.display = 'block';
  var chips = document.querySelectorAll('.crop-chip');
  for(var i=0;i<chips.length;i++) chips[i].classList.toggle('active', parseFloat(chips[i].getAttribute('data-r')) === 0);
  cropBox = { x: 0, y: 0, w: rc.w, h: rc.h };
  document.getElementById('crop-box').style.display = 'block';
  renderCropBox();
}
function cropCancel(){
  cropMode = false;
  var el = document.getElementById('crop-box');
  if(el) el.style.display = 'none';
  document.getElementById('crop-tools').style.display = 'none';
  document.getElementById('editor-tools').style.display = 'block';
  edApplyPreview();
}
function cropSetRatio(r){
  edRatio = r;
  var chips = document.querySelectorAll('.crop-chip');
  for(var i=0;i<chips.length;i++) chips[i].classList.toggle('active', Math.abs(parseFloat(chips[i].getAttribute('data-r')) - r) < 0.001);
  if(!r) return;
  var rc = edDispRect();
  if(!rc) return;
  var w = rc.w, h = w / r;
  if(h > rc.h){ h = rc.h; w = h * r; }
  cropBox = { x: (rc.w - w) / 2, y: (rc.h - h) / 2, w: w, h: h };
  renderCropBox();
}
function cropApply(){
  if(!edSource || !cropBox){ cropCancel(); return; }
  var rc = edDispRect();
  if(!rc){ cropCancel(); return; }
  var rr = rc.w / edSource.w;
  var sx = cropBox.x / rr, sy = cropBox.y / rr;
  var sw = Math.min(cropBox.w / rr, edSource.w - sx);
  var sh = Math.min(cropBox.h / rr, edSource.h - sy);
  if(sw < 16 || sh < 16){ toast('Crop area is too small'); return; }
  var cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(sw));
  cv.height = Math.max(1, Math.round(sh));
  cv.getContext('2d').drawImage(edSource.img, Math.round(sx), Math.round(sy), cv.width, cv.height, 0, 0, cv.width, cv.height);
  edCropOff.x += Math.round(sx);
  edCropOff.y += Math.round(sy);
  edSource = { img: cv, w: cv.width, h: cv.height };
  ed.zoom = 100; ed.x = 0; ed.y = 0; ed.edited = true;
  cropMode = false;
  document.getElementById('crop-box').style.display = 'none';
  document.getElementById('crop-tools').style.display = 'none';
  document.getElementById('editor-tools').style.display = 'block';
  edApplyPreview();
  toast('Cropped ✂');
}
function cropResize(zone, drag, px, py){
  var rc = edDispRect();
  if(!rc) return;
  var W = rc.w, H = rc.h;
  px = Math.max(0, Math.min(W, px));
  py = Math.max(0, Math.min(H, py));
  var b = drag.box, R = edRatio, ax, ay;
  if(zone === 'nw'){ ax = b.x + b.w; ay = b.y + b.h; }
  else if(zone === 'ne'){ ax = b.x; ay = b.y + b.h; }
  else if(zone === 'sw'){ ax = b.x + b.w; ay = b.y; }
  else if(zone === 'se'){ ax = b.x; ay = b.y; }
  else if(zone === 'n'){ ax = b.x + b.w / 2; ay = b.y + b.h; }
  else if(zone === 's'){ ax = b.x + b.w / 2; ay = b.y; }
  else if(zone === 'w'){ ax = b.x + b.w; ay = b.y + b.h / 2; }
  else { ax = b.x; ay = b.y + b.h / 2; }
  var w, h;
  if(zone === 'n' || zone === 's'){ h = Math.abs(py - ay); w = R ? h * R : b.w; }
  else if(zone === 'w' || zone === 'e'){ w = Math.abs(px - ax); h = R ? w / R : b.h; }
  else {
    var dx = Math.abs(px - ax), dy = Math.abs(py - ay);
    if(R){ w = Math.max(dx, dy * R); h = w / R; }
    else { w = dx; h = dy; }
  }
  var dirX = (zone === 'n' || zone === 's') ? 0 : (px >= ax ? 1 : -1);
  var dirY = (zone === 'w' || zone === 'e') ? 0 : (py >= ay ? 1 : -1);
  var x = dirX === 0 ? ax - w / 2 : (dirX > 0 ? ax : ax - w);
  var y = dirY === 0 ? ay - h / 2 : (dirY > 0 ? ay : ay - h);
  if(x < 0) x = 0;
  if(y < 0) y = 0;
  if(x + w > W) x = Math.max(0, W - w);
  if(y + h > H) y = Math.max(0, H - h);
  if(x + w > W) w = W - x;
  if(y + h > H) h = H - y;
  cropBox = { x: x, y: y, w: Math.max(12, w), h: Math.max(12, h) };
}
(function(){
  var wrap = document.getElementById('preview-wrap');
  if(!wrap) return;
  var drag = null;
  function rel(e){
    var rc = edDispRect();
    var wr = wrap.getBoundingClientRect();
    return { x: e.clientX - wr.left - (rc ? rc.x : 0), y: e.clientY - wr.top - (rc ? rc.y : 0) };
  }
  function up(){
    if(!drag) return;
    if(drag.zone === 'new' && cropBox && (cropBox.w < 20 || cropBox.h < 20)){
      cropBox = drag.box;
      renderCropBox();
    }
    drag = null;
  }
  wrap.addEventListener('pointerdown', function(e){
    if(!cropMode || !edSource) return;
    var rc = edDispRect();
    if(!rc) return;
    var p = rel(e);
    p.x = Math.max(0, Math.min(rc.w, p.x));
    p.y = Math.max(0, Math.min(rc.h, p.y));
    var zone = cropZoneHit(p.x, p.y);
    drag = { zone: zone, px: p.x, py: p.y, box: { x: cropBox.x, y: cropBox.y, w: cropBox.w, h: cropBox.h } };
    try { wrap.setPointerCapture(e.pointerId); } catch(err){}
    e.preventDefault();
  });
  wrap.addEventListener('pointermove', function(e){
    if(!drag || !cropMode) return;
    var rc = edDispRect();
    if(!rc) return;
    var p = rel(e);
    p.x = Math.max(0, Math.min(rc.w, p.x));
    p.y = Math.max(0, Math.min(rc.h, p.y));
    if(drag.zone === 'move'){
      var nx = Math.max(0, Math.min(rc.w - drag.box.w, drag.box.x + (p.x - drag.px)));
      var ny = Math.max(0, Math.min(rc.h - drag.box.h, drag.box.y + (p.y - drag.py)));
      cropBox = { x: nx, y: ny, w: drag.box.w, h: drag.box.h };
    } else if(drag.zone === 'new'){
      var x = Math.min(drag.px, p.x), y = Math.min(drag.py, p.y);
      var w = Math.abs(p.x - drag.px), h = Math.abs(p.y - drag.py);
      if(edRatio){ w = Math.max(w, h * edRatio); h = w / edRatio; }
      if(drag.px > p.x) x = drag.px - w;
      if(drag.py > p.y) y = drag.py - h;
      x = Math.max(0, Math.min(rc.w - 12, x));
      y = Math.max(0, Math.min(rc.h - 12, y));
      cropBox = { x: x, y: y, w: Math.max(12, Math.min(w, rc.w - x)), h: Math.max(12, Math.min(h, rc.h - y)) };
    } else {
      cropResize(drag.zone, drag, p.x, p.y);
    }
    renderCropBox();
  });
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);
})();

function edFilterPixels(imgData){
  var b = ed.bright / 100;
  var c = ed.contrast - 100;
  var m = ed.sat / 100;
  if(b === 1 && c === 0 && m === 1) return;
  var k = (259 * (c + 255)) / (255 * (259 - c));
  var d = imgData.data;
  for(var i = 0; i < d.length; i += 4){
    var r = d[i] * b, g = d[i+1] * b, bl = d[i+2] * b;
    r = (r - 128) * k + 128; g = (g - 128) * k + 128; bl = (bl - 128) * k + 128;
    if(m !== 1){
      var lu = 0.3 * r + 0.59 * g + 0.11 * bl;
      r = lu + (r - lu) * m; g = lu + (g - lu) * m; bl = lu + (bl - lu) * m;
    }
    d[i]   = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i+1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i+2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
  }
}
async function getEditedFileFor(i){
  var item = pendingImages[i];
  if(!item || !item.file) return null;
  if(!item.edit || !item.edit.ed.edited || !item.edit.edSource) return item.file;
  var gEd = Object.assign({}, ed), gSrc = edSource, gOrig = edOriginal, gOff = Object.assign({}, edCropOff);
  ed = Object.assign({}, item.edit.ed);
  edSource = item.edit.edSource;
  edOriginal = item.edit.edOriginal;
  edCropOff = Object.assign({}, item.edit.edCropOff);
  var out;
  try { out = await buildEditedFile(item.file); }
  finally {
    ed = gEd; edSource = gSrc; edOriginal = gOrig; edCropOff = gOff;
  }
  return out;
}
async function buildEditedFile(file){
  if(!file) return null;
  if(!ed.edited || !edSource) return file;
  try {
    var MAX = 1440;
    var sw = edSource.w, sh = edSource.h;
    var sc = Math.min(1, MAX / Math.max(sw, sh));
    var w = Math.max(1, Math.round(sw * sc)), h = Math.max(1, Math.round(sh * sc));
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    var z = ed.zoom / 100;
    ctx.translate(w / 2 + ed.x * sc, h / 2 + ed.y * sc);
    ctx.scale(z * sc, z * sc);
    ctx.drawImage(edSource.img, -sw / 2, -sh / 2);
    var data = ctx.getImageData(0, 0, w, h);
    edFilterPixels(data);
    ctx.putImageData(data, 0, 0);
    var blob = await new Promise(function(res){ cv.toBlob(res, 'image/jpeg', 0.92); });
    if(!blob) return file;
    return new File([blob], 'photo-edited.jpg', { type: 'image/jpeg' });
  } catch(err){
    console.error(err);
    return file;
  }
}

function openMusicPicker(){
  if(musicReady === false || songsReady === false){
    toast('Music needs a one-time SQL update in Supabase — see music-library-setup.sql');
    return;
  }
  document.getElementById('music-modal').classList.add('open');
  document.getElementById('music-search').value = '';
  renderSongList();
  loadSongs();
}
function closeMusicPicker(){
  document.getElementById('music-modal').classList.remove('open');
  stopPreview();
}
async function loadSongs(){
  const q = await supa.from('songs').select('id,title,artist,audio_url,created_at').order('created_at', { ascending: false }).limit(500);
  if(!q.error) songsCache = q.data || [];
  renderSongList();
}
function renderSongList(){
  var el = document.getElementById('song-list');
  if(!el) return;
  var term = (document.getElementById('music-search').value || '').trim().toLowerCase();
  var list = songsCache;
  if(term){
    list = list.filter(function(s){
      return String(s.title || '').toLowerCase().indexOf(term) !== -1 || String(s.artist || '').toLowerCase().indexOf(term) !== -1;
    });
  }
  songListShown = list;
  if(!list.length){
    el.innerHTML = '<div class="empty-note" style="padding:26px 8px;">' + (songsCache.length ? 'No songs match that search.' : 'The library is empty.<br>Tap + Add a song to upload the first one!') + '</div>';
    return;
  }
  el.innerHTML = list.map(function(s, i){
    var key = s.id || ('idx' + i);
    return '<div class="song-row">'
      + '<button class="song-play" id="sp-' + key + '" onclick="toggleSongPreview(\'' + key + '\')"><span class="eq"><i></i><i></i><i></i></span></button>'
      + '<div class="song-meta" onclick="chooseSong(' + i + ')"><div class="t">' + esc(s.title || 'Untitled') + '</div><div class="a">' + esc(s.artist || 'Unknown artist') + '</div></div>'
      + '<button class="song-use" onclick="chooseSong(' + i + ')">Use</button>'
    + '</div>';
  }).join('');
}
function stopPreview(){
  if(previewAudio){ try{ previewAudio.pause(); }catch(e){} previewAudio = null; }
  previewingKey = null;
  var btns = document.querySelectorAll('.song-play');
  for(var i=0;i<btns.length;i++) btns[i].classList.remove('playing');
}
function toggleSongPreview(key){
  var song = null;
  for(var i=0;i<songListShown.length;i++){
    var k = songListShown[i].id || ('idx' + i);
    if(String(k) === String(key)){ song = songListShown[i]; break; }
  }
  if(!song) return;
  if(previewingKey === String(key)){ stopPreview(); return; }
  stopPreview();
  previewingKey = String(key);
  try {
    previewAudio = applyVol(new Audio(song.audio_url));
    previewAudio.onended = stopPreview;
    previewAudio.onerror = stopPreview;
    previewAudio.play().catch(stopPreview);
  } catch(e){ stopPreview(); return; }
  var btn = document.getElementById('sp-' + key);
  if(btn) btn.classList.add('playing');
}
function chooseSong(i){
  var s = songListShown[i];
  if(!s) return;
  pendingSong = { url: s.audio_url, title: s.title || '', artist: s.artist || '', start: 0, duration: 0 };
  stopPreview();
  closeMusicPicker();
  renderMusicRow();
  probeSongDuration();
  toast('Song added — ' + (pendingSong.title || 'Untitled'));
}

/* ---- song start-time picker (timeline) ---- */
function probeSongDuration(){
  if(!pendingSong || !pendingSong.url) return;
  try {
    var probe = new Audio();
    probe.preload = 'metadata';
    probe.onloadedmetadata = function(){
      if(!pendingSong) return;
      pendingSong.duration = isFinite(probe.duration) ? probe.duration : 0;
      var r = document.getElementById('music-start-range');
      if(r && pendingSong.duration > 5) r.max = Math.floor(pendingSong.duration - 5);
      updateTimeLabel();
    };
    probe.src = pendingSong.url;
  } catch(e){}
}
function onStartRange(){
  if(!pendingSong) return;
  pendingSong.start = parseFloat(document.getElementById('music-start-range').value) || 0;
  updateTimeLabel();
}
function updateTimeLabel(){
  var el = document.getElementById('music-start-time');
  if(!el || !pendingSong) return;
  var t = pendingSong.start || 0;
  var m = Math.floor(t / 60), s = Math.floor(t % 60);
  el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
}
function previewFromStart(){
  if(!pendingSong || !pendingSong.url) return;
  stopPreview();
  try {
    previewAudio = applyVol(new Audio(pendingSong.url));
    previewAudio.onended = stopPreview;
    previewAudio.onerror = stopPreview;
    previewAudio.play().then(function(){
      if(pendingSong && pendingSong.start > 0){ try{ previewAudio.currentTime = pendingSong.start; }catch(e){} }
    }).catch(function(){ stopPreview(); });
  } catch(e){ stopPreview(); }
}
function renderMusicRow(){
  var row = document.getElementById('music-row');
  var btn = document.getElementById('add-music-btn');
  if(!row || !btn) return;
  var tl = document.getElementById('music-timeline');
  if(pendingSong){
    row.style.display = 'flex';
    btn.style.display = 'none';
    document.getElementById('music-row-title').textContent = pendingSong.title || 'Untitled';
    document.getElementById('music-row-artist').textContent = pendingSong.artist ? ' · ' + pendingSong.artist : '';
    if(tl){
      if(musicStartReady){
        tl.style.display = 'block';
        var r = document.getElementById('music-start-range');
        if(r){
          if(pendingSong.duration > 5) r.max = Math.floor(pendingSong.duration - 5);
          r.value = pendingSong.start || 0;
        }
        updateTimeLabel();
      } else {
        tl.style.display = 'none';
      }
    }
  } else {
    row.style.display = 'none';
    btn.style.display = 'flex';
    if(tl) tl.style.display = 'none';
  }
}
function clearMusic(){ pendingSong = null; renderMusicRow(); }

document.getElementById('song-file-input').addEventListener('change', async function(e){
  var file = e.target.files[0];
  e.target.value = '';
  if(!file) return;
  var guess = (file.name || 'audio').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || 'audio';
  var title = prompt('Song title:', guess);
  if(title === null) return;
  var artist = prompt('Artist (optional):', '') || '';
  try {
    var url = await uploadAudioFile(file);
    var r = await supa.from('songs').insert({ title: (title || guess), artist: artist || null, audio_url: url, added_by: me.id });
    if(r.error) throw r.error;
    toast('Song added to the library');
    await loadSongs();
    for(var i=0;i<songsCache.length;i++){
      if(songsCache[i].audio_url === url){
        pendingSong = { url: url, title: songsCache[i].title, artist: songsCache[i].artist || '', start: 0, duration: 0 };
        probeSongDuration();
        break;
      }
    }
    renderMusicRow();
  } catch(err){
    console.error(err);
    toast('Could not add the song');
  }
});

async function publishCreate(){
  if(!pendingImages.length) return;
  const btn = document.getElementById('share-btn');
  btn.disabled = true; btn.textContent = 'Uploading...';
  stopPreview();
  if(cropMode) cropCancel();
  snapEdit();
  try {
    var audioUrl = null;
    if(pendingSong && musicReady){
      audioUrl = pendingSong.url;
    }
    if(pendingImages.length > 1 && !mediaUrlsReady){
      toast('Multi-photo posts need a one-time SQL update in Supabase — see multi-photo-posts.sql');
      btn.disabled = false; btn.textContent = createTab === 'post' ? 'Share' : 'Add to story';
      return;
    }
    var urls = [];
    for(var pi=0;pi<pendingImages.length;pi++){
      urls.push(await uploadImage(await getEditedFileFor(pi)));
    }
    if(createTab === 'post'){
      const caption = document.getElementById('caption-input').value.trim();
      var payload = { user_id: me.id, image_url: urls[0], caption: caption || null };
      if(urls.length > 1) payload.media_urls = urls;
      if(audioUrl){
        payload.audio_url = audioUrl;
        payload.audio_title = pendingSong.title || null;
        payload.audio_artist = pendingSong.artist || null;
        if(musicStartReady) payload.audio_start = pendingSong.start || 0;
      }
      const r = await supa.from('posts').insert(payload);
      if(r.error) throw r.error;
      closeCreateModal();
      await refreshData();
      showView('feed');
      toast(urls.length > 1 ? 'Posted ' + urls.length + ' photos!' : 'Posted!');
    } else {
      if(urls.length > 1) toast('Stories take one photo — the first one was used');
      var payload2 = { user_id: me.id, image_url: urls[0] };
      var cleanTexts = storyTexts.filter(function(it){ return (it.t || '').trim(); });
      if(cleanTexts.length){
        if(storyTextReady) payload2.text_overlays = cleanTexts;
        else toast('Text needs a one-time SQL update in Supabase — see story-text.sql');
      }
      if(audioUrl){
        payload2.audio_url = audioUrl;
        payload2.audio_title = pendingSong.title || null;
        payload2.audio_artist = pendingSong.artist || null;
        if(musicStartReady) payload2.audio_start = pendingSong.start || 0;
      }
      const r = await supa.from('stories').insert(payload2);
      if(r.error) throw r.error;
      storyTexts = []; stSel = -1;
      closeCreateModal();
      await refreshData();
      renderFeed();
      toast('Added to your story');
    }
  } catch(err){
    console.error(err);
    toast('Upload failed — check the media bucket in Supabase');
  } finally {
    btn.disabled = false;
    btn.textContent = createTab === 'post' ? 'Share' : 'Add to story';
  }
}

/* ---------------- Edit profile ---------------- */
function openEditProfile(){
  document.getElementById('ep-avatar-preview').src = avatarOf(me);
  document.getElementById('ep-name-input').value = me.display_name || '';
  document.getElementById('ep-username-input').value = me.username;
  document.getElementById('ep-bio-input').value = me.bio || '';
  pendingAvatarFile = null;
  document.getElementById('edit-profile-modal').classList.add('open');
}
function closeEditProfile(){
  document.getElementById('edit-profile-modal').classList.remove('open');
}
document.getElementById('ep-file-input').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingAvatarFile = file;
  const reader = new FileReader();
  reader.onload = function(ev){ document.getElementById('ep-avatar-preview').src = ev.target.result; };
  reader.readAsDataURL(file);
});

async function saveProfile(){
  let newName = document.getElementById('ep-name-input').value.trim();
  let newUsername = document.getElementById('ep-username-input').value.trim().toLowerCase();
  let newBio = document.getElementById('ep-bio-input').value.trim();
  if(newUsername && !/^[a-z0-9._]{3,20}$/.test(newUsername)){
    toast('Username must be 3-20 chars: letters, numbers, dot, underscore');
    return;
  }
  const updates = {};
  if(newName) updates.display_name = newName;
  if(newUsername && newUsername !== me.username) updates.username = newUsername;
  if(typeof newBio === 'string') updates.bio = newBio || null;
  if(pendingAvatarFile){
    try { updates.avatar_url = await uploadImage(pendingAvatarFile); } catch(err){ console.error(err); }
  }
  const r = await supa.from('profiles').update(updates).eq('id', me.id);
  if(r.error){
    if(r.error.code === '23505') toast('That username is already taken');
    else toast('Could not save changes');
    return;
  }
  if(updates.username) me.username = updates.username;
  if(updates.display_name !== undefined) me.display_name = updates.display_name;
  if(updates.bio !== undefined) me.bio = updates.bio;
  if(updates.avatar_url) me.avatar_url = updates.avatar_url;
  updateMeUI();
  closeEditProfile();
  await refreshData();
  toast('Profile updated');
}

/* ---------------- Delete post ---------------- */
async function postMenu(id){
  const p = postIndex[id];
  if(!p) return;
  if(p.uid !== me.id){
    toast('You can only delete your own posts');
    return;
  }
  if(!confirm('Delete this post? This cannot be undone.')) return;
  const r = await supa.from('posts').delete().eq('id', id);
  if(r.error){ toast('Could not delete the post'); return; }
  if(postModalOpenId === id) closePostModal();
  await refreshData();
  toast('Post deleted');
}

/* ---------------- Log out ---------------- */
async function logout(){
  if(!confirm('Log out? Email and Google accounts can log back in anytime; quick (no-email) accounts cannot be signed back into.')) return;
  try { await supa.removeAllChannels(); } catch(e){}
  try { await supa.auth.signOut(); } catch(e){}
  location.reload();
}

/* ---------------- Theme ---------------- */
function toggleTheme(){
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/* ---------------- Downloads ---------------- */
function fileExt(url, fallback){
  var m = String(url || '').split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : (fallback || 'jpg');
}
function nameFromUrl(url){
  try {
    var last = decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '');
    if(last && last.length <= 90) return last;
  } catch(e){}
  return 'pulse-' + Date.now() + '.' + fileExt(url, 'jpg');
}
async function downloadMedia(url, name){
  if(!url){ toast('Nothing to download'); return; }
  var fname = name || nameFromUrl(url);
  try {
    toast('Downloading...');
    var res = await fetch(url, { mode: 'cors' });
    if(!res.ok) throw new Error('http ' + res.status);
    var blob = await res.blob();
    var obj = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = obj;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(obj); }, 8000);
    toast('Saved to your device');
  } catch(e){
    console.error('download failed', e);
    try { window.open(url, '_blank'); } catch(e2){}
    toast('Opened in a new tab - use your browser menu to save it');
  }
}
function downloadPost(id){
  var p = postIndex[id];
  if(!p) return;
  var list = (p.media && p.media.length ? p.media : [p.img]);
  var url = list[0];
  if(list.length > 1){
    var track = document.querySelector('.post-media.carousel .car-track');
    var idx = 0;
    if(track){ var w = track.clientWidth || 1; idx = Math.round(track.scrollLeft / w); }
    if(idx < 0 || idx >= list.length) idx = 0;
    url = list[idx];
  }
  downloadMedia(url, 'pulse-post-' + Date.now() + '.' + fileExt(url, 'jpg'));
}
function downloadStoryItem(){
  if(!svUser || !svUser.items || !svUser.items[svIndex]) return;
  var url = svUser.items[svIndex].img;
  downloadMedia(url, 'pulse-story-' + Date.now() + '.' + fileExt(url, 'jpg'));
}
function downloadViewerImage(){
  var img = document.getElementById('img-viewer-img');
  if(!img || !img.src) return;
  downloadMedia(img.src, 'pulse-photo-' + Date.now() + '.' + fileExt(img.src, 'jpg'));
}
function downloadMsgMedia(id){
  var m = null;
  for(var i=0;i<chatThread.length;i++){ if(chatThread[i].id === id){ m = chatThread[i]; break; } }
  msgMenuId = null;
  msgMenuMedia = null;
  renderChat();
  if(!m || !m.media_url){ toast('This message has no file'); return; }
  downloadMedia(m.media_url);
}

/* ---------------- Photo compression (keeps Pulse fast and cheap) ---------------- */
function compressImage(file, maxDim, quality){
  return new Promise(function(resolve){
    try {
      if(!file || !file.type || file.type.indexOf('image/') !== 0) return resolve(file);
      if(file.type === 'image/gif') return resolve(file);
      var max = maxDim || 1440;
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){
        var done = false;
        function finish(out){
          if(done) return;
          done = true;
          try { URL.revokeObjectURL(url); } catch(e){}
          resolve(out);
        }
        try {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          if(!w || !h) return finish(file);
          var scale = Math.min(1, max / Math.max(w, h));
          if(scale === 1 && file.size < 400 * 1024) return finish(file);
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var c = document.createElement('canvas');
          c.width = cw; c.height = ch;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);
          c.toBlob(function(blob){
            if(!blob || blob.size >= file.size * 0.92) return finish(file);
            var name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
            finish(new File([blob], name, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality || 0.82);
        } catch(e){ finish(file); }
      };
      img.onerror = function(){ try { URL.revokeObjectURL(url); } catch(e){} resolve(file); };
      img.src = url;
    } catch(e){ resolve(file); }
  });
}

/* ---------------- Invites ---------------- */
function inviteLink(){
  return location.origin + location.pathname + '?invite=' + encodeURIComponent(me ? me.username : '');
}
function captureInvite(){
  try {
    var m = location.search.match(/[?&]invite=([^&]+)/);
    if(m && m[1]){
      var code = decodeURIComponent(m[1]).toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
      if(code) localStorage.setItem('pulse-invite-from', code);
    }
    var pm = location.search.match(/[?&]post=([^&]+)/);
    if(pm && pm[1]) pendingPostId = decodeURIComponent(pm[1]);
  } catch(e){}
}
async function applyInvite(){
  var code = null, applied = null;
  try { code = localStorage.getItem('pulse-invite-from'); applied = localStorage.getItem('pulse-invite-applied'); } catch(e){}
  if(!code || !me || applied === '1') return;
  try { localStorage.setItem('pulse-invite-applied', '1'); } catch(e){}
  try {
    var q = await supa.from('profiles').select('id,username').eq('username', code).maybeSingle();
    var inviter = q.data;
    if(!inviter || inviter.id === me.id) return;
    if(!myFollows.has(inviter.id)){
      myFollows.add(inviter.id);
      await supa.from('follows').insert({ follower_id: me.id, following_id: inviter.id });
      supa.from('notifications').insert({ user_id: inviter.id, actor_id: me.id, type: 'follow' })
        .then(function(){}, function(){});
    }
    supa.from('profiles').update({ invited_by: code }).eq('id', me.id).then(function(){}, function(){});
    toast('You joined via @' + esc(code) + ' - now following them');
  } catch(e){ console.error(e); }
}
async function openInvite(){
  var el = document.getElementById('invite-link-text');
  if(el) el.textContent = inviteLink();
  var cnt = document.getElementById('invite-count');
  if(cnt){
    cnt.textContent = '';
    try {
      var q = await supa.from('profiles').select('*', { count: 'exact', head: true }).eq('invited_by', me.username);
      if(!q.error) cnt.textContent = (q.count || 0) + (q.count === 1 ? ' friend has joined' : ' friends have joined');
    } catch(e){}
  }
  document.getElementById('invite-modal').classList.add('open');
}
function closeInvite(){ document.getElementById('invite-modal').classList.remove('open'); }
function shareInvite(){
  var link = inviteLink();
  if(navigator.share){
    navigator.share({ title: 'Pulse', text: 'Join me on Pulse', url: link }).catch(function(){});
    return;
  }
  window.open('https://wa.me/?text=' + encodeURIComponent('Join me on Pulse - ' + link), '_blank');
}
function copyInvite(){
  var link = inviteLink();
  if(navigator.clipboard){
    navigator.clipboard.writeText(link).then(function(){ toast('Invite link copied'); }, function(){ toast(link); });
  } else { toast(link); }
}

/* ---------------- Follow a few people (new accounts) ---------------- */
async function openFollow5(){
  try {
    var q = await supa.from('profiles').select('id,username,display_name,avatar_url').neq('id', me.id)
      .order('created_at', { ascending: false }).limit(12);
    follow5People = q.data || [];
  } catch(e){ follow5People = []; }
  document.getElementById('follow5-overlay').classList.add('open');
  renderFollow5();
}
function renderFollow5(){
  var el = document.getElementById('follow5-list');
  if(!el) return;
  var n = follow5People.filter(function(p){ return myFollows.has(p.id); }).length;
  el.innerHTML = follow5People.map(function(p){
    var f = myFollows.has(p.id);
    return '<div class="f5-row"><img src="' + avatarOf(p) + '">'
      + '<div class="f5-name"><b>' + esc(p.username) + '</b><span>' + esc(p.display_name || '') + '</span></div>'
      + '<button class="f5-btn' + (f ? ' following' : '') + '" onclick="toggleFollow(\'' + p.id + '\');setTimeout(renderFollow5,200)">' + (f ? 'Following' : 'Follow') + '</button>'
      + '</div>';
  }).join('') || '<div class="empty-note">No one else is here yet - invite a friend from Settings.</div>';
  var c = document.getElementById('follow5-count');
  if(c) c.textContent = n + ' of 5 followed';
  var d = document.getElementById('follow5-done');
  if(d) d.textContent = n >= 5 ? 'Start using Pulse' : (n > 0 ? 'Continue' : 'Skip for now');
}
function closeFollow5(){
  try { localStorage.setItem('pulse-follow5-done', '1'); } catch(e){}
  document.getElementById('follow5-overlay').classList.remove('open');
}

/* ---------------- Pulse Pro (subscriptions) ---------------- */
var PAY_FN = 'https://mvbojueciwemmjohxvyh.supabase.co/functions/v1/pay';
var razorpayLoaded = false;
var PRO_PLANS = [
  { k: 'pro_monthly', price: '₹99',  note: 'per month' },
  { k: 'pro_yearly',  price: '₹799', note: 'per year · save 33%', best: true }
];
async function loadPro(){
  try {
    var q = await supa.from('subscriptions').select('plan,status,current_period_end').eq('user_id', me.id).maybeSingle();
    proInfo = q.error ? null : (q.data || null);
  } catch(e){ proInfo = null; }
}
function isPro(){
  if(!proInfo || proInfo.status !== 'active' || !proInfo.current_period_end) return false;
  return new Date(proInfo.current_period_end).getTime() > Date.now();
}
function proUntilText(){
  if(!isPro()) return '';
  try { return 'Active until ' + new Date(proInfo.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch(e){ return 'Active'; }
}
function tickHtml(level){
  var fill = level === 'blue' ? '#0095F6' : '#E0A32E';
  var label = level === 'blue' ? 'Verified' : 'Pulse Pro';
  return '<span class="tick" title="' + label + '" aria-label="' + label + '">'
    + '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="' + fill + '"/>'
    + '<path d="m7.6 12.3 3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '</span>';
}
/* blue tick = given by the owner by hand;  gold tick = a Pro subscriber */
function tickFor(profile, mine){
  if(!profile) return '';
  if(profile.badge === 'blue') return tickHtml('blue');
  var pro = mine ? isPro() : !!profile.is_pro;
  return pro ? tickHtml('gold') : '';
}
async function toggleBlueTick(uid, username, hasBlue){
  if(!me || !me.is_admin){ toast('Only the owner can give the blue tick'); return; }
  try {
    var r = await supa.rpc('set_blue_tick', { target: uid, give: !hasBlue });
    if(r.error){
      console.error(r.error);
      toast('Could not update the tick - run badges.sql in Supabase first');
      return;
    }
    toast(!hasBlue ? 'Blue tick given to @' + username : 'Blue tick removed from @' + username);
    renderOtherProfile(username);
  } catch(e){
    console.error(e);
    toast('Could not update the tick');
  }
}
function proPick(k){ proPlanChosen = k; renderPro(); }
function proRenew(){ toast('Your plan runs out at the end of the period — pay again to extend it'); }
function proBenefit(title, sub){
  return '<div class="pro-benefit"><span class="pro-tick">✓</span><div><b>' + title + '</b><span>' + sub + '</span></div></div>';
}
function renderPro(){
  var active = isPro();
  document.getElementById('main-col').innerHTML =
    '<div class="set-wrap">'
    + '<div class="set-head">'
      + '<button class="set-back" onclick="showView(\'settings\')" title="Back">'
      + '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>'
      + '<h2>Pulse Pro</h2></div>'
    + '<div class="pro-hero">'
      + '<div class="pro-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8Z"/></svg></div>'
      + '<h3>Pulse Pro</h3>'
      + '<p>' + (active ? proUntilText() : 'Support Pulse and unlock a few extras.') + '</p>'
    + '</div>'
    + '<div class="set-title">What you get</div>'
    + '<div class="set-group">'
      + proBenefit('PRO badge next to your name', 'Shows on your profile and on your posts')
      + proBenefit('HD photo uploads', 'Your photos are kept much sharper instead of being shrunk')
      + proBenefit('Early access to new features', 'Try new tools before everyone else')
      + proBenefit('You keep Pulse alive', 'Your support pays for the servers')
    + '</div>'
    + (active ? '' : '<div class="set-title">Choose a plan</div>')
    + (active ? '' : '<div class="pro-plans">' + PRO_PLANS.map(function(p){
        return '<button class="pro-plan' + (p.best ? ' best' : '') + (proPlanChosen === p.k ? ' on' : '') + '" onclick="proPick(\'' + p.k + '\')">'
          + (p.best ? '<span class="pro-tag">BEST VALUE</span>' : '')
          + '<span class="pro-price">' + p.price + '</span>'
          + '<span class="pro-note">' + p.note + '</span></button>';
      }).join('') + '</div>')
    + (active
        ? '<button class="ghost-btn" onclick="proRenew()">Renew or extend</button>'
        : '<button class="share-btn" onclick="startPro()">Continue to payment</button>')
    + '<div class="pro-note-small">Pay by UPI, card or netbanking. The payment is handled by Razorpay — Pulse never sees your card details.</div>'
    + '</div>';
}
function loadRazorpay(){
  return new Promise(function(resolve, reject){
    if(window.Razorpay){ razorpayLoaded = true; return resolve(true); }
    var s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = function(){ razorpayLoaded = true; resolve(true); };
    s.onerror = function(){ reject(new Error('checkout script could not load')); };
    document.head.appendChild(s);
  });
}
async function startPro(){
  if(!me) return;
  try {
    toast('Starting secure checkout...');
    var sess = await supa.auth.getSession();
    var token = sess.data && sess.data.session ? sess.data.session.access_token : '';
    var r = await fetch(PAY_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ action: 'create_order', plan: proPlanChosen })
    });
    var data = await r.json();
    if(data && data.error === 'payments_not_configured'){ toast('Payments are not switched on yet'); return; }
    if(!data || !data.order_id){ toast('Could not start the payment'); return; }
    await loadRazorpay();
    var rzp = new window.Razorpay({
      key: data.key_id,
      amount: data.amount,
      currency: 'INR',
      name: 'Pulse',
      description: 'Pulse Pro',
      order_id: data.order_id,
      prefill: { name: me.display_name || me.username, email: myEmail || '' },
      theme: { color: '#0095F6' },
      handler: function(resp){ confirmPro(data.order_id, resp.razorpay_payment_id, resp.razorpay_signature); },
      modal: { ondismiss: function(){ toast('Payment cancelled'); } }
    });
    rzp.open();
  } catch(e){
    console.error(e);
    toast('Could not open the payment window');
  }
}
async function confirmPro(orderId, paymentId, signature){
  try {
    var sess = await supa.auth.getSession();
    var token = sess.data && sess.data.session ? sess.data.session.access_token : '';
    var r = await fetch(PAY_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ action: 'verify', plan: proPlanChosen, order_id: orderId, payment_id: paymentId, signature: signature })
    });
    var data = await r.json();
    if(data && data.ok){
      toast('Welcome to Pulse Pro!');
      await loadPro();
      renderPro();
    } else {
      toast('We could not confirm that payment — nothing extra was charged, please try again');
    }
  } catch(e){
    console.error(e);
    toast('Could not confirm the payment');
  }
}

/* ---------------- Text on stories ---------------- */
var ST_COLORS = ['#ffffff', '#111111', '#ED4956', '#FFD400', '#0095F6', '#2ECC71'];
var ST_FONTS = [
  { k: 'classic', label: 'Aa', css: "font-family:'Inter',system-ui,sans-serif;font-weight:600;" },
  { k: 'bold',    label: 'Aa', css: "font-family:'Poppins',sans-serif;font-weight:700;" },
  { k: 'serif',   label: 'Aa', css: "font-family:Georgia,'Times New Roman',serif;font-weight:600;" },
  { k: 'mono',    label: 'Aa', css: "font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600;" }
];
function stFontCss(k){
  for(var i=0;i<ST_FONTS.length;i++){ if(ST_FONTS[i].k === k) return ST_FONTS[i].css; }
  return ST_FONTS[0].css;
}
function stItemStyle(it, width){
  var fs = Math.round((width || 360) * (it.s || 6) / 100);
  var bg = it.bg === 'dark' ? 'background:rgba(0,0,0,.55);padding:.14em .55em;border-radius:.4em;'
         : it.bg === 'light' ? 'background:rgba(255,255,255,.92);padding:.14em .55em;border-radius:.4em;'
         : '';
  var col = it.bg === 'light' ? '#111111' : (it.c || '#ffffff');
  return 'left:' + (it.x == null ? 50 : it.x) + '%;top:' + (it.y == null ? 30 : it.y) + '%;'
    + 'font-size:' + fs + 'px;color:' + col + ';' + stFontCss(it.f) + bg;
}
function stRenderInto(layer, items, interactive){
  if(!layer) return;
  var w = layer.clientWidth || 360;
  layer.innerHTML = (items || []).map(function(it, i){
    var sel = (interactive && i === stSel) ? ' sel' : '';
    return '<div class="st-item' + (interactive ? ' editable' : '') + sel + '" data-i="' + i + '" style="' + stItemStyle(it, w) + '">'
      + (esc(it.t || '') || (interactive ? '<span class="st-ph">Tap to type</span>' : '')) + '</div>';
  }).join('');
  if(interactive) stAttachDrag(layer);
}
function stAttachDrag(layer){
  Array.prototype.forEach.call(layer.querySelectorAll('.st-item.editable'), function(el){
    el.addEventListener('pointerdown', function(e){
      e.preventDefault();
      var i = Number(el.getAttribute('data-i'));
      stSelect(i);
      el.style.zIndex = 5;
      var rect = layer.getBoundingClientRect();
      try { el.setPointerCapture(e.pointerId); } catch(err){}
      function move(ev){
        var it = storyTexts[i];
        if(!it) return;
        var x = ((ev.clientX - rect.left) / rect.width) * 100;
        var y = ((ev.clientY - rect.top) / rect.height) * 100;
        it.x = Math.round(Math.max(4, Math.min(96, x)));
        it.y = Math.round(Math.max(4, Math.min(96, y)));
        el.style.left = it.x + '%';
        el.style.top = it.y + '%';
      }
      function up(){
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      }
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  });
}
function stSelectVisual(){
  // update the selection + controls WITHOUT rebuilding the layer
  // (rebuilding mid-drag would destroy the element being dragged)
  var layer = document.getElementById('story-text-layer');
  if(layer){
    Array.prototype.forEach.call(layer.querySelectorAll('.st-item'), function(el){
      el.classList.toggle('sel', Number(el.getAttribute('data-i')) === stSel);
    });
  }
  var panel = document.getElementById('st-edit-panel');
  if(panel) panel.style.display = stSel >= 0 ? 'block' : 'none';
  var input = document.getElementById('st-text-input');
  if(input && stSel >= 0 && storyTexts[stSel] && document.activeElement !== input) input.value = storyTexts[stSel].t || '';
  stPaintControls();
}
function stRender(){
  var layer = document.getElementById('story-text-layer');
  if(layer) stRenderInto(layer, storyTexts, true);
  stSelectVisual();
}
function stPaintControls(){
  var it = storyTexts[stSel];
  var colors = document.getElementById('st-colors');
  if(colors){
    colors.innerHTML = ST_COLORS.map(function(c){
      var on = it && (it.c || '#ffffff') === c && it.bg !== 'light';
      return '<button type="button" class="st-sw' + (on ? ' on' : '') + '" style="background:' + c + '" onclick="stSetColor(\'' + c + '\')"></button>';
    }).join('');
  }
  var fonts = document.getElementById('st-fonts');
  if(fonts){
    fonts.innerHTML = ST_FONTS.map(function(f){
      var on = it && (it.f || 'classic') === f.k;
      return '<button type="button" class="st-font' + (on ? ' on' : '') + '" style="' + f.css + '" onclick="stSetFont(\'' + f.k + '\')">' + f.label + '</button>';
    }).join('');
  }
  var bgBtn = document.getElementById('st-bg-btn');
  if(bgBtn){
    bgBtn.classList.toggle('on', !!(it && it.bg));
    bgBtn.textContent = it && it.bg === 'light' ? 'Highlight: light' : (it && it.bg === 'dark' ? 'Highlight: dark' : 'Highlight');
  }
}
function stAddText(){
  storyTexts.push({ t: '', x: 50, y: 30, c: '#ffffff', f: 'classic', s: 6, bg: null });
  stSel = storyTexts.length - 1;
  stRender();
  var input = document.getElementById('st-text-input');
  if(input){ input.value = ''; input.focus(); }
}
function stSelect(i){
  stSel = i;
  stSelectVisual();
}
function stUpdateText(v){
  if(stSel < 0 || !storyTexts[stSel]) return;
  storyTexts[stSel].t = v;
  var layer = document.getElementById('story-text-layer');
  if(layer) stRenderInto(layer, storyTexts, true);
}
function stSetColor(c){
  if(stSel < 0 || !storyTexts[stSel]) return;
  storyTexts[stSel].c = c;
  stRender();
}
function stSetFont(k){
  if(stSel < 0 || !storyTexts[stSel]) return;
  storyTexts[stSel].f = k;
  stRender();
}
function stSetSize(delta){
  if(stSel < 0 || !storyTexts[stSel]) return;
  var it = storyTexts[stSel];
  it.s = Math.max(3, Math.min(18, (it.s || 6) + delta));
  stRender();
}
function stToggleBg(){
  if(stSel < 0 || !storyTexts[stSel]) return;
  var it = storyTexts[stSel];
  it.bg = it.bg === 'dark' ? 'light' : (it.bg === 'light' ? null : 'dark');
  stRender();
}
function stDeleteText(){
  if(stSel < 0) return;
  storyTexts.splice(stSel, 1);
  stSel = storyTexts.length ? storyTexts.length - 1 : -1;
  stRender();
}
function stRenderStoryTexts(items){
  var layer = document.getElementById('sv-text-layer');
  if(!layer) return;
  stRenderInto(layer, items || [], false);
}

/* ---------------- Settings ---------------- */
function renderSettings(){
  var darkOn = document.documentElement.classList.contains('dark');
  var pushOn = ('Notification' in window) && Notification.permission === 'granted' && !!localStorage.getItem('pulse-push-on');
  var emailVal = myEmail ? esc(myEmail) : 'Not set';
  var ic = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c0-3.6 3.1-5.8 7-5.8s7 2.2 7 5.8"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3.5h12v17l-6-4-6 4Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="1"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8Z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"/><path d="M16.5 6.2a3.2 3.2 0 0 1 0 6.1"/><path d="M18 14.6c2 .6 3.5 2.2 3.5 4.9"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20H15"/><path d="m10 8-4 4 4 4"/><path d="M6 12h9"/></svg>'
  };
  function row(icon, label, action, val, danger){
    return '<button class="set-row' + (danger ? ' danger' : '') + '" onclick="' + action + '">'
      + '<span class="ic">' + icon + '</span><span class="lbl">' + label + '</span>'
      + (val ? '<span class="val">' + val + '</span>' : '')
      + '<span class="chev">›</span></button>';
  }
  document.getElementById('main-col').innerHTML =
    '<div class="set-wrap">'
    + '<div class="set-head">'
      + '<button class="set-back" onclick="showView(\'profile\')" title="Back">'
      + '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>'
      + '<h2>Settings</h2></div>'
    + '<div class="set-group">' + row(ic.star, 'Pulse Pro', 'showView(\'pro\')', isPro() ? 'Active' : 'Upgrade') + '</div>'
    + '<div class="set-title">Account</div>'
    + '<div class="set-group">'
      + row(ic.mail, (myEmail ? 'Email' : 'Add email'), 'openAddEmail()', emailVal)
      + row(ic.lock, 'Change password', 'openChangePassword()')
      + row(ic.user, 'Edit profile', 'openEditProfile()')
    + '</div>'
    + '<div class="set-title">App</div>'
    + '<div class="set-group">'
      + '<button class="set-row" onclick="toggleTheme();renderSettings()"><span class="ic">' + ic.moon + '</span><span class="lbl">Dark mode</span><span class="switch' + (darkOn ? ' on' : '') + '"><i></i></span></button>'
      + '<button class="set-row" onclick="settingsNotifications()"><span class="ic">' + ic.bell + '</span><span class="lbl">Push notifications</span><span class="val">' + (pushOn ? 'On' : 'Off') + '</span><span class="chev">›</span></button>'
      + '<div class="set-row" style="cursor:default;"><span class="ic">' + ic.volume + '</span><span class="lbl">Sound volume</span><span class="val" id="vol-label">' + Math.round(audioVolume * 100) + '%</span><input id="vol-slider" type="range" min="0" max="100" value="' + Math.round(audioVolume * 100) + '" oninput="setVolume(this.value/100)" style="width:92px;margin-left:8px;flex-shrink:0;"></div>'
      + row(ic.people, 'Invite friends', 'openInvite()')
      + row(ic.down, 'Install app', 'installApp()')
      + row(ic.book, 'Saved posts', 'openSaved()')
    + '</div>'
    + '<div class="set-title">Privacy &amp; support</div>'
    + '<div class="set-group">'
      + row(ic.shield, 'Privacy policy', 'openPrivacy()')
      + row(ic.info, 'About Pulse', 'openAbout()')
    + '</div>'
    + '<div class="set-group">' + row(ic.out, 'Log out', 'logout()', null, true) + '</div>'
    + '</div>';
}
async function settingsNotifications(){
  if(!('Notification' in window)){ toast('This browser does not support notifications'); return; }
  if(Notification.permission === 'granted' && localStorage.getItem('pulse-push-on')){ toast('Notifications are already on'); return; }
  await enableNotifications();
  renderSettings();
}
function openSaved(){
  profileTab = 'saved';
  showView('profile');
}
function openChangePassword(){
  if(!myEmail){ toast('Add an email to your account first'); openAddEmail(); return; }
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-confirm').value = '';
  document.getElementById('pw-modal').classList.add('open');
}
function closeChangePassword(){ document.getElementById('pw-modal').classList.remove('open'); }
async function savePassword(){
  var a = document.getElementById('pw-new').value || '';
  var b = document.getElementById('pw-confirm').value || '';
  if(a.length < 6){ toast('Password must be at least 6 characters'); return; }
  if(a !== b){ toast('The two passwords do not match'); return; }
  var btn = document.getElementById('pw-submit');
  btn.disabled = true;
  try {
    var r = await supa.auth.updateUser({ password: a });
    if(r.error){ toast(r.error.message || 'Could not change the password'); return; }
    closeChangePassword();
    toast('Password changed! Use it next time you log in');
  } catch(e){
    console.error(e);
    toast('Something went wrong - please try again');
  } finally {
    btn.disabled = false;
  }
}
function openAbout(){ document.getElementById('about-modal').classList.add('open'); }
function closeAbout(){ document.getElementById('about-modal').classList.remove('open'); }

/* ---------------- Global escape-to-close ---------------- */
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  if(document.getElementById('img-viewer').classList.contains('open')) closeImageViewer();
  else if(document.getElementById('shorts-viewer').classList.contains('open')) closeShorts();
  else if(document.getElementById('post-modal').classList.contains('open')) closePostModal();
  else if(document.getElementById('create-modal').classList.contains('open')) closeCreateModal();
  else if(document.getElementById('music-modal').classList.contains('open')) closeMusicPicker();
  else if(document.getElementById('edit-profile-modal').classList.contains('open')) closeEditProfile();
  else if(document.getElementById('privacy-modal').classList.contains('open')) closePrivacy();
  else if(document.getElementById('email-auth-modal').classList.contains('open')) closeEmailAuth();
  else if(document.getElementById('add-email-modal').classList.contains('open')) closeAddEmail();
  else if(document.getElementById('pw-modal').classList.contains('open')) closeChangePassword();
  else if(document.getElementById('about-modal').classList.contains('open')) closeAbout();
  else if(document.getElementById('invite-modal').classList.contains('open')) closeInvite();
});

/* ---------------- Realtime ---------------- */
const scheduleRefresh = debounce(function(){ refreshData(); }, 700);
const scheduleConvRefresh = debounce(function(){
  fetchConversations().then(function(c){
    conversations = c;
    if(currentView === 'messages' && !activeChat) renderMessages();
    updateBadges();
  });
}, 500);
const scheduleBadgeRefresh = debounce(updateBadges, 800);

function setupRealtime(){
  if(!me) return;
  try {
    supa.channel('pulse-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, scheduleRefresh)
      .subscribe();

    supa.channel('pulse-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, function(payload){
        const m = payload.new;
        if(m && activeChat && (m.sender_id === activeChat || m.recipient_id === activeChat)){
          markChatRead(activeChat).then(fetchThread).then(renderChat);
        } else if(m && m.recipient_id === me.id && currentView !== 'messages'){
          // light signal: refresh badge + conversation list
        }
        scheduleConvRefresh();
        scheduleBadgeRefresh();
      })
      .subscribe();

    supa.channel('pulse-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + me.id }, function(){
        scheduleBadgeRefresh();
        if(currentView === 'notifications') scheduleRefresh();
      })
      .subscribe();
  } catch(e){
    console.error('realtime setup failed', e);
  }
}

/* ---------------- Presence (who is online) ---------------- */
function setupPresence(){
  try {
    presenceChannel = supa.channel('pulse-online', { config: { presence: { key: me.id } } });
    presenceChannel
      .on('presence', { event: 'sync' }, function(){
        presenceMap = new Set(Object.keys(presenceChannel.presenceState()));
        updatePresenceDots();
      })
      .subscribe(function(status){
        if(status === 'SUBSCRIBED'){
          presenceChannel.track({ user: me.username, at: new Date().toISOString() });
        }
      });
  } catch(e){
    console.error('presence setup failed', e);
  }
}
function updatePresenceDots(){
  document.querySelectorAll('.presence-dot[data-uid]').forEach(function(el){
    el.classList.toggle('on', presenceMap.has(el.getAttribute('data-uid')));
  });
}

/* ---------------- Push notifications ---------------- */
const VAPID_PUBLIC_KEY = 'BDx1LdMq6yeq4vvmybIoJkS2FEDI8bx8iUT0V-vWqXLPkRR2fiY8DKMbX6816i823yIIr_P1fvEOgx6gPtu-P_Q';
function urlB64ToUint8Array(b64){
  var padding = '='.repeat((4 - b64.length % 4) % 4);
  var base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  var raw = window.atob(base64);
  var arr = new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function enableNotifications(){
  if(!('serviceWorker' in navigator) || !('PushManager' in window)){ toast('This browser does not support notifications'); return; }
  try {
    var reg = await navigator.serviceWorker.register('sw.js');
    var perm = await Notification.requestPermission();
    if(perm !== 'granted'){ toast('Notifications were blocked \u2014 allow them in your browser settings, then try again'); return; }
    var sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) });
    var r = await supa.from('push_subscriptions').upsert(
      { user_id: me.id, endpoint: sub.endpoint, sub: sub.toJSON() },
      { onConflict: 'endpoint' }
    );
    if(r.error){ toast('Notifications need a one-time SQL update \u2014 see push-notifications.sql'); return; }
    try { localStorage.setItem('pulse-push-on', '1'); } catch(e2){}
    toast('Notifications on! \ud83d\udd14');
    var b = document.getElementById('notif-enable-btn');
    if(b) b.style.display = 'none';
    var btop = document.getElementById('notif-enable-top');
    if(btop) btop.style.display = 'none';
  } catch(e){
    console.error(e);
    toast('Could not turn on notifications');
  }
}


/* ---------------- Installable app (PWA) ---------------- */
var deferredInstall = null;
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  deferredInstall = e;
  var b = document.getElementById('install-btn');
  if(b) b.style.display = 'flex';
});
window.addEventListener('appinstalled', function(){
  deferredInstall = null;
  var b = document.getElementById('install-btn');
  if(b) b.style.display = 'none';
  toast('Pulse installed! Check your home screen');
});
function installApp(){
  if(!deferredInstall){
    toast('Open your browser menu and choose "Install app" or "Add to Home screen"');
    return;
  }
  deferredInstall.prompt();
  deferredInstall.userChoice.then(function(){ deferredInstall = null; });
  var b = document.getElementById('install-btn');
  if(b) b.style.display = 'none';
}

/* ---------------- Init ---------------- */
(function(){
  try { if(localStorage.getItem('pulse-agreed-v1')){ var cbAgree = document.getElementById('ob-agree'); if(cbAgree) cbAgree.checked = true; } } catch(e){}
  var ph = initialsAvatar('?');
  ['topbar-avatar','bottomnav-avatar','sidecol-avatar'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && !el.getAttribute('src')) el.src = ph;
  });
})();
boot();
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(e){ console.warn('service worker failed', e); });
  });
}
