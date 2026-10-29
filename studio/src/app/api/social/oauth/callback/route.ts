// src/app/api/social/oauth/callback/route.ts
// Receives OAuth callback from Meta or LinkedIn.
// Validates CSRF state, exchanges code for token, encrypts and stores in social_accounts.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptToken } from '@/lib/tokenCrypto';
import {
  exchangeMetaCode,
  getLongLivedUserToken,
  getUserPages,
  getInstagramAccount,
} from '@/services/metaPublisher';
import { exchangeLinkedInCode, getLinkedInProfile, getLinkedInOrganizations } from '@/services/linkedinPublisher';

const REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3001';
const CALLBACK_URL = `${REDIRECT_BASE}/api/social/oauth/callback`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  // OAuth error from platform
  if (errorParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=${encodeURIComponent(errorParam)}`);
  }
  if (!code || !stateParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=missing_params`);
  }

  // Validate CSRF state cookie
  const cookieHeader = request.headers.get('cookie') ?? '';
  const storedState = cookieHeader.match(/oauth_state=([^;]+)/)?.[1];
  if (!storedState || decodeURIComponent(storedState) !== stateParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=csrf_mismatch`);
  }

  let stateData: { nonce: string; email: string; platform: string };
  try {
    stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
  } catch {
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=invalid_state`);
  }

  const { email, platform } = stateData;
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', email).single();
  if (!profile) {
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=profile_not_found`);
  }

  try {
    if (platform === 'facebook' || platform === 'instagram') {
      await handleMetaCallback(code, profile.id, platform);
    } else if (platform === 'linkedin') {
      await handleLinkedInCallback(code, profile.id);
    }
  } catch (err: any) {
    console.error('[OAuth callback error]', err?.message);
    const errMsg = encodeURIComponent(err?.message ?? 'connection_failed');
    return NextResponse.redirect(`${REDIRECT_BASE}/social?error=${errMsg}`);
  }

  // Clear state cookie and redirect to social page
  const response = NextResponse.redirect(`${REDIRECT_BASE}/social?connected=1`);
  response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
  return response;
}

async function handleMetaCallback(code: string, profileId: string, platform: string) {
  // Exchange code for short-lived token
  const shortToken = await exchangeMetaCode(code, CALLBACK_URL);
  // Exchange for long-lived token (60 days)
  const longToken = await getLongLivedUserToken(shortToken.access_token);
  const expiresAt = longToken.expires_in
    ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
    : null;

  // Get all pages the user manages
  const pages = await getUserPages(longToken.access_token);

  for (const page of pages) {
    // Store Facebook page account
    await upsertSocialAccount({
      profileId,
      platform: 'facebook',
      platformAccountId: page.id,
      accountName: page.name,
      accountType: 'page',
      accessToken: page.access_token, // page-level token (never expires)
      expiresAt: null,
      meta: { category: page.category },
    });

    // Check if page has linked Instagram Professional account
    try {
      const igAccount = await getInstagramAccount(page.id, page.access_token);
      if (igAccount?.id) {
        await upsertSocialAccount({
          profileId,
          platform: 'instagram',
          platformAccountId: igAccount.id,
          accountName: `${page.name} (Instagram)`,
          accountType: 'page',
          accessToken: page.access_token,
          expiresAt: null,
          meta: { linkedFacebookPageId: page.id },
        });
      }
    } catch {
      // Instagram not linked — skip silently
    }
  }
}

async function handleLinkedInCallback(code: string, profileId: string) {
  const tokens = await exchangeLinkedInCode(code, CALLBACK_URL);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Get personal profile
  const liProfile = await getLinkedInProfile(tokens.access_token);
  const displayName = `${liProfile.localizedFirstName} ${liProfile.localizedLastName}`;

  await upsertSocialAccount({
    profileId,
    platform: 'linkedin',
    platformAccountId: liProfile.id,
    accountName: displayName,
    accountType: 'profile',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    meta: {},
  });

  // Also store any organizations they admin
  try {
    const orgs = await getLinkedInOrganizations(tokens.access_token);
    for (const org of orgs) {
      await upsertSocialAccount({
        profileId,
        platform: 'linkedin',
        platformAccountId: String(org.organization.id),
        accountName: org.organization.localizedName,
        accountType: 'organization',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        meta: {},
      });
    }
  } catch {
    // No orgs — fine
  }
}

async function upsertSocialAccount(params: {
  profileId: string;
  platform: string;
  platformAccountId: string;
  accountName: string;
  accountType: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string | null;
  meta: Record<string, any>;
}) {
  await supabase.from('social_accounts').upsert({
    profile_id: params.profileId,
    platform: params.platform,
    platform_account_id: params.platformAccountId,
    account_name: params.accountName,
    account_type: params.accountType,
    access_token_enc: encryptToken(params.accessToken),
    refresh_token_enc: params.refreshToken ? encryptToken(params.refreshToken) : null,
    token_expires_at: params.expiresAt,
    is_active: true,
    meta: params.meta,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id,platform,platform_account_id' });
}
