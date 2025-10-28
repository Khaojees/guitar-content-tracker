# 🎸 Guitar Content Tracker

> ระบบจัดการเพลงสำหรับทำคลิปกีตาร์สั้น — พัฒนาด้วย Next.js + Prisma + API สาธารณะ

---

## 💡 ปัญหาที่แก้

- **ไม่ต้องนั่งนึกว่าจะเล่นเพลงอะไร** — มีระบบสุ่มเพลงที่ติดดาว
- **ไม่ต้องจำว่าเพลงไหนเล่นไปแล้ว** — มี status tracking + post log
- **ไม่พลาดเพลงใหม่** — มี Release Radar ดึงเพลงใหม่ของศิลปินที่ติดตาม
- **จัดการแบบมืออาชีพ** — ทุกอย่างอยู่ในฐานข้อมูล searchable, trackable

---

## 🎯 Core Features

### 1. ระบบค้นหาและบันทึกเพลง

- ดึงข้อมูลจาก **iTunes Search API**
- รองรับเพลงไทย / สากล / อนิเมะ / OST
- กันซ้ำอัตโนมัติด้วย external IDs
- **รูปภาพศิลปิน/อัลบั้ม** จาก iTunes (artworkUrl60, artworkUrl100, artworkUrl600) เก็บเป็น URL
- แสดง Genre และ Link ไปยัง iTunes/YouTube เพื่อช่วยระบุศิลปินที่ถูกต้อง

### 2. Track Status Pipeline

- `idea → ready → recorded → posted`
- Toggle ⭐ สำหรับเพลงน่าเล่น
- **Ignored** — ทำเครื่องหมายเพลงที่เล่นไม่ได้หรือไม่มี intro ที่เหมาะ
- **Note** — เขียนบันทึกรายละเอียดหรือไอเดียเสริมสำหรับแต่ละเพลง
- เปลี่ยนสถานะด้วยคลิกเดียว

### 3. Playlist Management 🎵

- **สร้าง/แก้ไข/ลบ Playlist** — จัดกลุ่มเพลงตามธีมหรือแผนการทำคอนเทนต์
- **เพิ่มเพลงเข้า Playlist** — จัดระเบียบเพลงที่ต้องการเล่นตามหมวดหมู่
- **แสดงสถิติ** — จำนวนเพลง + ระยะเวลารวม
- **หน้า Playlist Detail** — ดูเพลงทั้งหมดใน playlist พร้อมจัดการเพลง

### 4. Release Radar (Sync Dashboard)

- **Sync Enable/Disable** — เปิด/ปิดการ sync สำหรับศิลปินแต่ละคน
- ดึงเพลงใหม่จากศิลปินทั้งหมดที่เปิด sync
- แสดง Preview เพลงใหม่ก่อน Import
- เลือก Add เป็นเพลง/อัลบั้ม/ทั้งหมดได้

### 5. Post Management

- บันทึก platform (TikTok / YouTube / Facebook)
- เก็บ URL และวันที่โพสต์
- ป้องกันการโพสต์ซ้ำ
- ดูประวัติการโพสต์ทั้งหมด

### 6. Random Starred 🎲

- สุ่มเพลงจากที่ติดดาวไว้
- เฉพาะสถานะ `idea` หรือ `ready`
- ไม่รวมเพลงที่ถูก ignored
- สำหรับตอนนึกไม่ออกจะเล่นอะไร

### 7. Delete Management 🗑️

- **ลบศิลปิน** — ลบทั้งศิลปิน อัลบั้ม เพลง และข้อมูลที่เกี่ยวข้องทั้งหมด (cascade)
- **ลบอัลบั้ม** — ลบอัลบั้มพร้อมเพลงทั้งหมด (cascade)
- **ลบเพลง** — ลบเพลงเดี่ยวๆ พร้อม status และ post logs
- **ลบ Playlist** — ลบ playlist (ไม่ลบเพลงจริง)
- **Confirmation** — มี popup ยืนยันก่อนลบทุกครั้ง

---

## 🛠 Tech Stack

| Component       | Technology                       |
| --------------- | -------------------------------- |
| **Framework**   | Next.js 15 (App Router)          |
| **Database**    | PostgreSQL (Vercel Postgres)     |
| **ORM**         | Prisma                           |
| **UI**          | TailwindCSS + Ant Design         |
| **API Sources** | iTunes Search API                |
| **Deployment**  | Vercel                           |

---

## 📊 Database Schema

```
Artist → Album → Track ←→ Playlist
  ↓                ↓           ↓
syncEnabled  TrackStatus  PlaylistTrack
  ↓            ↓    ↓
imageUrl   starred note
           ignored
             ↓
          PostLog
```

**ตารางหลัก:**

