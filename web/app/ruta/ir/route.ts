import { NextRequest, NextResponse } from 'next/server'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Recibe el form del wizard y redirige a la URL canónica. Solo valida la
// forma: si la combinación no existe, la página devuelve 404.
export function GET(request: NextRequest) {
  const objetivo = request.nextUrl.searchParams.get('objetivo') ?? ''
  const partida = request.nextUrl.searchParams.get('partida') ?? ''
  const destino = SLUG.test(objetivo) && SLUG.test(partida)
    ? `/ruta/${objetivo}/${partida}`
    : '/ruta#armar'
  return NextResponse.redirect(new URL(destino, request.url), 303)
}
