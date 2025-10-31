// iTunes API helper functions for new simplified schema

const ITUNES_BASE = 'https://itunes.apple.com'

export const normalizeArtwork = (artworkUrl?: string | null) => {
  if (!artworkUrl) return null
  return artworkUrl.replace('100x100bb', '600x600bb')
}

export async function fetchItunes(endpoint: string) {
  const response = await fetch(`${ITUNES_BASE}${endpoint}`)

  if (!response.ok) {
    throw new Error(`iTunes request failed: ${response.status}`)
  }

  return response.json()
}

// Fetch artist info from iTunes
export async function fetchArtistFromItunes(artistId: string | number) {
  const data = await fetchItunes(`/lookup?id=${artistId}`)

  if (!data?.results?.length) {
    throw new Error('Artist not found on iTunes')
  }

  const artist = data.results.find((item: any) => item.wrapperType === 'artist') || data.results[0]

  return {
    artistId: artist.artistId,
    artistName: artist.artistName,
    primaryGenreName: artist.primaryGenreName,
    artworkUrl100: artist.artworkUrl100,
  }
}

// Fetch all albums for an artist from iTunes
export async function fetchArtistAlbumsFromItunes(artistId: string | number) {
  const data = await fetchItunes(`/lookup?id=${artistId}&entity=album&limit=200`)

  if (!data?.results?.length) {
    return []
  }

  const albums = data.results.filter((item: any) => item.wrapperType === 'collection')

  return albums.map((album: any) => ({
    collectionId: album.collectionId,
    collectionName: album.collectionName,
    artistName: album.artistName,
    artworkUrl100: album.artworkUrl100,
    trackCount: album.trackCount,
    releaseDate: album.releaseDate,
    primaryGenreName: album.primaryGenreName,
  }))
}

// Fetch tracks for an album from iTunes
export async function fetchAlbumTracksFromItunes(collectionId: string | number) {
  const data = await fetchItunes(`/lookup?id=${collectionId}&entity=song&limit=200`)

  if (!data?.results?.length) {
    return []
  }

  const tracks = data.results.filter((item: any) => item.wrapperType === 'track' && item.trackId)

  return tracks.map((track: any) => ({
    trackId: track.trackId,
    trackName: track.trackName,
    artistId: track.artistId,
    artistName: track.artistName,
    collectionId: track.collectionId,
    collectionName: track.collectionName,
    artworkUrl100: track.artworkUrl100,
    trackNumber: track.trackNumber,
    trackTimeMillis: track.trackTimeMillis,
    primaryGenreName: track.primaryGenreName,
  }))
}

// Fetch single track info from iTunes
export async function fetchTrackFromItunes(trackId: string | number) {
  const data = await fetchItunes(`/lookup?id=${trackId}`)

  if (!data?.results?.length) {
    throw new Error('Track not found on iTunes')
  }

  const track = data.results.find((item: any) => item.trackId === Number(trackId)) || data.results[0]

  return {
    trackId: track.trackId,
    trackName: track.trackName,
    artistId: track.artistId,
    artistName: track.artistName,
    collectionId: track.collectionId,
    collectionName: track.collectionName,
    artworkUrl100: track.artworkUrl100,
    trackNumber: track.trackNumber,
    trackTimeMillis: track.trackTimeMillis,
    primaryGenreName: track.primaryGenreName,
  }
}

// Search iTunes
export async function searchItunes(term: string, entity: 'musicArtist' | 'album' | 'song' = 'musicArtist', limit = 25) {
  const data = await fetchItunes(`/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}`)

  return data.results || []
}
