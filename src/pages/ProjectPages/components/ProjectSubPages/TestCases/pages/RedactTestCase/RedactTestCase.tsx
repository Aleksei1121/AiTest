import { PAGE_ENDPOINTS } from '@constants/'
import { useProject, useTestCase, useUser } from '@contexts/'
import {
  TestCase,
  TestCaseUpdateData,
  testCaseStatusMap,
  testCasePriorityMap,
  TestCaseStep,
  UserRole,
} from '@interfaces/'
import { useHeaderStore } from '@stores/'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './RedactTestCases.module.scss'
import { Controller, useForm } from 'react-hook-form'
import {
  AttachmentsManager,
  StepsEditor,
  TagsInput,
  TestDataEditor,
} from '../../components'
import { Breadcrumbs, QuestionDialog } from '@components/'
import { toast } from 'sonner'
import { SyncLoader } from 'react-spinners'

interface TestCaseFormData {
  name: string
  description: string
  positive: boolean
  version: string
  status: 0 | 1 | 2
  priority: 0 | 1 | 2
  isAutoTest: boolean
  isLoadTest: boolean
  precondition: number
  project?: string

  tags: string[]

  steps: TestCaseStep[]

  testData: Array<{
    name: string
    value: string
    type: 'parameter' | 'file' | 'link' | 'not_set' | 'any'
    fileUrl?: string
  }>

  attachments: Array<{
    name: string
    url: string
    type: string
    size?: number
    uploadedAt?: Date
  }>

  scriptIds: { id: number; name: string }[]
  relatedTestCases: { id: number; name: string }[]
  owner: { id: number; username: string; fullName?: string }
}

