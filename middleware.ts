import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // สำหรับ API routes: ตรวจสอบ API key หรือ cookie session
  if (pathname.startsWith('/api/')) {
    const apiKey = process.env.API_KEY

    // ถ้าไม่ได้ตั้ง API_KEY ก็ให้ผ่านไปได้เลย (สำหรับ dev)
    if (!apiKey) {
      return NextResponse.next()
    }

    const requestApiKey = request.headers.get('x-api-key')
    const authHeader = request.headers.get('authorization')

    // ถ้ามี API key หรือ Basic Auth ที่ถูกต้อง ก็ให้ผ่าน
    if (requestApiKey === apiKey) {
      return NextResponse.next()
    }

    // ตรวจสอบ Basic Auth (สำหรับเว็บที่เรียก API เดียวกัน)
    if (authHeader) {
      const authPassword = process.env.AUTH_PASSWORD
      if (authPassword) {
        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
        const [, password] = credentials.split(':')

        if (password === authPassword) {
          return NextResponse.next()
        }
      }
    }

    // ถ้าไม่มีทั้ง API key และ Basic Auth ที่ถูกต้อง
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    )
  }

  // สำหรับเว็บ UI: ใช้ Basic Auth
  const authPassword = process.env.AUTH_PASSWORD
  if (!authPassword) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  // Decode Basic Auth (format: "Basic base64(username:password)")
  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  // เช็ครหัสผ่าน (username อะไรก็ได้)
  if (password === authPassword) {
    return NextResponse.next()
  }

  // ถ้ารหัสผ่านผิด
  return new NextResponse('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

// Apply middleware ทุกหน้า ยกเว้น API routes ที่ไม่ต้องการ auth
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
