'use client'

import React, { useActionState, useState, useEffect } from 'react'
import { updateKonfigurasi } from './actions'
import {
  Percent,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  CalendarRange,
  Loader2
} from 'lucide-react'

interface SystemConfig {
  key: string
  value: string
  keterangan?: string
}

interface KonfigurasiClientProps {
  initialSettings: SystemConfig[]
}

const keyLabels: Record<string, { label: string; unit: string; description: string }> = {
  komisi_default_persen: {
    label: 'Persentase Komisi Standard Agen',
    unit: '%',
    description: 'Tarif pembagian komisi kotor dasar untuk agen pemasaran (default: 3%).'
  },
  ppn_persen: {
    label: 'Pajak Pertambahan Nilai (PPN)',
    unit: '%',
    description: 'Pajak PPN (Inclusive) yang dikenakan dari komisi kotor (default: 10%).'
  },
  pph21_persen: {
    label: 'Pajak Penghasilan (PPh 21) Agen',
    unit: '%',
    description: 'Pajak PPh 21 dari Dasar Pengenaan Pajak (DPP) agen pemasaran (default: 5%).'
  },
  royalti_persen: {
    label: 'Royalti Franchise LJ Hooker Pusat',
    unit: '%',
    description: 'Porsi kontribusi royalti merek franchise ke kantor pusat (default: 10%).'
  },
  jatuh_tempo_exclusive_hari: {
    label: 'Batas Alert Kontrak Eksklusif',
    unit: 'Hari',
    description: 'Rentang waktu hari sebelum kontrak eksklusif berakhir untuk memicu warning (default: 30).'
  },
  jatuh_tempo_sewa_hari: {
    label: 'Batas Alert Masa Sewa Habis',
    unit: 'Hari',
    description: 'Rentang waktu hari sebelum masa sewa unit berakhir untuk memicu warning (default: 30).'
  }
}

export default function KonfigurasiClient({ initialSettings }: KonfigurasiClientProps) {
  // Find initial values
  const getInitialValue = (key: string) => {
    return initialSettings.find((s) => s.key === key)?.value || ''
  }

  const [state, formAction, isPending] = useActionState(updateKonfigurasi, null)
  const [showToast, setShowToast] = useState(false)

  // Trigger toast on success or error
  useEffect(() => {
    if (state?.success || state?.error) {
      setShowToast(true)
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            state?.success
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
              : 'bg-red-950/80 border-red-500/30 text-red-200'
          }`}
        >
          {state?.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          <div className="text-sm font-medium">
            {state?.success || state?.error}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form action={formAction} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Card 1: Komisi & Perpajakan */}
          <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Komisi & Perpajakan</h3>
                <p className="text-xs text-zinc-500">Konfigurasi persentase komisi kotor dan potongan pajak.</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                'komisi_default_persen',
                'ppn_persen',
                'pph21_persen',
                'royalti_persen'
              ].map((key) => {
                const config = keyLabels[key]
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor={key}>
                      {config.label}
                    </label>
                    <div className="relative flex rounded-xl border border-white/10 bg-white/[0.02] transition-all focus-within:border-yellow-400/50 focus-within:ring-1 focus-within:ring-yellow-400/50">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name={key}
                        id={key}
                        defaultValue={getInitialValue(key)}
                        className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
                        required
                        disabled={isPending}
                      />
                      <span className="flex items-center justify-center border-l border-white/10 px-4 text-xs font-semibold text-zinc-500 bg-white/[0.01] rounded-r-xl">
                        {config.unit}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{config.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 2: Pengingat & Jatuh Tempo */}
          <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Pengingat & Jatuh Tempo</h3>
                <p className="text-xs text-zinc-500">Batas toleransi hari peringatan sebelum kontrak kadaluwarsa.</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                'jatuh_tempo_exclusive_hari',
                'jatuh_tempo_sewa_hari'
              ].map((key) => {
                const config = keyLabels[key]
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor={key}>
                      {config.label}
                    </label>
                    <div className="relative flex rounded-xl border border-white/10 bg-white/[0.02] transition-all focus-within:border-yellow-400/50 focus-within:ring-1 focus-within:ring-yellow-400/50">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        name={key}
                        id={key}
                        defaultValue={getInitialValue(key)}
                        className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
                        required
                        disabled={isPending}
                      />
                      <span className="flex items-center justify-center border-l border-white/10 px-4 text-xs font-semibold text-zinc-500 bg-white/[0.01] rounded-r-xl">
                        {config.unit}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{config.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Warning Info */}
            <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4 text-xs text-yellow-400/80 leading-relaxed">
              <strong>Info Sistem:</strong> Parameter hari jatuh tempo ini digunakan untuk memunculkan lencana berwarna kuning (Peringatan) pada dashboard utama serta tabel daftar properti jika masa sewa atau hak eksklusif mendekati tanggal jatuh tempo.
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-end gap-4 border-t border-white/5 pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/10"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
