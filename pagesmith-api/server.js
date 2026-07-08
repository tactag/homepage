import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const MAX_BODY = 1_000_000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '';
}

function send(res, status, body, req) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': corsOrigin(req),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'origin',
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
    res.writeHead(204, {
      'access-control-allow-origin': corsOrigin(req),
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
      'vary': 'origin',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    send(res, 200, { ok: true, service: 'pagesmith-ai-api' }, req);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/polish') {
    try {
      const body = await readJson(req);
      send(res, 200, await polish(body), req);
    } catch (error) {
      send(res, error.status || 500, { error: error.message || 'AI polish failed.' }, req);
    }
    return;
  }

  send(res, 404, { error: 'Not found.' }, req);
});

server.listen(PORT, () => {
  console.log(`PageSmith AI API listening on ${PORT}`);
});
