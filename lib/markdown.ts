import 'server-only'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.setOptions({ gfm: true, breaks: true })

const ALLOWED = {
  allowedTags: [
    'p', 'br', 'hr', 'strong', 'em', 'del', 'blockquote', 'ul', 'ol', 'li',
    'h2', 'h3', 'h4', 'a', 'img', 'figure', 'figcaption', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

export async function renderMarkdown(md: string): Promise<string> {
  const raw = await marked.parse(md)
  return sanitizeHtml(raw, ALLOWED)
}

/** Drops headings levels 1/5/6 mapping noise so the narrow column stays readable. */
export function cleanPlain(md: string): string {
  return sanitizeHtml(md, { allowedTags: [], allowedAttributes: {} }).slice(0, 300)
}