'use client'

import { useState, useTransition, useEffect } from 'react'
import { createTransaksi } from '../actions'
import { AlertCircle, ArrowLeft, Save, Calculator, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Property {
  id: string
  no_listing: string
  alamat: string
  harga_jual: number | null
  harga_sewa: number | null
  is_for_sale: boolean
  is_for_rent: boolean
  marketing_id: string | null
}

interface Agent {
  id: string
  kode: string
  nama: string
}

interface Rules {
  ppn: number
  royalti: number
  pph21: number
}

function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

export default function TambahTransaksiForm({
  properties,
  agents,
  rules
}: {
  properties: Property[]
  agents: Agent[]
  rules: Rules
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [tipe, setTipe] = useState<'jual' | 'sewa'>('jual')
  const [hargaKesepakatan, setHargaKesepakatan] = useState(0)
  const [komisiPersen, setKomisiPersen] = useState(3) // Default 3%
  const [agentListingId, setAgentListingId] = useState('')
  const [agentSellingId, setAgentSellingId] = useState('')

  // Calculations State
  const [grossCommission, setGrossCommission] = useState(0)
  const [ppnAmount, setPpnAmount] = useState(0)
  const [royaltyAmount, setRoyaltyAmount] = useState(0)
  const [pphAmount, setPphAmount] = useState(0)
  const [netCommission, setNetCommission] = useState(0)
  
  const [officeShare, setOfficeShare] = useState(0)
  const [listingShare, setListingShare] = useState(0)
  const [sellingShare, setSellingShare] = useState(0)

  // 1. Update form based on property selection
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    const prop = properties.find((p) => p.id === propertyId)
    if (prop) {
      // Determine type
      const defaultType = prop.is_for_sale ? 'jual' : 'sewa'
      setTipe(defaultType)
      
      // Set default price
      const defaultPrice = defaultType === 'jual' ? (prop.harga_jual || 0) : (prop.harga_sewa || 0)
      setHargaKesepakatan(defaultPrice)
      
      // Pre-select Listing Agent
      if (prop.marketing_id) {
        setAgentListingId(prop.marketing_id)
      } else {
        setAgentListingId('')
      }
    }
  }

  // 2. Perform client-side calculations in real-time
  useEffect(() => {
    // Gross Commission
    const gross = hargaKesepakatan * (komisiPersen / 100)
    setGrossCommission(gross)

    // PPN Inclusive
    // Formula: PPN = Gross - (Gross / (1 + PPN% / 100))
    const ppn = gross - (gross / (1 + rules.ppn / 100))
    setPpnAmount(ppn)
    
    const baseAfterPpn = gross - ppn

    // Royalty: 10% of commission after PPN
    const royalty = baseAfterPpn * (rules.royalti / 100)
    setRoyaltyAmount(royalty)

    // PPh 21: 5% of DPP (50% of commission after PPN)
    const pph = baseAfterPpn * 0.5 * (rules.pph21 / 100)
    setPphAmount(pph)

    // Net Take Home Commission (THC)
    const net = gross - ppn - royalty - pph
    setNetCommission(net)

    // Split Distributions (50% Office, 25% Listing, 25% Selling)
    setOfficeShare(net * 0.50)

    if (agentListingId && agentSellingId) {
      if (agentListingId === agentSellingId) {
        setListingShare(net * 0.50)
        setSellingShare(0)
      } else {
        setListingShare(net * 0.25)
        setSellingShare(net * 0.25)
      }
    } else {
      setListingShare(0)
      setSellingShare(0)
    }

  }, [hargaKesepakatan, komisiPersen, agentListingId, agentSellingId, rules, tipe])

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!selectedPropertyId) {
      setError('Silakan pilih unit properti terlebih dahulu.')
      return
    }

    if (!agentListingId || !agentSellingId) {
      setError('Silakan tentukan Listing Agent dan Selling Agent.')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('tipe', tipe)
    
    startTransition(async () => {
      const result = await createTransaksi(null, formData)
      if (result && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout: Form vs Realtime Calculator Panel */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Form Inputs (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section A: Properti & Transaksi */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 space-y-5 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400">1. Data Properti & Transaksi</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pilih Unit Properti *</label>
              <select
                name="properti_id"
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              >
                <option value="" className="bg-[#0F0F11]">-- Pilih Unit Listing Aktif --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0F0F11]">
                    {p.no_listing} - {p.alamat.substring(0, 45)}...
                  </option>
                ))}
              </select>
              {properties.length === 0 && (
                <p className="text-[10px] text-yellow-500/80 mt-1">
                  * Belum ada unit properti dengan status "Tersedia" di database. Silakan tambah properti terlebih dahulu.
                </p>
              )}
            </div>

            {selectedPropertyId && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">No. Bukti Transaksi (No. Nota) *</label>
                  <input
                    name="no_bukti"
                    type="text"
                    required
                    placeholder="Contoh: TRX-2026-001"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipe Transaksi</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipe('jual')}
                      className={`flex-1 rounded-xl py-3 text-xs font-semibold border transition-all duration-300 ${
                        tipe === 'jual'
                          ? 'bg-yellow-400 text-black border-yellow-400'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Jual (Penjualan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipe('sewa')}
                      className={`flex-1 rounded-xl py-3 text-xs font-semibold border transition-all duration-300 ${
                        tipe === 'sewa'
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Sewa (Penyewaan)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Detail Legal Pihak (Buyer / Seller) */}
          {selectedPropertyId && (
            <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 space-y-6 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400">2. Pihak Penjual & Pembeli</h3>
              
              {/* Seller */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 border-b border-white/5 pb-2">DATA PIHAK KESATU (PENJUAL / PEMILIK)</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nama Penjual *</label>
                    <input
                      name="penjual_nama"
                      type="text"
                      required
                      placeholder="Nama lengkap penjual"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">No. HP Penjual</label>
                    <input
                      name="penjual_hp"
                      type="text"
                      placeholder="Nomor HP"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">No. KTP Penjual</label>
                    <input
                      name="penjual_ktp"
                      type="text"
                      placeholder="NIK KTP"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Alamat Asal Penjual</label>
                    <input
                      name="penjual_alamat_lama"
                      type="text"
                      placeholder="Alamat asal"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-zinc-400 border-b border-white/5 pb-2">DATA PIHAK KEDUA (PEMBELI / PENYEWA)</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nama Pembeli *</label>
                    <input
                      name="pembeli_nama"
                      type="text"
                      required
                      placeholder="Nama lengkap pembeli/penyewa"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">No. HP Pembeli</label>
                    <input
                      name="pembeli_hp"
                      type="text"
                      placeholder="Nomor HP"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">No. KTP Pembeli</label>
                    <input
                      name="pembeli_ktp"
                      type="text"
                      placeholder="NIK KTP"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Alamat Asal Pembeli</label>
                    <input
                      name="pembeli_alamat_lama"
                      type="text"
                      placeholder="Alamat asal"
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-xs text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section C: Financial & Closing */}
          {selectedPropertyId && (
            <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 space-y-5 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400">3. Nilai Transaksi & Tanggal</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Harga Kesepakatan (IDR) *</label>
                  <input
                    name="harga_kesepakatan"
                    type="number"
                    required
                    value={hargaKesepakatan || ''}
                    onChange={(e) => setHargaKesepakatan(parseNumber(e.target.value))}
                    placeholder="Harga deal akhir properti"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Uang Tanda Jadi / DP (IDR)</label>
                  <input
                    name="uang_tanda_jadi"
                    type="number"
                    placeholder="Nilai uang muka"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Komisi Gross (%)</label>
                  <input
                    name="komisi_persen"
                    type="number"
                    step="0.1"
                    required
                    value={komisiPersen}
                    onChange={(e) => setKomisiPersen(parseNumber(e.target.value))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tgl. Closing Transaksi *</label>
                  <input
                    name="tgl_transaksi"
                    type="date"
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
                {tipe === 'sewa' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-bold">Tgl. Jatuh Tempo Sewa *</label>
                    <input
                      name="tgl_jatuh_tempo_sewa"
                      type="date"
                      required
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                    />
                  </div>
                )}
              </div>

              {/* Agents selection */}
              <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Listing Agent (Pencari Properti) *</label>
                  <select
                    name="agent_listing_id"
                    value={agentListingId}
                    onChange={(e) => setAgentListingId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50"
                  >
                    <option value="" className="bg-[#0F0F11]">-- Pilih Listing Agent --</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#0F0F11]">{a.nama} ({a.kode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Selling Agent (Penjual Unit) *</label>
                  <select
                    name="agent_selling_id"
                    value={agentSellingId}
                    onChange={(e) => setAgentSellingId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50"
                  >
                    <option value="" className="bg-[#0F0F11]">-- Pilih Selling Agent --</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#0F0F11]">{a.nama} ({a.kode})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Live Calculator Visualizer (1/3 width) */}
        <div className="space-y-6">
          <div className="sticky top-6 rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
              <Calculator className="h-4.5 w-4.5 text-yellow-400" />
              Live Komisi Kalkulator
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Harga Deal:</span>
                <span className="font-semibold text-white">{formatRupiah(hargaKesepakatan)}</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-b border-white/5 pb-3">
                <span>Tarif Komisi ({komisiPersen}%):</span>
                <span className="font-semibold text-white">{formatRupiah(grossCommission)}</span>
              </div>

              {/* Deductions */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Potongan Sistem & Kantor</h4>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    PPn Inclusive ({rules.ppn}%):
                  </span>
                  <span className="font-medium text-red-400">-{formatRupiah(ppnAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Royalti Franchise ({rules.royalti}%):</span>
                  <span className="font-medium text-red-400">-{formatRupiah(royaltyAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-3">
                  <span>PPh 21 Agen ({rules.pph21}% dari 50%):</span>
                  <span className="font-medium text-red-400">-{formatRupiah(pphAmount)}</span>
                </div>
              </div>

              {/* Total Net Commission */}
              <div className="rounded-2xl bg-yellow-400/5 border border-yellow-400/10 p-4 space-y-1">
                <span className="text-xs text-yellow-400/80 font-medium">Sisa THC (Take Home Commission):</span>
                <div className="text-xl font-black text-yellow-400">{formatRupiah(netCommission)}</div>
              </div>

              {/* Splits Distributions */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Distribusi Sisa THC</h4>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Porsi Kantor (50%):</span>
                  <span className="font-semibold text-white">{formatRupiah(officeShare)}</span>
                </div>
                
                {agentListingId && agentSellingId ? (
                  agentListingId === agentSellingId ? (
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Listing & Selling (50%):</span>
                      <span className="font-semibold text-green-400">{formatRupiah(listingShare)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Porsi Listing Agent (25%):</span>
                        <span className="font-semibold text-green-400">{formatRupiah(listingShare)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Porsi Selling Agent (25%):</span>
                        <span className="font-semibold text-green-400">{formatRupiah(sellingShare)}</span>
                      </div>
                    </>
                  )
                ) : (
                  <p className="text-[10px] text-zinc-600 italic">
                    * Pilih Listing & Selling Agent untuk melihat pembagian porsi agen.
                  </p>
                )}
              </div>
            </div>

            {/* Warning info */}
            <div className="text-[10px] text-zinc-500 leading-normal border-t border-white/5 pt-4">
              * Perhitungan ini mengikuti parameter konfigurasi aktif LJ Hooker Semarang Kota. PPN bersifat inclusive (sudah termasuk dalam komisi kotor).
            </div>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4 border-t border-white/5 pt-6">
        <Link
          href="/dashboard/transaksi"
          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Batal</span>
        </Link>
        <button
          type="submit"
          disabled={isPending || !selectedPropertyId}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan & Bagikan Komisi</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
