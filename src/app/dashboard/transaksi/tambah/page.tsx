import { createClient } from '@/utils/supabase/server'
import TambahTransaksiForm from './TambahForm'
import { checkRole } from '@/utils/rbac'

export default async function TambahTransaksiPage() {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  // 1. Fetch available properties
  const { data: properties } = await supabase
    .from('properti')
    .select('id, no_listing, alamat, harga_jual, harga_sewa, is_for_sale, is_for_rent, marketing_id')
    .eq('status_aktif', 'aktif')
    .order('no_listing', { ascending: true })

  // 2. Fetch marketing agents
  const { data: agents } = await supabase
    .from('marketing')
    .select('id, kode, nama')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  // 3. Fetch configurations for calculations
  const { data: settings } = await supabase
    .from('konfigurasi_sistem')
    .select('key, value')

  const ppn = parseFloat(settings?.find((s) => s.key === 'ppn_persen')?.value || '10')
  const royalti = parseFloat(settings?.find((s) => s.key === 'royalti_persen')?.value || '10')
  const pph21 = parseFloat(settings?.find((s) => s.key === 'pph21_persen')?.value || '5')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Catat Transaksi Closing</h2>
        <p className="text-sm text-zinc-500">
          Catatkan transaksi baru untuk menghitung pembagian komisi secara real-time.
        </p>
      </div>
      <TambahTransaksiForm
        properties={properties || []}
        agents={agents || []}
        rules={{ ppn, royalti, pph21 }}
      />
    </div>
  )
}
