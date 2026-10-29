// src/types/index.ts
/**
 * Shared TypeScript types for the CreativeAI Studio backend.
 */
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name?: string | null;
  phone?: string | null;
  business_name?: string | null;
  profession?: string | null;
  business_description?: string | null;
  target_audience?: string | null;
  preferred_language?: string | null;
  country?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
  brandColors?: string[] | string | null;
  brand_colors?: string[] | string | null;
  // Extend with more branding fields as needed
}

export interface DesignBrief {
  profession?: string;
  businessName?: string;
  topic: string;
  designType: string;
  platform: string;
  style: string;
  language?: string;
  colorPalette?: string;
  logoUrl?: string;
  headline?: string;
  cta?: string;
  contactInfo?: string;
}

// ─── Social Publishing Types ───────────────────────────────
export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin';

export interface SocialAccount {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  platform_account_id: string;
  account_name: string;
  account_type: 'page' | 'profile' | 'organization';
  is_active: boolean;
  token_expires_at: string | null;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export type SocialPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';

export interface SocialPost {
  id: string;
  profile_id: string;
  design_id: string | null;
  caption: string;
  hashtags: string;
  image_url: string;
  status: SocialPostStatus;
  scheduled_at: string | null;
  timezone: string;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  error_details: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPostTarget {
  id: string;
  social_post_id: string;
  social_account_id: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'skipped';
  platform_post_id: string | null;
  platform_permalink: string | null;
  published_at: string | null;
  error_message: string | null;
}

export interface PublishingLog {
  id: string;
  social_post_id: string;
  social_account_id: string | null;
  attempt_number: number;
  status: 'success' | 'failure' | 'skipped';
  platform_response: Record<string, any> | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}
