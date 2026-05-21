'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkRole } from '@/utils/rbac'

export async function createMarketing(state: any, formData: FormData) {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  const kode = formData.get('kode') as string
  const nama = formData.get('nama') as string
  const hp = formData.get('hp') as string
  const alamat = formData.get('alamat') as string
  const telepon = formData.get('telepon') as string
  const bbm_pin = formData.get('bbm_pin') as string

  if (!kode || !nama || !hp) {
    return { error: 'Kode Marketing, Nama, dan HP harus diisi.' }
  }

  // Check unique kode
  const { data: existing } = await supabase
    .from('marketing')
    .select('id')
    .eq('kode', kode)
    .maybeSingle()

  if (existing) {
    return { error: `Kode marketing "${kode}" sudah terdaftar.` }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    kode,
    nama,
    hp,
    alamat: alamat || null,
    telepon: telepon || null,
    bbm_pin: bbm_pin || null,
    is_active: true,
    last_modified_by: user?.id || null
  }

  const { error } = await supabase.from('marketing').insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/marketing')
  revalidatePath('/dashboard/properti/tambah')
  redirect('/dashboard/marketing')
}

export async function updateMarketing(id: string, state: any, formData: FormData) {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  const kode = formData.get('kode') as string
  const nama = formData.get('nama') as string
  const hp = formData.get('hp') as string
  const alamat = formData.get('alamat') as string
  const telepon = formData.get('telepon') as string
  const bbm_pin = formData.get('bbm_pin') as string
  const is_active = formData.get('is_active') === 'true'

  if (!kode || !nama || !hp) {
    return { error: 'Kode Marketing, Nama, dan HP harus diisi.' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    kode,
    nama,
    hp,
    alamat: alamat || null,
    telepon: telepon || null,
    bbm_pin: bbm_pin || null,
    is_active,
    last_modified_by: user?.id || null
  }

  const { error } = await supabase
    .from('marketing')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/marketing')
  revalidatePath('/dashboard/properti/tambah')
  redirect('/dashboard/marketing')
}
