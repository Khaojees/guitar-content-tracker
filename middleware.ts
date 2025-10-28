import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ถ้าไม่ได้ตั้ง AUTH_PASSWORD ก็ให้ผ่านไปได้เลย (สำหรับ dev)
  const authPassword = process.env.AUTH_PASSWORD
  if (!authPassword) {
    return NextResponse.next()
  }

  // เช็ค Basic Auth header
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
