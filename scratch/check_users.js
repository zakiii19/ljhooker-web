const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xcugnkjhiovyzncsvtoz.supabase.co',
  'sb_publishable_kw0VL5Brqr73pfytgqVUbg__gcUOsou'
)

async function main() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    console.error('Error fetching users:', error)
  } else {
    console.log('Users in database:', data)
  }
}
main()
