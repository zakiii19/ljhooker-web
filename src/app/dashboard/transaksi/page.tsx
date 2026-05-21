import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { checkRole } from '@/utils/rbac'
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react'
import { deleteTransaksi } from './actions'

export const revalidate = 0 // Disable cache for real-time updates

interface SearchParams {
  search?: string
}

export default async function TransaksiPage(props: { searchParams: Promise<SearchParams> }) {
  await checkRole(['admin', 'principal'])
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const querySearch = searchParams.search || ''

  let query = supabase
    .from('transaksi')
    .select('*, properti(*), marketing(nama)')
    .order('tgl_transaksi', { ascending: false })

  if (querySearch) {
    query = query.or(
      `no_bukti.ilike.%${querySearch}%,penjual_nama.ilike.%${querySearch}%,pembeli_nama.ilike.%${querySearch}%`
    )
  }

  const { data: transactions } = await query

  const formatRupiah = (num: number) => {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Buku Transaksi</h2>
          <p className="text-sm text-zinc-500 font-medium">
            Catat dan pantau transaksi penjualan & penyewaan properti yang berhasil diselesaikan.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/transaksi/tambah"
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Transaksi Baru</span>
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
              placeholder="Cari transaksi berdasarkan No. Bukti, Nama Penjual, atau Pembeli..."
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

      {/* Grid List or Table Section */}
      {!transactions || transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/[0.01]">
          <FileText className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Transaksi</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Belum ada transaksi properti yang dicatatkan di database Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">No. Transaksi</th>
                  <th className="px-6 py-4">Properti (Alamat)</th>
                  <th className="px-6 py-4">Pihak Terlibat</th>
                  <th className="px-6 py-4">Nilai Deal</th>
                  <th className="px-6 py-4">Tanggal Closing</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((trans) => (
                  <tr key={trans.id} className="group hover:bg-white/[0.005] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {trans.no_bukti}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md mt-1 px-2 py-0.5 text-[9px] font-bold uppercase ${
                          trans.tipe === 'jual'
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {trans.tipe}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-300 max-w-[220px] truncate">
                        {/* @ts-ignore */}
                        {trans.properti?.alamat || '-'}
                      </p>
                      <span className="text-[10px] text-zinc-500">
                        {/* @ts-ignore */}
                        No. Listing: {trans.properti?.no_listing}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300 text-xs font-medium">
                        Penjual: <span className="text-white">{trans.penjual_nama}</span>
                      </div>
                      <div className="text-zinc-300 text-xs font-medium mt-0.5">
                        Pembeli: <span className="text-white">{trans.pembeli_nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatRupiah(trans.harga_kesepakatan)}
                      <div className="text-[9px] font-normal text-zinc-500 mt-0.5">
                        DP: {formatRupiah(trans.uang_tanda_jadi)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{formatDate(trans.tgl_transaksi)}</span>
                      </div>
                      {trans.tipe === 'sewa' && trans.tgl_jatuh_tempo_sewa && (
                        <div className="text-[10px] text-purple-400 mt-1">
                          Sewa Habis: {formatDate(trans.tgl_jatuh_tempo_sewa)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <form
                        action={async () => {
                          'use server'
                          await deleteTransaksi(trans.id, trans.properti_id)
                        }}
                        className="inline"
                      >
                        <button
                          type="submit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 transition-all duration-300 hover:bg-red-500/20 hover:text-red-300 active:scale-95"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
