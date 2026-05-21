import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import React from 'react'
import CetakBrosurClient from './CetakBrosurClient'

interface SearchParams {
  id?: string
}

export default async function CetakBrosurPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await props.searchParams
  const id = searchParams.id

  if (!id) {
    return (
      <div className="p-8 text-center text-red-500 bg-black min-h-screen flex items-center justify-center font-semibold">
        Error: Tidak ada ID properti yang diberikan.
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch property details, media, and marketing
  const { data: property, error } = await supabase
    .from('properti')
    .select('*, properti_media(*), marketing(*)')
    .eq('id', id)
    .single()

  if (error || !property) {
    return notFound()
  }

  // Helper to get the primary photo public URL
  const getPrimaryImageUrl = (prop: any) => {
    if (!prop.properti_media || prop.properti_media.length === 0) {
      return null
    }
    
    // Sort media by sort_order
    const mediaList = [...prop.properti_media].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    )
    
    // Find primary or take the first one
    const primaryMedia = mediaList.find((m) => m.is_primary) || mediaList[0]
    let url = primaryMedia.media_url

    // Handle typo in path if any
    if (url && url.includes('/properti-media/')) {
      url = url.replace('/properti-media/', '/properti_media/')
    }

    // Resolve Supabase storage URL if it is a relative path
    if (url && !url.startsWith('http')) {
      const { data } = supabase.storage.from('properti_media').getPublicUrl(url)
      return data.publicUrl
    }
    
    return url
  }

  const primaryImageUrl = getPrimaryImageUrl(property)

  return (
    <CetakBrosurClient 
      property={property} 
      primaryImageUrl={primaryImageUrl} 
    />
  )
}
