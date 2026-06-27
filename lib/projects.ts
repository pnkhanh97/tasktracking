import { getSheetData, appendRow } from './sheets'

const SHEET = 'Project'
const HEADERS = ['ProjectID','Name','Description','StartDate','Deadline','Priority','Status','Manager','Members','CreatedBy','CreatedAt']

export type Project = {
  rowNumber: number
  projectId: string
  name: string
  description: string
  startDate: string
  deadline: string
  priority: string
  status: string
  manager: string
  members: string[]
  createdBy: string
  createdAt: string
}

function idx(headers: string[], name: string) {
  return headers.indexOf(name)
}

export async function getProjects(): Promise<Project[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  const h = data[0]
  // If first row is not a header (e.g. starts with PRJ-), skip detection
  const hasHeader = h[0] === 'ProjectID' || h.some(c => HEADERS.includes(c))
  if (!hasHeader) return []
  const rows = data.slice(1)
  return rows.map((row, i) => ({
    rowNumber: i + 2,
    projectId:   row[idx(h,'ProjectID')]   ?? '',
    name:        row[idx(h,'Name')]        ?? '',
    description: row[idx(h,'Description')] ?? '',
    startDate:   row[idx(h,'StartDate')]   ?? '',
    deadline:    row[idx(h,'Deadline')]    ?? '',
    priority:    row[idx(h,'Priority')]    ?? '',
    status:      row[idx(h,'Status')]      ?? '',
    manager:     row[idx(h,'Manager')]     ?? '',
    members:     row[idx(h,'Members')] ? row[idx(h,'Members')].split(',').map((s:string) => s.trim()).filter(Boolean) : [],
    createdBy:   row[idx(h,'CreatedBy')]   ?? '',
    createdAt:   row[idx(h,'CreatedAt')]   ?? '',
  })).filter(p => p.projectId)
}

export async function createProject(data: {
  name: string
  description: string
  startDate: string
  deadline: string
  priority: string
  manager: string
  members: string[]
  createdBy: string
}): Promise<string> {
  const projects = await getProjects()
  const nextNum = projects.length + 1
  const projectId = `PRJ-${String(nextNum).padStart(3, '0')}`
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  // Write header if sheet is empty
  const existing = await getSheetData(SHEET)
  if (existing.length === 0 || existing[0][0] !== 'ProjectID') {
    await appendRow(SHEET, HEADERS)
  }

  await appendRow(SHEET, [
    projectId,
    data.name,
    data.description,
    data.startDate,
    data.deadline,
    data.priority,
    'Chờ khởi động',
    data.manager,
    data.members.join(','),
    data.createdBy,
    now,
  ])

  return projectId
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const projects = await getProjects()
  return projects.find(p => p.projectId === projectId) ?? null
}
