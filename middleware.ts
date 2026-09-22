import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known aggressive scrapers / non-search AI crawlers that often ignore robots.txt
const BLOCKED_BOT_PATTERNS = [
  'bytespider',
  'petalbot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'amazonbot',
  'claudebot',
  'anthropic-ai',
  'gptbot',
  'chatgpt-user',
  'ccbot',
  'cohere-ai',
  'facebookbot',
  'meta-externalagent',
  'scrapy',
  'dataforseobot',
];

export function middleware(request: NextRequest) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // Fast check: if User-Agent contains any blocked crawler pattern, reject immediately with 403
  if (BLOCKED_BOT_PATTERNS.some(bot => userAgent.includes(bot))) {
    return new NextResponse('Access Denied: Automated bot scraping is not permitted.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Match dynamic routes and APIs, excluding static assets and images
  matcher: [
    '/((?!_next/static|_next/image|images/|favicon\\.svg|icon\\.svg|ads\\.txt|search-index\\.json).*)',
  ],
};
