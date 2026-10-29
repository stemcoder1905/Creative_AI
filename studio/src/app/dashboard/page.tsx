'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  Image as ImageIcon,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
} from 'lucide-react'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [credits, setCredits] = useState<{ total_credits: number; used_credits: number }>({
    total_credits: 25,
    used_credits: 0,
  })
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, desRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/designs'),
        ])
        if (profRes.ok) {
          const profData = await profRes.json()
          setProfile(profData.profile)
          if (profData.credits) setCredits(profData.credits)
        }
        if (desRes.ok) {
          const desData = await desRes.json()
          setDesigns(desData.designs || [])
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const remainingCredits = credits.total_credits - credits.used_credits

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              CreativeAI
            </span>
          </Link>

          <nav className="space-y-1.5 pt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium text-sm border border-indigo-500/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/create-design"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Design</span>
            </Link>
            <Link
              href="/designs"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
            >
              <ImageIcon className="w-4 h-4" />
              <span>My Designs</span>
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
            >
              <Palette className="w-4 h-4" />
              <span>Brand Kit & Profile</span>
            </Link>
            <Link
              href="/social"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Social Publishing</span>
            </Link>
          </nav>
        </div>

        {/* Credit Meter & User Card */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Monthly Credits</span>
              <span className="font-semibold text-indigo-400">{remainingCredits} left</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (remainingCredits / Math.max(1, credits.total_credits)) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">5 credits per AI generation</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="truncate text-xs">
              <p className="font-medium text-slate-200 truncate">{profile?.business_name || profile?.full_name || 'My Studio'}</p>
              <p className="text-slate-500 truncate">{profile?.email}</p>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-slate-300 transition">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {profile?.business_name ? `Welcome back, ${profile.business_name}!` : 'Welcome to CreativeAI Studio'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Generate commercial-grade banners, posters, and social media flyers tailored to your brand in seconds.
            </p>
          </div>

          <Link
            href="/create-design"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Quick Create Design
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Total Generated</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">{designs.length}</p>
            <span className="text-xs text-slate-500">Creatives saved in your vault</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Available Credits</span>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">{remainingCredits}</p>
            <span className="text-xs text-slate-500">{Math.floor(remainingCredits / 5)} standard generations</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Configured Brand</span>
              <Palette className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white mt-2 truncate">
              {profile?.profession || 'Standard Preset'}
            </p>
            <span className="text-xs text-slate-500">Auto-injected into prompt engine</span>
          </div>
        </div>

        {/* Recent Designs Gallery / Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Generations</h2>
            {designs.length > 0 && (
              <Link href="/designs" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
              Loading your studio assets...
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">No designs generated yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Ready to create high-converting promotional banners or festival posters for your business? Click below to start.
              </p>
              <Link
                href="/create-design"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
              >
                <PlusCircle className="w-4 h-4" />
                Create your first design
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.slice(0, 6).map((design) => (
                <div
                  key={design.id}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={design.image_path}
                      alt={design.title || 'Generated Banner'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-white line-clamp-1">{design.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {design.prompt?.brief?.topic || 'AI Generated Creative'}
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {new Date(design.created_at).toLocaleDateString()}
                      </span>
                      <a
                        href={design.image_path}
                        download={`creative_${design.id}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
