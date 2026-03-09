import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AntdRegistry from '@/lib/AntdRegistry'

export const metadata: Metadata = {
  title: '后台管理系统',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}

