import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import EditPropertiForm from './EditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPropertiPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the property along with its media files
  const { data: properti, error } = await supabase
    .from('properti')
    .select('*, properti_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !properti) {
    notFound()
  }

  // Fetch active marketing agents
  const { data: marketingAgents } = await supabase
    .from('marketing')
    .select('id, kode, nama')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  // Sort the media by sort_order
  if (properti.properti_media) {
    properti.properti_media.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Edit Properti</h2>
        <p className="text-sm text-zinc-500">
          Ubah informasi detail unit properti dan perbarui foto dokumentasi.
        </p>
      </div>
      <EditPropertiForm properti={properti} marketingAgents={marketingAgents || []} />
    </div>
  )
}
