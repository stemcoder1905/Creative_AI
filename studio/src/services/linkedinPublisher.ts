// src/services/linkedinPublisher.ts
// LinkedIn UGC Post API for personal profiles and organization pages.
// Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

const LI_BASE = 'https://api.linkedin.com/v2';

export interface LinkedInPublishResult {
  platformPostId: string;
  permalink?: string;
}

// ──────────────────────────────────────────────────────────────
// Publish image + caption to LinkedIn (person or organization)
// ──────────────────────────────────────────────────────────────
export async function publishToLinkedIn(
  accessToken: string,
  authorUrn: string,       // e.g. "urn:li:person:abc123" or "urn:li:organization:123"
  imageUrl: string,
  caption: string
): Promise<LinkedInPublishResult> {
  // Step 1: Register image upload
  const { asset, uploadUrl } = await registerLinkedInImage(accessToken, authorUrn);

  // Step 2: Fetch the image from our URL and upload to LinkedIn
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image for LinkedIn: ${imageRes.status}`);
  const imageBuffer = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });
  if (!uploadRes.ok) {
    throw new Error(`LinkedIn image upload failed: ${uploadRes.status}`);
  }

  // Step 3: Create the UGC post
  const postBody = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: caption },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            description: { text: caption.slice(0, 200) },
            media: asset,
            title: { text: 'CreativeAI Studio Design' },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const postRes = await fetch(`${LI_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });
  const postData = await postRes.json();
  if (!postRes.ok) {
    throw new Error(
      `LinkedIn post creation failed: ${postData.message ?? JSON.stringify(postData)}`
    );
  }

  const postId = postRes.headers.get('x-restli-id') ?? postData.id ?? '';
  return {
    platformPostId: postId,
    permalink: `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/`,
  };
}

async function registerLinkedInImage(accessToken: string, ownerUrn: string) {
  const body = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: ownerUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };
  const res = await fetch(`${LI_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`LinkedIn registerUpload failed: ${data.message ?? JSON.stringify(data)}`);
  }
  const uploadUrl: string =
    data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
      .uploadUrl;
  const asset: string = data.value.asset;
  return { asset, uploadUrl };
}

// ──────────────────────────────────────────────────────────────
// OAuth: exchange authorization code for tokens
// ──────────────────────────────────────────────────────────────
export async function exchangeLinkedInCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
    client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
  });
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`LinkedIn token exchange error: ${data.error_description ?? JSON.stringify(data)}`);
  }
  return data as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  };
}

/** Get LinkedIn member profile (id, localizedFirstName, localizedLastName) */
export async function getLinkedInProfile(accessToken: string) {
  const res = await fetch(`${LI_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LinkedIn /me error: ${JSON.stringify(data)}`);
  return data as { id: string; localizedFirstName: string; localizedLastName: string };
}

/** Get organizations the member administers */
export async function getLinkedInOrganizations(accessToken: string) {
  const res = await fetch(
    `${LI_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`LinkedIn orgs error: ${JSON.stringify(data)}`);
  return (data.elements ?? []) as Array<{
    organization: { id: string; localizedName: string };
  }>;
}
