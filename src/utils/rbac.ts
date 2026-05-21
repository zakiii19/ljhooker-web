import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function checkRole(allowedRoles: ('admin' | 'principal' | 'marketing')[]) {
  const supabase = await createClient()
  
  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role from public.users profile table
  let { data: profile } = await supabase
    .from('users')
    .select('role')
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
      profile = { role: newProfile.role }
    } else {
      console.error('RBAC Sync Profile Error:', insertError)
      profile = { role: newProfile.role }
    }
  }

  // Handle mapping owner -> principal
  const activeRole = (profile.role === 'owner' ? 'principal' : profile.role) as 'admin' | 'principal' | 'marketing'

  if (!allowedRoles.includes(activeRole)) {
    // Redirect unauthorized user back to dashboard home
    redirect('/dashboard?error=access_denied')
  }

  return { user, role: activeRole }
}

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    let metaRole = user.user_metadata.role || 'marketing'
    if (metaRole === 'owner') metaRole = 'principal'
    return metaRole
  }

  return profile.role === 'owner' ? 'principal' : profile.role
}
