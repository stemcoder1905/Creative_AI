// src/app/api/designs/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';

export const dynamic = 'force-dynamic';

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
    .select('id, title, image_path, prompt, status, created_at')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { designs: designs || [] },
    {
      headers: {
        'Cache-Control': 'private, no-cache, must-revalidate',
      },
    }
  );
}
