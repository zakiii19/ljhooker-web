'use client'

import { useState, useTransition } from 'react'
import { login, signup } from './actions'
import { KeyRound, Mail, User, ShieldAlert, CheckCircle, Shield } from 'lucide-react'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      if (mode === 'login') {
        const result = await login(null, formData)
        if (result && result.error) {
          setError(result.error)
        }
      } else {
        const result = await signup(null, formData)
        if (result && result.error) {
          setError(result.error)
        } else if (result && result.success) {
          setSuccess(result.success)
          setMode('login')
        }
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F11] font-sans text-zinc-200">
      {/* Background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[120px]" />

      <div className="relative w-full max-w-md px-6 py-12">
        {/* Brand Logo / Title */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            LJ HOOKER <span className="text-yellow-400 font-medium">Semarang Kota</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sistem Manajemen Properti & Pembagian Komisi
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="mb-8 flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => {
                setMode('login')
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setMode('signup')
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    name="nama"
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pr-4 pl-11 text-sm outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pr-4 pl-11 text-sm outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pr-4 pl-11 text-sm outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Role / Jabatan
                </label>
                <select
                  name="role"
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm outline-none transition-all duration-300 focus:border-yellow-400/50 focus:bg-white/[0.08]"
                >
                  <option value="marketing" className="bg-[#0F0F11]">Staf Marketing</option>
                  <option value="principal" className="bg-[#0F0F11]">Principal / Broker Owner</option>
                  <option value="admin" className="bg-[#0F0F11]">Administrator Kantor</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : mode === 'login' ? (
                'Masuk ke Sistem'
              ) : (
                'Daftar Akun Baru'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
