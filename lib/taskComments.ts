import { getSheetData, appendRow } from './sheets'

const SHEET = 'TaskComments'
const HEADERS = ['CommentID','TaskID','AuthorID','AuthorName','Content','CreatedAt']

export type TaskComment = {
  commentId: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export async function getCommentsByTask(taskId: string): Promise<TaskComment[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  const h = data[0]
  if (!h.includes('CommentID')) return []
  return data.slice(1)
    .map(row => ({
      commentId:  row[h.indexOf('CommentID')]  ?? '',
      taskId:     row[h.indexOf('TaskID')]     ?? '',
      authorId:   row[h.indexOf('AuthorID')]   ?? '',
      authorName: row[h.indexOf('AuthorName')] ?? '',
      content:    row[h.indexOf('Content')]    ?? '',
      createdAt:  row[h.indexOf('CreatedAt')]  ?? '',
    }))
    .filter(c => c.commentId && c.taskId === taskId)
}

export async function addTaskComment(data: {
  taskId: string
  authorId: string
  authorName: string
  content: string
}): Promise<void> {
  const existing = await getSheetData(SHEET)
  if (existing.length === 0 || !existing[0].includes('CommentID')) {
    await appendRow(SHEET, HEADERS)
  }
  const count = existing.filter(r => r[0]?.startsWith('TC-')).length
  const commentId = `TC-${String(count + 1).padStart(4, '0')}`
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  await appendRow(SHEET, [commentId, data.taskId, data.authorId, data.authorName, data.content, now])
}
