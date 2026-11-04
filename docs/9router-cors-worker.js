// Cloudflare Worker for 9router.nakamo.fun: lets the Wegym app (a web page) call 9router.
// A browser asks first with OPTIONS, without the API key; 9router answers that with 401, so the
// browser blocks the real request. This Worker answers OPTIONS itself and adds the CORS headers to
// every reply. Everything else (the key, streaming answers) passes through to 9router unchanged.
// Route: 9router.nakamo.fun/*
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const res = await fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
    return out;
  },
};
