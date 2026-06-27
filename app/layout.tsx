import type { Metadata } from 'next'
import './globals.css'
import { getSession } from '@/lib/session'
import { logout } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Task Tracking',
  description: 'Quản lý công việc và theo dõi tiến độ',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {session && (
          <nav className="bg-[#03A680] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6">
              <a href="/" className="text-white font-bold text-lg tracking-tight">Task Tracking</a>
              <a href="/" className="text-white/80 hover:text-white text-sm transition-colors">Dashboard</a>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-white/80 text-sm">
                  {session.name}
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize">
                    {session.role}
                  </span>
                </span>
                <form action={logout}>
                  <button type="submit" className="text-white/70 hover:text-white text-sm transition-colors">
                    Đăng xuất
                  </button>
                </form>
              </div>
            </div>
          </nav>
        )}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
