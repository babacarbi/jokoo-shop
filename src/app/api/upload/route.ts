import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérification type et taille (max 10 Mo en entrée avant compression)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'image dépasse la taille maximale autorisée (10 Mo)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    let uploadBuffer: Buffer = inputBuffer
    let uploadFileName: string = file.name
    let uploadContentType: string = file.type

    // Si ce n'est pas un SVG (qui est déjà vectoriel), on compresse automatiquement en WebP HD
    if (file.type !== 'image/svg+xml') {
      try {
        uploadBuffer = await sharp(inputBuffer)
          .rotate() // Corrige automatiquement l'orientation des photos smartphone (EXIF)
          .resize({
            width: 1400,
            height: 1400,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80, effort: 4 })
          .toBuffer()

        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')
        uploadFileName = `${baseName || 'image'}.webp`
        uploadContentType = 'image/webp'
      } catch (sharpError) {
        console.warn('[Sharp Compression Warning] Fallback au fichier original:', sharpError)
        // En cas d'erreur de décodage non bloquante, on garde le buffer original
      }
    }

    const publicUrl = await uploadToR2(uploadBuffer, uploadFileName, uploadContentType)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalSize: file.size,
      compressedSize: uploadBuffer.length,
      compressionRatio: file.size > uploadBuffer.length 
        ? `${Math.round((1 - uploadBuffer.length / file.size) * 100)}% d'économie` 
        : '0%'
    })
  } catch (error: any) {
    console.error('[Upload R2 Error]:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'envoi du fichier vers Cloudflare R2' }, { status: 500 })
  }
}

