import { MarkdownBody } from '@/components/MarkdownBody'
import { useSiteContent } from '@/state/ContentProvider'
import styles from './About.module.css'

export function About() {
  const { about } = useSiteContent()
  return (
    <div className={styles.about}>
      {about.avatar && (
        <img className={styles.avatar} src={about.avatar} alt={about.avatarAlt || 'avatar'} />
      )}
      <MarkdownBody imgClassName={styles.inlineImg}>{about.body}</MarkdownBody>
    </div>
  )
}
