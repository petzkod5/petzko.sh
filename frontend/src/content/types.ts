export interface AboutDoc {
  heading: string
  avatar: string
  avatarAlt: string
  body: string
}

export interface ContactItem {
  type: string
  url: string
  description: string
  click: boolean
  newTab: boolean
  copy: boolean
}

export interface ProjectItem {
  type: string
  name: string
  url: string
  icon: string
  company: string
  description: string
}

export interface SiteContent {
  about: AboutDoc
  contacts: ContactItem[]
  portfolio: ProjectItem[]
}
