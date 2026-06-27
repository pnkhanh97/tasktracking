import { getSheetData, appendRow } from './sheets'

const SHEET = 'Project'

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

export async function getProjects(): Promise<Project[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  return data.slice(1).map((row, i) => ({
    rowNumber: i + 2,
    projectId: row[0] ?? '',
    name:        row[1] ?? '',
    description: row[2] ?? '',
    startDate:   row[3] ?? '',
    deadline:    row[4] ?? '',
    priority:    row[5] ?? '',
    status:      row[6] ?? '',
    manager:     row[7] ?? '',
    members:     row[8] ? row[8].split(',').map(s => s.trim()).filter(Boolean) : [],
    createdBy:   row[9] ?? '',
    createdAt:   row[10] ?? '',
  }))
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
