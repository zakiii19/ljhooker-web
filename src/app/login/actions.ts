'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(state: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password harus diisi.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Sync user profile to public.users table if it doesn't exist
  if (data.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) {
      await supabase.from('users').insert({
        id: data.user.id,
        username: data.user.email!,
        nama: data.user.user_metadata.nama || 'Staf Marketing',
        role: (data.user.user_metadata.role || 'marketing') as 'admin' | 'principal' | 'marketing',
        is_active: true
      })
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(state: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nama = formData.get('nama') as string
  const role = (formData.get('role') as string) || 'marketing'

  if (!email || !password || !nama) {
    return { error: 'Nama, Email, dan Password harus diisi.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create profile in public.users
  if (data.user) {
    const { error: profileError } = await supabase.from('users').upsert({
      id: data.user.id,
      username: email,
      nama,
      role: role as 'admin' | 'principal' | 'marketing',
      is_active: true
    })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  return { success: 'Pendaftaran berhasil! Silakan login.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
