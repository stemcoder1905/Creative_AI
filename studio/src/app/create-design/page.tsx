'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Layers,
  Palette,
  Sliders,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const DESIGN_TYPES = [
  'Promotional Banner',
  'Poster',
  'Festival & Holiday Greeting',
  'Special Offer & Discount Ad',
  'Product Showcase',
  'Service Announcement',
  'Educational Post',
  'Event Invitation',
  'Motivational Quote',
  'Instagram Reel Cover',
]

const PLATFORM_PRESETS = [
  { id: 'instagram_square', label: 'Instagram Square (1080 × 1080)', ratio: '1:1' },
  { id: 'instagram_portrait', label: 'Instagram Portrait (1080 × 1350)', ratio: '4:5' },
  { id: 'instagram_story', label: 'Instagram Story / Reel (1080 × 1920)', ratio: '9:16' },
  { id: 'facebook_feed', label: 'Facebook Feed (1080 × 1350)', ratio: '4:5' },
  { id: 'facebook_cover', label: 'Facebook Cover (1640 × 624)', ratio: '16:6' },
  { id: 'linkedin_post', label: 'LinkedIn Post (1200 × 627)', ratio: '1.91:1' },
  { id: 'youtube_thumbnail', label: 'YouTube Thumbnail (1280 × 720)', ratio: '16:9' },
  { id: 'whatsapp_status', label: 'WhatsApp Status (1080 × 1920)', ratio: '9:16' },
]

const VISUAL_STYLES = [
  'Photorealistic & Commercial',
  'Modern & Minimalist',
  'Vibrant & Bold',
  'Luxury & Elegant',
  'Traditional & Festive (Diwali, Eid, etc.)',
  'Corporate & Clean',
  'Artistic 3D Illustration',
  'Cinematic & Dramatic',
]

export default function CreateDesignPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    topic: '',
    designType: 'Promotional Banner',
    platform: 'instagram_square',
    style: 'Modern & Minimalist',
    language: 'English',
    colorPalette: '',
    headline: '',
    cta: '',
    contactInfo: '',
  })

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setProfile(data.profile)
            if (data.profile.brand_colors) {
              setFormData((prev) => ({
                ...prev,
                colorPalette: Array.isArray(data.profile.brand_colors)
                  ? data.profile.brand_colors.join(', ')
                  : data.profile.brand_colors,
              }))
            }
          }
        }
      } catch (e) {
        console.error('Error fetching profile', e)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim()) {
      setError('Please provide a topic or prompt for your design.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/design/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Generation failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Error occurred while generating design')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Studio Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Creative Studio Studio
            </h1>
            <p className="text-xs text-slate-400">
              {profile?.business_name ? `Configured for ${profile.business_name}` : 'Multi-format AI Graphic Generator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/designs"
            className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition"
          >
            My Saved Vault
          </Link>
        </div>
      </header>

      {/* Studio Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Left Form: Inputs & Customization */}
        <div className="w-full lg:w-1/2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Design Parameters</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tell our prompt engine what you want to create and select output dimensions.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Topic, Promotion or Idea <span className="text-indigo-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g. Diwali discount poster for our astrology consultation: Consultation price reduced from ₹450 to ₹199 with gold accents and cosmic background."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Quick ideas:</span>
              {[
                'Diwali festival offer 40% OFF',
                'Luxury 2BHK Apartment for Rent',
                'Healthy Salad Bar Grand Opening',
                'Personal Fitness Transformation 30-Day',
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFormData({ ...formData, topic: pill })}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Design Type & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Design Type</label>
                <select
                  name="designType"
                  value={formData.designType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {DESIGN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Platform Preset</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PLATFORM_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Style & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Visual Style</label>
                <select
                  name="style"
                  value={formData.style}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {VISUAL_STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="English, Hindi, Spanish, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Copy & Details Overrides */}
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Text & Typography Hierarchy (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Promotional Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="e.g. SPECIAL 50% OFF"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Call to Action (CTA)</label>
                  <input
                    type="text"
                    name="cta"
                    value={formData.cta}
                    onChange={handleChange}
                    placeholder="e.g. Book Now / Order Today"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact or Brand Info</label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="e.g. Phone: +91 98765 43210 | www.mybrand.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating AI Design...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Design (5 Credits)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Panel */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 min-h-[480px]">
          {loading ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">Synthesizing High-Resolution Creative</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Engineering prompt, applying brand color palette, and rendering through OpenAI DALL·E-3 engine...
              </p>
            </div>
          ) : result?.imageUrl ? (
            <div className="w-full space-y-4 flex flex-col items-center">
              <div className="relative max-h-[500px] w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.imageUrl}
                  alt="AI Generated Social Media Creative"
                  className="max-h-[500px] w-auto object-contain"
                />
              </div>

              <div className="w-full flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4" /> Generation Complete
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={result.imageUrl}
                    download="generated_design.png"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Full Res
                  </a>
                </div>
              </div>

              {result.prompt && (
                <div className="w-full bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-left mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Engineered Prompt:</span>
                  <p className="text-xs text-slate-400 font-mono line-clamp-3">{result.prompt}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Layers className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-400">Creative Preview Canvas</p>
              <p className="text-xs max-w-xs text-slate-500">
                Your generated graphics and banners will appear here in ultra-high resolution ready for download.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
