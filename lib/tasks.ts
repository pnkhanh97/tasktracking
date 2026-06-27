import { getSheetData, appendRow, updateRow } from './sheets'

const SHEET = 'Tasks'
const HEADERS = ['TaskID','ProjectID','Title','Description','AssignedTo','Priority','Status','Deadline','Result','SubmittedAt','CreatedBy','CreatedAt']

export type Task = {
  rowNumber: number
  taskId: string
  projectId: string
  title: string
  description: string
  assignedTo: string
  priority: string
  status: string
  deadline: string
  result: string
  submittedAt: string
  createdBy: string
  createdAt: string
}

function idx(h: string[], name: string) { return h.indexOf(name) }

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  const h = data[0]
  if (!h.includes('TaskID')) return []
  return data.slice(1)
    .map((row, i) => ({
      rowNumber: i + 2,
      taskId:      row[idx(h,'TaskID')]      ?? '',
      projectId:   row[idx(h,'ProjectID')]   ?? '',
      title:       row[idx(h,'Title')]       ?? '',
      description: row[idx(h,'Description')] ?? '',
      assignedTo:  row[idx(h,'AssignedTo')]  ?? '',
      priority:    row[idx(h,'Priority')]    ?? '',
      status:      row[idx(h,'Status')]      ?? '',
      deadline:    row[idx(h,'Deadline')]    ?? '',
      result:      row[idx(h,'Result')]      ?? '',
      submittedAt: row[idx(h,'SubmittedAt')] ?? '',
      createdBy:   row[idx(h,'CreatedBy')]   ?? '',
      createdAt:   row[idx(h,'CreatedAt')]   ?? '',
    }))
    .filter(t => t.taskId && t.projectId === projectId)
}

export async function createTask(data: {
  projectId: string
  title: string
  description: string
  assignedTo: string
  priority: string
  deadline: string
  createdBy: string
}): Promise<string> {
  const existing = await getSheetData(SHEET)
  if (existing.length === 0 || !existing[0].includes('TaskID')) {
    await appendRow(SHEET, HEADERS)
  }
  const all = existing.filter(r => r[0]?.startsWith('TSK-'))
  const nextNum = all.length + 1
  const taskId = `TSK-${String(nextNum).padStart(3, '0')}`
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  await appendRow(SHEET, [
    taskId, data.projectId, data.title, data.description,
    data.assignedTo, data.priority, 'Chờ thực hiện',
    data.deadline, '', '', data.createdBy, now,
  ])
  return taskId
}

export async function submitTaskResult(task: Task, result: string): Promise<void> {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const data = await getSheetData(SHEET)
  const h = data[0]
  const resultIdx = idx(h, 'Result')
  const submittedAtIdx = idx(h, 'SubmittedAt')
  const statusIdx = idx(h, 'Status')

  const row = data[task.rowNumber - 1] ?? []
  row[resultIdx] = result
  row[submittedAtIdx] = now
  row[statusIdx] = 'Chờ duyệt'
  await updateRow(SHEET, task.rowNumber, row)
}

export async function updateTaskStatus(task: Task, status: string): Promise<void> {
  const data = await getSheetData(SHEET)
  const h = data[0]
  const row = data[task.rowNumber - 1] ?? []
  row[idx(h, 'Status')] = status
  if (status === 'Hoàn thành') {
    row[idx(h, 'SubmittedAt')] = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  }
  await updateRow(SHEET, task.rowNumber, row)
}
