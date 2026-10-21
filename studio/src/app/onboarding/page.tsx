'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Building, Palette, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

const SUGGESTED_INDUSTRIES = [
  'Astrologer & Spiritual Consultant',
  'Doctor / Healthcare Clinic',
  'Restaurant, Cafe & Cloud Kitchen',
  'Real Estate & Property Dealer',
  'Coach, Tutor & Educational Institute',
  'Clothing & E-commerce Brand',
  'Gym, Fitness & Salon / Spa',
  'Influencer & Content Creator',
  'Retail Store / Local Business',
  'Startup / Tech Company',
]

const PRIMARY_USE_CASES = [
  { id: 'promotional_banners', label: 'Promotional Banners' },
  { id: 'festival_posters', label: 'Festival & Occasion Posters' },
  { id: 'product_ads', label: 'Product Advertisements' },
  { id: 'service_ads', label: 'Service Advertisements' },
  { id: 'educational_posts', label: 'Educational & Info Graphics' },
  { id: 'event_posters', label: 'Event Posters & Announcements' },
  { id: 'offers_discounts', label: 'Discount Deals & Flash Sales' },
  { id: 'story_graphics', label: 'Story & Reel Covers' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    profession: '',
    custom_profession: '',
    business_description: '',
    target_audience: '',
    brand_colors: '#4f46e5, #9333ea',
    brand_slogan: '',
    website: '',
    primary_use_case: 'promotional_banners',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)

    const finalProfession = formData.profession === 'Other' ? formData.custom_profession : formData.profession

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profession: finalProfession,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile preferences')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Progress header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">CreativeAI Onboarding</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Setup your Business Profile</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tell our AI about your brand so every generated poster and banner fits your identity.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  step === s
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : step > s
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 text-slate-500'
                }`}
              >
                <span>Step {s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-950/60 border border-red-800 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-lg font-semibold text-white border-b border-slate-800 pb-3">
                <Building className="w-5 h-5 text-indigo-400" />
                <span>1. Business & Industry Details</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Business or Brand Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="e.g. Vedic Horizon Astro, Spice Delight Cafe"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Profession or Industry</label>
                <select
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose your industry --</option>
                  {SUGGESTED_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                  <option value="Other">Other / Custom Profession</option>
                </select>
              </div>

              {formData.profession === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Describe Custom Profession</label>
                  <input
                    type="text"
                    name="custom_profession"
                    value={formData.custom_profession}
                    onChange={handleChange}
                    placeholder="e.g. Organic Candle Artisan"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Short Business Description</label>
                <textarea
                  rows={2}
                  name="business_description"
                  value={formData.business_description}
                  onChange={handleChange}
                  placeholder="Briefly describe what services or products you offer..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Next: Branding <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-lg font-semibold text-white border-b border-slate-800 pb-3">
                <Palette className="w-5 h-5 text-indigo-400" />
                <span>2. Brand Styling & Target Audience</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Audience</label>
                <input
                  type="text"
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  placeholder="e.g. Young professionals, families, local college students"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Brand Colors (Hex codes or comma separated)</label>
                <input
                  type="text"
                  name="brand_colors"
                  value={formData.brand_colors}
                  onChange={handleChange}
                  placeholder="#4f46e5, #9333ea, #f59e0b"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Brand Slogan / Tagline (Optional)</label>
                <input
                  type="text"
                  name="brand_slogan"
                  value={formData.brand_slogan}
                  onChange={handleChange}
                  placeholder="e.g. Aligning your stars for future success"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Website or Social Media Link (Optional)</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourbrand.com or @instagram_handle"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Next: Primary Goals <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-lg font-semibold text-white border-b border-slate-800 pb-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>3. Primary Design Requirements</span>
              </div>

              <p className="text-sm text-slate-400">
                What do you plan to generate most frequently?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {PRIMARY_USE_CASES.map((useCase) => (
                  <label
                    key={useCase.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      formData.primary_use_case === useCase.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="primary_use_case"
                      value={useCase.id}
                      checked={formData.primary_use_case === useCase.id}
                      onChange={handleChange}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">{useCase.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
                >
                  {loading ? 'Saving preferences...' : 'Complete & Launch Studio'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
