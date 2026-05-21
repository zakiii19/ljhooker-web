import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { checkRole } from '@/utils/rbac'
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Edit2
} from 'lucide-react'

export const revalidate = 0 // Disable cache for real-time data

interface SearchParams {
  search?: string
}

export default async function MarketingPage(props: { searchParams: Promise<SearchParams> }) {
  await checkRole(['admin', 'principal'])
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const querySearch = searchParams.search || ''

  let query = supabase
    .from('marketing')
    .select('*')
    .order('nama', { ascending: true })

  if (querySearch) {
    query = query.or(`nama.ilike.%${querySearch}%,kode.ilike.%${querySearch}%`)
  }

  const { data: agents } = await query

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Staf Marketing</h2>
          <p className="text-sm text-zinc-500 font-medium">
            Kelola agen properti terdaftar pada LJ Hooker Semarang Kota.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/marketing/tambah"
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Staf Marketing</span>
          </Link>
        </div>
      </div>

      {/* Search Bar Card */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-md">
        <form method="GET" className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              type="text"
              defaultValue={querySearch}
              placeholder="Cari Staf berdasarkan Nama atau Kode Agen..."
              className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 pr-4 pl-11 text-xs text-white outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-white/10"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Grid List Section */}
      {!agents || agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/[0.01]">
          <Users className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Staf Marketing Tidak Ditemukan</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Belum ada agen terdaftar atau kata kunci pencarian Anda tidak cocok.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative flex flex-col rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl transition-all duration-300 hover:border-yellow-400/20 hover:bg-white/[0.02]"
            >
              {/* Agent card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg font-bold text-lg">
                    {agent.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {agent.nama}
                    </h4>
                    <span className="text-xs font-medium text-zinc-500">Kode Agen: {agent.kode}</span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/marketing/edit/${agent.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-400 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  <Edit2 className="h-4 w-4" />
                </Link>
              </div>

              {/* Specs & Info */}
              <div className="mt-6 space-y-3 border-t border-white/5 pt-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-zinc-600" />
                  <span>{agent.hp} {agent.telepon ? `/ ${agent.telepon}` : ''}</span>
                </div>
                {agent.alamat && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{agent.alamat}</span>
                  </div>
                )}
                {agent.bbm_pin && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-zinc-600 border border-zinc-700/60 rounded px-1.5 py-0.5">WA/BBM</span>
                    <span>{agent.bbm_pin}</span>
                  </div>
                )}
              </div>

              {/* Status footer */}
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                <span className="text-zinc-500">Status Keaktifan</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    agent.is_active ? 'text-green-400' : 'text-zinc-500'
                  }`}
                >
                  {agent.is_active ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Aktif</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Nonaktif</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
