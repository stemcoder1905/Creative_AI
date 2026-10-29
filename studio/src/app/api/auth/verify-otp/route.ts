// src/app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parse = verifySchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid email or 6-digit code format' }, { status: 422 });
  }

  const { otp } = parse.data;
  const email = parse.data.email.toLowerCase().trim();

  // Retrieve active OTP records for this email
  const { data: records, error: dbError } = await supabase
    .from('otp_codes')
    .select('id, otp_hash, expires_at, created_at')
    .eq('email', email)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (dbError || !records || records.length === 0) {
    return NextResponse.json({ error: 'Code expired or not found. Please request a new one.' }, { status: 400 });
  }

  // Find matching hashed OTP
  let validRecordId: string | null = null;
  for (const record of records) {
    if (bcrypt.compareSync(otp, record.otp_hash)) {
      validRecordId = record.id;
      break;
    }
  }

  if (!validRecordId) {
    return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
  }

  // Delete used OTP
  await supabase.from('otp_codes').delete().eq('id', validRecordId);

  // Check if profile exists or create one
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  let isNewUser = false;

  if (!profile) {
    isNewUser = true;
    const { data: newProfile, error: profileErr } = await supabase
      .from('profiles')
      .insert({
        email,                              // FIX: required unique key
        full_name: email.split('@')[0],
      })
      .select()
      .single();

    if (!profileErr && newProfile) {
      profile = newProfile;
      // Initialize free starter credits (25 credits = 5 generations @ 5 each)
      await supabase.from('credits').insert({
        profile_id: newProfile.id,          // FIX: use profile_id (matches new schema)
        total_credits: 25,
        used_credits: 0,
      });
    }
  }

  // Generate session token — HMAC-signed to prevent tampering
  // Uses a server-side secret so clients cannot forge sessions
  const crypto = await import('crypto');
  const secret = process.env.SESSION_SECRET || 'change-me-in-production-32chars+';
  const payload = JSON.stringify({ userId: profile?.id || email, email, created: Date.now() });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sessionToken = Buffer.from(payload).toString('base64') + '.' + sig;

  const response = NextResponse.json({
    success: true,
    isNewUser,
    profile,
    message: 'Authentication successful',
  });

  // Set HttpOnly session cookie
  response.cookies.set('sb-access-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