- **Artist** — name, imageUrl, syncEnabled, timestamps
- **Album** — name, imageUrl, artistId, timestamps
- **Track** — name, albumId, duration, trackNumber, note, timestamps
- **TrackStatus** — trackId (unique), status, starred, ignored, timestamps
- **PostLog** — trackStatusId, platform, url, postedAt, timestamps
- **Playlist** — name, description, timestamps
- **PlaylistTrack** — playlistId, trackId (unique pair), order, timestamps
- **Source** — type, externalId (unique pair), artistId/albumId/trackId

**รูปภาพ:**

- เก็บ `imageUrl` (string) ใน Artist/Album
- ดึงจาก iTunes API (artworkUrl60, artworkUrl100, artworkUrl600)
- ไม่ต้องดาวน์โหลดมาเก็บ ใช้ URL โดยตรง

**การ Sync:**

- Artist มี `syncEnabled` (default: true)
- ใช้ควบคุมว่าจะให้ Release Radar ดึงเพลงใหม่หรือไม่
- สำหรับศิลปินที่ติดตามแบบไม่เข้มข้น

---

## 🔄 Workflow

1. **ค้นหาศิลปิน** → บันทึกทั้งวง พร้อมเพลงทั้งหมด
2. **ติดดาวเพลงที่ชอบ** → ใช้สุ่มภายหลัง
3. **เขียน Note** → บันทึกไอเดียหรือรายละเอียดเพิ่มเติม
4. **จัดกลุ่มด้วย Playlist** → สร้าง playlist และเพิ่มเพลงเข้าไป
5. **Update สถานะ** → `idea → ready → recorded → posted`
6. **บันทึกการโพสต์** → platform + url
7. **สุ่มเพลงใหม่** → จากที่ติดดาวไว้ (ไม่รวม ignored)
8. **Update เพลงใหม่** → Release Radar อัตโนมัติ (เฉพาะที่เปิด sync)
9. **ลบเพลง/ศิลปิน** → กรณีบันทึกผิด

---

## 🌐 API Endpoints

### Search & Save
| Method   | Path                     | Function                |
| -------- | ------------------------ | ----------------------- |
| `GET`    | `/api/search`            | ค้นหาจาก iTunes API     |
| `POST`   | `/api/save/artist`       | บันทึกศิลปิน + เพลง     |
| `POST`   | `/api/save/album`        | บันทึกอัลบั้ม + เพลง    |
| `POST`   | `/api/save/track`        | บันทึกเพลงเดี่ยว        |
| `GET`    | `/api/search/album/:id`  | ดึงข้อมูลอัลบั้ม        |
| `GET`    | `/api/search/status`     | ตรวจสอบสถานะการบันทึก   |

### Sync Operations
| Method   | Path                  | Function                     |
| -------- | --------------------- | ---------------------------- |
| `POST`   | `/api/sync-all`       | ดึงเพลงใหม่ทุกศิลปิน (เก่า)  |
| `POST`   | `/api/sync/preview`   | Preview เพลงใหม่ (แบบใหม่)    |
| `POST`   | `/api/sync/apply`     | Apply การ Import เพลงใหม่    |

### Track Management
| Method   | Path                     | Function                       |
| -------- | ------------------------ | ------------------------------ |
| `GET`    | `/api/tracks`            | ดึงเพลงทั้งหมด (filter ได้)     |
| `POST`   | `/api/track/:id/status`  | อัปเดตสถานะ/ดาว/ignored/note  |
| `POST`   | `/api/track/:id/postlog` | บันทึกการโพสต์                 |
| `GET`    | `/api/track/:id/postlog` | ดูประวัติการโพสต์               |
| `DELETE` | `/api/track/:id`         | ลบเพลง                         |

### Playlist Management
| Method   | Path                          | Function                    |
| -------- | ----------------------------- | --------------------------- |
| `GET`    | `/api/playlist`               | ดึง playlist ทั้งหมด        |
| `POST`   | `/api/playlist`               | สร้าง playlist ใหม่         |
| `GET`    | `/api/playlist/:id`           | ดูรายละเอียด playlist       |
| `PATCH`  | `/api/playlist/:id`           | แก้ไข playlist              |
| `DELETE` | `/api/playlist/:id`           | ลบ playlist                 |
| `POST`   | `/api/playlist/:id/tracks`    | เพิ่มเพลงเข้า playlist       |
| `DELETE` | `/api/playlist/:id/tracks`    | ลบเพลงออกจาก playlist       |

### Delete Operations
| Method   | Path                | Function            |
| -------- | ------------------- | ------------------- |
| `DELETE` | `/api/artist/:id`   | ลบศิลปิน (cascade)  |
| `DELETE` | `/api/album/:id`    | ลบอัลบั้ม (cascade) |
| `DELETE` | `/api/track/:id`    | ลบเพลง              |

