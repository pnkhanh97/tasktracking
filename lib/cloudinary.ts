import crypto from 'crypto'

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME  ?? ''
const API_KEY     = process.env.CLOUDINARY_API_KEY     ?? ''
const API_SECRET  = process.env.CLOUDINARY_API_SECRET  ?? ''

export async function uploadFileToCloudinary(
  projectId: string,
  taskId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ name: string; url: string }> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(`Cloudinary chưa cấu hình: cloud=${CLOUD_NAME} key=${API_KEY ? '(set)' : '(missing)'}`)
  }

  const folder    = `tasktracking/${projectId}/${taskId}`
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // Tạo signature theo Cloudinary spec
  const toSign    = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')

  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName)
  form.append('folder',    folder)
  form.append('timestamp', timestamp)
  form.append('api_key',   API_KEY)
  form.append('signature', signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: form }
  )

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) {
    throw new Error(JSON.stringify(data))
  }

  return { name: fileName, url: String(data.secure_url ?? '') }
}
