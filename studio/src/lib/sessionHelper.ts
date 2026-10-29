// src/lib/sessionHelper.ts
// Shared HMAC-verified session parser — keeps auth logic in one place.

import crypto from 'crypto';

export interface SessionUser {
  userId: string;
  email: string;
  created: number;
}

export function getSessionUser(request: Request): SessionUser | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) return null;
  try {
    const tokenRaw = decodeURIComponent(match[1]);
    const dotIdx = tokenRaw.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const payloadB64 = tokenRaw.slice(0, dotIdx);
    const sig = tokenRaw.slice(dotIdx + 1);
    const secret = process.env.SESSION_SECRET || 'change-me-in-production-32chars+';
    const raw = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (sig !== expectedSig) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
