import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import aboutRaw from '../content/about.md?raw'
import { parseFrontmatter } from '@/content/frontmatter'
import styles from './About.module.css'

const { data, content } = parseFrontmatter(aboutRaw)

// Themed renderers. `node` is stripped so it isn't spread onto the DOM element.
const components: Components = {
  a({ node, ...props }) {
    void node
    return <a target="_blank" rel="noreferrer" {...props} />
  },
  img({ node, ...props }) {
    void node
    return <img className={styles.inlineImg} {...props} />
  },
}

/**
 * About section — renders a single Markdown file (src/content/about.md) with a
 * circular avatar floated top-left that the text wraps around. Inline images
 * referenced from the Markdown render wherever they're placed.
 */
export function About() {
  return (
    <div className={styles.about}>
      {data.avatar && (
        <img
          className={styles.avatar}
          src={data.avatar}
          alt={data.avatarAlt ?? 'avatar'}
        />
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
