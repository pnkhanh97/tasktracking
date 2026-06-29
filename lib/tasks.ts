import { getSheetData, appendRow, updateRow } from './sheets'
import { getOrCreateTaskFolder } from './drive'

const SHEET = 'Tasks'
// Cột mới (DocLink, AttachmentFolder, ResultFiles) thêm vào CUỐI để tương thích dữ liệu cũ
const HEADERS = ['TaskID','ProjectID','Title','Description','AssignedTo','Priority','Status','Deadline','Result','SubmittedAt','CreatedBy','CreatedAt','DocLink','AttachmentFolder','ResultFiles','StartedAt']

export type Task = {
  rowNumber: number
  taskId: string
  projectId: string
  title: string
  description: string
  assignees: string[]
  priority: string
  status: string
  deadline: string
  result: string
  submittedAt: string
  startedAt: string
  createdBy: string
  createdAt: string
  docLink: string
  attachmentFolder: string
  resultFiles: { name: string; url: string }[]
}

function idx(h: string[], name: string) { return h.indexOf(name) }

function parseFiles(raw: string): { name: string; url: string }[] {
  if (!raw) return []
  // Định dạng: "name1|url1 ;; name2|url2"
  return raw.split(';;').map(s => s.trim()).filter(Boolean).map(part => {
    const [name, url] = part.split('|')
    return { name: name ?? '', url: url ?? '' }
  })
}

function stringifyFiles(files: { name: string; url: string }[]): string {
  return files.map(f => `${f.name}|${f.url}`).join(' ;; ')
}

function mapRow(h: string[], row: string[], rowNumber: number): Task {
  return {
    rowNumber,
    taskId:      row[idx(h,'TaskID')]      ?? '',
    projectId:   row[idx(h,'ProjectID')]   ?? '',
    title:       row[idx(h,'Title')]       ?? '',
    description: row[idx(h,'Description')] ?? '',
    assignees:   row[idx(h,'AssignedTo')] ? row[idx(h,'AssignedTo')].split(',').map(s => s.trim()).filter(Boolean) : [],
    priority:    row[idx(h,'Priority')]    ?? '',
    status:      row[idx(h,'Status')]      ?? '',
    deadline:    row[idx(h,'Deadline')]    ?? '',
    result:      row[idx(h,'Result')]      ?? '',
    submittedAt: row[idx(h,'SubmittedAt')] ?? '',
    createdBy:   row[idx(h,'CreatedBy')]   ?? '',
    createdAt:   row[idx(h,'CreatedAt')]   ?? '',
    docLink:     row[idx(h,'DocLink')]     ?? '',
    attachmentFolder: row[idx(h,'AttachmentFolder')] ?? '',
    resultFiles: parseFiles(row[idx(h,'ResultFiles')] ?? ''),
    startedAt:   row[idx(h,'StartedAt')]   ?? '',
  }
}

export async function getTaskSummaryByProject(): Promise<Record<string, { total: number; done: number; inProgress: number }>> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return {}
  const h = data[0]
  if (!h.includes('TaskID')) return {}
  const result: Record<string, { total: number; done: number; inProgress: number }> = {}
  data.slice(1).forEach(row => {
    const pid = row[idx(h, 'ProjectID')]
    if (!pid) return
    if (!result[pid]) result[pid] = { total: 0, done: 0, inProgress: 0 }
    result[pid].total++
    const status = row[idx(h, 'Status')] ?? ''
    if (status === 'Hoàn thành') result[pid].done++
    else if (status === 'Đang thực hiện') result[pid].inProgress++
  })
  return result
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  const h = data[0]
  if (!h.includes('TaskID')) return []
  return data.slice(1)
    .map((row, i) => mapRow(h, row, i + 2))
    .filter(t => t.taskId && t.projectId === projectId)
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return null
  const h = data[0]
  const i = data.slice(1).findIndex(r => r[idx(h,'TaskID')] === taskId)
  if (i < 0) return null
  return mapRow(h, data[i + 1], i + 2)
}

async function ensureHeader() {
  const existing = await getSheetData(SHEET)
  if (existing.length === 0 || !existing[0].includes('TaskID')) {
    await appendRow(SHEET, HEADERS)
  } else if (existing[0].length < HEADERS.length) {
    // Sheet cũ thiếu cột mới -> mở rộng header (cột mới đều ở cuối nên an toàn)
    await updateRow(SHEET, 1, HEADERS)
  }
}

export async function createTask(data: {
  projectId: string
  title: string
  description: string
  assignees: string[]
  priority: string
  deadline: string
  docLink: string
  createdBy: string
}): Promise<string> {
  await ensureHeader()
  const all = await getSheetData(SHEET)
  const count = all.filter(r => r[0]?.startsWith('TSK-')).length
  const taskId = `TSK-${String(count + 1).padStart(3, '0')}`
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  // Tạo sẵn folder Drive cho task
  let folderUrl = ''
  try {
    const folder = await getOrCreateTaskFolder(data.projectId, taskId)
    folderUrl = folder.url
  } catch {
    folderUrl = ''
  }

  await appendRow(SHEET, [
    taskId, data.projectId, data.title, data.description,
    data.assignees.join(','), data.priority, 'Chờ thực hiện',
    data.deadline, '', '', data.createdBy, now,
    data.docLink, folderUrl, '',
  ])
  return taskId
}

// Ghi lại nguyên dòng task hiện tại với các giá trị cập nhật
async function writeBack(task: Task, updates: Partial<Record<string, string>>) {
  const data = await getSheetData(SHEET)
  const h = data[0]
  const row = data[task.rowNumber - 1] ?? []
  // đảm bảo đủ độ dài
  while (row.length < h.length) row.push('')
  for (const [col, val] of Object.entries(updates)) {
    const c = idx(h, col)
    if (c >= 0) row[c] = val ?? ''
  }
  await updateRow(SHEET, task.rowNumber, row)
}

export async function submitTaskResult(
  task: Task,
  result: string,
  newFiles: { name: string; url: string }[]
): Promise<void> {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const merged = [...task.resultFiles, ...newFiles]
  await writeBack(task, {
    Result: result,
    ResultFiles: stringifyFiles(merged),
    SubmittedAt: now,
    Status: 'Chờ duyệt',
  })
}

export async function updateTaskStatus(task: Task, status: string): Promise<void> {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const updates: Record<string, string> = { Status: status }
  if (status === 'Đang thực hiện') {
    updates.StartedAt = now
  }
  if (status === 'Hoàn thành') {
    updates.SubmittedAt = now
  }
  await writeBack(task, updates)
}
