import { createClient } from '@/utils/supabase/server'
import TambahPropertiForm from './TambahForm'

export default async function TambahPropertiPage() {
  const supabase = await createClient()
  const { data: marketingAgents } = await supabase
    .from('marketing')
    .select('id, kode, nama')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Tambah Properti Baru</h2>
        <p className="text-sm text-zinc-500">
          Masukkan detail unit properti baru beserta relasi marketing pendampingnya.
        </p>
      </div>
      <TambahPropertiForm marketingAgents={marketingAgents || []} />
    </div>
  )
}
