import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import React from 'react'

interface SearchParams {
  ids?: string
  kepada?: string
  dari?: string
  hp?: string
  tanggal?: string
}

export default async function CetakPenawaranPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await props.searchParams
  const ids = searchParams.ids || ''
  const kepada = searchParams.kepada || '-'
  const dari = searchParams.dari || '-'
  const hp = searchParams.hp || '-'
  const tanggal = searchParams.tanggal || '-'

  if (!ids) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Tidak ada properti yang dipilih untuk dicetak.
      </div>
    )
  }

  const idsArray = ids.split(',')
  const supabase = await createClient()

  // Fetch properties with media and marketing relations
  const { data: properties, error } = await supabase
    .from('properti')
    .select('*, properti_media(*), marketing(*)')
    .in('id', idsArray)

  if (error || !properties || properties.length === 0) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Gagal memuat data properti atau data tidak ditemukan.
      </div>
    )
  }

  // Sort properties according to the order of selection in idsArray
  const sortedProperties = [...properties].sort((a, b) => {
    return idsArray.indexOf(a.id) - idsArray.indexOf(b.id)
  })

  // Format Helper Functions
  const formatPrice = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return 'Rp. 0'
    return 'Rp. ' + new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatLuasTanah = (item: any) => {
    const lt = item.luas_tanah || 0
    const lebar = item.lebar_tanah || 0
    const panjang = item.panjang_tanah || 0
    return `${lt} m2 ( ${lebar}x${panjang} ) m`
  }

  const formatAir = (item: any) => {
    const pam = item.has_pam
    const sumur = item.has_sumur
    if (pam && sumur) return 'Sumur & PAM'
    if (pam) return 'PAM'
    if (sumur) return 'Sumur'
    return '-'
  }

  const getPrimaryImageUrl = (property: any) => {
    if (!property.properti_media || property.properti_media.length === 0) {
      return null
    }
    const mediaList = [...property.properti_media].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const primaryMedia = mediaList.find((m) => m.is_primary) || mediaList[0]
    let url = primaryMedia.media_url

    if (url && url.includes('/properti-media/')) {
      url = url.replace('/properti-media/', '/properti_media/')
    }

    if (url && !url.startsWith('http')) {
      const { data } = supabase.storage.from('properti_media').getPublicUrl(url)
      return data.publicUrl
    }
    return url
  }

  return (
    <>
      {/* Global CSS override for the layout inside Next.js dashboard layout wrapper */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Remove sidebar & header completely */
        aside, header {
          display: none !important;
        }

        /* Reset background for dashboard layout wrapper */
        div.flex.min-h-screen.bg-\\[\\#0A0A0C\\] {
          background-color: #f3f4f6 !important;
          color: #1f2937 !important;
          min-height: auto !important;
          display: block !important;
        }

        main {
          padding: 0 !important;
          overflow: visible !important;
        }

        /* Document Design Styles */
        body {
          font-family: Arial, Helvetica, sans-serif;
          margin: 0;
          padding: 0;
        }

        .print-preview-wrapper {
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .print-container {
          background-color: #ffffff;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          width: 210mm; /* A4 Width */
          min-height: 297mm; /* A4 Height */
          padding: 15mm 15mm 25mm 15mm; /* bottom padding is large to accommodate fixed footer */
          box-sizing: border-box;
          position: relative;
          color: #000000;
        }

        /* Print Header Style */
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .print-header-left {
          font-size: 13px;
          line-height: 1.4;
        }

        .print-header-right {
          text-align: right;
        }

        .phone-text {
          font-size: 12px;
          margin-top: 4px;
          color: #000000;
          font-weight: bold;
        }

        /* Metadata Table */
        .meta-table {
          margin-top: 20px;
          font-size: 13px;
          border-collapse: collapse;
        }

        .meta-table td {
          padding: 2px 0;
          vertical-align: top;
        }

        .meta-label {
          width: 90px;
        }

        .meta-colon {
          width: 15px;
          text-align: center;
        }

        .meta-value {
          font-weight: bold;
        }

        /* Properti Items List */
        .properties-list {
          margin-top: 25px;
        }

        .property-box {
          border: 1.5px solid #000000;
          margin-bottom: 25px;
          display: flex;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 175px;
        }

        .property-details {
          flex: 7;
          padding: 12px 14px;
        }

        .property-image-box {
          flex: 3;
          border-left: 1.5px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: #f9f9f9;
        }

        .property-image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-photo-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 11px;
          height: 100%;
          text-align: center;
          padding: 10px;
        }

        /* Property Title inside Box */
        .property-title {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          line-height: 1.3;
          margin-bottom: 12px;
        }

        .property-title-main {
          color: #000000;
        }

        .property-title-sub {
          margin-top: 2px;
        }

        /* Specs Tables columns */
        .specs-columns {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .specs-col {
          flex: 1;
        }

        .specs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .specs-table td {
          padding: 3px 0;
          vertical-align: top;
        }

        .spec-label {
          width: 115px;
          color: #000000;
        }

        .spec-colon {
          width: 12px;
          text-align: left;
        }

        .spec-value {
          font-weight: normal;
          color: #000000;
        }

        /* Print Page Footer */
        .print-footer {
          border-top: 2px solid #000000;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 11px;
          line-height: 1.4;
          margin-top: 40px;
        }

        .footer-address {
          text-align: right;
          font-weight: normal;
        }

        /* PRINT MEDIA QUERY RULES */
        @media print {
          /* Force page margins */
          @page {
            size: A4;
            margin: 15mm 15mm 25mm 15mm;
          }

          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          /* Hide wrapper elements on print */
          .print-preview-wrapper {
            padding: 0 !important;
            display: block !important;
          }

          .print-container {
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          /* Fixed footer at the bottom of each page */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            margin-top: 0;
            background-color: #ffffff;
            /* Extra wrapper size */
            height: 20mm;
            box-sizing: border-box;
          }

          /* Hide non-print buttons if any */
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      <div className="print-preview-wrapper">
        <div className="print-container">
          {/* Header */}
          <div className="print-header">
            <div className="print-header-left">
              <div>Semarang, {tanggal}</div>
              
              <table className="meta-table">
                <tbody>
                  <tr>
                    <td className="meta-label">Kepada yth.</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{kepada}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">Dari</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{dari}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">HP</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{hp}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-header-right">
              {/* LJ Hooker Logo SVG */}
              <svg viewBox="0 0 100 55" width="135" height="74" xmlns="http://www.w3.org/2000/svg">
                {/* Red segment (left) */}
                <path d="M 10 50 A 40 40 0 0 1 30 15.36 L 40 32.68 A 20 20 0 0 0 30 50 Z" fill="#D12630" />
                {/* Black segment (middle) */}
                <path d="M 30 15.36 A 40 40 0 0 1 70 15.36 L 60 32.68 A 20 20 0 0 0 40 32.68 Z" fill="#1A1A1A" />
                {/* Yellow/Orange segment (right) */}
                <path d="M 70 15.36 A 40 40 0 0 1 90 50 L 70 50 A 20 20 0 0 0 60 32.68 Z" fill="#FDB913" />
              </svg>
              <div className="phone-text">t.+6224 3531 4099</div>
            </div>
          </div>

          {/* Properties List */}
          <div className="properties-list">
            {sortedProperties.map((item, index) => {
              const imageUrl = getPrimaryImageUrl(item)
              const agentCode = item.marketing?.kode || '-'

              return (
                <div key={item.id} className="property-box">
                  {/* Left content: Specs */}
                  <div className="property-details">
                    <div className="property-title">
                      <div className="property-title-main">{index + 1}. &nbsp; {item.alamat}</div>
                      <div className="property-title-sub" style={{ marginLeft: '17px' }}>
                        {item.no_listing} ({agentCode})
                      </div>
                    </div>

                    <div className="specs-columns">
                      {/* Left Column */}
                      <div className="specs-col">
                        <table className="specs-table">
                          <tbody>
                            <tr>
                              <td className="spec-label">Luas Tanah</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{formatLuasTanah(item)}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Luas Bangunan</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.luas_bangunan ? `${item.luas_bangunan} m2` : '-'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Status Kepemilikan</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.tipe_sertifikat || '-'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Jumlah Lantai</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.jumlah_lantai || '1'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Hadap</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.hadap || '-'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Kondisi Bangunan</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.kondisi || '-'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label" style={{ fontWeight: 'bold' }}>Harga Jual</td>
                              <td className="spec-colon" style={{ fontWeight: 'bold' }}>:</td>
                              <td className="spec-value" style={{ fontWeight: 'bold' }}>{formatPrice(item.harga_jual)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Right Column */}
                      <div className="specs-col">
                        <table className="specs-table">
                          <tbody>
                            <tr>
                              <td className="spec-label">K. Tidur U/S/P</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">
                                {item.kamar_tidur_utama || 0} / {item.kamar_tidur_standard || 0} / {item.kamar_tidur_pembantu || 0}
                              </td>
                            </tr>
                            <tr>
                              <td className="spec-label">K. Mandi U/S/P</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">
                                {item.kamar_mandi_utama || 0} / {item.kamar_mandi_standard || 0} / {item.kamar_mandi_pembantu || 0}
                              </td>
                            </tr>
                            <tr>
                              <td className="spec-label">Garasi/Carport</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.garasi || 0} / {item.carport || 0}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Listrik</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.listrik_va ? `${item.listrik_va} watt` : '0 watt'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Air</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{formatAir(item)}</td>
                            </tr>
                            <tr>
                              <td className="spec-label">Telepon</td>
                              <td className="spec-colon">:</td>
                              <td className="spec-value">{item.telepon_lines !== undefined ? `${item.telepon_lines} Line` : '0 Line'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label" style={{ fontWeight: 'bold' }}>Harga Sewa</td>
                              <td className="spec-colon" style={{ fontWeight: 'bold' }}>:</td>
                              <td className="spec-value" style={{ fontWeight: 'bold' }}>{formatPrice(item.harga_sewa)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right photo */}
                  <div className="property-image-box">
                    {imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={imageUrl} alt={item.alamat} />
                    ) : (
                      <div className="no-photo-box">
                        <svg className="w-8 h-8 text-zinc-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>Pratinjau Foto</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="print-footer">
            <div className="footer-left">
              Halaman : &nbsp; <span className="page-number"></span>
            </div>
            <div className="footer-address">
              Ruko Murni Blok H<br />
              Jl. Gajahmada 144<br />
              Semarang 50135
            </div>
          </div>
        </div>
      </div>

      {/* Auto trigger print script */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Update page numbering text for static layout
        // In print mode, the browser handles standard headers, but let's make sure window.print runs after resources loaded
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 500);
        });
      ` }} />
    </>
  )
}
