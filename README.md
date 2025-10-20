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
- ดึงข้อมูลจาก **iTunes Search API**, **Deezer**, **AnimeThemes**
- รองรับเพลงไทย / สากล / อนิเมะ / OST
- กันซ้ำอัตโนมัติด้วย external IDs
- **รูปภาพศิลปิน/อัลบั้ม** จาก iTunes (artworkUrl60, artworkUrl100, artworkUrl600) เก็บเป็น URL

### 2. Track Status Pipeline
- `idea → ready → recorded → posted`
- Toggle ⭐ สำหรับเพลงน่าเล่น
- เปลี่ยนสถานะด้วยคลิกเดียว

### 3. Release Radar
- ปุ่ม "Update เพลงใหม่" สำหรับศิลปินทั้งหมด
- แสดงรายการเพลงใหม่ที่ยังไม่มีในระบบ
- เลือก Add เป็นเพลง/อัลบั้ม/ทั้งหมด

### 4. Post Management
- บันทึก platform (TikTok / YouTube / Facebook)
- เก็บ URL และวันที่โพสต์
- ป้องกันการโพสต์ซ้ำ

### 5. Random Starred 🎲
- สุ่มเพลงจากที่ติดดาวไว้
- เฉพาะสถานะ `idea` หรือ `ready`
- สำหรับตอนนึกไม่ออกจะเล่นอะไร

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | SQLite (dev) → Turso/Neon (prod) |
| **ORM** | Prisma |
| **UI** | TailwindCSS + shadcn/ui |
| **API Sources** | iTunes Search API, Deezer, AnimeThemes |
| **Deployment** | Vercel |

---

## 📊 Database Schema

```
Artist → Album → Track
           ↓
   TrackStatus (status + starred)
           ↓
   PostLog (platform + url)
```

**ตาราง Source:**
- ใช้ map external IDs กับ local entities
- `UNIQUE(type, externalId)` ป้องกันซ้ำ

**รูปภาพ:**
- เก็บ `imageUrl` (string) ใน Artist/Album
- ดึงจาก iTunes API (artworkUrl60, artworkUrl100, artworkUrl600)
- ไม่ต้องดาวน์โหลดมาเก็บ ใช้ URL โดยตรง

**กลุ่มเพลง:**
- เพลงที่ไม่มี album → "ไม่ระบุอัลบั้ม"
- Auto-detect genre/category จาก API

---

## 🔄 Workflow

1. **ค้นหาศิลปิน** → บันทึกทั้งวง พร้อมเพลงทั้งหมด
2. **ติดดาวเพลงที่ชอบ** → ใช้สุ่มภายหลัง
3. **Update สถานะ** → `idea → ready → recorded → posted`
4. **บันทึกการโพสต์** → platform + url
5. **สุ่มเพลงใหม่** → จากที่ติดดาวไว้

---

## 🌐 API Endpoints

| Method | Path | Function |
|--------|------|----------|
| `GET` | `/api/search` | ค้นหาจาก external APIs |
| `POST` | `/api/save/artist` | บันทึกศิลปิน + เพลง |
| `POST` | `/api/track/:id/status` | อัปเดตสถานะ |
| `POST` | `/api/track/:id/postlog` | บันทึกการโพสต์ |
| `POST` | `/api/sync-all` | ดึงเพลงใหม่ทุกศิลปิน |
| `GET` | `/api/random-starred` | สุ่มเพลงติดดาว |

---

## 📱 UI Pages

- `/search` — ค้นหาและบันทึก
- `/artists` — รายการศิลปิน
- `/artists/[id]` — เพลงของศิลปิน + toggle status
- `/tracks` — เพลงทั้งหมด (sortable)
- `/random` — หน้าสุ่มเพลง

---

## 🎬 Use Case Example

```javascript
// 1. ค้นหา "Oasis" จาก iTunes Search API
// 2. บันทึกทั้งวง + albums + tracks
// 3. ติดดาว "Wonderwall", "Don't Look Back in Anger"
// 4. เปลี่ยนสถานะ "Wonderwall" → ready
// 5. ถ่ายวิดีโอ → recorded
// 6. โพสต์ TikTok → posted + save URL
// 7. สุ่มเพลงถัดไป → ได้ "Don't Look Back in Anger"
```

---

## 🔮 Future Features

- [ ] Auto sync เพลงใหม่ทุกสัปดาห์ (Vercel Cron)
- [ ] Export/Import JSON backup
- [ ] Keyboard shortcuts (`j/k` = navigate, `s` = star, `r` = recorded)
- [ ] Advanced filters (key, tempo, duration)
- [ ] Analytics (เพลงที่โพสต์บ่อยสุด)
- [x] iTunes Search API integration (ไม่ต้อง authentication)
- [ ] Audio preview จาก iTunes (30 วินาที)

---

## 💭 Design Philosophy

> **"ใช้คนเดียว แต่ทำเหมือน production"**

- ✅ ระบบชัดเจน trackable ทุกอย่าง
- ✅ กันซ้ำด้วย external IDs
- ✅ Status pipeline ที่ make sense
- ✅ UI ใช้ง่าย ไม่ต้อง overthink

**Built by guitarist who codes** 🎸 × 💻

---
