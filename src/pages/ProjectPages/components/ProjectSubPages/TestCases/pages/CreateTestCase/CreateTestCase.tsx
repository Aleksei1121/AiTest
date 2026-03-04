import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useProject, useTestCase, useUser } from '@contexts/'
import { useHeaderStore } from '@stores/'
import { PAGE_ENDPOINTS } from '@constants/'
import {
  TestCaseFormData,
  testCaseStatusMap,
  testCasePriorityMap,
  TestCase,
  UserRole,
} from '@interfaces/'
import styles from './CreateTestCase.module.scss'
import {
  AttachmentsManager,
  StepsEditor,
  TagsInput,
  TestDataEditor,
} from '../../components'
import { Breadcrumbs, QuestionDialog } from '@components/'

export const CreateTestCase: React.FC = () => {
  const { project, checkAccess } = useProject()
  const { createTestCase, isLoading: isCreating, allTestCases } = useTestCase()
  const { user: currentUser } = useUser()
  const { setHeaderContent } = useHeaderStore()
  const navigate = useNavigate()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showStopCreatingDiag, setShowStopCreatingDiag] = useState(false)
  const [showDeleteStepDiag, setShowDeleteStepDiag] = useState(false)
  const [deleteStepFunc, setDeleteStepFunc] = useState<() => void>(() => {})
  const { testCaseId } = useParams<{ testCaseId: string }>()
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
      tags: [],
      steps: [],
      testData: [],
      attachments: [],
    },
  })

  // Получаем значения формы для валидации
  const watchedValues = watch()

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
            {
              text: 'Тест-кейсы',
              link: `${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${project.id}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`,
            },
            { text: 'Создание' },
          ]}
          maxVisibleItems={2}
        />
      )
    }
  }, [project, setHeaderContent])

  // Автоматически увеличиваем версию
  const generateNextVersion = () => {
    const versionPattern = /^(\d{3})\.(\d{3})\.(\d{3})$/
    const match = watchedValues.version.match(versionPattern)

    if (match) {
      const major = parseInt(match[1])
      const minor = parseInt(match[2])
      const patch = parseInt(match[3])

      // Увеличиваем патч версию на 1
      const nextVersion = `${major.toString().padStart(3, '0')}.${minor.toString().padStart(3, '0')}.${(patch + 1).toString().padStart(3, '0')}`
      setValue('version', nextVersion)
    }
  }

  // Валидация версии
  const validateVersion = (value: string) => {
    const pattern = /^\d{3}\.\d{3}\.\d{3}$/
    if (!pattern.test(value)) {
      return 'Версия должна быть в формате 000.000.000'
    }
    return true
  }

  // Обработчик сохранения
  const handleSave = async (data: TestCaseFormData) => {
    if (!project || !currentUser) {
      setFormError('Проект или пользователь не определены')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // Добавляем недостающие поля
      const formData: TestCaseFormData = {
        ...data,
        project: project.name,
        scriptIds: [],
        relatedTestCases: [],
        owner: {
          id: currentUser.id,
          username: currentUser.profileData.firstName,
          fullName: currentUser.profileData.lastName,
        },
      }

      // Создаем тест-кейс
      await createTestCase(project.id, formData)

      // Возвращаемся к списку тест-кейсов
      const projectBaseUrl = window.location.href.split(
        '/' + PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE
      )[0]
      navigate(`${projectBaseUrl}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`)
    } catch (error) {
      console.error('Ошибка при создании тест-кейса:', error)
      setFormError(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при создании тест-кейса'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Проверка, что есть хотя бы один шаг с действием и результатом
  const validateSteps = (steps: any[]) => {
    if (steps.length === 0) {
      return 'Добавьте хотя бы один шаг'
    }

    const invalidSteps = steps.filter(
      (step) => !step.action?.trim() || !step.result?.trim()
    )

    if (invalidSteps.length > 0) {
      return 'Все шаги должны иметь действие и ожидаемый результат'
    }

    return true
  }

  if (
    !checkAccess([UserRole.TESTER, UserRole.PROJECT_ADMIN, UserRole.ANALYST])
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

  return (
    <div className={styles.pageContainer}>
      <form className={styles.form} onSubmit={handleSubmit(handleSave)}>
        <div className={styles.formHeader}>
          <h2>Создание тест-кейса</h2>

          <div className={styles.formActionsTop}>
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.primaryButton}`}
              disabled={isSubmitting || isCreating}
            >
              {isSubmitting ? 'Создание...' : 'Создать тест-кейс'}
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.secondaryButton}`}
              onClick={generateNextVersion}
              disabled={isSubmitting}
            >
              Сгенерировать версию
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.cancelButton}`}
              onClick={() => setShowStopCreatingDiag(true)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          </div>
        </div>

        {/* Сообщение об ошибке формы */}
        {formError && (
          <div className={styles.formError}>
            <span>⚠️</span>
            <p>{formError}</p>
          </div>
        )}

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
                    autoFocus
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
                  <div className={styles.versionInputWrapper}>
                    <input
                      {...field}
                      className={styles.input}
                      type="text"
                      placeholder="000.000.000"
                      pattern="\d{3}\.\d{3}\.\d{3}"
                    />
                    <button
                      type="button"
                      className={styles.versionGenerateButton}
                      onClick={generateNextVersion}
                      title="Сгенерировать следующую версию"
                    >
                      🔄
                    </button>
                  </div>
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
              <input
                type="text"
                value={project?.name || ''}
                className={styles.input}
                readOnly
                disabled
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
                    {allTestCases
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
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>

        {/* Шаги тест-кейса */}
        <div className={styles.section}>
          <h3>Шаги тест-кейса *</h3>
          <div className={styles.stepsHint}>
            <p>
              Добавьте последовательность шагов для выполнения тест-кейса.
              Каждый шаг должен содержать:
            </p>
            <ul>
              <li>Конкретное действие</li>
              <li>Ожидаемый результат</li>
              <li>Дополнительные параметры (если необходимо)</li>
            </ul>
          </div>

          <Controller
            name="steps"
            control={control}
            rules={{
              validate: validateSteps,
            }}
            render={({ field, fieldState }) => (
              <div>
                <StepsEditor
                  steps={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  defaultExpanded={true}
                  showTableView={false}
                  setDeleteStepFunc={setDeleteStepFunc}
                  setOpenDiag={setShowDeleteStepDiag}
                />
                {fieldState.error && (
                  <div className={styles.errorMessage}>
                    ⚠️ {fieldState.error.message}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Тестовые данные */}
        <div className={styles.section}>
          <h3>Тестовые данные (СПД)</h3>
          <Controller
            name="testData"
            control={control}
            render={({ field }) => (
              <TestDataEditor
                testData={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        {/* Вложения */}
        <div className={styles.section}>
          <h3>Вложения</h3>
          <Controller
            name="attachments"
            control={control}
            render={({ field }) => (
              <AttachmentsManager
                attachments={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        {/* Подсказки для заполнения */}
        {/* <div className={styles.section}>
          <h3>Рекомендации по заполнению</h3>
          <div className={styles.guidelines}>
            <div className={styles.guidelineItem}>
              <span className={styles.guidelineIcon}>📝</span>
              <div className={styles.guidelineContent}>
                <strong>Название:</strong> Должно четко отражать суть проверки
                (например: "Проверка авторизации с корректными данными")
              </div>
            </div>
            <div className={styles.guidelineItem}>
              <span className={styles.guidelineIcon}>🎯</span>
              <div className={styles.guidelineContent}>
                <strong>Шаги:</strong> Каждый шаг - одно конкретное действие.
                Избегайте общих фраз.
              </div>
            </div>
            <div className={styles.guidelineItem}>
              <span className={styles.guidelineIcon}>📊</span>
              <div className={styles.guidelineContent}>
                <strong>Результаты:</strong> Должны быть конкретными и
                измеримыми (например: "Появляется сообщение 'Успешная
                авторизация'")
              </div>
            </div>
            <div className={styles.guidelineItem}>
              <span className={styles.guidelineIcon}>🏷️</span>
              <div className={styles.guidelineContent}>
                <strong>Теги:</strong> Используйте для быстрого поиска и
                категоризации
              </div>
            </div>
          </div>
        </div> */}

        {/* Кнопки внизу формы */}
        <div className={styles.formActionsBottom}>
          <div className={styles.actionButtons}>
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.primaryButton}`}
              disabled={isSubmitting || isCreating}
            >
              {isSubmitting ? 'Создание...' : 'Создать тест-кейс'}
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.secondaryButton}`}
              onClick={generateNextVersion}
              disabled={isSubmitting}
            >
              Сгенерировать версию
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.cancelButton}`}
              onClick={() => setShowStopCreatingDiag(true)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          </div>

          <div className={styles.formStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Шагов:</span>
              <span className={styles.statValue}>
                {watchedValues.steps.length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Тегов:</span>
              <span className={styles.statValue}>
                {watchedValues.tags.length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>СПД:</span>
              <span className={styles.statValue}>
                {watchedValues.testData.length}
              </span>
            </div>
          </div>
        </div>
      </form>
      <QuestionDialog
        showQuestion={showStopCreatingDiag}
        changeShowQuestion={setShowStopCreatingDiag}
        onYesClick={() => {
          const projectBaseUrl = window.location.href.split(
            '/' + PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE
          )[0]
          navigate(
            `${projectBaseUrl}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`
          )
        }}
      >
        Отменить создание тест-кейса? <br />
        Все несохраненные данные будут потеряны.
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
