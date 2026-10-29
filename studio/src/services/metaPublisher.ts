// src/services/metaPublisher.ts
// Facebook Page posts + Instagram Professional account publishing
// via Meta Graph API v19.0
// Docs: https://developers.facebook.com/docs/graph-api/reference/page/photos/
//       https://developers.facebook.com/docs/instagram-api/guides/content-publishing

const META_API_VERSION = 'v19.0';
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaPublishResult {
  platformPostId: string;
  permalink?: string;
}

// ──────────────────────────────────────────────────────────────
// Facebook Page: publish an image with caption
// ──────────────────────────────────────────────────────────────
export async function publishToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
): Promise<MetaPublishResult> {
  // POST /{page-id}/photos — uploads + publishes image in one call
  const url = `${META_BASE}/${pageId}/photos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      caption,
      published: true,
      access_token: pageAccessToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Facebook API error: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }
  // data.post_id is the timeline post ID; data.id is the photo node ID
  const postId: string = data.post_id ?? data.id;
  return {
    platformPostId: postId,
    permalink: `https://www.facebook.com/${postId}`,
  };
}

// ──────────────────────────────────────────────────────────────
// Instagram Professional: two-step container → publish
// ──────────────────────────────────────────────────────────────
export async function publishToInstagram(
  igAccountId: string,
  userAccessToken: string,
  imageUrl: string,
  caption: string
): Promise<MetaPublishResult> {
  // Step 1: Create media container
  const containerRes = await fetch(`${META_BASE}/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: userAccessToken,
    }),
  });
  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(
      `Instagram container error: ${containerData.error?.message ?? JSON.stringify(containerData)}`
    );
  }
  const containerId: string = containerData.id;

  // Step 2: Poll container status (usually instant but good practice)
  await waitForInstagramContainer(containerId, userAccessToken);

  // Step 3: Publish the container
  const pubRes = await fetch(`${META_BASE}/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: userAccessToken,
    }),
  });
  const pubData = await pubRes.json();
  if (!pubRes.ok || pubData.error) {
    throw new Error(
      `Instagram publish error: ${pubData.error?.message ?? JSON.stringify(pubData)}`
    );
  }
  return {
    platformPostId: pubData.id,
    permalink: `https://www.instagram.com/p/${pubData.id}/`,
  };
}

async function waitForInstagramContainer(
  containerId: string,
  accessToken: string,
  maxWaitMs = 30_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `${META_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Instagram container failed: ${JSON.stringify(data)}`);
    }
    await sleep(2000);
  }
  throw new Error('Instagram container timed out waiting for FINISHED status');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ──────────────────────────────────────────────────────────────
// OAuth helpers: exchange code for token, exchange for long-lived token
// ──────────────────────────────────────────────────────────────
export async function exchangeMetaCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? '',
    client_secret: process.env.META_APP_SECRET ?? '',
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${META_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Meta token exchange error: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data as { access_token: string; token_type: string; expires_in?: number };
}

export async function getLongLivedUserToken(shortToken: string) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID ?? '',
    client_secret: process.env.META_APP_SECRET ?? '',
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${META_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Meta long-lived token error: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data as { access_token: string; token_type: string; expires_in?: number };
}

/** Fetch all pages the user manages with their page tokens */
export async function getUserPages(userAccessToken: string) {
  const res = await fetch(
    `${META_BASE}/me/accounts?fields=id,name,access_token,category&access_token=${userAccessToken}`
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Meta pages error: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data.data as Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
  }>;
}

/** Get Instagram Professional account linked to a Facebook Page */
export async function getInstagramAccount(pageId: string, pageAccessToken: string) {
  const res = await fetch(
    `${META_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Instagram account lookup error: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data.instagram_business_account as { id: string } | undefined;
}
