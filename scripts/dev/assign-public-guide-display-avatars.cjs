#!/usr/bin/env node
/** Assign unique avatar_url to public test guides (C3 · C1) — Visual Consistency fix */
const http = require('http');
const https = require('https');

const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const lib = API.startsWith('https') ? https : http;

const PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=82',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=640&q=82',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=640&q=82',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=640&q=82',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=640&q=82',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=640&q=82',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&q=82',
  'https://images.unsplash.com/photo-1599566150163-29194dabcad3?w=640&q=82',
];

const ACCOUNTS = [
  { email: 'guide@test.com', password: 'Test123!', portrait: 0 },
  { email: 'multi-demo@test.com', password: 'Test123!', portrait: 1 },
];

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
    const payload = body ? JSON.stringify(body) : null;
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

(async () => {
  for (const acct of ACCOUNTS) {
    const login = await req('POST', '/auth/login', { email: acct.email, password: acct.password });
    const tok = JSON.parse(login.body).token;
    const avatar_url = PORTRAITS[acct.portrait % PORTRAITS.length];
    const pr = await req('PATCH', '/api/v1/me/guide-profile', { avatar_url }, tok);
    if (pr.status < 200 || pr.status >= 300) {
      console.error('FAIL', acct.email, pr.status, pr.body.slice(0, 120));
      process.exit(1);
    }
    console.log('OK avatar', acct.email, avatar_url.slice(0, 50));
  }
  console.log('assign-public-guide-display-avatars: exit 0');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
