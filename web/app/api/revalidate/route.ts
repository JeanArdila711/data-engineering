import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 })
  }

  revalidatePath('/')
  revalidatePath('/ruta')
  revalidatePath('/ruta/[objetivo]/[partida]', 'page')
  return NextResponse.json({ revalidated: true })
}
