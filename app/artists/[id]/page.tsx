import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ArtistHeader from './ArtistHeader'
import ArtistAlbumsRealtime from './ArtistAlbumsRealtime'

export const dynamic = 'force-dynamic'

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const artistId = parseInt(id)

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
  })

  if (!artist) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <ArtistHeader artist={artist} />
      <ArtistAlbumsRealtime artistId={artist.id} artistName={artist.name} />
    </div>
  )
}
