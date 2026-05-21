'use client'

import { useState, useTransition, useEffect } from 'react'
import { createProperti } from '../actions'
import { AlertCircle, ArrowLeft, Save, Sparkles, Camera, UploadCloud, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface MarketingAgent {
  id: string
  kode: string
  nama: string
}

interface ImageItem {
  id: string
  file: File
  preview: string
}

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const max_size = 1200

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width
            width = max_size
          }
        } else {
          if (height > max_size) {
            width *= max_size / height
            height = max_size
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create Blob from canvas'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

export default function TambahPropertiForm({
  marketingAgents
}: {
  marketingAgents: MarketingAgent[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  
  // Interactive conditional states
  const [isForSale, setIsForSale] = useState(true)
  const [isForRent, setIsForRent] = useState(false)
  const [isExclusive, setIsExclusive] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview))
    }
  }, [images])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file)
      }))
      setImages((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id)
      if (item) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images]
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      const temp = newImages[index]
      newImages[index] = newImages[targetIndex]
      newImages[targetIndex] = temp
      setImages(newImages)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!isForSale && !isForRent) {
      setError('Properti harus dipilih minimal untuk Jual atau Sewa.')
      return
    }

    const formData = new FormData(e.currentTarget)
    
    // Explicitly append boolean check states that HTML forms exclude if unchecked
    formData.set('is_for_sale', isForSale.toString())
    formData.set('is_for_rent', isForRent.toString())
    formData.set('is_exclusive', isExclusive.toString())

    const propertiId = crypto.randomUUID()
    formData.set('id', propertiId)

    startTransition(async () => {
      try {
        const uploadedUrls: string[] = []
        const supabase = createClient()

        for (let i = 0; i < images.length; i++) {
          const item = images[i]
          setUploadStatus(`Mengompresi gambar ke-${i + 1}...`)
          const compressedBlob = await compressImage(item.file)

          setUploadStatus(`Mengunggah gambar ke-${i + 1} dari ${images.length}...`)
          
          const filename = `properties/${propertiId}/${i}_${Date.now()}.jpg`
          
          const { data, error: uploadError } = await supabase.storage
            .from('properti_media')
            .upload(filename, compressedBlob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) {
            throw new Error(`Gagal mengunggah gambar ${i + 1}: ${uploadError.message}`)
          }

          const { data: { publicUrl } } = supabase.storage
            .from('properti_media')
            .getPublicUrl(filename)

          uploadedUrls.push(publicUrl)
        }

        formData.set('image_urls', JSON.stringify(uploadedUrls))
        setUploadStatus('Menyimpan data properti...')

        const result = await createProperti(null, formData)
        if (result && result.error) {
          setError(result.error)
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengunggah gambar.')
      } finally {
        setUploadStatus(null)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Glassmorphic Card */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 shadow-2xl backdrop-blur-md space-y-8">
        
        {/* Section 1: Informasi Dasar */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400 text-xs">1</span>
            Informasi Dasar
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">No. Listing (No Bukti) *</label>
              <input
                name="no_listing"
                type="text"
                required
                placeholder="Contoh: R-1234 atau S-5678"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Pemilik Properti *</label>
              <input
                name="pemilik_nama"
                type="text"
                required
                placeholder="Nama pemilik sah unit properti"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipe Properti</label>
              <select
                name="tipe_properti"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              >
                <option value="rumah" className="bg-[#0F0F11]">Rumah</option>
                <option value="gudang" className="bg-[#0F0F11]">Gudang</option>
                <option value="town_house" className="bg-[#0F0F11]">Town House</option>
                <option value="ruko" className="bg-[#0F0F11]">Ruko</option>
                <option value="kavling" className="bg-[#0F0F11]">Kavling</option>
                <option value="apartment" className="bg-[#0F0F11]">Apartment</option>
                <option value="lainnya" className="bg-[#0F0F11]">Lainnya</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Listing</label>
              <select
                name="status_aktif"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              >
                <option value="aktif" className="bg-[#0F0F11]">Tersedia / Aktif</option>
                <option value="tersewa" className="bg-[#0F0F11]">Tersewa</option>
                <option value="terjual" className="bg-[#0F0F11]">Terjual</option>
                <option value="nonaktif" className="bg-[#0F0F11]">Nonaktif</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Alamat Lengkap Properti *</label>
            <textarea
              name="alamat"
              rows={3}
              required
              placeholder="Masukkan alamat jalan, nomor, RT/RW, kelurahan, kecamatan"
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        {/* Section 2: Foto Properti */}
        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400 text-xs">2</span>
            Foto Properti
          </h3>
          
          <div className="space-y-4">
            {images.length === 0 ? (
              <label
                htmlFor="properti-images"
                className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-yellow-400/50 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] p-10 cursor-pointer transition-all group"
              >
                <UploadCloud className="h-12 w-12 text-zinc-500 group-hover:text-yellow-400 transition-colors mb-3 animate-pulse" />
                <span className="text-sm text-zinc-300 font-semibold group-hover:text-white transition-colors">
                  Pilih Foto Properti
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  Mendukung JPEG, PNG. Ukuran file max 10MB. Foto akan dikompresi otomatis.
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="properti-images"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                    >
                      <img
                        src={img.preview}
                        alt="Pratinjau"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black shadow-md uppercase tracking-wider">
                          Utama
                        </span>
                      )}
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="self-end rounded-lg bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/40 hover:text-white transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="flex justify-between items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'left')}
                            className="rounded-lg bg-white/10 p-1 text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[10px] text-zinc-300 font-semibold">{index + 1}</span>
                          <button
                            type="button"
                            disabled={index === images.length - 1}
                            onClick={() => handleMove(index, 'right')}
                            className="rounded-lg bg-white/10 p-1 text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Small trigger tile at the end of the grid */}
                  <label
                    htmlFor="properti-images-more"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-yellow-400/40 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] aspect-square cursor-pointer transition-all group"
                  >
                    <Plus className="h-6 w-6 text-zinc-500 group-hover:text-yellow-400 transition-colors mb-1" />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">Tambah Foto</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="properti-images-more"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Status & Finansial */}
        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-400/10 text-green-400 text-xs">3</span>
            Status & Finansial
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Jual Switch & Price */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.005] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Dipasarkan untuk Dijual</h4>
                  <p className="text-xs text-zinc-500">Aktifkan opsi harga jual unit</p>
                </div>
                <input
                  type="checkbox"
                  checked={isForSale}
                  onChange={(e) => setIsForSale(e.target.checked)}
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-yellow-400 focus:ring-0 focus:ring-offset-0 accent-yellow-400 cursor-pointer"
                />
              </div>
              {isForSale && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Harga Jual (IDR)</label>
                  <input
                    name="harga_jual"
                    type="number"
                    required
                    placeholder="Contoh: 1500000000"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
              )}
            </div>

            {/* Sewa Switch & Price */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.005] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Dipasarkan untuk Disewakan</h4>
                  <p className="text-xs text-zinc-500">Aktifkan opsi harga sewa per tahun</p>
                </div>
                <input
                  type="checkbox"
                  checked={isForRent}
                  onChange={(e) => setIsForRent(e.target.checked)}
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-yellow-400 focus:ring-0 focus:ring-offset-0 accent-yellow-400 cursor-pointer"
                />
              </div>
              {isForRent && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Harga Sewa / Tahun (IDR)</label>
                  <input
                    name="harga_sewa"
                    type="number"
                    required
                    placeholder="Contoh: 75000000"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipe Sertifikat</label>
              <select
                name="tipe_sertifikat"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
              >
                <option value="SHM" className="bg-[#0F0F11]">SHM - Sertifikat Hak Milik</option>
                <option value="HGB" className="bg-[#0F0F11]">HGB - Hak Guna Bangunan</option>
                <option value="IMB" className="bg-[#0F0F11]">IMB - Izin Mendirikan Bangunan</option>
                <option value="lainnya" className="bg-[#0F0F11]">Lainnya</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Spesifikasi Properti */}
        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-400/10 text-blue-400 text-xs">4</span>
            Spesifikasi Properti
          </h3>
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Luas Tanah (m²)</label>
              <input name="luas_tanah" type="number" step="any" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Luas Bangunan (m²)</label>
              <input name="luas_bangunan" type="number" step="any" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Lebar Tanah (m)</label>
              <input name="lebar_tanah" type="number" step="any" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Panjang Tanah (m)</label>
              <input name="panjang_tanah" type="number" step="any" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jumlah Lantai</label>
              <input name="jumlah_lantai" type="number" defaultValue="1" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hadap Arah</label>
              <input name="hadap" type="text" placeholder="Utara/Selatan/dll" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kondisi Properti</label>
              <input name="kondisi" type="text" placeholder="Bagus, Butuh Renovasi, dll" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kapasitas Listrik (VA)</label>
              <input name="listrik_va" type="number" placeholder="2200" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
          </div>

          {/* Air utilities */}
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="has_pam" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Sumber Air PAM</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="has_sumur" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Sumber Air Sumur/Artesis</span>
            </label>
          </div>
        </div>

        {/* Section 5: Kamar & Fasilitas */}
        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-400/10 text-purple-400 text-xs">5</span>
            Kamar & Fasilitas Interior
          </h3>
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">KT Standard</label>
              <input name="kamar_tidur_standard" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">KT Pembantu</label>
              <input name="kamar_tidur_pembantu" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">KM Standard</label>
              <input name="kamar_mandi_standard" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">KM Pembantu</label>
              <input name="kamar_mandi_pembantu" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
          </div>

          <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kapasitas Garasi</label>
              <input name="garasi" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kapasitas Carport</label>
              <input name="carport" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jumlah AC Split</label>
              <input name="ac_split_count" type="number" placeholder="0" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]" />
            </div>
          </div>

          {/* Checkbox Amenities */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="dapur_basah" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Dapur Basah</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="dapur_kering" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Dapur Kering</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="taman_depan" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Taman Depan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="taman_belakang" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Taman Belakang</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="has_gudang" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Gudang</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input type="checkbox" name="is_furnished" className="h-4 w-4 accent-yellow-400 rounded cursor-pointer" />
              <span>Semi/Full Furnished</span>
            </label>
          </div>
        </div>

        {/* Section 6: Kontrak Eksklusif & Pihak Terkait */}
        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400 text-xs">6</span>
            Legalitas Kontrak & Marketing
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Exclusive contract card */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.005] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Listing Perjanjian Eksklusif</h4>
                  <p className="text-xs text-zinc-500">Unit terikat kontrak eksklusif dengan kantor</p>
                </div>
                <input
                  type="checkbox"
                  checked={isExclusive}
                  onChange={(e) => setIsExclusive(e.target.checked)}
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-yellow-400 focus:ring-0 focus:ring-offset-0 accent-yellow-400 cursor-pointer"
                />
              </div>
              {isExclusive && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tanggal Jatuh Tempo Kontrak</label>
                  <input
                    name="tgl_jatuh_tempo"
                    type="date"
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                  />
                </div>
              )}
            </div>

            {/* Marketing dropdown */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.005] p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Staf Marketing Pendamping</h4>
                <p className="text-xs text-zinc-500">Pilih marketing penanggung jawab unit ini</p>
              </div>
              <div className="space-y-1.5">
                <select
                  name="marketing_id"
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-zinc-300 outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
                >
                  <option value="" className="bg-[#0F0F11]">-- Pilih Staf Marketing --</option>
                  {marketingAgents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-[#0F0F11]">
                      {agent.nama} ({agent.kode})
                    </option>
                  ))}
                </select>
                {marketingAgents.length === 0 && (
                  <p className="text-[10px] text-yellow-500/80 mt-1">
                    * Belum ada staf marketing di database. Silakan tambah staf terlebih dahulu di menu Marketing.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Keterangan Tambahan / Deskripsi</label>
            <textarea
              name="keterangan"
              rows={4}
              placeholder="Catatan tambahan properti seperti keunggulan unit, informasi akses jalan, dll."
              className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

      </div>

      {/* Upload/Status progress overlay */}
      {uploadStatus && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm text-yellow-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/dashboard/properti"
          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Batal</span>
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan Properti</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
