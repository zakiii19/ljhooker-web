import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from '../login/actions'
import {
  LayoutDashboard,
  Home as PropertiIcon,
  Users as MarketingIcon,
  FileText as TransaksiIcon,
  DollarSign as KomisiIcon,
  Settings as KonfigurasiIcon,
  LogOut,
  Shield,
  User as UserIcon
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile from public.users table to fetch the role
  const { data: profile } = await supabase
    .from('users')
    .select('nama, role')
    .eq('id', user.id)
    .maybeSingle()

  const userName = profile?.nama || user.user_metadata.nama || 'Pengguna'
  const userRole = profile?.role || user.user_metadata.role || 'marketing'

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'principal':
        return 'Principal / Owner'
      default:
        return 'Marketing Agent'
    }
  }

  const isAdminOrPrincipal = userRole === 'admin' || userRole === 'principal'

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Daftar Properti', href: '/dashboard/properti', icon: PropertiIcon },
    ...(isAdminOrPrincipal ? [
      { name: 'Staf Marketing', href: '/dashboard/marketing', icon: MarketingIcon },
      { name: 'Transaksi', href: '/dashboard/transaksi', icon: TransaksiIcon },
      { name: 'Perhitungan Komisi', href: '/dashboard/komisi', icon: KomisiIcon },
      { name: 'Pengaturan Sistem', href: '/dashboard/konfigurasi', icon: KonfigurasiIcon },
    ] : [])
  ]

  return (
    <div className="flex min-h-screen bg-[#0A0A0C] text-zinc-100 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#0F0F12] md:block">
        <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
          <Shield className="h-6 w-6 text-yellow-400" />
          <span className="font-bold tracking-tight text-white">
            LJ HOOKER <span className="text-yellow-400 font-medium">SK</span>
          </span>
        </div>

        {/* User Info Card */}
        <div className="mx-4 my-6 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="truncate text-sm font-semibold text-white">{userName}</h4>
              <p className="truncate text-xs text-zinc-500 capitalize">{getRoleLabel(userRole)}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
            >
              <item.icon className="h-5 w-5 text-zinc-500" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Form */}
        <div className="absolute bottom-6 w-56 px-4">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-5 w-5 text-red-500/70" />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header Mobile / Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0F0F12] px-6 md:justify-end">
          <div className="flex items-center gap-2 md:hidden">
            <Shield className="h-6 w-6 text-yellow-400" />
            <span className="font-bold tracking-tight text-white">LJ HOOKER</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <span className="block text-sm font-medium text-white">{userName}</span>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                {getRoleLabel(userRole)}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-xs font-semibold text-white">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
