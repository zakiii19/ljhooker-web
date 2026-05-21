import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import {
  Home,
  Users,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Plus,
  Calendar
} from 'lucide-react'

export const revalidate = 0 // Disable cache for real-time dashboard data

interface SearchParams {
  error?: string
}

export default async function DashboardPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const error = searchParams.error
  const supabase = await createClient()

  // 1. Fetch System Settings for Expiry Warnings
  const { data: settings } = await supabase
    .from('konfigurasi_sistem')
    .select('key, value')

  const exclusiveDays = parseInt(
    settings?.find((s) => s.key === 'jatuh_tempo_exclusive_hari')?.value || '30'
  )
  const sewaDays = parseInt(
    settings?.find((s) => s.key === 'jatuh_tempo_sewa_hari')?.value || '30'
  )

  // 2. Fetch Dashboard Overview Count Metrics
  const { count: totalProperti } = await supabase
    .from('properti')
    .select('*', { count: 'exact', head: true })

  const { count: activeProperti } = await supabase
    .from('properti')
    .select('*', { count: 'exact', head: true })
    .eq('status_aktif', 'aktif')

  const { count: rentedProperti } = await supabase
    .from('properti')
    .select('*', { count: 'exact', head: true })
    .eq('status_aktif', 'tersewa')

  const { count: totalMarketing } = await supabase
    .from('marketing')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // 3. Fetch Expiring Exclusive Listings
  // Formula: tgl_jatuh_tempo + N days >= today => tgl_jatuh_tempo >= today - N days
  const exclusiveLimitDate = new Date()
  exclusiveLimitDate.setDate(exclusiveLimitDate.getDate() - exclusiveDays)
  const exclusiveLimitStr = exclusiveLimitDate.toISOString().split('T')[0]

  const { data: exclusiveAlerts } = await supabase
    .from('properti')
    .select('id, no_listing, pemilik_nama, alamat, tgl_jatuh_tempo, marketing(nama)')
    .eq('is_exclusive', true)
    .eq('status_aktif', 'aktif')
    .gte('tgl_jatuh_tempo', exclusiveLimitStr)
    .order('tgl_jatuh_tempo', { ascending: true })
    .limit(5)

  // 4. Fetch Expiring Rental Agreements
  const sewaLimitDate = new Date()
  sewaLimitDate.setDate(sewaLimitDate.getDate() - sewaDays)
  const sewaLimitStr = sewaLimitDate.toISOString().split('T')[0]

  const { data: rentalAlerts } = await supabase
    .from('transaksi')
    .select('id, no_bukti, pembeli_nama, tgl_jatuh_tempo_sewa, properti(alamat), marketing(nama)')
    .eq('tipe', 'sewa')
    .gte('tgl_jatuh_tempo_sewa', sewaLimitStr)
    .order('tgl_jatuh_tempo_sewa', { ascending: true })
    .limit(5)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate if a date has expired
  const isExpired = (dateStr: string) => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const target = new Date(dateStr)
    target.setHours(0,0,0,0)
    return target < today
  }

  return (
    <div className="space-y-8">
      {error === 'access_denied' && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 animate-fadeIn">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>Akses Ditolak: Akun Anda tidak memiliki wewenang untuk mengakses halaman tersebut.</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-sm text-zinc-500">
            Pemantauan langsung inventaris properti, jatuh tempo, dan performa transaksi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/properti"
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Properti</span>
          </Link>
        </div>
      </div>

      {/* KPI Widgets Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-400">Total Properti</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{totalProperti || 0}</h3>
            <p className="mt-1 text-xs text-zinc-500">Unit properti terdaftar</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-400">Tersedia (Aktif)</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{activeProperti || 0}</h3>
            <p className="mt-1 text-xs text-zinc-500">Sedang aktif dipasarkan</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-400">Unit Tersewa</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{rentedProperti || 0}</h3>
            <p className="mt-1 text-xs text-zinc-500">Masa sewa sedang berjalan</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-400">Staf Marketing</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{totalMarketing || 0}</h3>
            <p className="mt-1 text-xs text-zinc-500">Agen aktif di Semarang Kota</p>
          </div>
        </div>
      </div>

      {/* Expiration Warnings Section (Jatuh Tempo) */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Exclusive Listing Expiry Alert Card */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Jatuh Tempo Listing Eksklusif</h4>
                <p className="text-xs text-zinc-500">Batas peringatan: {exclusiveDays} hari sebelum/setelah</p>
              </div>
            </div>
            <Link
              href="/dashboard/properti"
              className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              <span>Semua</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {!exclusiveAlerts || exclusiveAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Tidak ada listing eksklusif yang jatuh tempo.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">No. Listing</th>
                    <th className="pb-3">Pemilik</th>
                    <th className="pb-3">Tanggal Habis</th>
                    <th className="pb-3 text-right">Marketing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exclusiveAlerts.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.01]">
                      <td className="py-3.5 font-medium text-white group-hover:text-yellow-400 transition-colors">
                        {item.no_listing}
                      </td>
                      <td className="py-3.5 text-zinc-400 truncate max-w-[120px]">{item.pemilik_nama}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            isExpired(item.tgl_jatuh_tempo!)
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-400/10 text-yellow-400'
                          }`}
                        >
                          {formatDate(item.tgl_jatuh_tempo!)}
                          {isExpired(item.tgl_jatuh_tempo!) && ' (Habis)'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-zinc-300">
                        {/* @ts-ignore */}
                        {item.marketing?.nama || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Rental Expiration Expiry Alert Card */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Jatuh Tempo Masa Sewa</h4>
                <p className="text-xs text-zinc-500">Batas peringatan: {sewaDays} hari sebelum/setelah</p>
              </div>
            </div>
            <Link
              href="/dashboard/transaksi"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Semua</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {!rentalAlerts || rentalAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Tidak ada masa sewa properti yang jatuh tempo.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">No. Sewa</th>
                    <th className="pb-3">Penyewa</th>
                    <th className="pb-3">Tanggal Habis</th>
                    <th className="pb-3 text-right">Marketing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rentalAlerts.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.01]">
                      <td className="py-3.5 font-medium text-white group-hover:text-purple-400 transition-colors">
                        {item.no_bukti}
                      </td>
                      <td className="py-3.5 text-zinc-400 truncate max-w-[120px]">{item.pembeli_nama}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            isExpired(item.tgl_jatuh_tempo_sewa!)
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-purple-400/10 text-purple-400'
                          }`}
                        >
                          {formatDate(item.tgl_jatuh_tempo_sewa!)}
                          {isExpired(item.tgl_jatuh_tempo_sewa!) && ' (Habis)'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-zinc-300">
                        {/* @ts-ignore */}
                        {item.marketing?.nama || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