export const RedactTestCase: React.FC = () => {
  const { project, checkAccess } = useProject()
  const { allTestCases: testCases, updateTestCase } = useTestCase()
  const { user: currentUser } = useUser()
  const { setHeaderContent } = useHeaderStore()
  const { testCaseId } = useParams<{ testCaseId: string }>()
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStopCreatingDiag, setShowStopCreatingDiag] = useState(false)
  const [showDeleteStepDiag, setShowDeleteStepDiag] = useState(false)
  const [deleteStepFunc, setDeleteStepFunc] = useState<() => void>(() => {})
  const [error, setError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<TestCaseFormData>({
    defaultValues: {
      name: '',
      description: '',
      positive: true,
      version: '001.000.000',
      status: 2, // Черновик по умолчанию
      priority: 1, // Нормальный по умолчанию
      isAutoTest: false,
      isLoadTest: false,
      precondition: -1,
      project: '',
      tags: [],
      steps: [],
      testData: [],
      attachments: [],
      scriptIds: [],
      relatedTestCases: [],
      owner: { id: 0, username: '', fullName: '' },
    },
  })

  const navigate = useNavigate()

  useEffect(() => {
    const loadTestCase = async () => {
      try {
        setIsLoading(true)
        const parsedTestCaseId = parseInt(testCaseId || '-1')
        if (isNaN(parsedTestCaseId) || parsedTestCaseId <= 0) {
          if (project && currentUser) {
            reset({
              name: '',
              description: '',
              positive: true,
              version: '001.000.000',
              status: 2,
              priority: 1,
              isAutoTest: false,
              isLoadTest: false,
              precondition: -1,
              project: project.name,
              tags: [],
              steps: [],
              testData: [],
              attachments: [],
              scriptIds: [],
              relatedTestCases: [],
            })
          }
          setTestCase(null)
          setError('')
        } else {
          const data = testCases.find((el) => el.id === parsedTestCaseId)
          if (data) {
            setTestCase(data)
            reset({
              name: data.name,
              description: data.description || '',
              positive: data.positive,
              version: data.version,
              status: data.status,
              priority: data.priority,
              isAutoTest: data.isAutoTest,
              isLoadTest: data.isLoadTest,
              precondition: data.precondition || -1,
              project: data.project || project?.name || '',
              tags: data.tags || [],
              steps: data.steps || [],
              testData: data.testData || [],
              attachments: data.attachments || [],
              scriptIds: data.scriptIds || [],
              relatedTestCases: data.relatedTestCases || [],
              owner: data.owner,
            })
            setError('')
          } else {
            setError('тест кейс не найден')
            throw new Error('no test case was found')
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке тест-кейса:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTestCase()
  }, [testCaseId, testCases, project, reset, currentUser])

  useEffect(() => {
    const pageTitle = testCaseId ? 'Редактирование' : 'Создание'

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
            {
              text: 'Тест-кейсы',
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`,
            },
            { text: pageTitle },
          ]}
          maxVisibleItems={3}
        />
      )
    }
  }, [testCase, project, setHeaderContent, testCaseId])

  const handleSave = async (data: TestCaseFormData) => {
    if (!project) {
      toast.error('Проект не выбран!', {
        position: 'top-center',
      })
      return
    }

    try {
      const updateData: TestCaseUpdateData = {
        name: data.name,
        description: data.description,
        positive: data.positive,
        version: data.version,
        status: data.status,
        priority: data.priority,
        isAutoTest: data.isAutoTest,
        isLoadTest: data.isLoadTest,
        precondition: data.precondition,
        project: data.project,
        tags: data.tags,
        steps: data.steps,
        testData: data.testData,
        attachments: data.attachments,
        scriptIds: data.scriptIds,
        relatedTestCases: data.relatedTestCases,
      }

      if (testCase) {
        await updateTestCase(project.id, testCase.id, updateData)
        toast.success('Тест-кейс успешно обновлен!', {
          position: 'top-center',
        })
      } else {
        // Здесь должен быть вызов API для создания
        console.log('Создание нового тест-кейса:', updateData)
        toast.success('Тест-кейс успешно созлдан!', {
          position: 'top-center',
        })
      }

      navigate(-1)
    } catch (error) {
      console.error('Ошибка при сохранении тест-кейса:', error)
      toast.success('Тест-кейс успешно сохранен!', {
        position: 'top-center',
      })
    }
  }

  const saveAsNewVersion = async () => {
    if (!testCase || !project) return
    try {
      const formData = getValues()
      const newVersionData: TestCaseUpdateData = {
        ...formData,
        version: `${testCase.version} (новая версия)`,
        status: 1, // Активный
        creationDate: new Date(),
      }

      // Здесь должен быть вызов API
      console.log('Создание новой версии:', newVersionData)
      toast.success('Новая версия успешно создана!', {
        position: 'top-center',
      })
      navigate(-1)
    } catch (error) {
      console.error('Ошибка при создании новой версии:', error)
      toast.error('Произошла ошибка при создании нового кейса!', {
        position: 'top-center',
      })
    }
  }

  const validateVersion = (value: string) => {
    const pattern = /^\d{3}\.\d{3}\.\d{3}$/
    if (!pattern.test(value)) {
      return 'Версия должна быть в формате 000.000.000'
    }
    return true
  }

  if (
    !checkAccess([
      UserRole.TESTER,
      UserRole.PROJECT_ADMIN,
      UserRole.ANALYST,
      UserRole.AUTOMATOR,
      UserRole.IT_LEADER,
    ])
  ) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Обратитесь к Администратору проекта для доступа к разделу</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка тест-кейса</p>
          <SyncLoader color="#000000" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>При загрузке проекта произошла ошибка:</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const isEditMode = !!testCaseId

  return (
    <div className={styles.pageContainer}>
      <form className={styles.form} onSubmit={handleSubmit(handleSave)}>
        <div className={styles.formHeader}>
          <h2>
            {isEditMode ? `Редактирование тест-кейса` : 'Создание тест-кейса'}
            {testCase?.idt && (
              <span className={styles.idt}>IDT: {testCase.idt}</span>
            )}
          </h2>
          <div className={styles.formActionsTop}>
            {checkAccess([
              UserRole.TESTER,
              UserRole.PROJECT_ADMIN,
              UserRole.ANALYST,
            ]) && (
              <button
                type="submit"
                className={`${styles.actionButton} ${styles.primaryButton}`}
                disabled={
                  isSubmitting ||
                  !checkAccess([
                    UserRole.TESTER,
                    UserRole.PROJECT_ADMIN,
                    UserRole.ANALYST,
                    UserRole.AUTOMATOR,
                  ])
                }
              >
                {isSubmitting
                  ? 'Сохранение...'
                  : isEditMode
                    ? 'Сохранить изменения'
                    : 'Создать тест-кейс'}
              </button>
            )}
            {isEditMode &&
              checkAccess([
                UserRole.AUTOMATOR,
                UserRole.TESTER,
                UserRole.PROJECT_ADMIN,
                UserRole.ANALYST,
              ]) && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                  onClick={() => setShowStopCreatingDiag(true)}
                >
                  Сохранить как новую версию
                </button>
              )}
            <button
              type="button"
              className={`${styles.actionButton} ${styles.cancelButton}`}
              onClick={() => navigate(-1)}
            >
              Отмена
            </button>
          </div>
        </div>

        {/* Основная информация */}
        <div className={styles.section}>
          <h3>Основная информация</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name">
                Название ТК *
                <span className={styles.fieldHint}>
                  Краткое наименование сути проверки
                </span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Введите название тест-кейса',
                  minLength: {
                    value: 5,
                    message: 'Название должно быть не менее 5 символов',
                  },
                  maxLength: {
                    value: 200,
                    message: 'Название должно быть не более 200 символов',
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={styles.input}
                    type="text"
                    placeholder="Введите название тест-кейса"
                  />
                )}
              />
              {errors.name && (
                <span className={styles.error}>{errors.name.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="version">
                Версия *
                <span className={styles.fieldHint}>Формат: 000.000.000</span>
              </label>
              <Controller
                name="version"
                control={control}
                rules={{
                  required: 'Введите версию',
                  validate: validateVersion,
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={styles.input}
                    type="text"
                    placeholder="000.000.000"
                    pattern="\d{3}\.\d{3}\.\d{3}"
                  />
                )}
              />
              {errors.version && (
                <span className={styles.error}>{errors.version.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Статус *</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select {...field} className={styles.select}>
                    {Object.entries(testCaseStatusMap).map(([key, value]) => (
                      <option key={key} value={parseInt(key)}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority">Приоритет *</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <select {...field} className={styles.select}>
                    {Object.entries(testCasePriorityMap).map(([key, value]) => (
                      <option key={key} value={parseInt(key)}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="project">
                Проект
                <span className={styles.fieldHint}>
                  Автоматически заполняется
                </span>
              </label>
              <Controller
                name="project"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={styles.input}
                    type="text"
                    readOnly
                    disabled
                  />
                )}
              />
              <label htmlFor="precondition">
                Предусловие
                <span className={styles.fieldHint}>
                  Необходимо ли выполнение другого тк
                </span>
              </label>
              <Controller
                name="precondition"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={styles.select}
                    value={field.value?.toString() || '-1'}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  >
                    <option value={-1}>нет</option>
                    {testCases
                      .reduce((filtered, newVal) => {
                        if (
                          !filtered.some(
                            (prevCase) => prevCase.id === newVal.id
                          )
                        ) {
                          filtered.push(newVal)
                        }
                        return filtered
                      }, [] as TestCase[])
                      .map((el) =>
                        el.id === parseInt(testCaseId || '') ? (
                          <></>
                        ) : (
                          <option value={el.id}>{el.name}</option>
                        )
                      )}
                  </select>
                )}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">
                Описание *
                <span className={styles.fieldHint}>
                  Рекомендуется начинать со слова "Проверка"
                </span>
              </label>
              <Controller
                name="description"
                control={control}
                rules={{
                  required: 'Введите описание тест-кейса',
                  minLength: {
                    value: 10,
                    message: 'Описание должно быть не менее 10 символов',
                  },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={styles.textarea}
                    placeholder="Проверка ..."
                    rows={3}
                  />
                )}
              />
              {errors.description && (
                <span className={styles.error}>
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Флаги и теги */}
        <div className={styles.section}>
          <h3>Дополнительные параметры</h3>
          <div className={styles.formGrid}>
            <div className={styles.checkboxGroup}>
              <Controller
                name="positive"
                control={control}
                render={({ field }) => (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <span className={styles.checkboxText}>
                      Позитивный тест-кейс
                    </span>
                  </label>
                )}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <Controller
                name="isAutoTest"
                control={control}
                render={({ field }) => (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <span className={styles.checkboxText}>Авто-тест</span>
                    <span className={styles.checkboxHint}>
                      По ТК разработан автоматизированный тест-кейс
                    </span>
                  </label>
                )}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <Controller
                name="isLoadTest"
                control={control}
                render={({ field }) => (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <span className={styles.checkboxText}>
                      Нагрузочное тестирование (НТ)
                    </span>
                    <span className={styles.checkboxHint}>
                      По ТК разработан скрипт нагрузочного тестирования
                    </span>
                  </label>
                )}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tags">
              Теги
              <span className={styles.fieldHint}>
                Для категоризации и поиска
              </span>
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagsInput
                  tags={field.value}
                  onChange={field.onChange}
                  placeholder="Введите тег (например: авторизация, UI, API)"
                />
              )}
            />
          </div>
        </div>

        {/* Шаги тест-кейса */}
        <div className={styles.section}>
          <Controller
            name="steps"
            control={control}
            render={({ field }) => (
              <StepsEditor
                steps={field.value}
                onChange={field.onChange}
                disabled={
                  isSubmitting ||
                  !checkAccess([
                    UserRole.TESTER,
                    UserRole.PROJECT_ADMIN,
                    UserRole.ANALYST,
                    UserRole.AUTOMATOR,
                  ])
                }
                setDeleteStepFunc={setDeleteStepFunc}
                setOpenDiag={setShowDeleteStepDiag}
              />
            )}
          />
        </div>

        {/* Тестовые данные */}
        <div className={styles.section}>
          <Controller
            name="testData"
            control={control}
            render={({ field }) => (
              <TestDataEditor
                testData={field.value}
                onChange={field.onChange}
                disabled={
                  isSubmitting ||
                  !checkAccess([
                    UserRole.TESTER,
                    UserRole.PROJECT_ADMIN,
                    UserRole.ANALYST,
                    UserRole.AUTOMATOR,
                  ])
                }
              />
            )}
          />
        </div>

        {/* Вложения */}
        <div className={styles.section}>
          <Controller
            name="attachments"
            control={control}
            render={({ field }) => (
              <AttachmentsManager
                attachments={field.value}
                onChange={field.onChange}
                disabled={
                  isSubmitting ||
                  !checkAccess([
                    UserRole.TESTER,
                    UserRole.PROJECT_ADMIN,
                    UserRole.ANALYST,
                    UserRole.AUTOMATOR,
                  ])
                }
              />
            )}
          />
        </div>

        {/* Информация только для чтения */}
        {isEditMode && testCase && (
          <div className={styles.section}>
            <h3>Системная информация</h3>
            <div className={styles.readonlyInfo}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Владелец:</span>
                  <span className={styles.infoValue}>
                    {testCase.owner.username}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Дата создания:</span>
                  <span className={styles.infoValue}>
                    {testCase.creationDate.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Последнее изменение:</span>
                  <span className={styles.infoValue}>
                    {testCase.lastModified.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>IDT:</span>
                  <span className={styles.infoValue}>
                    {testCase.idt || 'Не задан'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Скрипты:</span>
                  <span className={styles.infoValue}>
                    {testCase.scriptIds.length > 0
                      ? testCase.scriptIds.map((s) => s.name).join(', ')
                      : 'Нет'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    Используется в тест-кейсах:
                  </span>
                  <span className={styles.infoValue}>
                    {testCase.relatedTestCases.length > 0
                      ? testCase.relatedTestCases
                          .map((tc) => tc.name)
                          .join(', ')
                      : 'Нет'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки внизу формы */}
        <div className={styles.formActionsBottom}>
          {checkAccess([
            UserRole.TESTER,
            UserRole.PROJECT_ADMIN,
            UserRole.ANALYST,
          ]) && (
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.primaryButton}`}
              disabled={
                isSubmitting ||
                !checkAccess([
                  UserRole.TESTER,
                  UserRole.PROJECT_ADMIN,
                  UserRole.ANALYST,
                  UserRole.AUTOMATOR,
                ])
              }
            >
              {isSubmitting
                ? 'Сохранение...'
                : isEditMode
                  ? 'Сохранить изменения'
                  : 'Создать тест-кейс'}
            </button>
          )}
          {isEditMode &&
            checkAccess([
              UserRole.AUTOMATOR,
              UserRole.TESTER,
              UserRole.PROJECT_ADMIN,
              UserRole.ANALYST,
            ]) && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => setShowStopCreatingDiag(true)}
              >
                Сохранить как новую версию
              </button>
            )}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.cancelButton}`}
            onClick={() => navigate(-1)}
          >
            Отмена
          </button>
        </div>
      </form>
      <QuestionDialog
        showQuestion={showStopCreatingDiag}
        changeShowQuestion={setShowStopCreatingDiag}
        onYesClick={saveAsNewVersion}
      >
        Сохранить как новую версию тест-кейса? <br />
        Старая версия будет переведена в архив.
      </QuestionDialog>
      <QuestionDialog
        showQuestion={showDeleteStepDiag}
        changeShowQuestion={setShowDeleteStepDiag}
        onYesClick={() => deleteStepFunc()}
      >
        Вы уверены, что хотите удалить этот шаг?
      </QuestionDialog>
    </div>
  )
}
