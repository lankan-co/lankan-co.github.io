/**
 * Brand asset generator
 * ---------------------------------------------------------------
 * Builds every static brand file from the single source of truth
 * (src/data/logo-paths.json — vectors traced from the original artwork):
 *
 *   public/brand/lankan-logo.svg           full logo (mark + wordmark)
 *   public/brand/lankan-logo-tagline.svg   full logo + tagline lockup
 *   public/brand/lankan-mark.svg           logo-only square mark
 *   public/favicon.svg, apple-touch-icon.png, icon-512.png
 *   public/og-image.png                   1200x630 social card
 *
 * Run:  npm run brand
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logo = JSON.parse(readFileSync(resolve(root, 'src/data/logo-paths.json'), 'utf8'));
const out = (p) => resolve(root, p);
mkdirSync(out('public/brand'), { recursive: true });

const { width: W, height: H } = logo.viewBox;

/* ---------- Logo SVG fragments ---------- */
const markGroup = `<rect width="${logo.square.width}" height="${logo.square.height}" fill="#fff"/><path fill="#000" fill-rule="evenodd" d="${logo.mark}"/>`;
const wordGroup = `<path fill="#fff" fill-rule="evenodd" transform="translate(${logo.wordmarkOffsetX} 0)" d="${logo.wordmark}"/>`;

const fullLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Lankan Brands &amp; Co."><title>Lankan Brands &amp; Co.</title>${markGroup}${wordGroup}</svg>`;
const fullLogoOnBlack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 ${W + 120} ${H + 120}"><rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="#000"/>${markGroup}${wordGroup}</svg>`;
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logo.square.width} ${logo.square.height}" role="img" aria-label="Lankan Brands &amp; Co. mark"><title>Lankan Brands &amp; Co.</title>${markGroup}</svg>`;

writeFileSync(out('public/brand/lankan-logo.svg'), fullLogo);
writeFileSync(out('public/brand/lankan-mark.svg'), mark);
writeFileSync(out('public/favicon.svg'), mark);

/* Tagline lockup — logo is the hero, tagline sits beneath it as in the artwork. */
const tagW = W + 240;
const tagH = H + 420;
const taglineLockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tagW} ${tagH}" role="img" aria-label="Lankan Brands &amp; Co. — For small businesses building something of their own">
<rect width="${tagW}" height="${tagH}" fill="#000"/>
<g transform="translate(120 80)">${markGroup}${wordGroup}</g>
<text x="${tagW / 2}" y="${H + 230}" fill="#fff" font-family="DM Sans, Inter, Helvetica, Arial, sans-serif" font-size="64" text-anchor="middle">For small businesses building something of their own</text>
<text x="${tagW / 2}" y="${H + 330}" fill="#fff" font-family="DM Sans, Inter, Helvetica, Arial, sans-serif" font-size="44" font-weight="700" text-anchor="middle">Your business. Your style.</text>
</svg>`;
writeFileSync(out('public/brand/lankan-logo-tagline.svg'), taglineLockup);

/* ---------- Raster icons ---------- */
await sharp(Buffer.from(mark)).resize(180, 180).png().toFile(out('public/apple-touch-icon.png'));
await sharp(Buffer.from(mark)).resize(512, 512).png().toFile(out('public/icon-512.png'));
await sharp(Buffer.from(fullLogoOnBlack)).resize(2400).png({ compressionLevel: 9 }).toFile(out('public/brand/lankan-logo.png'));

/* ---------- Background: vertical bands echoing the artwork ---------- */
const bands = (w, h, cols) =>
  cols.map(([x, cw]) => `<rect x="${x * w}" y="0" width="${cw * w}" height="${h}" fill="#0A0A0A"/>`).join('');
const artworkCols = [[0.075, 0.23], [0.385, 0.23], [0.695, 0.23]];

/* ---------- Open Graph card 1200x630 ---------- */
const ogLogoW = 640;
const ogScale = ogLogoW / W;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#000"/>${bands(1200, 630, artworkCols)}
<g transform="translate(${(1200 - ogLogoW) / 2} 90) scale(${ogScale})">${markGroup}${wordGroup}</g>
<text x="600" y="480" fill="#fff" font-family="DM Sans, Inter, Helvetica, Arial, sans-serif" font-size="40" text-anchor="middle">For small businesses building something of their own</text>
<text x="600" y="545" fill="#A3A3A3" font-family="DM Sans, Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" text-anchor="middle">Your business. Your style.</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(out('public/og-image.png'));

console.log('✓ Brand assets generated');
