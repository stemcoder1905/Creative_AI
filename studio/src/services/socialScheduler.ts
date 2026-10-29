// src/services/socialScheduler.ts
// Processes scheduled social posts.
// Called by the Supabase Edge Function cron every 2 minutes.

import { supabase } from '@/lib/supabase';
import { decryptToken } from '@/lib/tokenCrypto';
import { publishToFacebookPage, publishToInstagram } from './metaPublisher';
import { publishToLinkedIn } from './linkedinPublisher';

const MAX_RETRIES = 3;

export async function processScheduledPosts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  // Fetch posts that are due (scheduled_at <= now and status=scheduled)
  // or posts stuck in 'publishing' for > 5 minutes (crash recovery)
  const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select(`
      id, profile_id, image_url, caption, hashtags,
      retry_count, max_retries, idempotency_key,
      social_post_targets (
        id, social_account_id, status,
        social_accounts ( id, platform, platform_account_id, access_token_enc, account_type )
      )
    `)
    .or(`and(status.eq.scheduled,scheduled_at.lte.${now}),and(status.eq.publishing,updated_at.lte.${stuckCutoff})`)
    .order('scheduled_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[Scheduler] DB query error:', error.message);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  if (!posts || posts.length === 0) return { processed: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;

  for (const post of posts) {
    // Mark as 'publishing' to prevent duplicate processing (optimistic lock on scheduled/publishing status)
    const { error: lockErr } = await supabase
      .from('social_posts')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', post.id)
      .in('status', ['scheduled', 'publishing']);

    if (lockErr) continue;

    const targets: any[] = (post as any).social_post_targets ?? [];
    let allSucceeded = true;

    for (const target of targets) {
      if (target.status === 'published') continue; // idempotent — already done

      const account = target.social_accounts;
      if (!account) continue;

      const attemptStart = Date.now();
      try {
        const accessToken = decryptToken(account.access_token_enc);
        const fullCaption = [post.caption, post.hashtags].filter(Boolean).join('\n\n');

        let result: { platformPostId: string; permalink?: string };

        if (account.platform === 'facebook') {
          result = await publishToFacebookPage(
            account.platform_account_id, accessToken, post.image_url, fullCaption
          );
        } else if (account.platform === 'instagram') {
          result = await publishToInstagram(
            account.platform_account_id, accessToken, post.image_url, fullCaption
          );
        } else if (account.platform === 'linkedin') {
          const urnPrefix = account.account_type === 'organization'
            ? 'urn:li:organization:'
            : 'urn:li:person:';
          result = await publishToLinkedIn(
            accessToken,
            `${urnPrefix}${account.platform_account_id}`,
            post.image_url,
            fullCaption
          );
        } else {
          throw new Error(`Unknown platform: ${account.platform}`);
        }

        // Mark target as published
        await supabase.from('social_post_targets').update({
          status: 'published',
          platform_post_id: result.platformPostId,
          platform_permalink: result.permalink ?? null,
          published_at: new Date().toISOString(),
        }).eq('id', target.id);

        // Log success
        await supabase.from('publishing_logs').insert({
          social_post_id: post.id,
          social_account_id: account.id,
          attempt_number: (post.retry_count ?? 0) + 1,
          status: 'success',
          platform_response: { platformPostId: result.platformPostId },
          duration_ms: Date.now() - attemptStart,
        });
        succeeded++;
      } catch (err: any) {
        allSucceeded = false;
        const errMsg = err?.message ?? String(err);
        console.error(`[Scheduler] Publish failed for target ${target.id}:`, errMsg);

        // Update target
        await supabase.from('social_post_targets').update({
          status: 'failed',
          error_message: errMsg,
        }).eq('id', target.id);

        // Log failure (never log the raw token)
        await supabase.from('publishing_logs').insert({
          social_post_id: post.id,
          social_account_id: account.id,
          attempt_number: (post.retry_count ?? 0) + 1,
          status: 'failure',
          error_message: errMsg,
          duration_ms: Date.now() - attemptStart,
        });
        failed++;
      }
    }

    // Update post status
    const newRetryCount = (post.retry_count ?? 0) + 1;
    const postMaxRetries = post.max_retries ?? MAX_RETRIES;
    if (allSucceeded) {
      await supabase.from('social_posts').update({
        status: 'published',
        updated_at: new Date().toISOString(),
      }).eq('id', post.id);
    } else if (newRetryCount >= postMaxRetries) {
      await supabase.from('social_posts').update({
        status: 'failed',
        retry_count: newRetryCount,
        error_details: 'Max retries reached',
        updated_at: new Date().toISOString(),
      }).eq('id', post.id);
    } else {
      // Exponential backoff: 2^retry * 2 minutes
      const backoffMs = Math.pow(2, newRetryCount) * 2 * 60 * 1000;
      const nextRetry = new Date(Date.now() + backoffMs).toISOString();
      await supabase.from('social_posts').update({
        status: 'scheduled',
        retry_count: newRetryCount,
        next_retry_at: nextRetry,
        scheduled_at: nextRetry,
        updated_at: new Date().toISOString(),
      }).eq('id', post.id);
    }
  }

  return { processed: posts.length, succeeded, failed };
}
