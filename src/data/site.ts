/**
 * All site copy lives here so it can be edited without touching layout code.
 * Case studies and testimonials are PLACEHOLDERS — replace with real clients.
 * Their sections are not rendered until then (see src/pages/index.astro).
 */
import type { ImageMetadata } from 'astro';
import kiri from '@/assets/work/kiri-bakehouse.png';
import surf from '@/assets/work/saltwater-surf.png';
import thread from '@/assets/work/ceylon-thread.png';
import lumen from '@/assets/work/lumen-coffee.png';

export const site = {
  name: 'Lankan Brands & Co.',
  tagline: 'For small businesses building something of their own',
  secondary: 'Your business. Your style.',
  description:
    'Lankan Brands & Co. is a boutique branding and digital marketing studio for small businesses and founders who want authentic, stylish growth — not corporate noise.',
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || 'hello@lankanbrands.com',
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
  // Profile URLs. Links with an empty href are not shown; the footer's
  // "Follow" column disappears entirely while all are empty.
  social: [
    { label: 'Instagram', href: '' },
    { label: 'LinkedIn', href: '' },
    { label: 'Facebook', href: '' },
    { label: 'Behance', href: '' },
  ],
} as const;

export const nav = [
  { label: 'Philosophy', href: '#philosophy' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
] as const;

export const values = [
  {
    title: 'Yours, not ours',
    body: 'We don’t stamp a house style on your business. Everything we make starts with who you are and who you serve.',
  },
  {
    title: 'Small on purpose',
    body: 'A tight team means you work with the people doing the work. No account managers, no hand-offs, no noise.',
  },
  {
    title: 'Craft that converts',
    body: 'Good taste and good numbers aren’t opposites. We design for both, and we show you the results.',
  },
  {
    title: 'Built to last',
    body: 'You leave with systems, guidelines and know-how you own — so the brand keeps growing long after launch.',
  },
] as const;

export const services = [
  {
    title: 'Branding & Identity',
    summary: 'Names, logos and visual systems with a point of view.',
    detail: 'Strategy workshop, naming, logo suite, colour & type, packaging and a practical brand guide.',
  },
  {
    title: 'Digital Marketing Strategy',
    summary: 'A clear plan for where to show up and why.',
    detail: 'Audience research, positioning, channel mix, 90-day roadmap and the metrics that matter.',
  },
  {
    title: 'Social Media & Content',
    summary: 'Content that sounds like you and earns attention.',
    detail: 'Content pillars, monthly calendars, photo & reel direction, templates and community playbooks.',
  },
  {
    title: 'SEO & Visibility',
    summary: 'Get found by the people already looking.',
    detail: 'Technical audits, local SEO, Google Business Profile, on-page copy and search-led content.',
  },
  {
    title: 'Paid Advertising',
    summary: 'Small budgets, spent with intent.',
    detail: 'Meta & Google campaigns, creative testing, tracking set-up and honest monthly reporting.',
  },
  {
    title: 'Creative Direction',
    summary: 'One consistent voice across every touchpoint.',
    detail: 'Shoots, launches, websites and campaigns — directed so everything feels unmistakably yours.',
  },
] as const;

export const process = [
  {
    title: 'Listen',
    body: 'A relaxed discovery call and workshop. We learn your story, your customers and what “success” really means for you.',
  },
  {
    title: 'Shape',
    body: 'We turn what we heard into a sharp strategy and a creative direction you can see, feel and react to.',
  },
  {
    title: 'Build',
    body: 'Identity, content, campaigns, web — crafted in focused sprints with you in the loop at every step.',
  },
  {
    title: 'Grow',
    body: 'We launch, measure and refine. You get clear reporting and the tools to keep the momentum going.',
  },
] as const;

export type CaseStudy = {
  client: string;
  sector: string;
  title: string;
  metric: string;
  metricLabel: string;
  body: string;
  image: ImageMetadata;
  alt: string;
};

export const work: CaseStudy[] = [
  {
    client: 'Kiri Bakehouse',
    sector: 'Neighbourhood bakery',
    title: 'From corner shop to weekend queue',
    metric: '+212%',
    metricLabel: 'online pre-orders',
    body: 'A warm new identity, packaging and an Instagram-first launch that turned regulars into evangelists.',
    image: kiri,
    alt: 'Abstract cover: white square with a ring, beside concentric circles on black',
  },
  {
    client: 'Saltwater Surf Co.',
    sector: 'Surf school & rentals',
    title: 'A brand that rides the swell',
    metric: '3.4×',
    metricLabel: 'return on ad spend',
    body: 'Positioning, reel-led content and tightly targeted ads that filled lessons through the off-season.',
    image: surf,
    alt: 'Abstract cover: layered wave lines beneath a soft blue sun',
  },
  {
    client: 'Ceylon Thread',
    sector: 'Handloom textiles',
    title: 'Heritage craft, modern storefront',
    metric: '+180%',
    metricLabel: 'organic search traffic',
    body: 'A refined visual system and search-led content strategy that took a family weaver online and global.',
    image: thread,
    alt: 'Abstract cover: woven grid of vertical and horizontal bars',
  },
  {
    client: 'Lumen Coffee',
    sector: 'Specialty café',
    title: 'Small café, big local presence',
    metric: '#1',
    metricLabel: 'in local map results',
    body: 'Local SEO, a calm new identity and a loyalty campaign that made Lumen the neighbourhood default.',
    image: lumen,
    alt: 'Abstract cover: a bold white arc rising over a dot, like a sunrise',
  },
];

export const testimonials = [
  {
    quote:
      'They didn’t give us a template. They gave us a brand that finally sounds like us — and customers noticed straight away.',
    name: 'Nadeesha P.',
    role: 'Founder, home bakery',
  },
  {
    quote:
      'Honest, fast and genuinely invested. Our ad budget is half what we used to spend and the bookings have never been better.',
    name: 'Ravi K.',
    role: 'Owner, surf school',
  },
  {
    quote:
      'Working with Lankan felt like having a creative co-founder. Every decision came back to what was right for our business.',
    name: 'Amaya S.',
    role: 'Co-founder, textile studio',
  },
] as const;
