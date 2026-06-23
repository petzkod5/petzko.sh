import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * The site's canonical Markdown renderer — GFM enabled, links forced to open in
 * a new tab, and (deliberately) NO rehype-raw, so author-supplied raw HTML is
 * escaped rather than executed (XSS-safe). Shared by the public About section
 * and the admin About editor's live preview so what the author sees is exactly
 * what the site renders.
 *
 * Element styling is intentionally NOT owned here — the consumer wraps this in a
 * scoping class and styles the rendered elements, so the same markup adapts to
 * the site theme (About) or the admin palette (preview). `imgClassName` lets the
 * consumer style inline images, which can't be targeted by a wrapper alone in a
 * CSS-module setup.
 */
export function MarkdownBody({
  children,
  imgClassName,
}: {
  children: string
  imgClassName?: string
}) {
  const components: Components = useMemo(
    () => ({
      a({ node, ...props }) {
        void node
        return <a target="_blank" rel="noreferrer" {...props} />
      },
      img({ node, ...props }) {
        void node
        return <img className={imgClassName} {...props} />
      },
    }),
    [imgClassName],
  )

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
