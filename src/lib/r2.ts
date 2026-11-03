import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME || 'jokoo-media'
const publicUrl = process.env.R2_PUBLIC_URL || ''

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Variables Cloudflare R2 manquantes dans l\'environnement.')
  }

  const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanFileName,
      Body: fileBuffer,
      ContentType: contentType,
    })
  )

  // URL publique d'accès
  const baseUrl = publicUrl.replace(/\/$/, '')
  return `${baseUrl}/${cleanFileName}`
}

export async function deleteFromR2(fileKey: string): Promise<void> {
  if (!accountId || !accessKeyId || !secretAccessKey) return

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })
  )
}
