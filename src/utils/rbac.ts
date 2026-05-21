import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  
  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch role from public.users profile table
  let { data: profile } = await supabase
    .from('users')
    .select('id, username, nama, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  // 3. Auto-sync profile if not found in database yet
  if (!profile) {
    let metaRole = user.user_metadata.role || 'marketing'
    if (metaRole === 'owner') metaRole = 'principal'

    const newProfile = {
      id: user.id,
      username: user.email!,
      nama: user.user_metadata.nama || 'Pengguna',
      role: metaRole as 'admin' | 'principal' | 'marketing',
      is_active: true
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert(newProfile)

    if (!insertError) {
      profile = newProfile
    } else {
      console.error('RBAC Sync Profile Error:', insertError)
      profile = newProfile
    }
  }

  return { user, profile }
})

export async function checkRole(allowedRoles: ('admin' | 'principal' | 'marketing')[]) {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }
  
  const { user, profile } = session
  const activeRole = (profile.role === 'owner' ? 'principal' : profile.role) as 'admin' | 'principal' | 'marketing'

  if (!allowedRoles.includes(activeRole)) {
    // Redirect unauthorized user back to dashboard home
    redirect('/dashboard?error=access_denied')
  }

  return { user, role: activeRole }
}

export async function getUserRole() {
  const session = await getSessionUser()
  if (!session) return null
  return session.profile.role === 'owner' ? 'principal' : session.profile.role
}
