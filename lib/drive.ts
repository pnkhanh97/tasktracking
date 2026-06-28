import { google } from 'googleapis'
import { Readable } from 'stream'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

function driveClient() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

const ROOT_FOLDER = process.env.TASK_DRIVE_FOLDER_ID!

// Tìm hoặc tạo folder con tên = taskId trong folder gốc TaskTracking
export async function getOrCreateTaskFolder(taskId: string): Promise<{ id: string; url: string }> {
  const drive = driveClient()
  const q = `name='${taskId}' and '${ROOT_FOLDER}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await drive.files.list({
    q,
    fields: 'files(id, webViewLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (res.data.files && res.data.files.length > 0) {
    const f = res.data.files[0]
    return { id: f.id!, url: f.webViewLink ?? `https://drive.google.com/drive/folders/${f.id}` }
  }

  const folder = await drive.files.create({
    requestBody: {
      name: taskId,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER],
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })
  return {
    id: folder.data.id!,
    url: folder.data.webViewLink ?? `https://drive.google.com/drive/folders/${folder.data.id}`,
  }
}

// Upload 1 file vào folder của task, trả về { name, url }
export async function uploadFileToTask(
  taskId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ name: string; url: string }> {
  const drive = driveClient()
  const folder = await getOrCreateTaskFolder(taskId)

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folder.id] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })

  // Cho phép bất kỳ ai có link đều xem được
  try {
    await drive.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    })
  } catch {
    // ignore nếu không set được quyền
  }

  return {
    name: fileName,
    url: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  }
}
