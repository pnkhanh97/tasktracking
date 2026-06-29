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

const ROOT_FOLDER = process.env.TASK_DRIVE_FOLDER_ID ?? ''
if (!ROOT_FOLDER) console.error('[drive] TASK_DRIVE_FOLDER_ID is not set!')

type Drive = ReturnType<typeof driveClient>

// Tìm hoặc tạo 1 folder tên `name` bên trong `parentId`
async function getOrCreateFolder(drive: Drive, name: string, parentId: string): Promise<{ id: string; url: string }> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
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
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })
  return {
    id: folder.data.id!,
    url: folder.data.webViewLink ?? `https://drive.google.com/drive/folders/${folder.data.id}`,
  }
}

// Cấu trúc: TaskTracking / <projectId> / <taskId>
export async function getOrCreateTaskFolder(projectId: string, taskId: string): Promise<{ id: string; url: string }> {
  if (!ROOT_FOLDER) throw new Error('TASK_DRIVE_FOLDER_ID chưa được cấu hình trong môi trường')
  const drive = driveClient()
  const projectFolder = await getOrCreateFolder(drive, projectId, ROOT_FOLDER)
  return getOrCreateFolder(drive, taskId, projectFolder.id)
}

// Upload 1 file vào folder của task
export async function uploadFileToTask(
  projectId: string,
  taskId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ name: string; url: string }> {
  const drive = driveClient()
  const folder = await getOrCreateTaskFolder(projectId, taskId)

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folder.id] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })

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
