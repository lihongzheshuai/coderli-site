import { MetadataRoute } from 'next';
import {
  getAllPosts,
  getAllTags,
  getCategoryTree,
  getPostsByCategory,
  getPostsByTag,
} from '@/lib/posts';
import { getCategoryLink } from '@/lib/categories';

export const revalidate = false; // Permanent edge cache, revalidated on-demand via /api/revalidate

function parseSafeDate(dateStr?: string, fallback: Date = new Date('2026-01-01')): Date {
  if (!dateStr) return fallback;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? fallback : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.coderli.com';
  const posts = getAllPosts();
  const latestSiteDate = posts.length > 0 ? parseSafeDate(posts[0].date) : new Date();

  const latestByTopic = (topic: string): Date => {
    const matched = posts.find(p => p.topic === topic);
    return matched ? parseSafeDate(matched.date, latestSiteDate) : latestSiteDate;
  };

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: latestSiteDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/archives/`,
      lastModified: latestSiteDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/gesp/`,
      lastModified: latestByTopic('gesp'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/csp/`,
      lastModified: latestByTopic('csp'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/algo/`,
      lastModified: latestByTopic('algo'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/java/`,
      lastModified: latestByTopic('java'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/topics/python-data/`,
      lastModified: latestByTopic('python-data'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/categories/`,
      lastModified: latestSiteDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags/`,
      lastModified: latestSiteDate,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  // 2. All Articles
  const postRoutes: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${baseUrl}/${post.slug}/`,
    lastModified: parseSafeDate(post.date, latestSiteDate),
    changeFrequency: 'monthly',
    priority: post.pinned ? 0.9 : 0.75,
  }));

  // 3. Category Routes (canonical getCategoryLink)
  const categoryTree = getCategoryTree();
  const categoryRoutes: MetadataRoute.Sitemap = [];
  for (const parent of categoryTree) {
    const parentPosts = getPostsByCategory(parent.name);
    const parentDate = parentPosts.length > 0 ? parseSafeDate(parentPosts[0].date, latestSiteDate) : latestSiteDate;
    categoryRoutes.push({
      url: `${baseUrl}${getCategoryLink(parent.name)}`,
      lastModified: parentDate,
      changeFrequency: 'weekly',
      priority: 0.65,
    });
    for (const child of parent.children) {
      const childPosts = getPostsByCategory(parent.name, child.name);
      const childDate = childPosts.length > 0 ? parseSafeDate(childPosts[0].date, parentDate) : parentDate;
      categoryRoutes.push({
        url: `${baseUrl}${getCategoryLink(parent.name, child.name)}`,
        lastModified: childDate,
        changeFrequency: 'weekly',
        priority: 0.65,
      });
    }
  }

  // 4. Tag Routes (only include tags with >= 2 articles in sitemap to concentrate crawl budget)
  const tags = getAllTags().filter(item => item.count >= 2);
  const tagRoutes: MetadataRoute.Sitemap = tags.map(item => {
    const tagPosts = getPostsByTag(item.tag);
    const tagDate = tagPosts.length > 0 ? parseSafeDate(tagPosts[0].date, latestSiteDate) : latestSiteDate;
    return {
      url: `${baseUrl}/tags/${encodeURIComponent(item.tag)}/`,
      lastModified: tagDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    };
  });

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
