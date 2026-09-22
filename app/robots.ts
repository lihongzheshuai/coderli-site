import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/norobots/', '/api/'],
      },
      {
        userAgent: [
          'Bytespider',
          'PetalBot',
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
          'Amazonbot',
          'ClaudeBot',
          'anthropic-ai',
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'cohere-ai',
          'FacebookBot',
          'meta-externalagent',
          'Scrapy',
          'DataForSeoBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.coderli.com/sitemap.xml',
  };
}