### Random
| Method   | Path                  | Function          |
| -------- | --------------------- | ----------------- |
| `GET`    | `/api/random-starred` | สุ่มเพลงติดดาว    |

---

## 📱 UI Pages

- **`/`** — หน้าหลัก + Quick Actions + Playlist Preview + Release Radar Link
- **`/search`** — ค้นหาและบันทึกศิลปิน/อัลบั้ม/เพลง
- **`/artists`** — รายการศิลปิน (grid view + toggle sync + delete button)
- **`/artists/[id]`** — รายละเอียดศิลปิน + เพลงทั้งหมด + toggle status/star/ignored + note + delete
- **`/tracks`** — เพลงทั้งหมด (table view + filter + เพิ่มเข้า playlist + edit note)
- **`/playlists`** — รายการ playlist ทั้งหมด + สร้าง/แก้ไข/ลบ
- **`/playlists/[id]`** — รายละเอียด playlist + เพลงทั้งหมด + ลบเพลง + sort
- **`/sync`** — Sync Dashboard (Preview + Import เพลงใหม่)
- **`/random`** — หน้าสุ่มเพลงติดดาว (ไม่รวม ignored)

---

## 🎬 Use Case Example

```javascript
// 1. ค้นหา "Oasis" จาก iTunes Search API
// 2. บันทึกทั้งวง + albums + tracks
// 3. ติดดาว "Wonderwall", "Don't Look Back in Anger"
// 4. เขียน note "เล่น intro ช้าๆ แบบอะคูสติก" ใน Wonderwall
// 5. สร้าง playlist "Rock Classics" และเพิ่มเพลงทั้ง 2 เข้าไป
// 6. เปลี่ยนสถานะ "Wonderwall" → ready
// 7. ถ่ายวิดีโอ → recorded
// 8. โพสต์ TikTok → posted + save URL
// 9. สุ่มเพลงถัดไป → ได้ "Don't Look Back in Anger"
// 10. เพลงบางเพลงที่ intro ไม่เหมาะ → ทำเครื่องหมาย ignored
// 11. Release Radar ดึงเพลงใหม่ของ Oasis มาให้ preview
// 12. ปิด sync สำหรับศิลปินที่ไม่สนใจเพลงใหม่
```

---

## 💭 Design Philosophy

> **"ใช้คนเดียว แต่ทำเหมือน production"**

- ✅ ระบบชัดเจน trackable ทุกอย่าง
- ✅ กันซ้ำด้วย external IDs
- ✅ Status pipeline ที่ make sense
- ✅ UI ใช้ง่าย ไม่ต้อง overthink

**Built by guitarist who codes** 🎸 × 💻

---

## 🚀 Deployment บน Vercel

### Prerequisites
- บัญชี [Vercel](https://vercel.com)
- GitHub repository ของโปรเจกต์นี้

### ขั้นตอน Deploy

#### 1. สร้าง Vercel Postgres Database
```bash
# ไปที่ Vercel Dashboard → Storage → Create Database
# เลือก Postgres
# คัดลอก Environment Variables ที่ได้
```

#### 2. Import โปรเจกต์ใน Vercel
```bash
# ไปที่ Vercel Dashboard → New Project
# Import จาก GitHub repository
# เลือก guitar-content-tracker
```

#### 3. ตั้งค่า Environment Variables
ใน Vercel Project Settings → Environment Variables เพิ่ม:
```env
DATABASE_URL=postgres://...  (จาก Vercel Postgres)
DIRECT_URL=postgres://...    (จาก Vercel Postgres)
```

#### 4. Deploy
```bash
# Vercel จะ auto-deploy ทันทีที่ push code
# หรือกด Deploy ใน Dashboard
```

#### 5. Database Setup (Auto)
Build command ใน `vercel.json` จะรัน:
- `prisma generate` — สร้าง Prisma Client
- `prisma db push` — สร้างตารางใน database
- `next build` — build Next.js

### Local Development กับ Vercel Postgres

```bash
# 1. ติดตั้ง Vercel CLI
npm i -g vercel

# 2. Link โปรเจกต์
vercel link

# 3. Pull environment variables
vercel env pull .env.local

# 4. รัน development server
npm run dev
```

### การสลับระหว่าง SQLite (dev) และ PostgreSQL (prod)

**Development (SQLite):**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Production (PostgreSQL):**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Troubleshooting

**Build Failed:**
- ตรวจสอบ `DATABASE_URL` และ `DIRECT_URL` ใน Environment Variables
- ดู build logs ใน Vercel Dashboard

**Database Connection Error:**
- ตรวจสอบว่า Vercel Postgres database ยังทำงานอยู่
- ลอง Redeploy

**Migration Issues:**
- ใช้ `prisma db push` แทน `prisma migrate` สำหรับ prototype
- หรือสร้าง migrations ด้วย `prisma migrate dev` แล้ว commit

---
