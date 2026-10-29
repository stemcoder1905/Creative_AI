// src/app/api/social/posts/[id]/retry/route.ts
// POST — retry a failed social post

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';
import { processScheduledPosts } from '@/services/socialScheduler';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getSessionUser(request);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: post } = await supabase
    .from('social_posts')
    .select('id, status, profile_id, retry_count, max_retries')
    .eq('id', params.id)
    .single();

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.profile_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (post.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed posts can be retried' }, { status: 409 });
  }

  // Reset failed targets to pending so scheduler picks them up
  await supabase.from('social_post_targets').update({
    status: 'pending',
    error_message: null,
  }).eq('social_post_id', post.id).eq('status', 'failed');

  // Reset post to scheduled (immediate)
  await supabase.from('social_posts').update({
    status: 'scheduled',
    scheduled_at: new Date().toISOString(),
    retry_count: 0,
    error_details: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  // Trigger scheduler immediately
  processScheduledPosts().catch((e) =>
    console.error('[retry scheduler error]', e?.message)
  );

  return NextResponse.json({ success: true });
}
