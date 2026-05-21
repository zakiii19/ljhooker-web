'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const parsed = parseFloat(val)
  return isNaN(parsed) ? null : parsed
}

function parseBoolean(val: any): boolean {
  return val === 'true' || val === 'on' || val === true
}

export async function createProperti(state: any, formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const no_listing = formData.get('no_listing') as string
  const pemilik_nama = formData.get('pemilik_nama') as string
  const alamat = formData.get('alamat') as string
  const imageUrlsStr = formData.get('image_urls') as string
  const imageUrls: string[] = imageUrlsStr ? JSON.parse(imageUrlsStr) : []

  if (!no_listing || !pemilik_nama || !alamat) {
    return { error: 'Nomor Listing, Nama Pemilik, dan Alamat harus diisi.' }
  }

  // Check unique no_listing
  const { data: existing } = await supabase
    .from('properti')
    .select('id')
    .eq('no_listing', no_listing)
    .maybeSingle()

  if (existing) {
    return { error: `Nomor listing "${no_listing}" sudah terdaftar.` }
  }

  const payload = {
    id: id || undefined,
    no_listing,
    pemilik_nama,
    alamat,
    tipe_properti: (formData.get('tipe_properti') as string) || 'rumah',
    tipe_sertifikat: (formData.get('tipe_sertifikat') as string) || 'SHM',
    status_aktif: (formData.get('status_aktif') as string) || 'aktif',
    
    // Financials
    is_for_sale: parseBoolean(formData.get('is_for_sale')),
    harga_jual: parseNumber(formData.get('harga_jual')),
    is_for_rent: parseBoolean(formData.get('is_for_rent')),
    harga_sewa: parseNumber(formData.get('harga_sewa')),
    
    // Specs
    luas_tanah: parseNumber(formData.get('luas_tanah')),
    luas_bangunan: parseNumber(formData.get('luas_bangunan')),
    lebar_tanah: parseNumber(formData.get('lebar_tanah')),
    panjang_tanah: parseNumber(formData.get('panjang_tanah')),
    jumlah_lantai: parseNumber(formData.get('jumlah_lantai')) || 1,
    hadap: (formData.get('hadap') as string) || null,
    kondisi: (formData.get('kondisi') as string) || null,
    listrik_va: parseNumber(formData.get('listrik_va')),
    telepon_lines: parseNumber(formData.get('telepon_lines')) || 0,
    has_pam: parseBoolean(formData.get('has_pam')),
    has_sumur: parseBoolean(formData.get('has_sumur')),
    
    // Rooms & Features
    kamar_tidur_standard: parseNumber(formData.get('kamar_tidur_standard')) || 0,
    kamar_tidur_pembantu: parseNumber(formData.get('kamar_tidur_pembantu')) || 0,
    kamar_mandi_standard: parseNumber(formData.get('kamar_mandi_standard')) || 0,
    kamar_mandi_pembantu: parseNumber(formData.get('kamar_mandi_pembantu')) || 0,
    garasi: parseNumber(formData.get('garasi')) || 0,
    carport: parseNumber(formData.get('carport')) || 0,
    dapur_basah: parseBoolean(formData.get('dapur_basah')),
    dapur_kering: parseBoolean(formData.get('dapur_kering')),
    taman_depan: parseBoolean(formData.get('taman_depan')),
    taman_belakang: parseBoolean(formData.get('taman_belakang')),
    has_gudang: parseBoolean(formData.get('has_gudang')),
    ac_split_count: parseNumber(formData.get('ac_split_count')) || 0,
    is_furnished: parseBoolean(formData.get('is_furnished')),
    
    // Exclusive contract
    is_exclusive: parseBoolean(formData.get('is_exclusive')),
    tgl_jatuh_tempo: (formData.get('tgl_jatuh_tempo') as string) || null,
    
    // Marketing Link
    marketing_id: (formData.get('marketing_id') as string) || null,
    keterangan: (formData.get('keterangan') as string) || null,
  }

  const { data: newProp, error } = await supabase
    .from('properti')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Insert media URLs if any
  if (imageUrls && imageUrls.length > 0) {
    const mediaPayload = imageUrls.map((url, index) => ({
      properti_id: newProp.id,
      media_url: url,
      media_type: 'foto',
      is_primary: index === 0,
      sort_order: index
    }))

    const { error: mediaError } = await supabase
      .from('properti_media')
      .insert(mediaPayload)

    if (mediaError) {
      console.error('Failed to save properti media:', mediaError)
    }
  }

  revalidatePath('/dashboard/properti')
  redirect('/dashboard/properti')
}

