import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  Palette,
  Image as ImageIcon,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              CreativeAI Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Gen Multi-Tenant AI Social Media Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight sm:leading-none">
          Generate Professional{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Banners & Posters
          </span>{' '}
          for Your Business in Seconds
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl">
          Empowering astrologers, doctors, cafes, fitness coaches, real estate brokers, and e-commerce brands to produce studio-grade marketing graphics without hiring a designer.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 transition text-base"
          >
            Start Creating for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-base"
          >
            Launch Studio App
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left w-full">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Brand Kit</h3>
            <p className="text-sm text-slate-400">
              Save your profession, industry tone, brand colors, and slogan. Our prompt engine automatically infuses your brand identity into every poster.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Omni-Platform Presets</h3>
            <p className="text-sm text-slate-400">
              Tailored dimension presets for Instagram Feed & Stories, WhatsApp Status, Facebook banners, LinkedIn portraits, and YouTube thumbnails.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Tenant Isolation</h3>
            <p className="text-sm text-slate-400">
              Complete tenant separation powered by Supabase PostgreSQL RLS, encrypted OTP authentication, and per-account usage credit controls.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CreativeAI Studio. Built for high-conversion social media marketing.
      </footer>
    </div>
  )
}
