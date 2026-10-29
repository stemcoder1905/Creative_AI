// src/app/api/social/posts/route.ts
// GET  — list social posts for the session user
// POST — create a new social post (publish now or schedule)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';
import { processScheduledPosts } from '@/services/socialScheduler';

const createPostSchema = z.object({
  designId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
  caption: z.string().max(2200).optional().default(''),
  hashtags: z.string().max(500).optional().default(''),
  accountIds: z.array(z.string().uuid()).min(1, 'Select at least one account'),
  publishNow: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),   // ISO 8601
  timezone: z.string().default('UTC'),
});

export async function GET(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: posts, error } = await supabase
    .from('social_posts')
    .select(`
      id, design_id, caption, hashtags, image_url, status,
      scheduled_at, timezone, retry_count, error_details, created_at, updated_at,
      social_post_targets (
        id, status, platform_post_id, platform_permalink, published_at, error_message,
        social_accounts ( id, platform, account_name, account_type )
      )
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: posts ?? [] });
}

export async function POST(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parse = createPostSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.format() }, { status: 422 });
  }
  const data = parse.data;

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Validate that all accountIds belong to this profile (ownership check)
  const { data: accounts, error: accErr } = await supabase
    .from('social_accounts')
    .select('id, is_active')
    .in('id', data.accountIds)
    .eq('profile_id', profile.id)
    .eq('is_active', true);

  if (accErr || !accounts || accounts.length !== data.accountIds.length) {
    return NextResponse.json(
      { error: 'One or more account IDs are invalid or do not belong to you.' },
      { status: 403 }
    );
  }

  // All posts start as 'scheduled' (publishNow posts are scheduled for immediate execution)
  const status = 'scheduled';
  const scheduledAt = data.publishNow
    ? new Date().toISOString()
    : (data.scheduledAt ?? new Date().toISOString());

  // Create the post record
  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .insert({
      profile_id: profile.id,
      design_id: data.designId ?? null,
      caption: data.caption,
      hashtags: data.hashtags,
      image_url: data.imageUrl,
      status,
      scheduled_at: scheduledAt,
      timezone: data.timezone,
      publish_now: data.publishNow,
    })
    .select()
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: postErr?.message ?? 'Failed to create post' }, { status: 500 });
  }

  // Create targets (one per selected account)
  const targets = data.accountIds.map((accountId) => ({
    social_post_id: post.id,
    social_account_id: accountId,
    status: 'pending',
  }));
  await supabase.from('social_post_targets').insert(targets);

  // If publishNow, trigger scheduler immediately in the same request
  if (data.publishNow) {
    // Run async — don't await to avoid long response time
    processScheduledPosts().catch((e) =>
      console.error('[publish-now scheduler error]', e?.message)
    );
  }

  return NextResponse.json({ success: true, postId: post.id, status });
}
