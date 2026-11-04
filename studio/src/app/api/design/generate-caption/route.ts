// src/app/api/design/generate-caption/route.ts
// Generates or regenerates social media caption & hashtags for a design or custom topic

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/sessionHelper';
import { generateSocialCopy } from '@/services/captionEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { designId, topic: customTopic, tone, platform, cta } = body || {};

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', session.email)
    .single();

  let targetTopic = customTopic;
  let targetDesignType = 'Social Post';
  let targetHeadline = '';
  let targetCta = cta || '';
  let designRecord: any = null;

  if (designId) {
    const { data: foundDesign } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single();

    if (foundDesign) {
      designRecord = foundDesign;
      const brief = foundDesign.prompt?.brief || {};
      targetTopic = targetTopic || brief.topic || foundDesign.title;
      if (targetTopic && /for\s+my\s*space/i.test(targetTopic)) {
        targetTopic = brief.topic || 'Social Media Creative';
      }
      targetDesignType = brief.designType || 'Social Post';
      targetHeadline = brief.headline || '';
      targetCta = targetCta || brief.cta || '';
    }
  }

  if (targetTopic && /for\s+my\s*space/i.test(targetTopic)) {
    targetTopic = 'Social Media Creative';
  }

  if (!targetTopic || typeof targetTopic !== 'string' || !targetTopic.trim()) {
    return NextResponse.json(
      { error: 'Topic is required to generate social copy' },
      { status: 400 }
    );
  }

  const rawBusinessName = profile?.business_name || profile?.full_name || '';
  const cleanBusinessName = /my\s*space/i.test(rawBusinessName) ? '' : rawBusinessName;

  const copy = await generateSocialCopy({
    topic: targetTopic,
    designType: targetDesignType,
    platform: platform || 'Social Media',
    headline: targetHeadline,
    cta: targetCta,
    businessName: cleanBusinessName,
    profession: profile?.profession || '',
    tone: tone || 'engaging, inspiring, and authentic',
  });

  // If designId is present, persist the updated caption & hashtags to DB
  if (designRecord && designRecord.id) {
    const updatedPrompt = {
      ...(designRecord.prompt || {}),
      caption: copy.caption,
      hashtags: copy.hashtags,
      generatedTitle: copy.title,
    };

    await supabase
      .from('designs')
      .update({
        prompt: updatedPrompt,
        title: copy.title || designRecord.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designRecord.id);
  }

  return NextResponse.json({
    success: true,
    title: copy.title,
    caption: copy.caption,
    hashtags: copy.hashtags,
  });
}
