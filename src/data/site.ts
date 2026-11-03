/**
 * All site copy lives here so it can be edited without touching layout code.
 * Projects for the Work pages live in src/data/projects.ts.
 */
export const site = {
  name: 'Lankan Brands & Co.',
  tagline: 'For small businesses building something of their own',
  secondary: 'Your business. Your style.',
  description:
    'Lankan Brands & Co. is a boutique branding and digital marketing studio for small businesses and founders who want authentic, stylish growth — not corporate noise.',
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || 'lankanbrands.co@gmail.com',
  // One number for calls and WhatsApp. `e164` drives tel: links, `whatsapp` drives wa.me links.
  phone: {
    display: '+94 72 788 6000',
    e164: '+94727886000',
    whatsapp: '94727886000',
  },
  // Shown in the footer and on the Contact page. Add a city when you want it shown, e.g. 'Colombo, Sri Lanka'.
  location: 'Sri Lanka',
  // Web3Forms access key for the contact form. Public by design: it only routes
  // mail to the inbox the key was created for.
  web3formsKey: import.meta.env.PUBLIC_WEB3FORMS_KEY || '52518f06-f2e7-4455-910d-9ab7dc0e46ce',
  // Social profiles, shown with icons in the footer and on the Contact page and
  // listed as `sameAs` in the structured data. Links with an empty href are hidden.
  social: [
    { label: 'Instagram', icon: 'instagram', handle: '@lankanbrands.co', href: 'https://www.instagram.com/lankanbrands.co/' },
    { label: 'Facebook', icon: 'facebook', handle: 'Lankan Brands & Co.', href: 'https://www.facebook.com/share/19jaLr12zz/' },
    { label: 'Threads', icon: 'threads', handle: '@lankanbrands.co', href: 'https://www.threads.com/@lankanbrands.co' },
    { label: 'LinkedIn', icon: 'linkedin', handle: 'Lankan Brands & Co.', href: 'https://www.linkedin.com/company/lankan-brands-co/' },
  ],
} as const;

/** WhatsApp click-to-chat link, optionally with a pre-filled message. */
export const whatsappHref = (text?: string) =>
  `https://wa.me/${site.phone.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Social profiles that have a URL. */
export const socialLinks = site.social.filter((s) => s.href);

export const chatMessage = `Hi ${site.name}, I’d like to talk about a project.`;

/** Top navigation. Paths are relative to the site root; see `href()` in src/data/paths.ts. */
export const nav = [
  { label: 'About', path: 'about/' },
  { label: 'Work', path: 'work/' },
  { label: 'Services', path: 'services/' },
  { label: 'Contact', path: 'contact/' },
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

/** Frequently asked questions — answers only restate what the rest of the site promises. */
export const faqs = [
  {
    q: 'We’re a very small business. Is that okay?',
    a: 'That’s exactly who we’re for. We build brands for the bakery, the studio and the side project that became the main thing — the businesses that are truly someone’s own.',
  },
  {
    q: 'Do we have to sign up for everything?',
    a: 'No. Pick one thing, or let us take care of the lot. Every engagement is shaped around your stage, your budget and your goals.',
  },
  {
    q: 'How much does it cost?',
    a: 'It depends on what you need, so we don’t do one-size packages. Tell us about your project and your budget, and we’ll suggest the plan that gets the most out of it.',
  },
  {
    q: 'Who owns the work at the end?',
    a: 'You do. You leave with the systems, guidelines and know-how to keep the brand growing long after launch.',
  },
  {
    q: 'How quickly will we hear back?',
    a: 'Within one working day, with honest thoughts — even if we’re not the right fit. Prefer to talk first? Message us on WhatsApp.',
  },
] as const;
