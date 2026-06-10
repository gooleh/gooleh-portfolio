import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNotionProjects } from './lib/notion-projects';
import { getNotionBlogPosts } from './lib/notion-blog';

export type { NotionProject } from './lib/notion-projects';
export type { NotionBlogPost } from './lib/notion-blog';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// 카테고리 문자열 → 고유 hue (블로그 카드/칩 색상용)
export function categoryHue(category: string): number {
	let h = 0;
	for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) % 360;
	return h;
}

export const getFeaturedProjects = getNotionProjects;
export const getProjects = getNotionProjects;
export const getBlogPosts = getNotionBlogPosts;
