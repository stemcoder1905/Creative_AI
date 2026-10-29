'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Share2, Facebook, Instagram, Linkedin, Plus, Trash2,
  CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink,
  ArrowLeft, Sparkles, AlertCircle, Send, Calendar
} from 'lucide-react'

type SocialAccount = {
  id: string
  platform: 'facebook' | 'instagram' | 'linkedin'
  account_name: string
  account_type: string
  is_active: boolean
  token_expires_at: string | null
  created_at: string
}

type PostTarget = {
  id: string
  status: string
  platform_post_id: string | null
  platform_permalink: string | null
  published_at: string | null
  error_message: string | null
  social_accounts: { platform: string; account_name: string; account_type: string }
}

type SocialPost = {
  id: string
  caption: string
  image_url: string
  status: string
  scheduled_at: string | null
  retry_count: number
  error_details: string | null
  created_at: string
  social_post_targets: PostTarget[]
}

const PLATFORM_CONFIG = {
  facebook: { label: 'Facebook', color: 'bg-blue-600', icon: Facebook, textColor: 'text-blue-400' },
  instagram: { label: 'Instagram', color: 'bg-pink-600', icon: Instagram, textColor: 'text-pink-400' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-700', icon: Linkedin, textColor: 'text-sky-400' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:      { label: 'Draft',       color: 'bg-slate-700 text-slate-300',  icon: Clock },
  scheduled:  { label: 'Scheduled',   color: 'bg-indigo-900 text-indigo-300', icon: Calendar },
  publishing: { label: 'Publishing',  color: 'bg-yellow-900 text-yellow-300', icon: RefreshCw },
  published:  { label: 'Published',   color: 'bg-emerald-900 text-emerald-300', icon: CheckCircle2 },
  failed:     { label: 'Failed',      color: 'bg-red-900 text-red-300',      icon: XCircle },
  cancelled:  { label: 'Cancelled',   color: 'bg-slate-800 text-slate-500',  icon: XCircle },
}

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'accounts' | 'history'>('accounts')
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadData = useCallback(async () => {
    try {
      const [accRes, postsRes] = await Promise.all([
        fetch('/api/social/accounts'),
        fetch('/api/social/posts'),
      ])
      if (accRes.ok) setAccounts((await accRes.json()).accounts ?? [])
      if (postsRes.ok) setPosts((await postsRes.json()).posts ?? [])
    } catch (e) {
      console.error('Failed to load social data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Check for success/error query param from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      showToast('Social account connected successfully!', 'success')
      window.history.replaceState({}, '', '/social')
      loadData()
    } else if (params.get('error')) {
      showToast(`Connection failed: ${params.get('error')}`, 'error')
      window.history.replaceState({}, '', '/social')
    }
  }, [loadData])

  const handleConnect = (platform: string) => {
    window.location.href = `/api/social/oauth/connect?platform=${platform}`
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this account? Scheduled posts targeting it may fail.')) return
    setDisconnecting(accountId)
    try {
      const res = await fetch(`/api/social/accounts?id=${accountId}`, { method: 'DELETE' })
      if (res.ok) {
        setAccounts((a) => a.filter((acc) => acc.id !== accountId))
        showToast('Account disconnected.', 'success')
      } else {
        showToast('Failed to disconnect account.', 'error')
      }
    } finally {
      setDisconnecting(null)
    }
  }

  const handleCancel = async (postId: string) => {
    if (!confirm('Cancel this scheduled post?')) return
    const res = await fetch(`/api/social/posts/${postId}`, { method: 'PATCH' })
    if (res.ok) {
      setPosts((p) => p.map((post) => post.id === postId ? { ...post, status: 'cancelled' } : post))
      showToast('Post cancelled.', 'success')
    }
  }

  const handleRetry = async (postId: string) => {
    setRetrying(postId)
    try {
      const res = await fetch(`/api/social/posts/${postId}/retry`, { method: 'POST' })
      if (res.ok) {
        showToast('Post queued for retry!', 'success')
        loadData()
      } else {
        showToast('Retry failed.', 'error')
      }
    } finally {
      setRetrying(null)
    }
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl
          ${toast.type === 'success' ? 'bg-emerald-900 border border-emerald-700 text-emerald-200' : 'bg-red-900 border border-red-700 text-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Social Publishing
            </h1>
            <p className="text-xs text-slate-400">Connect accounts and publish your AI designs to social media</p>
          </div>
        </div>
        <Link
          href="/designs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
        >
          <Send className="w-3.5 h-3.5" />
          Publish a Design
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-6 sm:p-10">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-8 w-fit">
          {(['accounts', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'accounts' ? 'Connected Accounts' : 'Publish History'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">Loading...</div>
        ) : activeTab === 'accounts' ? (
          <AccountsTab
            accounts={accounts}
            connectedPlatforms={connectedPlatforms}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
          />
        ) : (
          <HistoryTab
            posts={posts}
            onCancel={handleCancel}
            onRetry={handleRetry}
            retrying={retrying}
          />
        )}
      </main>
    </div>
  )
}

function AccountsTab({ accounts, connectedPlatforms, onConnect, onDisconnect, disconnecting }: any) {
  const platforms = ['facebook', 'instagram', 'linkedin'] as const
  return (
    <div className="space-y-8">
      {/* Connect New */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Connect a Platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const cfg = PLATFORM_CONFIG[platform]
            const Icon = cfg.icon
            const already = connectedPlatforms.has(platform)
            return (
              <div key={platform} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{cfg.label}</p>
                    <p className="text-xs text-slate-400">{already ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                <button
                  onClick={() => onConnect(platform)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition
                    ${already
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {already ? 'Connect Another' : `Connect ${cfg.label}`}
                </button>
                {platform === 'facebook' && (
                  <p className="text-[10px] text-slate-500">Requires Meta app with pages_manage_posts permission</p>
                )}
                {platform === 'linkedin' && (
                  <p className="text-[10px] text-slate-500">Requires LinkedIn app with w_member_social permission</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Connected Accounts List */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Your Connected Accounts ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No accounts connected yet. Connect a platform above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc: SocialAccount) => {
              const cfg = PLATFORM_CONFIG[acc.platform] ?? PLATFORM_CONFIG.facebook
              const Icon = cfg.icon
              const isExpired = acc.token_expires_at && new Date(acc.token_expires_at) < new Date()
              return (
                <div key={acc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{acc.account_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{acc.platform} · {acc.account_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isExpired ? (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Token expired
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                    <button
                      onClick={() => onDisconnect(acc.id)}
                      disabled={disconnecting === acc.id}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryTab({ posts, onCancel, onRetry, retrying }: any) {
  if (posts.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <Send className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No social posts yet. Go to My Designs and click Publish.</p>
        <Link href="/designs" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition">
          <Sparkles className="w-3.5 h-3.5" /> Go to Designs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post: SocialPost) => {
        const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft
        const StatusIcon = statusCfg.icon
        return (
          <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image_url} alt="Design" className="w-full h-full object-cover" />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm text-slate-200 line-clamp-2">{post.caption || '(No caption)'}</p>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusCfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </span>
                </div>
                {post.scheduled_at && (
                  <p className="text-xs text-slate-500 mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(post.scheduled_at).toLocaleString()}
                  </p>
                )}
                {/* Targets */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.social_post_targets?.map((t: PostTarget) => {
                    const cfg = PLATFORM_CONFIG[t.social_accounts?.platform as keyof typeof PLATFORM_CONFIG]
                    const Icon = cfg?.icon ?? Share2
                    return (
                      <div key={t.id} className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1">
                        <Icon className={`w-3 h-3 ${cfg?.textColor ?? 'text-slate-400'}`} />
                        <span className="text-xs text-slate-300">{t.social_accounts?.account_name}</span>
                        {t.status === 'published' && t.platform_permalink && (
                          <a href={t.platform_permalink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {t.status === 'failed' && <XCircle className="w-3 h-3 text-red-400" />}
                        {t.status === 'published' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                    )
                  })}
                </div>
                {post.error_details && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {post.error_details}
                  </p>
                )}
              </div>
            </div>
            {/* Actions */}
            {(post.status === 'scheduled' || post.status === 'failed') && (
              <div className="border-t border-slate-800 px-4 py-2 flex gap-3">
                {post.status === 'scheduled' && (
                  <button onClick={() => onCancel(post.id)} className="text-xs text-slate-400 hover:text-red-400 transition">
                    Cancel
                  </button>
                )}
                {post.status === 'failed' && (
                  <button
                    onClick={() => onRetry(post.id)}
                    disabled={retrying === post.id}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${retrying === post.id ? 'animate-spin' : ''}`} />
                    {retrying === post.id ? 'Retrying...' : 'Retry'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
