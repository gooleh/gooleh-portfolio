import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNotionProjects } from './lib/notion-projects';
import { getNotionBlogPosts } from './lib/notion-blog';

export type { NotionProject } from './lib/notion-projects';
export type { NotionBlogPost } from './lib/notion-blog';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getFeaturedProjects = getNotionProjects;
export const getProjects = getNotionProjects;
export const getBlogPosts = getNotionBlogPosts;
