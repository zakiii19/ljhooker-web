'use client'

import React, { useState } from 'react'
import * as htmlToImage from 'html-to-image'

interface Marketing {
  id: string
  kode: string
  nama: string
  hp: string
}

interface Property {
  id: string
  no_listing: string
  alamat: string
  harga_jual: number | null
  harga_sewa: number | null
  is_for_sale: boolean
  is_for_rent: boolean
  luas_tanah: number | null
  luas_bangunan: number | null
  lebar_tanah: number | null
  panjang_tanah: number | null
  jumlah_lantai: number | null
  hadap: string | null
  kondisi: string | null
  listrik_va: number | null
  telepon_lines: number | null
  has_pam: boolean
  has_sumur: boolean
  kamar_tidur_utama: number
  kamar_tidur_standard: number
  kamar_tidur_pembantu: number
  kamar_mandi_utama: number
  kamar_mandi_standard: number
  kamar_mandi_pembantu: number
  garasi: number
  carport: number
  is_exclusive: boolean
  is_furnished: boolean
  tipe_sertifikat: string | null
  keterangan: string | null
  marketing?: Marketing | null
}

interface CetakBrosurClientProps {
  property: Property
  primaryImageUrl: string | null
}

export default function CetakBrosurClient({ property, primaryImageUrl }: CetakBrosurClientProps) {
  const [downloading, setDownloading] = useState(false)

  // Address clean & split helper
  const formatAddress = (addr: string) => {
    if (!addr) return { title: 'PROPERTI PILIHAN', subtitle: '-' }
    
    // Clean specific house numbers / blocks to protect owner's privacy
    const cleaned = addr
      .replace(/(?:no\.?\s*\d+\s*[a-zA-Z]?)|(?:blok\s*[a-zA-Z0-9-]+\s*(?:no\.?)?\s*\d*)/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/, '')
      .trim()

    const parts = cleaned.split(',')
    const title = parts[0].trim()
    const subtitle = parts.slice(1).join(', ').trim()
    
    return {
      title: title || 'PROPERTI PILIHAN',
      subtitle: subtitle || '-'
    }
  }

  const { title: mainTitle, subtitle: subtitleAddress } = formatAddress(property.alamat || '')

  // Format Helper Functions
  const formatPriceShort = (price: number | null, isRent: boolean) => {
    if (price === null || price === undefined || price === 0) return '-'
    
    let valStr = ''
    if (price >= 1_000_000_000) {
      const val = price / 1_000_000_000
      valStr = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
      }).format(val) + ' Miliar'
    } else if (price >= 1_000_000) {
      const val = price / 1_000_000
      valStr = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
      }).format(val) + ' Juta'
    } else {
      valStr = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0
      }).format(price)
    }
    
    return isRent ? `Rp ${valStr} / Tahun` : `Rp ${valStr}`
  }

  const formatAir = () => {
    const pam = property.has_pam
    const sumur = property.has_sumur
    if (pam && sumur) return 'Sumur & PAM'
    if (pam) return 'PAM'
    if (sumur) return 'Sumur'
    return '-'
  }

  const formatLuasTanah = () => {
    const lt = property.luas_tanah || 0
    const lebar = property.lebar_tanah || 0
    const panjang = property.panjang_tanah || 0
    if (lebar > 0 && panjang > 0) {
      return `${lt} m² (${lebar}x${panjang} m)`
    }
    return `${lt} m²`
  }

  // Helper to format bedrooms / bathrooms list nicely
  const ktUtama = property.kamar_tidur_utama || 0
  const ktStandard = property.kamar_tidur_standard || 0
  const ktPembantu = property.kamar_tidur_pembantu || 0
  
  const kmUtama = property.kamar_mandi_utama || 0
  const kmStandard = property.kamar_mandi_standard || 0
  const kmPembantu = property.kamar_mandi_pembantu || 0
  
  const garasiText = `${property.garasi || 0} / ${property.carport || 0}`

  // Format WA number for link
  const formatWaNumber = (hp?: string | null) => {
    if (!hp) return ''
    let clean = hp.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return clean
  }

  const getWhatsAppLink = () => {
    const hp = property.marketing?.hp
    if (!hp) return ''
    const cleanHp = formatWaNumber(hp)
    const message = `Halo ${property.marketing?.nama || 'Agen'}, saya tertarik dengan properti No. Listing ${property.no_listing}. Apakah unit ini masih tersedia?`
    return `https://wa.me/${cleanHp}?text=${encodeURIComponent(message)}`
  }

  const getQrCodeSrc = () => {
    const waLink = getWhatsAppLink()
    if (!waLink) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(waLink)}`
  }

  // Export PNG Function
  const handleDownloadPng = async () => {
    const node = document.getElementById('flyer-card')
    if (!node) return

    setDownloading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1.0,
        pixelRatio: 2, // Double resolution for ultra-sharp prints/screens
        cacheBust: true,
      })

      const link = document.createElement('a')
      const sanitizedTitle = mainTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      link.download = `Brosur-${sanitizedTitle}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating image:', err)
      alert('Gagal mengunduh gambar. Silakan coba kembali atau gunakan Cetak PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {/* Dynamic Fonts and Layout Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* Hide Next.js default shell structures */
        aside, header {
          display: none !important;
        }

        div.flex.min-h-screen.bg-\\[\\#0A0A0C\\] {
          background-color: #f3f4f6 !important;
          min-height: auto !important;
          display: block !important;
        }

        main {
          padding: 0 !important;
          overflow: visible !important;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Toolbar styles */
        .toolbar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13.5px;
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-yellow {
          background: #FDB913;
          color: #000000;
          box-shadow: 0 4px 14px rgba(253, 185, 19, 0.3);
        }
        .btn-yellow:hover:not(:disabled) {
          background: #e5a60c;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(253, 185, 19, 0.4);
        }

        .btn-dark {
          background: #1f2937;
          color: #ffffff;
          border: 1px solid #111827;
        }
        .btn-dark:hover:not(:disabled) {
          background: #111827;
          transform: translateY(-1.5px);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Flyer Wrapper & Paper Styling */
        .flyer-wrapper {
          display: flex;
          justify-content: center;
          padding: 40px 10px;
        }

        .flyer-card {
          width: 210mm;
          height: 297mm;
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
        }

        /* Hero Image Area */
        .hero-section {
          position: relative;
          height: 135mm; /* Around 45% of A4 */
          width: 100%;
          overflow: hidden;
          background: #f3f4f6;
        }

        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: rgba(0, 0, 0, 0.3);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0) 40%,
            rgba(0, 0, 0, 0.6) 100-percent
          );
          z-index: 2;
        }

        /* Header items over Image */
        .hero-header-row {
          position: absolute;
          top: 24px;
          left: 28px;
          right: 28px;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          padding: 8px 18px 8px 14px;
          border-radius: 50px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border: 1.5px solid #FDB913;
        }

        .logo-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1.0;
        }

        .logo-main-brand {
          color: #111827;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.5px;
        }

        .logo-branch {
          color: #6b7280;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 2px;
        }

        .status-badge {
          background: #D12630;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 2px;
          padding: 8px 22px;
          border-radius: 50px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(209, 38, 48, 0.3);
          font-family: 'Outfit', sans-serif;
        }

        .status-badge.rent {
          background: #1f2937;
          box-shadow: 0 4px 12px rgba(31, 41, 55, 0.3);
        }

        /* Accent Corporate Ribbon */
        .corporate-ribbon {
          width: 100%;
          height: 5px;
          background: linear-gradient(90deg, #D12630 0%, #E35D25 50%, #FDB913 100%);
          z-index: 10;
        }

        /* Details Section */
        .details-section {
          flex: 1;
          background: #ffffff;
          position: relative;
          padding: 32px 32px 24px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        /* Grid for details cards */
        .details-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 28px;
          align-items: stretch;
          flex-grow: 1;
        }

        .left-col {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 20px;
        }

        /* Property Titles & Info */
        .title-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .property-category {
          color: #D12630;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 2px;
          display: block;
        }

        .property-title {
          color: #111827;
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          line-height: 1.15;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }

        .property-address-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          color: #4b5563;
          font-size: 13.5px;
          font-weight: 500;
          margin-top: 4px;
        }

        .property-address-icon {
          width: 15px;
          height: 15px;
          color: #D12630;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Yellow Pricing Card */
        .pricing-card {
          background: linear-gradient(135deg, #FDB913 0%, #fca700 100%);
          border-radius: 20px;
          padding: 22px 24px;
          box-shadow: 0 6px 20px rgba(253, 185, 19, 0.15);
          display: flex;
          flex-direction: column;
          color: #000000;
          position: relative;
          overflow: hidden;
        }

        .pricing-card-glow {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
          pointer-events: none;
        }

        .price-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.6);
        }

        .price-exclusive-tag {
          background: rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.12);
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .price-value {
          font-family: 'Outfit', sans-serif;
          font-size: 38px;
          font-weight: 800;
          line-height: 1.0;
          margin-top: 6px;
          letter-spacing: -0.5px;
        }

        /* Spec Quick Bar (Outline Cards) */
        .quick-specs-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
        }

        .quick-spec-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 8px;
          color: #1f2937;
          transition: all 0.2s ease;
        }

        .quick-spec-icon {
          width: 18px;
          height: 18px;
          color: #D12630;
        }

        .quick-spec-value {
          font-size: 12px;
          font-weight: 700;
        }

        .quick-spec-label {
          font-size: 9px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Property Description */
        .description-card {
          background: #f9fafb;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          padding: 16px;
        }

        .description-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #111827;
          letter-spacing: 1px;
          margin-bottom: 6px;
          display: block;
        }

        .description-content {
          font-size: 11.5px;
          color: #4b5563;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Gelap/Light Specs Card (Right) */
        .specs-card {
          background: #f9fafb;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }

        .specs-card-title {
          color: #111827;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 16px 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .specs-card-title-icon {
          width: 14px;
          height: 14px;
          color: #D12630;
        }

        .specs-items-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
          flex-grow: 1;
        }

        .specs-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          color: #4b5563;
          padding-bottom: 7px;
          border-bottom: 1px dashed #e5e7eb;
        }

        .specs-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .specs-label {
          font-weight: 600;
        }

        .specs-value {
          color: #111827;
          font-weight: 700;
        }

        /* Agent & Social Branding Footer */
        .footer-branding {
          border-top: 1.5px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .agent-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .agent-circle-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-circle {
          width: 52px;
          height: 52px;
          border-radius: 52px;
          background: linear-gradient(135deg, #D12630 0%, #FDB913 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 16px;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .agent-text-col {
          display: flex;
          flex-direction: column;
        }

        .agent-title-label {
          font-size: 8px;
          font-weight: 800;
          color: #D12630;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1px;
        }

        .agent-fullname {
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }

        .agent-contact-num {
          color: #4b5563;
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 1px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* WhatsApp QR Code Section */
        .qr-code-section {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 6px 12px 6px 8px;
        }

        .qr-image-container {
          width: 50px;
          height: 50px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-image {
          width: 100%;
          height: 100%;
        }

        .qr-text-col {
          display: flex;
          flex-direction: column;
        }

        .qr-text-title {
          font-size: 8.5px;
          font-weight: 800;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .qr-text-desc {
          font-size: 8px;
          color: #6b7280;
          line-height: 1.1;
          margin-top: 1px;
        }

        .office-brand-col {
          text-align: right;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .office-website-url {
          color: #111827;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .office-insta-tag {
          color: #6b7280;
          font-size: 9.5px;
          margin-top: 2px;
          font-weight: 500;
        }

        /* PRINTING OVERRIDES */
        @media print {
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
          }
          div.flex.min-h-screen.bg-\\[\\#0A0A0C\\] {
            background-color: #ffffff !important;
            display: block !important;
          }
          .toolbar {
            display: none !important;
          }
          .flyer-wrapper {
            padding: 0 !important;
          }
          .flyer-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      ` }} />

      {/* Action Toolbar */}
      <div className="toolbar">
        <button 
          onClick={() => window.print()} 
          className="btn btn-dark"
          disabled={downloading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak / Simpan PDF
        </button>

        <button 
          onClick={handleDownloadPng} 
          className="btn btn-yellow"
          disabled={downloading}
        >
          {downloading ? (
            <>
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mengekspor...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh Gambar (PNG)
            </>
          )}
        </button>
      </div>

      {/* Printable / Downloadable A4 Flyer */}
      <div className="flyer-wrapper">
        <div id="flyer-card" className="flyer-card">
          
          {/* Top Section - Image & Hero info */}
          <div className="hero-section">
            {primaryImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={primaryImageUrl} 
                alt={property.alamat} 
                className="hero-image"
                crossOrigin="anonymous" 
              />
            ) : (
              <div className="hero-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs font-semibold mt-3 uppercase tracking-wider opacity-60">Pratinjau Foto</span>
              </div>
            )}
            
            <div className="hero-overlay" />

            {/* Header branding overlay */}
            <div className="hero-header-row">
              <div className="logo-container">
                <svg viewBox="0 0 100 55" width="46" height="25" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 10 50 A 40 40 0 0 1 30 15.36 L 40 32.68 A 20 20 0 0 0 30 50 Z" fill="#D12630" />
                  <path d="M 30 15.36 A 40 40 0 0 1 70 15.36 L 60 32.68 A 20 20 0 0 0 40 32.68 Z" fill="#1A1A1A" />
                  <path d="M 70 15.36 A 40 40 0 0 1 90 50 L 70 50 A 20 20 0 0 0 60 32.68 Z" fill="#FDB913" />
                </svg>
                <div className="logo-text-block">
                  <span className="logo-main-brand">LJ HOOKER</span>
                  <span className="logo-branch">Semarang Kota</span>
                </div>
              </div>

              <span className={`status-badge ${property.is_for_rent && !property.is_for_sale ? 'rent' : ''}`}>
                {property.is_for_sale ? 'Dijual' : 'Disewa'}
              </span>
            </div>
          </div>

          {/* Accent corporate color border line */}
          <div className="corporate-ribbon" />

          {/* Bottom Section - Detailed card specs */}
          <div className="details-section">
            
            {/* Grid layout */}
            <div className="details-grid">
              
              {/* Left Column (Main Info & Highlights) */}
              <div className="left-col">
                <div className="title-block">
                  <span className="property-category">LJ Hooker Premium Select</span>
                  <h1 className="property-title">{mainTitle}</h1>
                  <div className="property-address-row">
                    <svg className="property-address-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{subtitleAddress}</span>
                  </div>
                </div>

                {/* Kuning Info Card */}
                <div className="pricing-card">
                  <div className="pricing-card-glow" />
                  <div className="price-label-row">
                    <span className="price-label">
                      {property.is_for_sale ? 'Harga Jual Penawaran' : 'Harga Sewa Tahunan'}
                    </span>
                    {property.is_exclusive && (
                      <span className="price-exclusive-tag">Exclusive Listing</span>
                    )}
                  </div>
                  <div className="price-value">
                    {property.is_for_sale 
                      ? formatPriceShort(property.harga_jual, false) 
                      : formatPriceShort(property.harga_sewa, true)
                    }
                  </div>
                </div>

                {/* Quick Specs Bar */}
                <div className="quick-specs-bar">
                  <div className="quick-spec-item">
                    <svg className="quick-spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="quick-spec-value">{ktUtama + ktStandard} {ktPembantu > 0 ? `+ ${ktPembantu}` : ''}</span>
                    <span className="quick-spec-label">Bedrooms</span>
                  </div>

                  <div className="quick-spec-item">
                    <svg className="quick-spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="quick-spec-value">{kmUtama + kmStandard} {kmPembantu > 0 ? `+ ${kmPembantu}` : ''}</span>
                    <span className="quick-spec-label">Bathrooms</span>
                  </div>

                  <div className="quick-spec-item">
                    <svg className="quick-spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span className="quick-spec-value">{garasiText}</span>
                    <span className="quick-spec-label">Garasi / Cpt</span>
                  </div>
                </div>

                {/* Description Card */}
                {property.keterangan && (
                  <div className="description-card">
                    <span className="description-title">Catatan Properti</span>
                    <p className="description-content">{property.keterangan}</p>
                  </div>
                )}
              </div>

              {/* Right Column (Technical Specifications) */}
              <div className="specs-card">
                <h3 className="specs-card-title">
                  <svg className="specs-card-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Spesifikasi Detail
                </h3>

                <div className="specs-items-list">
                  <div className="specs-row">
                    <span className="specs-label">Sertifikat</span>
                    <span className="specs-value">{property.tipe_sertifikat || '-'}</span>
                  </div>
                  
                  <div className="specs-row">
                    <span className="specs-label">Luas Tanah</span>
                    <span className="specs-value">{formatLuasTanah()}</span>
                  </div>

                  <div className="specs-row">
                    <span className="specs-label">Luas Bangunan</span>
                    <span className="specs-value">
                      {property.luas_bangunan ? `${property.luas_bangunan} m²` : '-'}
                    </span>
                  </div>

                  <div className="specs-row">
                    <span className="specs-label">Daya Listrik</span>
                    <span className="specs-value">
                      {property.listrik_va ? `${property.listrik_va} VA` : '-'}
                    </span>
                  </div>
                  
                  <div className="specs-row">
                    <span className="specs-label">Saluran Air</span>
                    <span className="specs-value">{formatAir()}</span>
                  </div>
                  
                  <div className="specs-row">
                    <span className="specs-label">Jumlah Lantai</span>
                    <span className="specs-value">{property.jumlah_lantai || 1} Lantai</span>
                  </div>
                  
                  <div className="specs-row">
                    <span className="specs-label">Hadap</span>
                    <span className="specs-value">{property.hadap || '-'}</span>
                  </div>
                  
                  <div className="specs-row">
                    <span className="specs-label">Kondisi</span>
                    <span className="specs-value">{property.kondisi || '-'}</span>
                  </div>

                  <div className="specs-row">
                    <span className="specs-label">Furnishing</span>
                    <span className="specs-value">
                      {property.is_furnished ? 'Furnished' : 'Non-Furnished'}
                    </span>
                  </div>

                  <div className="specs-row">
                    <span className="specs-label">No. Listing</span>
                    <span className="specs-value" style={{ letterSpacing: '0.3px' }}>
                      {property.no_listing}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent & Social Branding Footer */}
            <div className="footer-branding">
              
              {/* Agent Profile */}
              <div className="agent-profile">
                <div className="agent-circle-wrapper">
                  <div className="agent-circle">
                    {property.marketing?.nama ? property.marketing.nama.substring(0, 2).toUpperCase() : 'LH'}
                  </div>
                </div>
                <div className="agent-text-col">
                  <span className="agent-title-label">Hubungi Agen Pemasaran</span>
                  <span className="agent-fullname">
                    {property.marketing?.nama || 'Marketing Agent'}
                  </span>
                  <span className="agent-contact-num">
                    {/* WhatsApp Icon */}
                    <svg className="w-3.5 h-3.5 text-green-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.725-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.736.001-2.599-1.01-5.043-2.848-6.883-1.837-1.84-4.286-2.854-6.892-2.855-5.442 0-9.871 4.372-9.875 9.739-.002 1.743.498 3.447 1.447 5.01L2.17 19.53l4.477-1.376zM17.58 14.39c-.27-.136-1.6-.79-1.846-.88-.246-.089-.427-.135-.607.135-.18.27-.697.88-.854 1.06-.157.18-.314.202-.584.067-.27-.136-1.14-.42-2.172-1.34-1.03-.92-1.724-2.057-1.926-2.4-.202-.34-.022-.523.147-.692.153-.153.34-.395.51-.593.17-.198.226-.339.34-.565.113-.226.056-.424-.028-.593-.084-.17-.607-1.46-.83-1.998-.218-.523-.46-.452-.63-.46-.158-.008-.34-.01-.52-.01-.18 0-.472.067-.72.338-.246.27-.94.92-.94 2.24s.967 2.59 1.102 2.77c.135.18 1.902 2.904 4.608 4.07 1.49.645 2.65.845 3.58.705.81-.122 1.6-1.127 1.846-1.748.246-.62.246-1.15.17-1.263-.075-.11-.27-.198-.54-.334z"/>
                    </svg>
                    <span>{property.marketing?.hp || '-'}</span>
                  </span>
                </div>
              </div>

              {/* QR Code Section */}
              {property.marketing?.hp && (
                <div className="qr-code-section">
                  <div className="qr-image-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getQrCodeSrc()} 
                      alt="WhatsApp QR Code" 
                      className="qr-image"
                    />
                  </div>
                  <div className="qr-text-col">
                    <span className="qr-text-title">WhatsApp Chat</span>
                    <span className="qr-text-desc">Pindai QR ini<br />untuk bertanya</span>
                  </div>
                </div>
              )}

              {/* Office Branding */}
              <div className="office-brand-col">
                <span className="office-website-url">semarangkota.ljhrealty.com</span>
                <span className="office-insta-tag">Instagram: @ljhrealty.semarangkota</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
