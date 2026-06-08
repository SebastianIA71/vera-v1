import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { SESSION_SECRET } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PÚBLICAS — no requieren autenticación
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  '/setup',                           // Primera configuración del PIN
  '/lock',                            // Login (PIN, WebAuthn, Google OAuth)
  '/share',                           // Share extension
  '/sw.js',                           // Service Worker
  '/manifest.json',                   // PWA manifest
  '/icons',                           // Iconos de la app
  '/api/auth/setup',                  // Crear PIN
  '/api/auth/login',                  // Login PIN
  '/api/auth/salt',                   // Obtener salt para PIN
  '/api/auth/webauthn/auth-options',  // WebAuthn paso 1
  '/api/auth/webauthn/auth-verify',   // WebAuthn paso 2
  '/api/auth/google',                 // OAuth Google
  '/api/auth/google/callback',        // Google OAuth callback
  '/api/capabilities',                // Estado de servicios externos (público)
  '/api/widget',                      // Widget público (si existe)
  '/api/email/inbound',               // Webhooks de email entrante
];

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE CRON — requieren Authorization: Bearer $CRON_SECRET
// ─────────────────────────────────────────────────────────────────────────────

const CRON_ROUTES = ['/api/cron/'];

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE ADMIN — requieren sesión + rol='admin'
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ROUTES = ['/api/admin/'];

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY PRINCIPAL — Función de autenticación centralizada
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Rutas de CRON — verificar CRON_SECRET en header
  if (matchesRoute(pathname, CRON_ROUTES)) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    return NextResponse.next();
  }

  // 2. Rutas PÚBLICAS — permitir sin sesión
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // 3. Rutas PROTEGIDAS — verificar sesión
  const sessionCookie = req.cookies.get('vera_session');
  if (!sessionCookie) {
    // Si es API, devolver 401
    if (isApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    // Si es página del navegador, redirigir a /lock
    return NextResponse.redirect(new URL('/lock', req.url));
  }

  // 4. Verificar validez del JWT y extraer datos
  try {
    const verified = await jwtVerify(sessionCookie.value, SESSION_SECRET);
    const session = verified.payload as any;
    const role = session.role ?? 'user';

    // 5. Verificar acceso a rutas ADMIN — requieren rol='admin'
    if (matchesRoute(pathname, ADMIN_ROUTES)) {
      if (role !== 'admin') {
        const response = isApiRoute(pathname)
          ? new NextResponse(
              JSON.stringify({ error: 'Forbidden — admin role required' }),
              { status: 403, headers: { 'content-type': 'application/json' } }
            )
          : NextResponse.redirect(new URL('/', req.url));
        return response;
      }
    }

    return NextResponse.next();
  } catch (err) {
    // JWT inválido o expirado
    const response = isApiRoute(pathname)
      ? new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      : NextResponse.redirect(new URL('/lock', req.url));

    // Limpiar cookie inválida
    response.cookies.delete('vera_session');
    return response;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL MATCHER
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    // Protege todas las rutas EXCEPTO archivos estáticos de Next.js, imágenes, etc.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
