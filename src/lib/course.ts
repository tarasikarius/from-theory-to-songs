import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Lesson = CollectionEntry<'lessons'> & { slug: string };

/** Lessons of one language in course order (file names are prefixed MM-NN-). */
export async function getLessons(lang: Lang): Promise<Lesson[]> {
  const all = await getCollection('lessons', e => e.id.startsWith(lang + '/'));
  return all
    .map(e => ({ ...e, slug: e.id.slice(lang.length + 1) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function byModule(lessons: Lesson[]): { module: number; lessons: Lesson[] }[] {
  const groups: { module: number; lessons: Lesson[] }[] = [];
  for (const l of lessons) {
    const last = groups[groups.length - 1];
    if (last && last.module === l.data.module) last.lessons.push(l);
    else groups.push({ module: l.data.module, lessons: [l] });
  }
  return groups;
}
