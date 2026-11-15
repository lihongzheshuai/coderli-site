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
          'Googlebot',
          'Google-Extended',
          'Bingbot',
          'Baiduspider',
          'Sogou web spider',
          '360Spider',
          'YisouSpider',
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',
          'Claude-User',
          'Claude-SearchBot',
          'anthropic-ai',
          'Bytespider',
          'KimiBot',
          'Kimi-User',
          'PetalBot',
          'Applebot',
          'Applebot-Extended',
          'DuckAssistBot',
          'YouBot',
        ],
        allow: '/',
        disallow: ['/norobots/', '/api/'],
      },
      {
        userAgent: [
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
          'BLEXBot',
          'DataForSeoBot',
          'Scrapy',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.coderli.com/sitemap.xml',
    host: 'https://www.coderli.com',
  };
}
