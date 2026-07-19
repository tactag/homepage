import http from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const MAX_BODY = 1_000_000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const AUTH_ALLOWLIST = (process.env.AUTH_ALLOWLIST ||
  'tyson.a.gauthier@gmail.com,d6ewa.supervisor@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const OTP_TTL_MS = Number(process.env.OTP_TTL_MS || 10 * 60 * 1000);
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 45_000;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'PageSmith <noreply@construe.tactag.app>';
const APP_URL = process.env.APP_URL || 'https://tactag.app/pagesmith/';

/** @type {Map<string, { hash: string, exp: number, attempts: number, sentAt: number }>} */
const otpStore = new Map();
/** @type {Map<string, number>} */
const revokedSessions = new Map();

function corsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '';
}

function corsHeaders(req, extra = {}) {
  return {
    'access-control-allow-origin': corsOrigin(req),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'vary': 'origin',
    ...extra,
  };
}

function send(res, status, body, req) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    ...corsHeaders(req),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAllowlisted(email) {
  return AUTH_ALLOWLIST.includes(normalizeEmail(email));
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function signSession(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(body).digest());
  return `${body}.${sig}`;
}

function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload?.email || !payload?.exp || !payload?.jti) return null;
  if (Date.now() > payload.exp) return null;
  if (revokedSessions.has(payload.jti)) return null;
  if (!isAllowlisted(payload.email)) return null;
  return payload;
}

function authFromReq(req) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifySession(m[1].trim());
}

function requireAuth(req, res) {
  const session = authFromReq(req);
  if (!session) {
    send(res, 401, { error: 'Sign in required.' }, req);
    return null;
  }
  return session;
}

function hashOtp(email, code) {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${normalizeEmail(email)}:${code}`)
    .digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function purgeExpired() {
  const now = Date.now();
  for (const [email, entry] of otpStore) {
    if (entry.exp <= now) otpStore.delete(email);
  }
  for (const [jti, exp] of revokedSessions) {
    if (exp <= now) revokedSessions.delete(jti);
  }
}

async function sendOtpEmail(email, code) {
  if (!RESEND_API_KEY) {
    const err = new Error('RESEND_API_KEY is not configured.');
    err.status = 500;
    throw err;
  }

  // No magic login link. Scrapers that auto-follow email URLs cannot consume the OTP.
  // Optional plain site link has zero auth material.
  const text = [
    'Your PageSmith sign-in code:',
    '',
    `  ${code}`,
    '',
    'Enter this code on the PageSmith sign-in screen.',
    'It expires in 10 minutes.',
    '',
    `Open PageSmith: ${APP_URL}`,
    '',
    'If you did not request this, ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,system-ui,sans-serif;max-width:480px;color:#161616">
      <p style="margin:0 0 12px">Your PageSmith sign-in code:</p>
      <p style="font-size:28px;letter-spacing:0.25em;font-weight:700;margin:0 0 16px">${code}</p>
      <p style="margin:0 0 12px;color:#444">Enter this code on the PageSmith sign-in screen. It expires in 10 minutes.</p>
      <p style="margin:0 0 12px"><a href="${APP_URL}">Open PageSmith</a> (this link does not sign you in).</p>
      <p style="margin:0;color:#777;font-size:12px">If you did not request this, ignore this email.</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: 'Your PageSmith sign-in code',
      text,
      html,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Resend failed (${response.status}).`;
    const err = new Error(message);
    err.status = 502;
    throw err;
  }
  return data;
}

async function handleRequestCode(req, res) {
  purgeExpired();
  const body = await readJson(req);
  const email = normalizeEmail(body.email);

  // Always return the same shape for allowlisted and non-allowlisted to reduce enumeration.
  const generic = {
    ok: true,
    message: 'If that email is authorized, a sign-in code was sent. Check your inbox and enter the code here — no link is needed.',
  };

  if (!email || !email.includes('@')) {
    send(res, 400, { error: 'Enter a valid email address.' }, req);
    return;
  }

  if (!isAllowlisted(email)) {
    // Slow identical response; no email sent.
    await new Promise((r) => setTimeout(r, 400));
    send(res, 200, generic, req);
    return;
  }

  const existing = otpStore.get(email);
  if (existing && Date.now() - existing.sentAt < OTP_COOLDOWN_MS) {
    const waitSec = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
    send(res, 429, { error: `Wait ${waitSec}s before requesting another code.` }, req);
    return;
  }

  const code = generateOtp();
  otpStore.set(email, {
    hash: hashOtp(email, code),
    exp: Date.now() + OTP_TTL_MS,
    attempts: 0,
    sentAt: Date.now(),
  });

  await sendOtpEmail(email, code);
  send(res, 200, generic, req);
}

