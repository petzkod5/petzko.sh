import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSiteContent } from '@/state/ContentProvider'
import styles from './About.module.css'

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

export function About() {
  const { about } = useSiteContent()
  return (
    <div className={styles.about}>
      {about.avatar && (
        <img className={styles.avatar} src={about.avatar} alt={about.avatarAlt || 'avatar'} />
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {about.body}
      </ReactMarkdown>
    </div>
  )
}
