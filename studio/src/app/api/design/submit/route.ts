// src/app/api/design/submit/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { buildPrompt } from '@/services/promptEngine';
import { generateImage } from '@/services/imageGeneration';
import { DesignBrief } from '@/types';

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

const designSchema = z.object({
  topic: z.string().min(1),
  designType: z.string().min(1),
  platform: z.string().min(1),
  style: z.string().min(1),
  language: z.string().optional(),
  colorPalette: z.string().optional(),
  logoUrl: z.string().url().optional(),
  headline: z.string().optional(),
  cta: z.string().optional(),
  contactInfo: z.string().optional(),
});

export async function POST(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Unauthenticated. Please log in.' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parseResult = designSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.format() }, { status: 422 });
  }
  const brief = parseResult.data as DesignBrief;

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', session.email)
    .single();

  if (!profile) {
    profile = { email: session.email, id: session.userId };
  }

  const COST_PER_GEN = Number(process.env.CREDIT_COST_PER_GENERATION ?? '5');
  let creditRecord = { id: 'temp', total_credits: 25, used_credits: 0 };
  const { data: foundCredits } = await supabase
    .from('credits')
    .select('id, total_credits, used_credits')
    .eq('profile_id', profile.id)
    .single();

  if (foundCredits) {
    creditRecord = foundCredits;
  }

  const remaining = creditRecord.total_credits - creditRecord.used_credits;
  if (remaining < COST_PER_GEN) {
    return NextResponse.json({
      error: `Insufficient credits. You need ${COST_PER_GEN} credits, but have ${remaining} left.`,
    }, { status: 402 });
  }

  const promptText = buildPrompt(brief, profile);
  const dimensionsMap: Record<string, [number, number]> = {
    instagram_square: [1080, 1080],
    instagram_portrait: [1080, 1350],
    instagram_story: [1080, 1920],
    facebook_feed: [1080, 1350],
    facebook_story: [1080, 1920],
    facebook_cover: [1640, 624],
    linkedin_post: [1200, 627],
    youtube_thumbnail: [1280, 720],
    whatsapp_status: [1080, 1920],
    custom: [1080, 1080],
  };
  const [width, height] = dimensionsMap[brief.platform] ?? dimensionsMap.custom;

  let imageUrl: string;
  try {
    imageUrl = await generateImage(promptText, width, height);
  } catch (e: any) {
    console.error('[Generate Design Route Error]:', e);
    // Return the EXACT error message directly so user can see what OpenAI reported
    return NextResponse.json({
      error: e.message || 'Image generation failed',
    }, { status: 502 });
  }

  // Deduct credits only on success
  if (creditRecord.id !== 'temp') {
    await supabase
      .from('credits')
      .update({ used_credits: creditRecord.used_credits + COST_PER_GEN })
      .eq('id', creditRecord.id);
  }

  const { data: designRecord } = await supabase
    .from('designs')
    .insert({
      profile_id: profile.id,
      title: `${brief.designType} for ${profile.business_name ?? profile.profession ?? 'Social Media'}`,
      prompt: { brief, generatedPrompt: promptText },
      image_path: imageUrl,
      status: 'completed',
    })
    .select()
    .single();

  return NextResponse.json({
    success: true,
    designId: designRecord?.id,
    imageUrl,
    prompt: promptText,
    creditsRemaining: remaining - COST_PER_GEN,
  });
}
