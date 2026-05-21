import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { checkRole } from '@/utils/rbac'
import KonfigurasiClient from './KonfigurasiClient'
import { Settings } from 'lucide-react'

export const revalidate = 0 // Disable cache for real-time updates

export default async function KonfigurasiPage() {
  // 1. Verify user role: only Admin or Principal allowed
  await checkRole(['admin', 'principal'])

  // 2. Fetch configurations
  const supabase = await createClient()
  const { data: settings, error } = await supabase
    .from('konfigurasi_sistem')
    .select('key, value, keterangan')
    .order('key', { ascending: true })

  if (error) {
    console.error('Error fetching konfigurasi_sistem:', error)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Pengaturan Sistem</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Konfigurasi tarif komisi standard, pembagian porsi pajak, dan parameter jatuh tempo.
          </p>
        </div>
      </div>

      {/* Main Configurations Client Component */}
      <KonfigurasiClient initialSettings={settings || []} />
    </div>
  )
}