async function handleVerifyCode(req, res) {
  purgeExpired();
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').replace(/\s+/g, '');

  if (!email || !/^\d{6}$/.test(code)) {
    send(res, 400, { error: 'Enter your email and the 6-digit code.' }, req);
    return;
  }

  if (!isAllowlisted(email)) {
    send(res, 401, { error: 'Invalid email or code.' }, req);
    return;
  }

  const entry = otpStore.get(email);
  if (!entry || entry.exp <= Date.now()) {
    otpStore.delete(email);
    send(res, 401, { error: 'Code expired. Request a new one.' }, req);
    return;
  }

  entry.attempts += 1;
  if (entry.attempts > OTP_MAX_ATTEMPTS) {
    otpStore.delete(email);
    send(res, 401, { error: 'Too many attempts. Request a new code.' }, req);
    return;
  }

  const expected = entry.hash;
  const got = hashOtp(email, code);
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    send(res, 401, { error: 'Invalid email or code.' }, req);
    return;
  }

  otpStore.delete(email);
  const now = Date.now();
  const session = {
    email,
    iat: now,
    exp: now + SESSION_TTL_MS,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  const token = signSession(session);
  send(res, 200, { ok: true, token, email, expiresAt: session.exp }, req);
}

function handleMe(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  send(res, 200, { ok: true, email: session.email, expiresAt: session.exp }, req);
}

function handleLogout(req, res) {
  const session = authFromReq(req);
  if (session?.jti) {
    revokedSessions.set(session.jti, session.exp);
  }
  send(res, 200, { ok: true }, req);
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Claude did not return JSON.');
  return JSON.parse(candidate.slice(start, end + 1));
}

function safeHref(href) {
  const h = String(href || '').trim();
  if (!h) return '';
  if (/^(https?:|mailto:|#|\/|\.\.?\/)/i.test(h)) return h;
  return '';
}

function escAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractLinks(html) {
  const links = [];
  const re = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(String(html || '')))) {
    const href = safeHref(match[1] || match[2] || match[3]);
    const text = match[4].replace(/<[^>]+>/g, '').trim();
    if (href) links.push({ href, text });
  }
  return links;
}

function collectLinks(document) {
  const seen = new Set();
  const links = [];
  for (const block of document.blocks || []) {
    const blockLinks = Array.isArray(block.links) ? block.links : extractLinks(block.html);
    for (const link of blockLinks) {
      const href = safeHref(link.href);
      if (!href || seen.has(href)) continue;
      seen.add(href);
      links.push({ href, text: String(link.text || '').trim() });
    }
  }
  return links;
}

function sanitizeAiHTML(html) {
  const allowed = new Set(['a', 'b', 'strong', 'i', 'em', 'br', 'li', 'ul']);
  const input = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  function walk(str) {
    const out = [];
    let i = 0;
    while (i < str.length) {
      const lt = str.indexOf('<', i);
      if (lt === -1) {
        out.push(escHtml(str.slice(i)));
        break;
      }
      if (lt > i) out.push(escHtml(str.slice(i, lt)));

      const gt = str.indexOf('>', lt);
      if (gt === -1) {
        out.push(escHtml(str.slice(lt)));
        break;
      }

      const tagContent = str.slice(lt + 1, gt).trim();
      const closing = tagContent.startsWith('/');
      const tagName = (closing ? tagContent.slice(1) : tagContent).split(/\s/)[0].toLowerCase();

      if (!allowed.has(tagName)) {
        i = gt + 1;
        continue;
      }

      if (tagName === 'br' && !closing) {
        out.push('<br>');
        i = gt + 1;
        continue;
      }

      if (tagName === 'a' && !closing) {
        const hrefMatch = tagContent.match(/^a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const href = safeHref(hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3]) : '');
        const end = str.toLowerCase().indexOf('</a>', gt);
        if (href && end !== -1) {
          const inner = walk(str.slice(gt + 1, end));
          out.push(`<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`);
          i = end + 4;
          continue;
        }
        i = gt + 1;
        continue;
      }

      if (closing) out.push(`</${tagName}>`);
      else out.push(`<${tagName}>`);
      i = gt + 1;
    }
    return out.join('');
  }

  return walk(input).trim();
}

