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
- แสดง Genre และ Link ไปยัง iTunes เพื่อช่วยระบุศิลปินที่ถูกต้อง

### 2. Track Status Pipeline

- `idea → ready → recorded → posted`
- Toggle ⭐ สำหรับเพลงน่าเล่น
- เปลี่ยนสถานะด้วยคลิกเดียว

### 3. Release Radar

- ปุ่ม "Update เพลงใหม่" สำหรับศิลปินทั้งหมดที่บันทึก
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

### 6. Delete Management 🗑️

- **ลบศิลปิน** — ลบทั้งศิลปิน อัลบั้ม เพลง และข้อมูลที่เกี่ยวข้องทั้งหมด (cascade)
- **ลบเพลง** — ลบเพลงเดี่ยวๆ พร้อม status และ post logs
- **Confirmation** — มี popup ยืนยันก่อนลบทุกครั้ง
- สำหรับกรณีบันทึกผิดหรือไม่ต้องการเพลงนั้นแล้ว

---

## 🛠 Tech Stack

| Component       | Technology                       |
| --------------- | -------------------------------- |
| **Framework**   | Next.js 15 (App Router)          |
| **Database**    | SQLite (dev) → Turso/Neon (prod) |
| **ORM**         | Prisma                           |
| **UI**          | TailwindCSS + Ant Design         |
| **API Sources** | iTunes Search API                |
| **Deployment**  | localhost only                   |

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
6. **Update เพลงใหม่** → Release Radar อัตโนมัติ
7. **ลบเพลง/ศิลปิน** → กรณีบันทึกผิด

---

## 🌐 API Endpoints

### Search & Save
| Method   | Path                     | Function                |
| -------- | ------------------------ | ----------------------- |
| `GET`    | `/api/search`            | ค้นหาจาก iTunes API     |
| `POST`   | `/api/save/artist`       | บันทึกศิลปิน + เพลง     |
| `POST`   | `/api/sync-all`          | ดึงเพลงใหม่ทุกศิลปิน    |

### Track Management
| Method   | Path                     | Function                |
| -------- | ------------------------ | ----------------------- |
| `POST`   | `/api/track/:id/status`  | อัปเดตสถานะ/ดาว         |
| `POST`   | `/api/track/:id/postlog` | บันทึกการโพสต์          |
| `GET`    | `/api/track/:id/postlog` | ดูประวัติการโพสต์        |
| `DELETE` | `/api/track/:id`         | ลบเพลง                  |

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

- **`/`** — หน้าหลัก + Release Radar
- **`/search`** — ค้นหาและบันทึกศิลปิน
- **`/artists`** — รายการศิลปิน (grid view + delete button)
- **`/artists/[id]`** — รายละเอียดศิลปิน + เพลงทั้งหมด + toggle status/star + delete
- **`/tracks`** — เพลงทั้งหมด (table view)
- **`/random`** — หน้าสุ่มเพลงติดดาว

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

## 💭 Design Philosophy

> **"ใช้คนเดียว แต่ทำเหมือน production"**

- ✅ ระบบชัดเจน trackable ทุกอย่าง
- ✅ กันซ้ำด้วย external IDs
- ✅ Status pipeline ที่ make sense
- ✅ UI ใช้ง่าย ไม่ต้อง overthink

**Built by guitarist who codes** 🎸 × 💻

---
