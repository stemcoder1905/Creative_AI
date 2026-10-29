// src/app/api/social/scheduler/route.ts
// POST — internal endpoint called by Supabase Edge Function cron every 2 minutes.
// Protected by SCHEDULER_SECRET bearer token.

import { NextResponse } from 'next/server';
import { processScheduledPosts } from '@/services/socialScheduler';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const expectedSecret = process.env.SCHEDULER_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await processScheduledPosts();
    console.log('[Scheduler] Run complete:', result);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Scheduler] Fatal error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Scheduler error' }, { status: 500 });
  }
}
