import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArtistHeader from "./ArtistHeader";
import dynamicImport from "next/dynamic";
import ArtistTracksView from "./ArtistTracksView";
// const ArtistTracksView = dynamicImport(() => import('./ArtistTracksView'), { ssr: false })

export const dynamic = "force-dynamic";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artistId = parseInt(id);

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      itunesId: true,
    },
  });

  if (!artist) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <ArtistHeader artist={artist} />
      <ArtistTracksView artistId={artist.id} artistName={artist.name} />
    </div>
  );
}
