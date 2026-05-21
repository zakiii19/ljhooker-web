'use client'

import { useState, useTransition } from 'react'
import { createMarketing } from '../actions'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function TambahMarketingForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createMarketing(null, formData)
      if (result && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Glass Card */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kode Agen (Kode Marketing) *</label>
            <input
              name="kode"
              type="text"
              required
              placeholder="Contoh: AG-001, AG-002"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Lengkap *</label>
            <input
              name="nama"
              type="text"
              required
              placeholder="Nama lengkap staf marketing"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">No. HP / Mobile *</label>
            <input
              name="hp"
              type="text"
              required
              placeholder="Contoh: 08123456789"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nomor Telepon Rumah/Kantor</label>
            <input
              name="telepon"
              type="text"
              placeholder="Contoh: 024-123456"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">WhatsApp / BBM Pin</label>
            <input
              name="bbm_pin"
              type="text"
              placeholder="PIN atau nomor WA"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Alamat Tinggal Staf</label>
          <textarea
            name="alamat"
            rows={3}
            placeholder="Masukkan alamat lengkap rumah tinggal staf marketing saat ini"
            className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/dashboard/marketing"
          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Batal</span>
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan Staf</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
