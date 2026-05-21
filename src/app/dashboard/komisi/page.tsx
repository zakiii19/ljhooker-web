import { createClient } from '@/utils/supabase/server'
import { checkRole } from '@/utils/rbac'
import {
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  Award,
  Calendar
} from 'lucide-react'

export const revalidate = 0 // Disable cache for real-time reporting

export default async function KomisiPage() {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  // Fetch all commission details
  const { data: commissions } = await supabase
    .from('komisi_transaksi')
    .select('*, transaksi(*), komisi_detail_penerima(*)')
    .order('tgl_pembagian', { ascending: false })

  // Calculate totals
  const totalGross = commissions?.reduce((acc, c) => acc + parseFloat(c.total_komisi_gross as any), 0) || 0
  const totalPpn = commissions?.reduce((acc, c) => acc + parseFloat(c.potongan_ppn as any), 0) || 0
  const totalRoyalty = commissions?.reduce((acc, c) => acc + parseFloat(c.royalti_franchise as any), 0) || 0
  const totalPph = commissions?.reduce((acc, c) => acc + parseFloat(c.potongan_pph21 as any), 0) || 0
  const totalNet = commissions?.reduce((acc, c) => acc + parseFloat(c.total_komisi_net as any), 0) || 0

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
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Laporan Keuangan Komisi</h2>
        <p className="text-sm text-zinc-500 font-medium">
          Rekapitulasi total pendapatan komisi kotor, potongan operasional, dan distribusi THC agen.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {/* Gross */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-5 shadow-xl">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Komisi Gross</span>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-white truncate">{formatRupiah(totalGross)}</h3>
            <p className="mt-1 text-[10px] text-zinc-500">Pendapatan sebelum potongan</p>
          </div>
        </div>

        {/* PPN */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-5 shadow-xl">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-red-400">Total PPN</span>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-red-400 truncate">-{formatRupiah(totalPpn)}</h3>
            <p className="mt-1 text-[10px] text-zinc-500">Setoran PPN negara</p>
          </div>
        </div>

        {/* Royalty */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-5 shadow-xl">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-red-400">Royalti Franchise</span>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-red-400 truncate">-{formatRupiah(totalRoyalty)}</h3>
            <p className="mt-1 text-[10px] text-zinc-500">Franchise fee pusat 10%</p>
          </div>
        </div>

        {/* PPh 21 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-5 shadow-xl">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-red-400">Pajak PPh 21</span>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-red-400 truncate">-{formatRupiah(totalPph)}</h3>
            <p className="mt-1 text-[10px] text-zinc-500">Pajak penghasilan agen</p>
          </div>
        </div>

        {/* Net (THC) */}
        <div className="rounded-3xl border border-yellow-400/10 bg-yellow-400/5 p-5 shadow-xl">
          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Total THC (Net)</span>
          <div className="mt-3">
            <h3 className="text-lg font-black text-yellow-400 truncate">{formatRupiah(totalNet)}</h3>
            <p className="mt-1 text-[10px] text-yellow-400/75">Sisa bersih siap dibagi</p>
          </div>
        </div>
      </div>

      {/* Detailed Ledger Section */}
      {!commissions || commissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/[0.01]">
          <DollarSign className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Belum Ada Pendapatan Komisi</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Setelah Anda mencatatkan transaksi closing baru, rincian pembagian komisi akan otomatis terbit di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {commissions.map((comm) => (
            <div
              key={comm.id}
              className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl space-y-6"
            >
              {/* Card Header */}
              <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {/* @ts-ignore */}
                    Nomor Nota: {comm.transaksi?.no_bukti}
                  </h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(comm.tgl_pembagian)}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span>Nilai Properti: {formatRupiah(comm.nilai_transaksi)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Sisa THC bersih</span>
                  <span className="text-lg font-black text-yellow-400">{formatRupiah(comm.total_komisi_net)}</span>
                </div>
              </div>

              {/* Grid: Financial detail vs Splits list */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Finance Breakdown */}
                <div className="space-y-3 rounded-2xl bg-white/[0.005] border border-white/5 p-5 text-sm text-zinc-400">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">RINCIAN POTONGAN KANTOR</h5>
                  <div className="flex justify-between">
                    <span>Komisi Kotor:</span>
                    <span className="font-medium text-white">{formatRupiah(comm.total_komisi_gross)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Potongan PPN:</span>
                    <span className="font-medium text-red-400">-{formatRupiah(comm.potongan_ppn)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Royalti Franchise (10%):</span>
                    <span className="font-medium text-red-400">-{formatRupiah(comm.royalti_franchise)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>PPh 21 Agen:</span>
                    <span className="font-medium text-red-400">-{formatRupiah(comm.potongan_pph21)}</span>
                  </div>
                </div>

                {/* Splits Distribution */}
                <div className="space-y-3 rounded-2xl bg-white/[0.005] border border-white/5 p-5 text-sm">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">DISTRIBUSI PEMBAGIAN THC AGEN</h5>
                  
                  <div className="space-y-3">
                    {/* @ts-ignore */}
                    {comm.komisi_detail_penerima?.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            recipient.penerima_nama.includes('Office') 
                              ? 'bg-blue-400' 
                              : 'bg-green-400'
                          }`} />
                          <span className="font-semibold text-zinc-300">{recipient.penerima_nama}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">{formatRupiah(recipient.nominal)}</span>
                          <span className="text-[9px] text-zinc-500 block">Share {recipient.persentase_share}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
