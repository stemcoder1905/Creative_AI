'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, Calendar, Clock, Facebook,
  Instagram, Linkedin, CheckCircle2, XCircle, Hash, AlignLeft, Share2
} from 'lucide-react'

type SocialAccount = {
  id: string
  platform: string
  account_name: string
  account_type: string
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-600',
  linkedin: 'bg-sky-700',
}

export default function PublishDesignPage() {
  const params = useParams()
  const router = useRouter()
  const designId = params?.designId as string

  const [design, setDesign] = useState<any>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load design info + connected accounts
  useEffect(() => {
    async function load() {
      try {
        const [desRes, accRes] = await Promise.all([
          fetch('/api/designs'),
          fetch('/api/social/accounts'),
        ])
        if (desRes.ok) {
          const data = await desRes.json()
          const found = (data.designs ?? []).find((d: any) => d.id === designId)
          setDesign(found ?? null)
          if (found?.prompt?.brief?.topic) {
            setCaption(`${found.title ?? 'Check out our latest design!'}\n\nCreated with CreativeAI Studio 🎨`)
          }
        }
        if (accRes.ok) {
          setAccounts((await accRes.json()).accounts ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [designId])

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAccounts.size === 0) {
      setError('Please select at least one social account.')
      return
    }
    if (!design?.image_url && !design?.image_path) {
      setError('Design image not found.')
      return
    }
    if (publishMode === 'schedule' && !scheduledAt) {
      setError('Please select a scheduled date and time.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          imageUrl: design.image_url ?? design.image_path,
          caption,
          hashtags,
          accountIds: Array.from(selectedAccounts),
          publishNow: publishMode === 'now',
          scheduledAt: publishMode === 'schedule' ? new Date(scheduledAt).toISOString() : undefined,
          timezone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : 'Failed to publish')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Design not found</p>
          <Link href="/designs" className="text-indigo-400 text-sm mt-2 inline-block">← Back to Designs</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {publishMode === 'now' ? 'Publishing in progress!' : 'Post scheduled!'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {publishMode === 'now'
              ? 'Your design is being published to the selected social accounts.'
              : `Your design will be published at ${new Date(scheduledAt).toLocaleString()}`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/social" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
              View Publishing History
            </Link>
            <Link href="/designs" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition">
              Back to Designs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = design.image_url ?? design.image_path

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center gap-4">
        <Link href="/designs" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            Publish Design
          </h1>
          <p className="text-xs text-slate-400">{design.title}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 sm:p-10">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Preview */}
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-300 mb-3">Design Preview</h2>
                <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={design.title} className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Select Accounts */}
              <div>
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Select Accounts ({selectedAccounts.size} selected)
                </h2>
                {accounts.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-slate-400 text-sm mb-3">No social accounts connected yet.</p>
                    <Link href="/social" className="text-indigo-400 text-xs hover:text-indigo-300">
                      → Connect accounts first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((acc) => {
                      const Icon = PLATFORM_ICONS[acc.platform] ?? Share2
                      const isSelected = selectedAccounts.has(acc.id)
                      return (
                        <button
                          type="button"
                          key={acc.id}
                          onClick={() => toggleAccount(acc.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition text-left
                            ${isSelected
                              ? 'border-indigo-500 bg-indigo-950/40'
                              : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${PLATFORM_COLORS[acc.platform] ?? 'bg-slate-700'} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{acc.account_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{acc.platform} · {acc.account_type}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Caption + Options */}
            <div className="space-y-6">
              {/* Caption */}
              <div>
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <AlignLeft className="w-4 h-4" /> Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={5}
                  maxLength={2200}
                  placeholder="Write your post caption..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1 text-right">{caption.length}/2200</p>
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Hash className="w-4 h-4" /> Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#marketing #design #socialmedia"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Publish Mode */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-3 block">Publish When?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { mode: 'now', label: 'Publish Now', icon: Send },
                    { mode: 'schedule', label: 'Schedule Post', icon: Calendar },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPublishMode(mode as any)}
                      className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition
                        ${publishMode === mode
                          ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Picker */}
              {publishMode === 'schedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-2">
                      <Clock className="w-4 h-4" /> Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      min={new Date(Date.now() + 2 * 60 * 1000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-sm text-red-300 flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || selectedAccounts.size === 0}
                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                {submitting ? (
                  <><Clock className="w-4 h-4 animate-spin" /> Processing...</>
                ) : publishMode === 'now' ? (
                  <><Send className="w-4 h-4" /> Publish Now</>
                ) : (
                  <><Calendar className="w-4 h-4" /> Schedule Post</>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
