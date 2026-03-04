import { PAGE_ENDPOINTS } from '@constants/'
import { useAuth, useProject, useUser } from '@contexts/'
import { UserRole } from '@interfaces/'

export interface MenuItem {
  title: string
  link: string
  icon?: string
  requireAuth?: boolean
  children?: MenuItem[]
}

export const useSidebarNavigation = () => {
  const { isAuthenticated, openAuthModal } = useAuth()
  const { project } = useProject()
  const { user } = useUser()

  const baseItems: MenuItem[] = []

  const authItems: MenuItem[] = [
    {
      title: 'Проекты',
      link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.HOME}`,
      icon: '#',
      requireAuth: true,
      children: [
        ...(!project && user ? user?.projectData : [])
          .sort(
            (a, b) =>
              new Date(b.lastUpdated).getTime() -
              new Date(a.lastUpdated).getTime()
          )
          .map((el) => {
            return {
              title: el.name,
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${el.id}`,
              requireAuth: true,
            }
          }),
        {
          title: 'Создать новый',
          link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/new`,
          requireAuth: true,
        },
        ...(project ? [
          {
            title: 'Обзор',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}`,
            requireAuth: true,
          },
          {
            title: 'Тест-кейсы',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`,
            requireAuth: true,
          },
          {
            title: 'Тест-планы',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN}`,
            requireAuth: true,
          },
          {
            title: 'Скрипты',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.SCRIPT}`,
            requireAuth: true,
          },
          {
            title: 'Автотестинг',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.AUTO_TEST}`,
            requireAuth: true,
          },
          {
            title: 'Отчеты',
            link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.REPORTS}`,
            requireAuth: true,
          },
          ...( project.users.find(el => el.id === user?.id)?.role === UserRole.PROJECT_ADMIN ? [
            {
              title: 'Настройки',
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.SETTINGS}`,
              requireAuth: true,
            },
          ] : [])
          
        ] : [])
      ],
    },
    {
      title: 'Планировщик',
      link: '#',
      requireAuth: true,
      children: [
        {
          title: 'Список задач',
          link: '#',
          requireAuth: true,
        },
        {
          title: 'Создать задачу',
          link: '#',
          requireAuth: true,
        },
      ],
    },
    {
      title: 'Ресурсы',
      link: '/resources',
      requireAuth: true,
      children: [
        {
          title: 'Мониторинг',
          link: '#',
          requireAuth: true,
        },
        {
          title: 'Аналитика',
          link: '#',
          requireAuth: true,
        },
      ],
    },
  ]

  const menuItems = [...baseItems, ...(isAuthenticated ? authItems : [])]

  const handleMenuItemClick = (e: React.MouseEvent, item: MenuItem) => {
    if (item.requireAuth && !isAuthenticated) {
      e.preventDefault()
      openAuthModal('login')
      return
    }
  }

  return {
    menuItems,
    handleMenuItemClick,
    isAuthenticated,
  }
}
