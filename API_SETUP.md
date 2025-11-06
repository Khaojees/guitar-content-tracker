# API Setup สำหรับ Mobile App

## การเปลี่ยนแปลง

### 1. API Key Authentication
- API routes ใช้ header `x-api-key` แทน Basic Auth
- เว็บ UI ยังใช้ Basic Auth เหมือนเดิม

### 2. CORS Support
- API routes รองรับ CORS requests จาก mobile app
- รองรับ preflight requests (OPTIONS method)

## Environment Variables

เพิ่มใน Vercel:

```env
API_KEY=Fvg8xjt
AUTH_PASSWORD=your-password-for-web-ui
```

## การเรียกใช้ API จาก Mobile App

### ตัวอย่าง Request

```javascript
// GET request
fetch('https://onelaplay.vercel.app/api/tracks', {
  headers: {
    'x-api-key': 'Fvg8xjt'
  }
})

// POST request
fetch('https://onelaplay.vercel.app/api/track/123/status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'Fvg8xjt'
  },
  body: JSON.stringify({
    status: 'ready',
    starred: true
  })
})
```

## API Endpoints

Base URL: `https://onelaplay.vercel.app`

### Tracks
- `GET /api/tracks` - ดึงเพลงทั้งหมด
- `GET /api/track/:id` - ดึงเพลงเดี่ยว
- `PATCH /api/track/:id` - แก้ไขเพลง
- `DELETE /api/track/:id` - ลบเพลง
- `POST /api/track/:id/status` - อัปเดตสถานะ/ดาว/ignored/note
- `GET /api/track/:id/postlog` - ดูประวัติการโพสต์
- `POST /api/track/:id/postlog` - บันทึกการโพสต์

### Artists
- `GET /api/artist/:id/tracks` - ดึงเพลงของศิลปิน
- `GET /api/artist/:id/albums` - ดึงอัลบั้มของศิลปิน
- `DELETE /api/artist/:id` - ลบศิลปิน

### Playlists
- `GET /api/playlist` - ดึง playlist ทั้งหมด
- `POST /api/playlist` - สร้าง playlist
- `GET /api/playlist/:id` - ดูรายละเอียด playlist
- `PATCH /api/playlist/:id` - แก้ไข playlist
- `DELETE /api/playlist/:id` - ลบ playlist
- `POST /api/playlist/:id/tracks` - เพิ่มเพลงเข้า playlist
- `DELETE /api/playlist/:id/tracks` - ลบเพลงออกจาก playlist

### Search & Save
- `GET /api/search?term=query` - ค้นหาจาก iTunes API
- `POST /api/save/artist` - บันทึกศิลปิน + เพลง
- `POST /api/save/track` - บันทึกเพลงเดี่ยว
- `POST /api/search/status` - ตรวจสอบสถานะการบันทึก

### Random
- `GET /api/random-starred` - สุ่มเพลงติดดาว

## ทดสอบ

```bash
# ทดสอบด้วย curl
curl -H "x-api-key: Fvg8xjt" https://onelaplay.vercel.app/api/tracks

# ทดสอบ POST
curl -X POST \
  -H "x-api-key: Fvg8xjt" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready","starred":true}' \
  https://onelaplay.vercel.app/api/track/1/status
```

## React Native Setup

```bash
# สร้างโปรเจกต์
npx create-expo-app guitar-app
cd guitar-app

# ติดตั้ง dependencies
npm install axios
```

### API Service

```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://onelaplay.vercel.app/api',
  headers: {
    'x-api-key': 'Fvg8xjt'
  }
})

export default api
```

### ตัวอย่างการใช้งาน

```typescript
// ดึงเพลงทั้งหมด
const response = await api.get('/tracks')
const tracks = response.data

// อัปเดตสถานะเพลง
await api.post(`/track/${trackId}/status`, {
  status: 'ready',
  starred: true
})

// สุ่มเพลง
const randomTrack = await api.get('/random-starred')
```
