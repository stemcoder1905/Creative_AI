// supabase/functions/publish-scheduler/index.ts
// Supabase Edge Function — calls the Next.js scheduler endpoint every 2 minutes.
// Deploy with: supabase functions deploy publish-scheduler
// Schedule with: supabase functions schedule publish-scheduler --schedule "*/2 * * * *"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const NEXT_APP_URL = Deno.env.get('NEXT_APP_URL') ?? 'http://localhost:3001'
const SCHEDULER_SECRET = Deno.env.get('SCHEDULER_SECRET') ?? ''

serve(async () => {
  if (!SCHEDULER_SECRET) {
    console.error('[Edge Scheduler] SCHEDULER_SECRET not set')
    return new Response('Config error', { status: 500 })
  }

  const start = Date.now()
  try {
    const res = await fetch(`${NEXT_APP_URL}/api/social/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SCHEDULER_SECRET}`,
      },
    })
    const data = await res.json()
    const duration = Date.now() - start
    console.log(`[Edge Scheduler] Done in ${duration}ms:`, data)
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err) {
    console.error('[Edge Scheduler] Error:', err)
    return new Response('Scheduler call failed', { status: 500 })
  }
})
