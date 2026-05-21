'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateKonfigurasi(state: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Verify authenticated session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sesi kedaluwarsa. Silakan masuk kembali.' }
  }

  // 2. Fetch role from public.users to ensure role is admin or principal
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || user.user_metadata.role
  if (userRole !== 'admin' && userRole !== 'principal') {
    return { error: 'Anda tidak memiliki wewenang untuk mengubah pengaturan.' }
  }

  const keys = [
    'komisi_default_persen',
    'ppn_persen',
    'pph21_persen',
    'royalti_persen',
    'jatuh_tempo_exclusive_hari',
    'jatuh_tempo_sewa_hari'
  ]

  const updates = []

  for (const key of keys) {
    const valStr = formData.get(key)
    if (valStr === null || valStr === undefined || valStr === '') {
      return { error: `Nilai untuk ${key.replace(/_/g, ' ')} tidak boleh kosong.` }
    }
    const valNum = parseFloat(valStr as string)
    if (isNaN(valNum) || valNum < 0) {
      return { error: `Nilai untuk ${key.replace(/_/g, ' ')} harus berupa angka positif.` }
    }

    // Additional validations for percentages
    if (key.endsWith('_persen') && valNum > 100) {
      return { error: `Persentase ${key.replace(/_/g, ' ')} tidak boleh melebihi 100%.` }
    }

    // Additional validations for days (must be integer)
    if (key.endsWith('_hari')) {
      const valInt = parseInt(valStr as string, 10)
      if (valInt !== valNum) {
        return { error: `Nilai hari untuk ${key.replace(/_/g, ' ')} harus berupa bilangan bulat.` }
      }
    }

    updates.push({
      key,
      value: valStr as string,
      updated_at: new Date().toISOString()
    })
  }

  // 3. Upsert into database
  const { error } = await supabase
    .from('konfigurasi_sistem')
    .upsert(updates, { onConflict: 'key' })

  if (error) {
    console.error('Update Konfigurasi Error:', error)
    return { error: `Gagal memperbarui konfigurasi: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/konfigurasi')
  revalidatePath('/dashboard/transaksi/tambah')

  return { success: 'Pengaturan sistem berhasil diperbarui.' }
}
