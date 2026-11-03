/**
 * Projects for the Work pages.
 *
 * To add a project:
 *   1. Create a folder src/assets/projects/<slug>/ and put its photos in it
 *      (JPG/PNG/WebP, ~2000px wide). Name the main one `cover.jpg`; every other
 *      photo becomes the gallery, in file-name order (01.jpg, 02.jpg, …).
 *   2. Add an entry below with the same slug.
 *
 * Astro turns every photo into responsive AVIF/WebP at build time. The Work
 * page, its filters and the homepage's "Selected work" appear automatically
 * once at least one project is listed.
 */
import type { ImageMetadata } from 'astro';

type ProjectEntry = {
  /** URL name and photo folder: lowercase words joined by hyphens, e.g. 'kiri-bakehouse-rebrand'. */
  slug: string;
  title: string;
  client?: string;
  /** Launch or shoot date, YYYY-MM-DD. Projects are listed newest first. */
  date: string;
  /** One word or two, e.g. 'Branding', 'Social', 'Packaging', 'Campaigns'. Becomes a filter tab. */
  category: string;
  /** One or two sentences for the project page. */
  summary: string;
  /** Describes the cover photo for screen readers. */
  coverAlt: string;
  /** Show on the homepage under "Selected work" (the newest three are used if none are marked). */
  featured?: boolean;
};

const entries: ProjectEntry[] = [
  // {
  //   slug: 'kiri-bakehouse-rebrand',
  //   title: 'Kiri Bakehouse',
  //   client: 'Kiri Bakehouse',
  //   date: '2026-11-01',
  //   category: 'Branding',
  //   summary: 'A warm new identity and packaging for a neighbourhood bakery.',
  //   coverAlt: 'Kiri Bakehouse paper bag with the new logo on a wooden counter',
  //   featured: true,
  // },
];

export type Project = ProjectEntry & { cover: ImageMetadata; gallery: ImageMetadata[]; dateLabel: string };

const photos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/projects/*/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

function build(entry: ProjectEntry): Project {
  const prefix = `/src/assets/projects/${entry.slug}/`;
  const files = Object.keys(photos)
    .filter((path) => path.startsWith(prefix))
    .sort();
  const coverPath = files.find((path) => /\/cover\.[a-z]+$/i.test(path)) ?? files[0];
  if (!coverPath) throw new Error(`Project "${entry.slug}" has no photos. Add them to ${prefix}`);
  const date = new Date(`${entry.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Project "${entry.slug}" has an invalid date "${entry.date}" (use YYYY-MM-DD).`);
  return {
    ...entry,
    cover: photos[coverPath].default,
    gallery: files.filter((path) => path !== coverPath).map((path) => photos[path].default),
    dateLabel: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

export const projects: Project[] = entries.map(build).sort((a, b) => b.date.localeCompare(a.date));

/** Filter tabs for the Work page, in order of first appearance. */
export const categories = [...new Set(projects.map((p) => p.category))];

const marked = projects.filter((p) => p.featured);
export const featured = (marked.length ? marked : projects).slice(0, 3);
