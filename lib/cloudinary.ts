import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadFileToCloudinary(
  projectId: string,
  taskId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ name: string; url: string }> {
  const folder = `tasktracking/${projectId}/${taskId}`

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName.replace(/\.[^/.]+$/, ''), // bỏ extension, cloudinary tự thêm
        resource_type: 'auto',                         // tự detect image/video/raw
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          const msg = typeof error === 'object'
            ? (error.message || error.http_code || JSON.stringify(error))
            : String(error)
          reject(new Error(String(msg)))
        } else {
          resolve(result as { secure_url: string })
        }
      }
    )
    stream.end(buffer)
  })

  return { name: fileName, url: result.secure_url }
}
