'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BedDouble,
  Bath,
  Maximize2,
  User,
  Printer,
  X,
  FileText
} from 'lucide-react'

interface Property {
  id: string
  no_listing: string
  is_exclusive: boolean
  status_aktif: string
  is_for_sale: boolean
  is_for_rent: boolean
  harga_jual: number | null
  harga_sewa: number | null
  alamat: string
  luas_tanah: number | null
  kamar_tidur_standard: number
  kamar_tidur_pembantu: number
  kamar_mandi_standard: number
  kamar_mandi_pembantu: number
  marketing?: {
    nama: string
  } | null
}

interface Marketing {
  id: string
  nama: string
  hp: string
  kode: string
}

interface PropertiListClientProps {
  properties: Property[]
  marketingList: Marketing[]
}

export default function PropertiListClient({ properties, marketingList }: PropertiListClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Print form states
  const [kepada, setKepada] = useState('')
  const [selectedMarketingId, setSelectedMarketingId] = useState('')
  const [hpMarketing, setHpMarketing] = useState('')
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
    const formatter = new Intl.DateTimeFormat('id-ID', options)
    return formatter.format(today) // e.g., "21 Mei 2026"
  })

  const formatRupiah = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const handleSelectProperty = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger the card link
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(properties.map((p) => p.id))
    }
  }

  const handleMarketingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedMarketingId(id)
    const agent = marketingList.find((m) => m.id === id)
    if (agent) {
      setHpMarketing(agent.hp)
    } else {
      setHpMarketing('')
    }
  }

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.length === 0) return

    const agent = marketingList.find((m) => m.id === selectedMarketingId)
    const marketingName = agent ? agent.nama : ''

    const queryParams = new URLSearchParams({
      ids: selectedIds.join(','),
      kepada,
      dari: marketingName,
      hp: hpMarketing,
      tanggal
    })

    window.open(`/dashboard/properti/cetak-penawaran?${queryParams.toString()}`, '_blank')
    setIsModalOpen(false)
  }

  return (
    <div className="relative">
      {/* Selection Control Panel (Floating/Header style inside list) */}
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
          >
            {selectedIds.length === properties.length ? 'Deselect All' : 'Select All on Page'}
          </button>
          {selectedIds.length > 0 && (
            <span className="text-xs text-zinc-400 font-medium">
              {selectedIds.length} properti terpilih
            </span>
          )}
        </div>
      </div>

      {/* Grid List Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((item) => {
          const isSelected = selectedIds.includes(item.id)
          return (
            <div
              key={item.id}
              className={`group relative flex flex-col rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                isSelected
                  ? 'border-yellow-400 bg-yellow-400/[0.02]'
                  : 'border-white/5 bg-white/[0.01] hover:border-yellow-400/20 hover:bg-white/[0.02]'
              }`}
            >
              {/* Select Checkbox (Overlay top-left) */}
              <div className="absolute top-4 left-4 z-10">
                <button
                  type="button"
                  onClick={(e) => handleSelectProperty(item.id, e)}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/20 bg-black/40 text-transparent hover:border-yellow-400/50'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4.5 w-4.5 stroke-[3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Main Card Content wrapping inside Link */}
              <Link href={`/dashboard/properti/edit/${item.id}`} className="flex flex-col h-full pl-12 pr-6 py-6">
                {/* Header Info Banner */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-500 tracking-wider">
                      {item.no_listing}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.is_exclusive && (
                        <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                          Eksklusif
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.status_aktif === 'aktif'
                            ? 'bg-green-500/10 text-green-400'
                            : item.status_aktif === 'tersewa'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-zinc-700/10 text-zinc-400'
                        }`}
                      >
                        {item.status_aktif === 'aktif' ? 'Tersedia' : item.status_aktif}
                      </span>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="mt-4">
                    {item.is_for_sale && (
                      <h4 className="text-xl font-bold text-white">
                        {formatRupiah(item.harga_jual)}
                        <span className="text-xs font-normal text-zinc-500 ml-1">Jual</span>
                      </h4>
                    )}
                    {item.is_for_rent && (
                      <h4 className={`text-xl font-bold text-white ${item.is_for_sale ? 'mt-1' : ''}`}>
                        {formatRupiah(item.harga_sewa)}
                        <span className="text-xs font-normal text-zinc-500 ml-1">/ Tahun (Sewa)</span>
                      </h4>
                    )}
                  </div>

                  {/* Address */}
                  <p className="mt-2 text-sm text-zinc-400 font-normal line-clamp-2 min-h-[40px]">
                    {item.alamat}
                  </p>
                </div>

                {/* Specs Bar */}
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4 pb-2 text-zinc-500">
                  <div className="flex items-center gap-4 text-xs">
                    {item.luas_tanah && (
                      <div className="flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5 text-zinc-600" />
                        <span>LT {item.luas_tanah} m²</span>
                      </div>
                    )}
                    {item.kamar_tidur_standard !== undefined && (
                      <div className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-zinc-600" />
                        <span>KT {item.kamar_tidur_standard + (item.kamar_tidur_pembantu || 0)}</span>
                      </div>
                    )}
                    {item.kamar_mandi_standard !== undefined && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5 text-zinc-600" />
                        <span>KM {item.kamar_mandi_standard + (item.kamar_mandi_pembantu || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent info */}
                <div className="flex items-center gap-2 border-t border-white/5 bg-white/[0.005] pt-3 text-xs text-zinc-500">
                  <User className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Agent: </span>
                  <span className="font-medium text-zinc-400">{item.marketing?.nama || '-'}</span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Sticky Bottom Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[#0F0F11]/90 px-6 py-4 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 w-[90%] max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {selectedIds.length} Unit Properti Terpilih
              </p>
              <p className="text-xs text-zinc-400">Siap cetak dokumen penawaran</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Batal
            </button>
            {selectedIds.length === 1 && (
              <a
                href={`/dashboard/properti/cetak-brosur?id=${selectedIds[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Cetak Brosur</span>
              </a>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-black transition hover:bg-yellow-500"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Penawaran</span>
            </button>
          </div>
        </div>
      )}

      {/* Print Parameter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#16161A] p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Printer className="h-5 w-5 text-yellow-400" />
                <span>Parameter Cetak Penawaran</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePrintSubmit} className="mt-4 space-y-4">
              {/* Kepada Yth */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Kepada Yth.
                </label>
                <input
                  type="text"
                  required
                  value={kepada}
                  onChange={(e) => setKepada(e.target.value)}
                  placeholder="Nama Penerima Penawaran (contoh: Ibu Shanti)"
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/50"
                />
              </div>

              {/* Dari (Staf Marketing) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Dari (Staf Marketing)
                </label>
                <select
                  required
                  value={selectedMarketingId}
                  onChange={handleMarketingChange}
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-zinc-300 outline-none focus:border-yellow-400/50"
                >
                  <option value="" className="bg-[#0F0F11]">
                    Pilih Staf Marketing
                  </option>
                  {marketingList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0F0F11]">
                      {m.nama} ({m.kode})
                    </option>
                  ))}
                </select>
              </div>

              {/* HP Marketing */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Nomor HP Staf Marketing
                </label>
                <input
                  type="text"
                  required
                  value={hpMarketing}
                  onChange={(e) => setHpMarketing(e.target.value)}
                  placeholder="Nomor HP Staf"
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/50"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Tanggal Dokumen
                </label>
                <input
                  type="text"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  placeholder="Semarang, Tanggal..."
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-500"
                >
                  Cetak Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
