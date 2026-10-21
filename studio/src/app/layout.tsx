import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CreativeAI Studio - AI Social Media Banner & Poster Generator',
  description: 'AI-powered social media banner, poster, and graphic design generator for businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className="h-full min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}

