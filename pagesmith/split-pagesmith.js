#!/usr/bin/env node
/*
 * split-pagesmith.js — one-time externalizer for PageSmith's single-file index.html
 *
 * What it does (no logic changes, pure byte-moves):
 *   - Pulls the vendored docx library out      -> vendor/docx.bundle.js
 *   - Pulls the 4 base64 logo constants out     -> assets/logos.js
 *   - Pulls the app code out                     -> app.js
 *   - Rewrites index.html to reference them via <script src=...> in the right order
 *
 * Why this is safe:
 *   - Classic <script> tags share one global scope, so top-level `const` in
 *     logos.js is visible to app.js as long as logos.js loads first (it does).
 *   - Any in-string "</script>" in the original is escaped as "<\/script>",
 *     so a literal </script> is always a real closing tag -> the regex is reliable.
 *
 * Usage:  node split-pagesmith.js [path/to/index.html]
 *         (defaults to ./index.html, writes a backup to index.original.html)
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || 'index.html';
const root = path.dirname(path.resolve(SRC));
const html = fs.readFileSync(SRC, 'utf8');

// Backup first.
fs.writeFileSync(path.join(root, 'index.original.html'), html);

// Match every real <script>...</script> block.
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const blocks = [];
let m;
while ((m = scriptRe.exec(html)) !== null) {
  blocks.push({ full: m[0], attrs: m[1], body: m[2], index: m.index });
}

const docxBlock = blocks.find(b => b.body.includes('(function(global2, factory)'));
const appBlock  = blocks.find(b => b.body.includes('const LOGOS={pagesmith:'));

if (!docxBlock) throw new Error('Could not find the vendored docx <script> block.');
if (!appBlock)  throw new Error('Could not find the app <script> block.');

// 1) docx library -> vendor/docx.bundle.js
fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(root, 'vendor', 'docx.bundle.js'), docxBlock.body.trim() + '\n');

// 2) the 4 logo data-URI consts -> assets/logos.js (removed from app body)
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
const logoNames = ['TACTAG_LOGO', 'PS_ICON', 'PS_WORD', 'RO_LOGO'];
const logoLines = [];
let appBody = appBlock.body;
for (const name of logoNames) {
  const re = new RegExp('^[ \\t]*const ' + name + '=.*$', 'm');
  const hit = appBody.match(re);
  if (!hit) throw new Error('Missing logo const: ' + name);
  logoLines.push(hit[0].trim());
  appBody = appBody.replace(re, '');
}
fs.writeFileSync(path.join(root, 'assets', 'logos.js'), logoLines.join('\n') + '\n');

// 3) remaining app code -> app.js
appBody = appBody.replace(/\n{3,}/g, '\n\n').trim();
fs.writeFileSync(path.join(root, 'app.js'), appBody + '\n');

// 4) rewrite index.html — swap inline blocks for external references (correct order)
let out = html
  .replace(docxBlock.full, '<script src="vendor/docx.bundle.js"></script>')
  .replace(appBlock.full,
    '<script src="assets/logos.js"></script>\n<script src="app.js"></script>');

fs.writeFileSync(path.join(root, 'index.html'), out);

// Report
const kb = p => (fs.statSync(path.join(root, p)).size / 1024).toFixed(1) + ' KB';
const lines = p => fs.readFileSync(path.join(root, p), 'utf8').split('\n').length;
console.log('Split complete.\n');
console.log('  index.html          ', kb('index.html'), '/', lines('index.html'), 'lines');
console.log('  app.js              ', kb('app.js'), '/', lines('app.js'), 'lines');
console.log('  assets/logos.js     ', kb('assets/logos.js'), '/', lines('assets/logos.js'), 'lines');
console.log('  vendor/docx.bundle.js', kb('vendor/docx.bundle.js'), '/', lines('vendor/docx.bundle.js'), 'lines');
console.log('  index.original.html ', kb('index.original.html'), '(backup)');
