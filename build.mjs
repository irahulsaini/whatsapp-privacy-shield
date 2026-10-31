import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { minify } from 'terser';
import Obfuscator from 'javascript-obfuscator';
import JSZip from 'jszip';
import { createCanvas } from '@napi-rs/canvas';
const root = path.dirname(fileURLToPath(import.meta.url));
const {version} = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const source = await readFile(path.join(root, 'src/privacy.js'), 'utf8');
const compact = (await minify(source, { compress: true, mangle: true, format: { comments: false } })).code;
const obfuscated = Obfuscator.obfuscate(compact, {
  target: 'browser-no-eval', seed: 100, compact: true,
  controlFlowFlattening: false, deadCodeInjection: false, debugProtection: false,
  selfDefending: false, disableConsoleOutput: false, stringArray: true,
}).getObfuscatedCode();
const icons = {};
for (const size of [16, 32, 48, 128]) {
  const canvas = createCanvas(size, size), ctx = canvas.getContext('2d');
  ctx.scale(size/128, size/128);
  ctx.fillStyle = '#374151'; ctx.fillRect(0,0,128,128);
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 8; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(64,18); ctx.lineTo(27,32); ctx.lineTo(27,62);
  ctx.bezierCurveTo(27,87,64,110,64,110); ctx.bezierCurveTo(64,110,101,87,101,62);
  ctx.lineTo(101,32); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(43,63); ctx.lineTo(58,78); ctx.lineTo(85,47); ctx.stroke();
  icons[`icons/${size}.png`] = canvas.toBuffer('image/png');
}
const manifest = {
  manifest_version: 3, name: 'WhatsApp Privacy Shield by Rahul Saini', version,
  description: 'Blur matching WhatsApp Web chats. Reveal on hover or focus, with local on/off and strength controls.',
  homepage_url: 'https://www.irahulsaini.com/tools/whatsapp-privacy-shield',
  icons: Object.fromEntries([16,32,48,128].map(n => [n,`icons/${n}.png`])),
  content_scripts: [{ matches: ['https://web.whatsapp.com/*'], js: ['privacy.js'], run_at: 'document_idle', all_frames: false }],
  action: { default_title: 'WhatsApp Privacy Shield', default_popup: 'popup.html' },
};
const popup = `<!doctype html><html lang="en"><meta charset="utf-8"><title>WhatsApp Privacy Shield</title><body><h1>WhatsApp Privacy Shield</h1><p>Open WhatsApp Web, then use the privacy shield beside the header title. If the title is unavailable, look in the top-right corner.</p><p>Choose ON/OFF, blur strength, and Messages or Entire chat. Messages reveals only the hovered or focused row; Entire chat reveals all matching messages while the conversation is hovered or focused. The header and composer remain visible. × closes settings; OFF removes blur. Refresh resets settings and enables blur again.</p><p>This is visual privacy, not encryption. Some content may remain visible. No data is collected or transmitted.</p><p>After installing, disabling or removing the extension, refresh existing WhatsApp tabs.</p><a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">Open WhatsApp Web</a></body></html>`;
for (const variant of ['chrome', 'edge', 'firefox', 'chromium-obfuscated-local-only']) {
  const config = structuredClone(manifest);
  if (variant === 'firefox') config.browser_specific_settings = {gecko: {
    id: 'whatsapp-privacy-blur@irahulsaini.com', strict_min_version: '140.0',
    data_collection_permissions: {required: ['none']},
  }};
  const files = { 'manifest.json': JSON.stringify(config,null,2)+'\n',
    'privacy.js': variant.includes('obfuscated') ? obfuscated : compact,
    'popup.html': popup, ...icons };
  const zip = new JSZip();
  for (const [name,data] of Object.entries(files)) {
    const dest = path.join(root,'dist',variant,name);
    await mkdir(path.dirname(dest),{recursive:true}); await writeFile(dest,data);
    zip.file(name,data,{date:new Date('2026-01-01T00:00:00Z')});
  }
  await writeFile(path.join(root,'dist',`${variant}-${version}.zip`), await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
}
await writeFile(path.join(root,'dist/console.js'), compact);
await writeFile(path.join(root,'dist/console.obfuscated.js'), obfuscated);
// Source archive includes exact build instructions and lockfile; no generated code.
const sourceZip = new JSZip();
async function addTree(dir) {
  for (const entry of await readdir(path.join(root,dir),{withFileTypes:true})) {
    const name=path.join(dir,entry.name);
    if (entry.isDirectory()) await addTree(name);
    else sourceZip.file(name,await readFile(path.join(root,name)),{date:new Date('2026-01-01T00:00:00Z')});
  }
}
for (const dir of ['src','original','tests','packages']) await addTree(dir);
for (const name of ['package.json','package-lock.json','build.mjs','README.md','PRIVACY.md','release.json']) {
  sourceZip.file(name,await readFile(path.join(root,name)),{date:new Date('2026-01-01T00:00:00Z')});
}
await writeFile(path.join(root,`dist/source-${version}.zip`),await sourceZip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
console.log('Built Chrome, Edge, Firefox, local-only obfuscated, console and source packages.');
