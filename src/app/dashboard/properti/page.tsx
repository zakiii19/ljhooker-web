import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import {
  Home,
  Search,
  Filter,
  Plus,
  BedDouble,
  Bath,
  Maximize2,
  Calendar,
  User,
  BadgeAlert,
  ArrowUpDown
} from 'lucide-react'
import PropertiListClient from './PropertiListClient'

export const revalidate = 0 // Disable cache for real-time listing updates

interface SearchParams {
  search?: string
  status?: string
  tipe?: string
  exclusive?: string
}

export default async function PropertiPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Retrieve Search Parameters from URL
  const querySearch = searchParams.search || ''
  const queryStatus = searchParams.status || 'all'
  const queryTipe = searchParams.tipe || 'all'
  const queryExclusive = searchParams.exclusive || 'all'

  // Build Supabase Query
  let query = supabase
    .from('properti')
    .select('*, marketing(nama)')
    .order('tgl_terdaftar', { ascending: false })

  // Apply filters
  if (querySearch) {
    query = query.or(
      `no_listing.ilike.%${querySearch}%,pemilik_nama.ilike.%${querySearch}%,alamat.ilike.%${querySearch}%`
    )
  }

  if (queryStatus !== 'all') {
    query = query.eq('status_aktif', queryStatus)
  }

  if (queryTipe !== 'all') {
    query = query.eq('tipe_properti', queryTipe)
  }

  if (queryExclusive !== 'all') {
    query = query.eq('is_exclusive', queryExclusive === 'true')
  }

  const { data: properties, error } = await query

  const { data: marketingList } = await supabase
    .from('marketing')
    .select('id, nama, hp, kode')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  const formatRupiah = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const propertiTypes = [
    { value: 'all', label: 'Semua Tipe' },
    { value: 'rumah', label: 'Rumah' },
    { value: 'gudang', label: 'Gudang' },
    { value: 'town_house', label: 'Town House' },
    { value: 'ruko', label: 'Ruko' },
    { value: 'kavling', label: 'Kavling' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'lainnya', label: 'Lainnya' }
  ]

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'aktif', label: 'Tersedia' },
    { value: 'tersewa', label: 'Tersewa' },
    { value: 'terjual', label: 'Terjual' },
    { value: 'nonaktif', label: 'Nonaktif' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Daftar Properti</h2>
          <p className="text-sm text-zinc-500 font-medium">
            Kelola inventaris listing penjualan dan sewa properti LJ Hooker Semarang Kota.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/properti/tambah"
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Unit Properti</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
        <form method="GET" className="grid gap-4 md:grid-cols-5">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              type="text"
              defaultValue={querySearch}
              placeholder="Cari No. Listing, Alamat, Pemilik..."
              className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 pr-4 pl-11 text-xs text-white outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>

          {/* Tipe Properti Dropdown */}
          <div>
            <select
              name="tipe"
              defaultValue={queryTipe}
              className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-zinc-300 outline-none transition-all duration-300 focus:border-yellow-400/50 focus:bg-white/[0.08]"
            >
              {propertiTypes.map((type) => (
                <option key={type.value} value={type.value} className="bg-[#0F0F11]">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              name="status"
              defaultValue={queryStatus}
              className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-zinc-300 outline-none transition-all duration-300 focus:border-yellow-400/50 focus:bg-white/[0.08]"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value} className="bg-[#0F0F11]">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Submit Button */}
          <div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-white/10"
            >
              <Filter className="h-4 w-4 text-zinc-400" />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid List Section */}
      {!properties || properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/[0.01]">
          <Home className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Properti Ditemukan</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Coba sesuaikan kata kunci pencarian Anda atau tambahkan unit properti baru ke database.
          </p>
        </div>
      ) : (
        <PropertiListClient properties={properties as any} marketingList={marketingList || []} />
      )}
    </div>
  )
}
