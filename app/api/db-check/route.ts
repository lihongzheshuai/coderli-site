import { NextResponse } from 'next/server';
import { checkDbStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await checkDbStatus();
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
  });
}
