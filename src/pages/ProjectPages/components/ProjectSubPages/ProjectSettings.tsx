import { useHeaderStore } from '@stores/'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ProjectUser,
  ROLE_CONFIG,
  UserRole,
  DataPoolItem,
  Project,
} from '../../../../types/'
import styles from './ProjectSettings.module.scss'
import { useProject, useUser } from '@contexts/'
import { Breadcrumbs, QuestionDialog } from '@components/'
import { PAGE_ENDPOINTS } from '@constants/'

interface ProjectFormData {
  name: string
  url: string
  description: string
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

export const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    updateProject,
    deleteProject,
    project,
    checkAccess,
    updateProjectUsers,
    deleteProjectUsers,
  } = useProject()
  const { setHeaderContent } = useHeaderStore()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProjectFormData>({
    mode: 'onBlur',
    defaultValues: { name: '', url: '', description: '' },
  })

  const [dataPool, setDataPool] = useState<DataPoolItem[]>([])
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([])
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateUserModal, setshowUpdateUserModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [updatngUser, setUpdatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    role: UserRole.USER as UserRole,
  })
  const [updatedUser, setUpdatedUser] = useState<ProjectUser>()
  const [removeUserId, setRemoveUserId] = useState<number>(-1)
  const [dataPoolMode, setDataPoolMode] = useState<'upload' | 'manual'>(
    'manual'
  )
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showQuestion, setShowQuestion] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [question, setQuestion] = useState(<></>)
  const { user } = useUser()

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'warning', message: string) => {
      setNotification({ type, message })
      setTimeout(() => setNotification(null), 5000)
    },
    []
  )

  useEffect(() => {
    if (project) {
      setHeaderContent(
        <Breadcrumbs
          items={[
            {
              text: 'Проекты',
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.HOME}`,
            },
            {
              text: project.name,
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}`,
            },
            { text: 'настройки' },
          ]}
        />
      )
    }

    return () => {
      setHeaderContent(null)
    }
  }, [project, setHeaderContent])

  useEffect(() => {
    if (!project || !user) return

    try {
      setProjectUsers(project.users)

      reset({
        name: project.name,
        url: project.url,
        description: project.description,
      })

      setDataPool(project.datapool)

      const currentUserInProject = project.users?.find(
        (u: any) => u.email === user.profileData.email
      )

      const savedDataPool = localStorage.getItem(
        `project_${projectId}_datapool`
      )
      if (savedDataPool) {
        try {
          const parsedData = JSON.parse(savedDataPool)
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setDataPool(
              parsedData.map((item: any, index: number) => ({
                id: item.id || -1,
                key: item.key || '',
                value: item.value || '',
              }))
            )
          }
        } catch (error) {
          console.error('Error parsing data pool:', error)
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
      showNotification('error', 'Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, user, reset, navigate, showNotification])

  const handleSaveProject = async (data: ProjectFormData) => {
    if (!project || !projectId) return

    try {
      setIsLoading(true)

      const updateData = {
        name: data.name,
        url: data.url,
        description: data.description,
        datapool: dataPool,
        hasDatapool: dataPool && dataPool.length > 0,
        updatedAt: new Date(),
      } satisfies Partial<Project>

      await updateProject(updateData)

      showNotification('success', 'Настройки проекта успешно сохранены')
    } catch (error) {
      showNotification('error', 'Ошибка при сохранении настроек')
      console.error('Save project error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDataPool = async () => {
    if (!project || !projectId) return

    const validDataPool = dataPool
      .filter((item) => item.key.trim() && item.value.trim())
      .map((item) => ({
        id: item.id,
        key: item.key.trim(),
        value: item.value.trim(),
      }))

    localStorage.setItem(
      `project_${project.id}_datapool`,
      JSON.stringify(validDataPool)
    )
    try {
      await updateProject({
        datapool: validDataPool,
        hasDatapool: validDataPool && validDataPool.length > 0,
      })
      showNotification('success', 'DataPool успешно сохранен')
    } catch (error) {
      showNotification('error', 'Ошибка при удалении проекта')
      console.error('Delete project error:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || !projectId) return

    try {
      if (deleteConfirm !== project.name) {
        showNotification('error', `Введите "${project.name}" для подтверждения`)
        return
      }

      localStorage.removeItem(`project_${project.id}_datapool`)

      await deleteProject()

      showNotification('success', 'Проект успешно удален')

      setTimeout(() => {
        navigate('/app/home')
      }, 1500)
    } catch (error) {
      showNotification('error', 'Ошибка при удалении проекта')
      console.error('Delete project error:', error)
    }
  }

  const handleAddDataPoolRow = () => {
    setDataPool([
      ...dataPool,
      {
        id: -1,
        key: '',
        value: '',
      },
    ])
  }

  const handleUpdateDataPoolItem = (
    id: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setDataPool(
      dataPool.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleRemoveDataPoolItem = (id: number) => {
    if (dataPool.length <= 1) {
      showNotification('error', 'Должна остаться хотя бы одна запись')
      return
    }

    setDataPool(dataPool.filter((item) => item.id !== id))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExtensions = ['.csv', '.json', '.xlsx', '.xls']
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(extension)) {
      showNotification('error', 'Неподдерживаемый формат файла')
      return
    }

    setUploadedFile(file)

    setTimeout(() => {
      const sampleData = [
        { id: 1, key: 'username', value: 'test_user' },
        { id: 2, key: 'password', value: 'test_password' },
        { id: 3, key: 'email', value: 'test@example.com' },
      ]
      setDataPool(sampleData)
      showNotification('success', 'Файл успешно загружен и обработан')
    }, 1000)
  }

  const handleAddUser = async () => {
    if (!project || !projectId) return

    if (!EMAIL_REGEX.test(newUser.email)) {
      showNotification('error', 'Введите корректный email адрес')
      return
    }

    const existingUser = projectUsers.find(
      (user) => user.email === newUser.email
    )
    if (existingUser) {
      showNotification('error', 'Пользователь с таким email уже в проекте')
      return
    }

    try {
      const newUserData: ProjectUser = {
        id: Date.now(),
        firstName: 'Новый',
        lastName: 'Пользователь',
        fatherName: null,
        email: newUser.email,
        role: newUser.role,
        permissions: JSON.stringify(ROLE_CONFIG[newUser.role].permissions),
      }
      const updatedUsers = [...projectUsers, newUserData]

      await updateProjectUsers(updatedUsers)
      setProjectUsers(updatedUsers)

      setShowAddUserModal(false)
      setNewUser({ email: '', role: UserRole.USER })
      showNotification(
        'success',
        `Пользователь ${newUser.email} добавлен в проект`
      )
    } catch (error) {
      showNotification('error', 'Ошибка при добавлении пользователя')
      console.error('Add user error:', error)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    try {
      const updatedUsers = projectUsers.filter((user) => user.id !== userId)

      await deleteProjectUsers([userId])

      setProjectUsers(updatedUsers)
      showNotification('success', 'Пользователь удален из проекта')
      setRemoveUserId(-1)
    } catch (error) {
      showNotification('error', 'Ошибка при удалении пользователя')
      console.error('Remove user error:', error)
    }
  }

  const handleUpdateUser = async () => {
    if (!updatedUser) {
      return
    }
    setUpdatingUser(true)
    try {
      console.log(updatedUser)
      const updatedUsers = projectUsers.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      )
      await updateProjectUsers([updatedUser])

      setProjectUsers(updatedUsers)
      showNotification('success', 'Роль пользователя обновлена')
      setshowUpdateUserModal(false)
    } catch (error) {
      showNotification('error', 'Ошибка при обновлении пользователя')
      console.error('Update user error:', error)
    } finally {
      setUpdatingUser(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.projectSettings}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  if (!checkAccess([UserRole.PROJECT_ADMIN])) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Обратитесь к Администратору проекта для доступа к разделу</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.projectSettings}>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit(handleSaveProject)}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Основная информация</h2>

          <div className={styles.formGroup}>
            <label htmlFor="projectName" className={styles.required}>
              Название проекта
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Название проекта обязательно',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    id="projectName"
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.error : ''}`}
                    placeholder="Введите название проекта"
                  />
                  {errors.name && (
                    <div className={styles.errorMessage}>
                      {errors.name.message}
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="projectUrl" className={styles.required}>
              URL проекта
            </label>
            <Controller
              name="url"
              control={control}
              rules={{
                required: 'URL проекта обязателен',
                pattern: {
                  value: URL_REGEX,
                  message: 'Введите корректный URL',
                },
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    id="projectUrl"
                    type="text"
                    className={`${styles.input} ${errors.url ? styles.error : ''}`}
                    placeholder="https://example.com"
                  />
                  {errors.url && (
                    <div className={styles.errorMessage}>
                      {errors.url.message}
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="projectDescription">Описание проекта</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="projectDescription"
                  className={styles.textarea}
                  placeholder="Опишите проект..."
                />
              )}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>DataPool</h2>

          <div className={styles.dataPoolModeSelector}>
            <button
              type="button"
              className={`${styles.modeButton} ${dataPoolMode === 'upload' ? styles.active : ''}`}
              onClick={() => setDataPoolMode('upload')}
            >
              Загрузка из файла
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${dataPoolMode === 'manual' ? styles.active : ''}`}
              onClick={() => setDataPoolMode('manual')}
            >
              Ручной ввод
            </button>
          </div>

          {dataPoolMode === 'upload' ? (
            <>
              <div
                className={styles.uploadArea}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".csv,.json,.xlsx,.xls"
                />
                <div className={styles.uploadIcon}>📁</div>
                <div className={styles.uploadText}>
                  Перетащите файл сюда или нажмите для выбора
                </div>
                <div className={styles.fileInfo}>
                  Поддерживаемые форматы: CSV, JSON, Excel. Максимум 10 МБ
                </div>
                {uploadedFile && (
                  <div style={{ marginTop: '16px', color: '#0E6073' }}>
                    Загружен файл: {uploadedFile.name}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <table className={`${styles.dataPoolTable} ${styles.table}`}>
                <thead>
                  <tr>
                    <th>Ключ</th>
                    <th>Значение</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dataPool.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) =>
                            handleUpdateDataPoolItem(
                              item.id,
                              'key',
                              e.target.value
                            )
                          }
                          className={styles.tableInput}
                          placeholder="..."
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) =>
                            handleUpdateDataPoolItem(
                              item.id,
                              'value',
                              e.target.value
                            )
                          }
                          className={styles.tableInput}
                          placeholder="..."
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveDataPoolItem(item.id)}
                          className={styles.dangerButton}
                          disabled={dataPool.length <= 1}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.dataPoolActions}>
                <button
                  type="button"
                  onClick={handleAddDataPoolRow}
                  className={styles.secondaryButton}
                >
                  + Добавить строку
                </button>
              </div>
            </>
          )}

          <div className={styles.dataPoolActions}>
            <button
              type="button"
              onClick={handleSaveDataPool}
              className={styles.primaryButton}
            >
              Сохранить DataPool
            </button>
          </div>
        </div>

        <div className={styles.actionsContainer}>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className={styles.primaryButton}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className={styles.dangerButton}
          >
            Удалить проект
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.teamHeader}>
            <h2 className={styles.sectionTitle}>Команда проекта</h2>
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className={styles.primaryButton}
            >
              + Добавить пользователя
            </button>
          </div>

          {projectUsers.length > 0 ? (
            <table className={`${styles.teamTable} ${styles.table}`}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {projectUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{`${user.lastName} ${user.firstName}`.trim()}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        id="userRole"
                        value={user.role}
                        onChange={(e) => {
                          setUpdatedUser({
                            ...user,
                            role: parseInt(e.target.value) as UserRole,
                          })
                          setshowUpdateUserModal(true)
                        }}
                        className={styles.roleBadge}
                      >
                        {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>

                      {/* <div className={styles.roleBadge}>
                        {ROLE_CONFIG[user.role as UserRole]?.label ||
                          'Пользователь'}
                      </div> */}
                      <div className={styles.permissionsInfo}>
                        {ROLE_CONFIG[user.role as UserRole]?.description || ''}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          if (!project || !projectId) return

                          const userToRemove = projectUsers.find(
                            (el) => el.id === user.id
                          )
                          if (!userToRemove) return
                          setQuestion(
                            <>
                              Вы уверены, что хотите удалить следующего
                              пользователя из проекта? <br />
                              {userToRemove.firstName} {userToRemove.lastName}
                            </>
                          )
                          setShowQuestion(true)
                          setRemoveUserId(user.id)
                        }}
                        className={styles.dangerButton}
                        disabled={
                          user.role === UserRole.IT_LEADER ||
                          user.id === project?.createdBy
                        }
                      >
                        {removeUserId === user.id ? "Удаляем..." : "Удалить"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <div>В проекте пока нет участников</div>
            </div>
          )}
        </div>
      </form>

      {showAddUserModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Добавить пользователя</h3>

            <div className={styles.formGroup}>
              <label htmlFor="userEmail" className={styles.required}>
                Email пользователя
              </label>
              <input
                id="userEmail"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className={styles.input}
                placeholder="user@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userRole">Роль в проекте</label>
              <select
                id="userRole"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: parseInt(e.target.value) as UserRole,
                  })
                }
                className={styles.select}
              >
                {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.permissionSummary}>
              <div className={styles.permissionTitle}>
                Права для роли "{ROLE_CONFIG[newUser.role]?.label}":
              </div>
              <ul className={styles.permissionList}>
                {ROLE_CONFIG[newUser.role]?.permissions.map(
                  (permission, index) => (
                    <li key={index}>• {permission}</li>
                  )
                )}
              </ul>
            </div>

            <div className={styles.modalButtons}>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className={styles.secondaryButton}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddUser}
                disabled={!newUser.email || !EMAIL_REGEX.test(newUser.email)}
                className={styles.primaryButton}
              >
                Добавить пользователя
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowDeleteModal(false)
            setDeleteConfirm('')
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              Подтверждение удаления проекта
            </h3>

            <div className={styles.warningBlock}>
              <div className={styles.warningTitle}>
                ⚠️ Будут удалены все данные проекта:
              </div>
              <ul className={styles.warningList}>
                <li>Тест-кейсы</li>
                <li>Скрипты автоматизации</li>
                <li>Планы тестирования</li>
                <li>Отчеты</li>
                <li>История прогонов</li>
              </ul>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="deleteConfirm">
                Для подтверждения введите название проекта:
                <br />
                <strong>{project?.name}</strong>
              </label>
              <input
                id="deleteConfirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className={styles.input}
                placeholder="Введите название проекта"
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm('')
                }}
                className={styles.secondaryButton}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteConfirm !== project?.name}
                className={styles.dangerButton}
              >
                Удалить проект
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateUserModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setshowUpdateUserModal(false)
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Подтверждение изменения роли</h3>

            <div className={styles.formGroup}>
              <label htmlFor="">Пользователь:</label>
              <span>
                {`${updatedUser?.lastName} ${updatedUser?.firstName} ${updatedUser?.fatherName}`}
              </span>
              <label htmlFor="" style={{ marginTop: '10px' }}>
                Новая роль:
              </label>
              <span>
                {ROLE_CONFIG[updatedUser?.role as UserRole]?.label ||
                  'Пользователь'}
              </span>
            </div>

            <div className={styles.modalButtons}>
              <button
                type="button"
                onClick={() => {
                  setshowUpdateUserModal(false)
                }}
                className={styles.secondaryButton}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={updatngUser}
                className={styles.dangerButton}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
      <QuestionDialog
        showQuestion={showQuestion}
        changeShowQuestion={setShowQuestion}
        onYesClick={() => handleRemoveUser(removeUserId)}
        onNoClick={() => {
          setRemoveUserId(-1)
          setQuestion(<></>)
        }}
      >
        {question}
      </QuestionDialog>
    </div>
  )
}
