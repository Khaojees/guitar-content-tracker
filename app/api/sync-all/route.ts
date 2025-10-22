import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get all artists with their iTunes IDs
    const artists = await prisma.artist.findMany({
      include: {
        sources: {
          where: {
            type: 'itunes_artist',
          },
        },
      },
    })

    const newTracks: any[] = []

    for (const artist of artists) {
      const itunesSource = artist.sources[0]
      if (!itunesSource) continue

      const artistId = itunesSource.externalId

      // Fetch latest albums from iTunes
      const albumsResponse = await fetch(
        `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200&sort=recent`
      )
      const albumsData = await albumsResponse.json()
      const albums = albumsData.results.filter((item: any) => item.wrapperType === 'collection')

      for (const albumData of albums) {
        const collectionId = albumData.collectionId

        // Check if album already exists
        const existingAlbum = await prisma.source.findUnique({
          where: {
            type_externalId: {
              type: 'itunes_album',
              externalId: String(collectionId),
            },
          },
          include: {
            album: true,
          },
        })

        if (!existingAlbum) {
          // New album found - fetch tracks
          const tracksResponse = await fetch(
            `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`
          )
          const tracksData = await tracksResponse.json()
          const tracks = tracksData.results.filter((item: any) => item.wrapperType === 'track')

          // Create album with tracks
          const newAlbum = await prisma.album.create({
            data: {
              name: albumData.collectionName || 'ไม่ระบุอัลบั้ม',
              imageUrl: albumData.artworkUrl100 || albumData.artworkUrl60 || null,
              artistId: artist.id,
              sources: {
                create: {
                  type: 'itunes_album',
                  externalId: String(collectionId),
                },
              },
              tracks: {
                create: tracks.map((track: any) => ({
                  name: track.trackName,
                  duration: track.trackTimeMillis || null,
                  trackNumber: track.trackNumber || null,
                  sources: {
                    create: {
                      type: 'itunes_track',
                      externalId: String(track.trackId),
                    },
                  },
                  trackStatus: {
                    create: {
                      status: 'idea',
                      starred: false,
                      ignored: false,
                    },
                  },
                })),
              },
            },
            include: {
              tracks: true,
            },
          })

          newTracks.push({
            artist: artist.name,
            album: newAlbum.name,
            tracks: newAlbum.tracks.map((t) => t.name),
          })
        } else {
          // Album exists - check for new tracks
          const tracksResponse = await fetch(
            `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`
          )
          const tracksData = await tracksResponse.json()
          const tracks = tracksData.results.filter((item: any) => item.wrapperType === 'track')

          for (const track of tracks) {
            const trackId = track.trackId

            const existingTrack = await prisma.source.findUnique({
              where: {
                type_externalId: {
                  type: 'itunes_track',
                  externalId: String(trackId),
                },
              },
            })

            if (!existingTrack) {
              // New track in existing album
              const newTrack = await prisma.track.create({
                data: {
                  name: track.trackName,
                  duration: track.trackTimeMillis || null,
                  trackNumber: track.trackNumber || null,
                  albumId: existingAlbum.album!.id,
                  sources: {
                    create: {
                      type: 'itunes_track',
                      externalId: String(trackId),
                    },
                  },
                  trackStatus: {
                    create: {
                      status: 'idea',
                      starred: false,
                      ignored: false,
                    },
                  },
                },
              })

              newTracks.push({
                artist: artist.name,
                album: existingAlbum.album!.name,
                tracks: [newTrack.name],
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      newTracks,
      count: newTracks.length,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 })
  }
}
