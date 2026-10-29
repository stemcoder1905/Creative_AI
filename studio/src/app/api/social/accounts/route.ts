// src/app/api/social/accounts/route.ts
// GET  — list connected social accounts for the session user
// DELETE — disconnect a social account (by ?id=)

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';

export async function GET(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('id, platform, platform_account_id, account_name, account_type, is_active, token_expires_at, meta, created_at')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: accounts ?? [] });
}

export async function DELETE(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const accountId = url.searchParams.get('id');
  if (!accountId) return NextResponse.json({ error: 'Missing account id' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('email', session.email).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Soft-delete — ownership check via profile_id
  const { error } = await supabase
    .from('social_accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('profile_id', profile.id); // prevents cross-user access

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
