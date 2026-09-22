import { MetadataRoute } from 'next';
import { getAllPosts, getAllTags, getCategoryTree } from '@/lib/posts';

export const revalidate = false; // Permanent edge cache, revalidated on-demand via /api/revalidate

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.coderli.com';

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/topics/gesp/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/java/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/csp/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/algo/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics/python-data/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 2. All Articles (937+ posts)
  const posts = getAllPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map(post => {
    let lastMod = new Date();
    if (post.date) {
      const parsed = new Date(post.date);
      if (!isNaN(parsed.getTime())) {
        lastMod = parsed;
      }
    }
    return {
      url: `${baseUrl}/${post.slug}/`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: post.pinned ? 0.9 : 0.7,
    };
  });

  // 3. Category Routes
  const categoryTree = getCategoryTree();
  const categoryRoutes: MetadataRoute.Sitemap = [];
  for (const parent of categoryTree) {
    categoryRoutes.push({
      url: `${baseUrl}/categories/${encodeURIComponent(parent.name)}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
    for (const child of parent.children) {
      categoryRoutes.push({
        url: `${baseUrl}/categories/${encodeURIComponent(parent.name)}/${encodeURIComponent(child.name)}/`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // 4. Tag Routes
  const tags = getAllTags();
  const tagRoutes: MetadataRoute.Sitemap = tags.map(item => ({
    url: `${baseUrl}/tags/${encodeURIComponent(item.tag)}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
