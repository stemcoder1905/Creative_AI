// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const signupSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parse = signupSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  }

  const email = parse.data.email.toLowerCase().trim();

  // Generate 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = bcrypt.genSaltSync(10);
  const otpHash = bcrypt.hashSync(rawOtp, salt);

  // 10 minutes expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store hashed OTP in Supabase table otp_codes
  const { error: dbError } = await supabase.from('otp_codes').insert({
    email,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });

  if (dbError) {
    console.error('Database error storing OTP:', dbError);
    // Don't leak DB specifics to client
    return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 });
  }

  // Send via Resend or log to console in dev/fallback
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'placeholder-resend-key') {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'CreativeAI Studio <auth@creativeai.studio>',
        to: email,
        subject: 'Your CreativeAI Studio Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Your Verification Code</h2>
            <p>Welcome to CreativeAI Studio. Use the code below to log in or complete your registration:</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #0f172a;">
              ${rawOtp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 16px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('Failed sending email via Resend:', mailErr);
    }
  } else {
    // Development fallback
    console.log(`\n========================================\n[DEV OTP] Email: ${email} | Code: ${rawOtp}\n========================================\n`);
  }

  // Always log to server console so you can see OTP in terminal
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  OTP for ${email}`);
  console.log(`║  Code: ${rawOtp}`);
  console.log(`╚══════════════════════════════════════╝\n`);

  return NextResponse.json({
    success: true,
    message: 'Verification code sent',
    // Show OTP on screen until a custom email domain is verified in Resend
    devPreviewOtp: rawOtp,
  });
}
