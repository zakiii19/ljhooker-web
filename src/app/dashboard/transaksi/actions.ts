'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkRole } from '@/utils/rbac'

function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

export async function createTransaksi(state: any, formData: FormData) {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  // 1. Read input fields
  const no_bukti = formData.get('no_bukti') as string
  const tipe = (formData.get('tipe') as 'jual' | 'sewa') || 'jual'
  const properti_id = formData.get('properti_id') as string
  const agent_listing_id = formData.get('agent_listing_id') as string
  const agent_selling_id = formData.get('agent_selling_id') as string
  
  // Buyer / Seller info
  const penjual_nama = formData.get('penjual_nama') as string
  const penjual_ktp = formData.get('penjual_ktp') as string
  const penjual_hp = formData.get('penjual_hp') as string
  const penjual_alamat_lama = formData.get('penjual_alamat_lama') as string
  
  const pembeli_nama = formData.get('pembeli_nama') as string
  const pembeli_ktp = formData.get('pembeli_ktp') as string
  const pembeli_hp = formData.get('pembeli_hp') as string
  const pembeli_alamat_lama = formData.get('pembeli_alamat_lama') as string

  // Financial inputs
  const harga_kesepakatan = parseNumber(formData.get('harga_kesepakatan'))
  const uang_tanda_jadi = parseNumber(formData.get('uang_tanda_jadi'))
  const tgl_transaksi = formData.get('tgl_transaksi') as string
  const tgl_jatuh_tempo_sewa = formData.get('tgl_jatuh_tempo_sewa') as string || null
  const komisi_persen = parseNumber(formData.get('komisi_persen')) // e.g. 3%

  if (!no_bukti || !properti_id || !agent_listing_id || !agent_selling_id || !penjual_nama || !pembeli_nama || harga_kesepakatan <= 0) {
    return { error: 'Lengkapi semua field wajib dan pastikan harga kesepakatan lebih besar dari 0.' }
  }

  // Check unique transaction number
  const { data: existingTrans } = await supabase
    .from('transaksi')
    .select('id')
    .eq('no_bukti', no_bukti)
    .maybeSingle()

  if (existingTrans) {
    return { error: `Nomor bukti transaksi "${no_bukti}" sudah terdaftar.` }
  }

  // 2. Fetch System Settings to get commission parameters
  const { data: settings } = await supabase
    .from('konfigurasi_sistem')
    .select('key, value')

  const ppnPercent = parseNumber(settings?.find((s) => s.key === 'ppn_persen')?.value || '10')
  const royaltiPercent = parseNumber(settings?.find((s) => s.key === 'royalti_persen')?.value || '10')
  const pph21Percent = parseNumber(settings?.find((s) => s.key === 'pph21_persen')?.value || '5')

  // 3. Perform Commission Calculations (Inclusive PPN)
  const total_komisi_gross = harga_kesepakatan * (komisi_persen / 100)
  
  // PPN Inclusive: PPN = Gross - (Gross / (1 + PPN% / 100))
  const potongan_ppn = total_komisi_gross - (total_komisi_gross / (1 + ppnPercent / 100))
  const komisi_setelah_ppn = total_komisi_gross - potongan_ppn

  // Royalty Franchise: 10% from commission after PPN
  const royalti_franchise = komisi_setelah_ppn * (royaltiPercent / 100)

  // PPh 21: 5% applied to DPP (50% of commission after PPN)
  // Formula: DPP = 50% * komisi_setelah_ppn. Tax = DPP * PPh21%
  const potongan_pph21 = komisi_setelah_ppn * 0.5 * (pph21Percent / 100)

  // Take Home Commission (THC)
  const total_komisi_net = total_komisi_gross - potongan_ppn - royalti_franchise - potongan_pph21

  const { data: { user } } = await supabase.auth.getUser()

  // 4. Save Transaksi Table
  const transactionPayload = {
    tipe,
    properti_id,
    marketing_id: agent_selling_id, // Primary marketing handling the closing
    no_bukti,
    tgl_transaksi,
    tgl_jatuh_tempo_sewa: tipe === 'sewa' ? tgl_jatuh_tempo_sewa : null,
    penjual_nama,
    penjual_ktp: penjual_ktp || null,
    penjual_hp: penjual_hp || null,
    penjual_alamat_lama: penjual_alamat_lama || null,
    pembeli_nama,
    pembeli_ktp: pembeli_ktp || null,
    pembeli_hp: pembeli_hp || null,
    pembeli_alamat_lama: pembeli_alamat_lama || null,
    harga_kesepakatan,
    uang_tanda_jadi,
    user_id: user?.id || null
  }

  const { data: transResult, error: transError } = await supabase
    .from('transaksi')
    .insert(transactionPayload)
    .select('id')
    .single()

  if (transError || !transResult) {
    return { error: transError?.message || 'Gagal menyimpan transaksi.' }
  }

  const transaksiId = transResult.id

  // 5. Save Komisi Transaksi Table
  const komisiPayload = {
    transaksi_id: transaksiId,
    tgl_pembagian: tgl_transaksi,
    agent_listing_id,
    agent_selling_id,
    nilai_transaksi: harga_kesepakatan,
    total_komisi_gross,
    potongan_ppn,
    potongan_pph21,
    royalti_franchise,
    total_komisi_net,
    created_by: user?.id || null
  }

  const { data: komisiResult, error: komisiError } = await supabase
    .from('komisi_transaksi')
    .insert(komisiPayload)
    .select('id')
    .single()

  if (komisiError || !komisiResult) {
    // Cleanup transaction on failure (since no native nested transaction wrapper in simple client sdk)
    await supabase.from('transaksi').delete().eq('id', transaksiId)
    return { error: komisiError?.message || 'Gagal menyimpan komisi transaksi.' }
  }

  const komisiId = komisiResult.id

  // 6. Split THC (50% Office, 25% Listing Agent, 25% Selling Agent)
  const officeShare = total_komisi_net * 0.50
  
  // If listing agent and selling agent are the same person, they get full 50%
  let listingShare = total_komisi_net * 0.25
  let sellingShare = total_komisi_net * 0.25

  if (agent_listing_id === agent_selling_id) {
    listingShare = total_komisi_net * 0.50
    sellingShare = 0
  }

  // Fetch names of the agents for record clarity in the details table
  const { data: listingAgentData } = await supabase
    .from('marketing')
    .select('nama')
    .eq('id', agent_listing_id)
    .single()

  const { data: sellingAgentData } = await supabase
    .from('marketing')
    .select('nama')
    .eq('id', agent_selling_id)
    .single()

  const listingName = listingAgentData?.nama || 'Listing Agent'
  const sellingName = sellingAgentData?.nama || 'Selling Agent'

  // Insert Split Details
  const splits = [
    {
      komisi_id: komisiId,
      penerima_nama: 'Office Share (Kantor)',
      nominal: officeShare,
      persentase_share: 50.0
    }
  ]

  if (agent_listing_id === agent_selling_id) {
    splits.push({
      komisi_id: komisiId,
      penerima_nama: `${listingName} (Listing & Selling Agent)`,
      nominal: listingShare,
      persentase_share: 50.0
    })
  } else {
    splits.push(
      {
        komisi_id: komisiId,
        penerima_nama: `${listingName} (Listing Agent)`,
        nominal: listingShare,
        persentase_share: 25.0
      },
      {
        komisi_id: komisiId,
        penerima_nama: `${sellingName} (Selling Agent)`,
        nominal: sellingShare,
        persentase_share: 25.0
      }
    )
  }

  const { error: splitError } = await supabase
    .from('komisi_detail_penerima')
    .insert(splits)

  if (splitError) {
    // Cleanup transaction & commission on failure
    await supabase.from('komisi_transaksi').delete().eq('id', komisiId)
    await supabase.from('transaksi').delete().eq('id', transaksiId)
    return { error: splitError.message }
  }

  // 7. Update status properti to Rented/Sold
  const updatedStatus = tipe === 'sewa' ? 'tersewa' : 'terjual'
  await supabase
    .from('properti')
    .update({ status_aktif: updatedStatus })
    .eq('id', properti_id)

  revalidatePath('/dashboard/transaksi')
  revalidatePath('/dashboard/komisi')
  revalidatePath('/dashboard')
  redirect('/dashboard/transaksi')
}

export async function deleteTransaksi(id: string, propertiId: string) {
  await checkRole(['admin', 'principal'])
  const supabase = await createClient()

  // Delete transaction row (cascades to komisi_transaksi and komisi_detail_penerima)
  const { error } = await supabase.from('transaksi').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // Reset property status back to active (available)
  await supabase
    .from('properti')
    .update({ status_aktif: 'aktif' })
    .eq('id', propertiId)

  revalidatePath('/dashboard/transaksi')
  revalidatePath('/dashboard/komisi')
  revalidatePath('/dashboard')
  redirect('/dashboard/transaksi')
}
