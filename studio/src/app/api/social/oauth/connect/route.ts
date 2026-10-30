// src/app/api/social/oauth/connect/route.ts
// GET ?platform=facebook|instagram|linkedin
// Redirects the user to the platform's OAuth authorization URL.
// Uses CSRF state stored in a signed cookie.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/sessionHelper';

const REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3001';
const CALLBACK_URL = `${REDIRECT_BASE}/api/social/oauth/callback`;

export async function GET(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');

  if (!['facebook', 'instagram', 'linkedin'].includes(platform ?? '')) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  // CSRF state = random nonce + email hash (validated in callback)
  const nonce = crypto.randomBytes(16).toString('hex');
  const statePayload = JSON.stringify({ nonce, email: session.email, platform });
  const state = Buffer.from(statePayload).toString('base64url');

  let authUrl: string;

  if (platform === 'facebook') {
    const metaAppId = process.env.META_APP_ID;
    if (!metaAppId) {
      return NextResponse.json(
        { error: 'META_APP_ID not configured. See .env.example.' },
        { status: 503 }
      );
    }
    // Pure Facebook Page publishing permissions
    const scopes = ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'].join(',');
    authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`;
  } else if (platform === 'instagram') {
    const metaAppId = process.env.META_APP_ID;
    if (!metaAppId) {
      return NextResponse.json(
        { error: 'META_APP_ID not configured. See .env.example.' },
        { status: 503 }
      );
    }
    // Instagram Professional publishing permissions
    const scopes = ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'].join(',');
    authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`;
  } else {
    // LinkedIn
    const liClientId = process.env.LINKEDIN_CLIENT_ID;
    if (!liClientId) {
      return NextResponse.json(
        { error: 'LINKEDIN_CLIENT_ID not configured. See .env.example.' },
        { status: 503 }
      );
    }
    const scopes = ['r_liteprofile', 'w_member_social', 'r_organization_admin', 'w_organization_social'].join(' ');
    authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${liClientId}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  }

  // Store state in a short-lived HttpOnly cookie for validation in callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  return response;
}
