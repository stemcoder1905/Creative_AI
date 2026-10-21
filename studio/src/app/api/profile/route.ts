// src/app/api/profile/route.ts
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', session.email)
    .single();

  const { data: credit } = await supabase
    .from('credits')
    .select('*')
    .eq('email', session.email)
    .single();

  return NextResponse.json({
    profile: profile || { email: session.email },
    credits: credit || { total_credits: 25, used_credits: 0 },
  });
}

export async function POST(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    full_name,
    business_name,
    profession,
    business_description,
    target_audience,
    brand_colors,
    brand_slogan,
    website,
    primary_use_case,
  } = body;

  const { data: updated, error } = await supabase
    .from('profiles')
    .upsert({
      email: session.email,
      full_name,
      business_name,
      profession,
      business_description,
      target_audience,
      brand_colors: typeof brand_colors === 'string' ? brand_colors.split(',').map((s: string) => s.trim()) : brand_colors,
      brand_slogan,
      website,
      primary_use_case,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: updated });
}