function validateDocument(doc) {
  if (!doc || typeof doc !== 'object') throw new Error('Missing document.');
  if (!Array.isArray(doc.blocks)) throw new Error('Document blocks must be an array.');
  return {
    title: String(doc.title || 'Untitled document').slice(0, 160),
    subtitle: String(doc.subtitle || '').slice(0, 240),
    blocks: doc.blocks.slice(0, 80).map((block) => {
      const type = String(block.type || 'p');
      const out = { type };
      if (['h1', 'h2', 'h3', 'p', 'callout', 'ul'].includes(type)) out.html = sanitizeAiHTML(block.html || '');
      if (type === 'stat') {
        out.num = String(block.num || '0');
        out.lab = String(block.lab || 'Key number');
        out.txt = String(block.txt || '');
      }
      if (type === 'table') {
        out.headers = Array.isArray(block.headers) ? block.headers.map(String).slice(0, 6) : ['Item', 'Notes'];
        out.rows = Array.isArray(block.rows) ? block.rows.slice(0, 20).map((row) => Array.isArray(row) ? row.map(String).slice(0, out.headers.length) : []) : [];
      }
      if (type === 'rings') {
        out.title = String(block.title || 'Progress');
        out.a = block.a || { label: 'Start', value: 0, max: 10 };
        out.two = block.two !== false;
        out.bb = block.bb || { label: 'Done', value: 0, max: 10 };
        out.delta = String(block.delta || 'progress');
      }
      return out;
    }),
  };
}

function buildPrompt({ document, options = {} }) {
  const linksToPreserve = collectLinks(document);
  return {
    role: 'user',
    content: JSON.stringify({
      task: 'Rewrite and organize this PageSmith document for maximum clarity, usefulness, and impact.',
      instructions: [
        'Return only valid JSON. No markdown, no commentary.',
        'Output schema: { "title": string, "subtitle": string, "blocks": array }.',
        'Allowed block types: h1, h2, h3, p, ul, callout, stat, table, rings, divider.',
        'For h1/h2/h3/p/callout/ul, use an html field with inline markup only.',
        'UL html must contain <li> elements. Example: "<li>First</li><li>Second</li>".',
        'The html field may contain inline tags: <a href="URL">, <b>, <i>, <br>.',
        'Preserve every hyperlink as <a href="...">...</a>. Keep each original href URL exactly. You may rewrite link label text or surrounding prose, but never remove links or change href values.',
        'When linksToPreserve is non-empty, every listed href must still appear in the output html as a working <a href="..."> tag.',
        'For table, use headers and rows arrays. For stat, use num, lab, txt.',
        'Do not invent private facts. Preserve the user intent, improve organization, and remove repetition.',
        'Make the result ready to publish, not just edited grammar.',
      ],
      linksToPreserve,
      style: options.style || 'clear',
      format: options.format || 'keep',
      intensity: options.intensity || 'standard',
      extraInstructions: options.instructions || '',
      document,
    }),
  };
}

async function polish(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not configured.');
    err.status = 500;
    throw err;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.35,
      system: 'You are an expert editor and information designer for PageSmith documents. Preserve hyperlinks in html fields using <a href="..."> tags. Never strip links or return plain-text URLs when the source used anchor tags.',
      messages: [buildPrompt(body)],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Anthropic request failed with ${response.status}.`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const text = (data.content || [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

  return {
    document: validateDocument(extractJson(text)),
    model: data.model || MODEL,
    usage: data.usage || null,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  try {
    if (req.method === 'GET' && path === '/health') {
      send(res, 200, {
        ok: true,
        service: 'pagesmith-ai-api',
        auth: true,
        allowlistCount: AUTH_ALLOWLIST.length,
      }, req);
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/request-code') {
      await handleRequestCode(req, res);
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/verify-code') {
      await handleVerifyCode(req, res);
      return;
    }

    if (req.method === 'GET' && path === '/api/auth/me') {
      handleMe(req, res);
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/logout') {
      handleLogout(req, res);
      return;
    }

    if (req.method === 'POST' && path === '/api/polish') {
      if (!requireAuth(req, res)) return;
      const body = await readJson(req);
      send(res, 200, await polish(body), req);
      return;
    }

    send(res, 404, { error: 'Not found.' }, req);
  } catch (error) {
    send(res, error.status || 500, { error: error.message || 'Request failed.' }, req);
  }
});

server.listen(PORT, () => {
  console.log(`PageSmith AI API listening on ${PORT} (auth gate enabled, ${AUTH_ALLOWLIST.length} allowlisted)`);
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET not set — using ephemeral secret (sessions reset on restart).');
  }
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — OTP emails will fail until configured.');
  }
});
