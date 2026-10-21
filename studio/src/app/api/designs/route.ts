// src/app/api/designs/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function getSessionUser(request: Request): { email: string; userId: string } | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) return null;
  try {
    const raw = Buffer.from(decodeURIComponent(match[1]), 'base64').toString('utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.email)
    .single();

  if (!profile) {
    return NextResponse.json({ designs: [] });
  }

  const { data: designs, error } = await supabase
    .from('designs')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ designs: designs || [] });
}
