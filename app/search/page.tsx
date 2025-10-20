'use client'

import { useState } from 'react'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchEntity, setSearchEntity] = useState('musicArtist')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResults([])

    try {
      const response = await fetch(
        `/api/search?term=${encodeURIComponent(searchTerm)}&entity=${searchEntity}`
      )
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveArtist = async (artist: any) => {
    setSaving(artist.artistId)

    try {
      const response = await fetch('/api/save/artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: artist.artistId,
          artistName: artist.artistName,
          imageUrl: artist.artworkUrl100 || artist.artworkUrl60,
        }),
      })

      const data = await response.json()
      alert(data.message + (data.totalTracks ? ` (${data.totalTracks} เพลง)` : ''))
    } catch (error) {
      console.error('Save error:', error)
      alert('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔍 ค้นหาเพลง</h1>
        <p className="mt-2 text-gray-600">ค้นหาและบันทึกศิลปิน/เพลงจาก iTunes API</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ชื่อศิลปิน หรือ เพลง..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภท
            </label>
            <select
              value={searchEntity}
              onChange={(e) => setSearchEntity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="musicArtist">ศิลปิน</option>
              <option value="song">เพลง</option>
              <option value="album">อัลบั้ม</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">ผลการค้นหา ({results.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                {item.artworkUrl100 && (
                  <img
                    src={item.artworkUrl100}
                    alt={item.artistName || item.trackName}
                    className="w-20 h-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {item.artistName || item.collectionName}
                  </div>
                  {item.trackName && (
                    <div className="text-sm text-gray-600">{item.trackName}</div>
                  )}
                  {item.collectionName && searchEntity === 'musicArtist' && (
                    <div className="text-sm text-gray-500">{item.primaryGenreName}</div>
                  )}
                </div>
                {searchEntity === 'musicArtist' && item.artistId && (
                  <button
                    onClick={() => handleSaveArtist(item)}
                    disabled={saving === item.artistId}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving === item.artistId ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