export async function updateProperti(id: string, state: any, formData: FormData) {
  const supabase = await createClient()

  const no_listing = formData.get('no_listing') as string
  const pemilik_nama = formData.get('pemilik_nama') as string
  const alamat = formData.get('alamat') as string
  const imageUrlsStr = formData.get('image_urls') as string
  const imageUrls: string[] = imageUrlsStr ? JSON.parse(imageUrlsStr) : []

  if (!no_listing || !pemilik_nama || !alamat) {
    return { error: 'Nomor Listing, Nama Pemilik, dan Alamat harus diisi.' }
  }

  const payload = {
    no_listing,
    pemilik_nama,
    alamat,
    tipe_properti: (formData.get('tipe_properti') as string) || 'rumah',
    tipe_sertifikat: (formData.get('tipe_sertifikat') as string) || 'SHM',
    status_aktif: (formData.get('status_aktif') as string) || 'aktif',
    
    // Financials
    is_for_sale: parseBoolean(formData.get('is_for_sale')),
    harga_jual: parseNumber(formData.get('harga_jual')),
    is_for_rent: parseBoolean(formData.get('is_for_rent')),
    harga_sewa: parseNumber(formData.get('harga_sewa')),
    
    // Specs
    luas_tanah: parseNumber(formData.get('luas_tanah')),
    luas_bangunan: parseNumber(formData.get('luas_bangunan')),
    lebar_tanah: parseNumber(formData.get('lebar_tanah')),
    panjang_tanah: parseNumber(formData.get('panjang_tanah')),
    jumlah_lantai: parseNumber(formData.get('jumlah_lantai')) || 1,
    hadap: (formData.get('hadap') as string) || null,
    kondisi: (formData.get('kondisi') as string) || null,
    listrik_va: parseNumber(formData.get('listrik_va')),
    telepon_lines: parseNumber(formData.get('telepon_lines')) || 0,
    has_pam: parseBoolean(formData.get('has_pam')),
    has_sumur: parseBoolean(formData.get('has_sumur')),
    
    // Rooms & Features
    kamar_tidur_standard: parseNumber(formData.get('kamar_tidur_standard')) || 0,
    kamar_tidur_pembantu: parseNumber(formData.get('kamar_tidur_pembantu')) || 0,
    kamar_mandi_standard: parseNumber(formData.get('kamar_mandi_standard')) || 0,
    kamar_mandi_pembantu: parseNumber(formData.get('kamar_mandi_pembantu')) || 0,
    garasi: parseNumber(formData.get('garasi')) || 0,
    carport: parseNumber(formData.get('carport')) || 0,
    dapur_basah: parseBoolean(formData.get('dapur_basah')),
    dapur_kering: parseBoolean(formData.get('dapur_kering')),
    taman_depan: parseBoolean(formData.get('taman_depan')),
    taman_belakang: parseBoolean(formData.get('taman_belakang')),
    has_gudang: parseBoolean(formData.get('has_gudang')),
    ac_split_count: parseNumber(formData.get('ac_split_count')) || 0,
    is_furnished: parseBoolean(formData.get('is_furnished')),
    
    // Exclusive contract
    is_exclusive: parseBoolean(formData.get('is_exclusive')),
    tgl_jatuh_tempo: (formData.get('tgl_jatuh_tempo') as string) || null,
    
    // Marketing Link
    marketing_id: (formData.get('marketing_id') as string) || null,
    keterangan: (formData.get('keterangan') as string) || null,
  }

  const { error } = await supabase
    .from('properti')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // Sync media: delete existing media first
  const { data: oldMedia } = await supabase
    .from('properti_media')
    .select('media_url')
    .eq('properti_id', id)

  if (oldMedia && oldMedia.length > 0) {
    const deletedUrls = oldMedia
      .map(m => m.media_url)
      .filter(url => !imageUrls.includes(url))

    if (deletedUrls.length > 0) {
      const paths = deletedUrls.map(url => {
        if (!url.startsWith('http')) {
          return url
        }
        const parts = url.split('/properti_media/')
        return parts.length > 1 ? parts[1] : null
      }).filter(Boolean) as string[]

      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('properti_media')
          .remove(paths)
        if (removeError) {
          console.error('Failed to remove deleted files from storage:', removeError)
        }
      }
    }
  }

  const { error: deleteMediaError } = await supabase
    .from('properti_media')
    .delete()
    .eq('properti_id', id)

  if (deleteMediaError) {
    console.error('Failed to clean up old properti media:', deleteMediaError)
  }

  // Insert updated/new media list
  if (imageUrls && imageUrls.length > 0) {
    const mediaPayload = imageUrls.map((url, index) => ({
      properti_id: id,
      media_url: url,
      media_type: 'foto',
      is_primary: index === 0,
      sort_order: index
    }))

    const { error: mediaError } = await supabase
      .from('properti_media')
      .insert(mediaPayload)

    if (mediaError) {
      console.error('Failed to save updated properti media:', mediaError)
    }
  }

  revalidatePath('/dashboard/properti')
  redirect('/dashboard/properti')
}

export async function deleteProperti(id: string) {
  const supabase = await createClient()

  // 1. List and remove all files in the properties/${id} storage folder
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('properti_media')
      .list(`properties/${id}`)

    if (!listError && files && files.length > 0) {
      const pathsToDelete = files.map((file: any) => `properties/${id}/${file.name}`)
      const { error: removeError } = await supabase.storage
        .from('properti_media')
        .remove(pathsToDelete)

      if (removeError) {
        console.error('Failed to delete storage files for properti:', removeError)
      }
    }
  } catch (err) {
    console.error('Error during properti storage deletion:', err)
  }

  // 2. Delete properti from database (cascade deletes properti_media rows)
  const { error } = await supabase.from('properti').delete().eq('id', id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/properti')
  redirect('/dashboard/properti')
}
