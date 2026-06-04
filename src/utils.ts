import { getCollection } from 'astro:content';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNotionProjects } from './lib/notion-projects';

export type { NotionProject } from './lib/notion-projects';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getFeaturedProjects = getNotionProjects;
export const getProjects = getNotionProjects;

export const getBlogPosts = async () => {
  const posts = (await getCollection("blog"))
    .filter((post: any) => post.data.published)
    .sort(
      (a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );

  return posts;
};
