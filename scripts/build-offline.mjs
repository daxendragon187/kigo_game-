import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const distIndex = path.join(distDir, 'index.html');
const publicDownloadsDir = path.join(root, 'public', 'downloads');
const distDownloadsDir = path.join(distDir, 'downloads');

if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndex, 'utf8');

// Inline stylesheet(s) using function replacer (avoids $& / $' expansion)
html = html.replace(
  /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi,
  (full, href) => {
    const cleanHref = href.replace(/^\.\//, '').replace(/^\//, '');
    const cssPath = path.join(distDir, cleanHref);
    if (!fs.existsSync(cssPath)) return full;
    const css = fs.readFileSync(cssPath, 'utf8').replace(/<\/style>/gi, '<\\/style>');
    return `<style>${css}</style>`;
  }
);

// Collect and remove external module script tags
const inlinedScripts = [];
html = html.replace(
  /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/gi,
  (full, src) => {
    const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
    const jsPath = path.join(distDir, cleanSrc);
    if (!fs.existsSync(jsPath)) return full;
    const js = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
    inlinedScripts.push(`<script type="module">${js}</script>`);
    return '';
  }
);

// Inject scripts at the final </body> tag without String.replace special patterns
if (inlinedScripts.length > 0) {
  const bodyCloseIdx = html.lastIndexOf('</body>');
  if (bodyCloseIdx !== -1) {
    html =
      html.slice(0, bodyCloseIdx) +
      '\n' +
      inlinedScripts.join('\n') +
      '\n' +
      html.slice(bodyCloseIdx);
  } else {
    html += '\n' + inlinedScripts.join('\n');
  }
}

fs.mkdirSync(publicDownloadsDir, { recursive: true });
fs.mkdirSync(distDownloadsDir, { recursive: true });

const publicOut = path.join(publicDownloadsDir, 'KIGO-TamilNadu-OpenWorld.html');
const distOut = path.join(distDownloadsDir, 'KIGO-TamilNadu-OpenWorld.html');

fs.writeFileSync(publicOut, html, 'utf8');
fs.writeFileSync(distOut, html, 'utf8');

const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Built standalone offline game: ${publicOut} (${sizeKb} KB)`);
