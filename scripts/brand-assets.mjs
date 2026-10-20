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
 *   src/assets/work/*.png                 abstract case-study covers
 *                                         (Astro converts these to AVIF/WebP)
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
mkdirSync(out('src/assets/work'), { recursive: true });

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

/* ---------- Case-study covers (abstract, monochrome placeholders) ----------
 * Swap these for real project photography — keep files in src/assets/work
 * and Astro's <Picture> will output AVIF + WebP automatically.          */
const CW = 1600, CH = 1200;
const grain = `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter><rect width="${CW}" height="${CH}" filter="url(#n)"/>`;
const covers = {
  // Bakery — soft concentric rings, like a loaf scored from above
  'kiri-bakehouse': `<rect width="${CW}" height="${CH}" fill="#0E0E0E"/>
    ${[520, 420, 320, 220, 120].map((r, i) => `<circle cx="1050" cy="640" r="${r}" fill="none" stroke="#fff" stroke-opacity="${0.08 + i * 0.12}" stroke-width="${3 + i}"/>`).join('')}
    <rect x="160" y="200" width="380" height="380" fill="#F5F5F5"/>
    <circle cx="350" cy="390" r="110" fill="none" stroke="#000" stroke-width="22"/>`,
  // Surf — stacked horizontal swells
  'saltwater-surf': `<rect width="${CW}" height="${CH}" fill="#0A0A0A"/>
    ${Array.from({ length: 9 }, (_, i) => {
      const y = 260 + i * 95;
      return `<path d="M0 ${y} C 400 ${y - 70}, 800 ${y + 70}, 1600 ${y - 20}" fill="none" stroke="#fff" stroke-opacity="${0.12 + i * 0.09}" stroke-width="${2 + i * 0.6}"/>`;
    }).join('')}
    <circle cx="1220" cy="250" r="90" fill="#60A5FA" fill-opacity=".9"/>`,
  // Textiles — woven grid
  'ceylon-thread': `<rect width="${CW}" height="${CH}" fill="#111"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${120 + i * 86}" y="140" width="34" height="920" fill="#fff" fill-opacity="${i % 3 === 0 ? 0.85 : 0.12}"/>`).join('')}
    ${Array.from({ length: 10 }, (_, i) => `<rect x="120" y="${160 + i * 90}" width="1360" height="22" fill="#000" fill-opacity=".75"/>`).join('')}`,
  // Café — a single bold arc and a dot
  'lumen-coffee': `<rect width="${CW}" height="${CH}" fill="#0C0C0C"/>
    <path d="M300 950 A 500 500 0 0 1 1300 950" fill="none" stroke="#F5F5F5" stroke-width="70"/>
    <circle cx="800" cy="520" r="54" fill="#F5F5F5"/>
    <rect x="0" y="950" width="${CW}" height="250" fill="#000"/>`,
};
for (const [name, body] of Object.entries(covers)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">${body}${grain}</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out(`src/assets/work/${name}.png`));
}

console.log('✓ Brand assets generated');
