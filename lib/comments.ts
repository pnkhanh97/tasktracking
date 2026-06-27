import { getSheetData, appendRow } from './sheets'

const SHEET = 'Comments'
const HEADERS = ['CommentID','ProjectID','AuthorID','AuthorName','Content','CreatedAt']

export type Comment = {
  commentId: string
  projectId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export async function getCommentsByProject(projectId: string): Promise<Comment[]> {
  const data = await getSheetData(SHEET)
  if (data.length < 2) return []
  const h = data[0]
  if (!h.includes('CommentID')) return []
  return data.slice(1)
    .map(row => ({
      commentId:  row[h.indexOf('CommentID')]  ?? '',
      projectId:  row[h.indexOf('ProjectID')]  ?? '',
      authorId:   row[h.indexOf('AuthorID')]   ?? '',
      authorName: row[h.indexOf('AuthorName')] ?? '',
      content:    row[h.indexOf('Content')]    ?? '',
      createdAt:  row[h.indexOf('CreatedAt')]  ?? '',
    }))
    .filter(c => c.commentId && c.projectId === projectId)
}

export async function addComment(data: {
  projectId: string
  authorId: string
  authorName: string
  content: string
}): Promise<void> {
  const existing = await getSheetData(SHEET)
  if (existing.length === 0 || !existing[0].includes('CommentID')) {
    await appendRow(SHEET, HEADERS)
  }
  const count = existing.filter(r => r[0]?.startsWith('CMT-')).length
  const commentId = `CMT-${String(count + 1).padStart(4, '0')}`
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  await appendRow(SHEET, [commentId, data.projectId, data.authorId, data.authorName, data.content, now])
}
