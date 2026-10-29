// src/app/api/social/posts/[id]/route.ts
// PATCH — cancel a scheduled post
// DELETE — delete a post record

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';

async function getProfileAndVerifyOwnership(request: Request, postId: string) {
  const session = getSessionUser(request);
  if (!session?.email) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return { error: 'Profile not found', status: 404 };

  const { data: post } = await supabase
    .from('social_posts').select('id, status, profile_id').eq('id', postId).single();
  if (!post) return { error: 'Post not found', status: 404 };
  if (post.profile_id !== profile.id) return { error: 'Forbidden', status: 403 };

  return { profile, post };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getProfileAndVerifyOwnership(request, params.id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { post } = result;

  if (!['scheduled', 'draft'].includes(post.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a post with status "${post.status}"` },
      { status: 409 }
    );
  }

  await supabase.from('social_posts').update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getProfileAndVerifyOwnership(request, params.id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await supabase.from('social_posts').delete().eq('id', params.id);
  return NextResponse.json({ success: true });
}
