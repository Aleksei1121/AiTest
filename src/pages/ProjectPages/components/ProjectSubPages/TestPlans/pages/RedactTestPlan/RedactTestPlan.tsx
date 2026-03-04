import { PAGE_ENDPOINTS } from '@constants/'
import { useProject, useTestCase, useTestPlan } from '@contexts/'
import { TestPlan, TestPlanUpdateData, TestCaseInTestPlan, TestCase, UserRole } from '@interfaces/'
import { useHeaderStore } from '@stores/'
import React, { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styles from './RedactTestPlan.module.scss'
import { Controller, useForm } from 'react-hook-form'
import { Breadcrumbs } from '@components/'

interface TestPlanForm {
  name: string
  version: string
  description: string
  testCases: TestCaseInTestPlan[]
}

export const RedactTestPlan: React.FC = () => {
  const { project, checkAccess } = useProject()
  const { allTestPlans: testPlans, updateTestPlan, createTestPlan } = useTestPlan()
  const {allTestCases, loadAllTestCases} = useTestCase()
  const { setHeaderContent } = useHeaderStore()
  const { projectId, testPlanId } = useParams<{ projectId: string; testPlanId?: string }>()
  const [testPlan, setTestPlan] = useState<TestPlan | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [showAddTestCaseModal, setShowAddTestCaseModal] = useState(false)
  const [hideAddedTestCases, setHideAddedTestCases] = useState(false)
  const [availableTestCases, setAvailableTestCases] = useState<TestCaseInTestPlan['testCase'][]>([])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    setValue,
  } = useForm<TestPlanForm>()

  const testCasesInPlan = watch('testCases') || []
  const navigate = useNavigate()

  useEffect(() => {
    const parsedTestPlanId = parseInt(testPlanId || '-1')
    
    setHeaderContent(
      <Breadcrumbs
        items={[
          {
            text: project?.name || '',
            link: window.location.pathname.split(
              '/' + PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN
            )[0],
          },
          {
            text: 'Тест-планы',
            link:
              window.location.href.split(
                '/' + PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN
              )[0] +
              '/' +
              PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN,
          },
          {
            text:
              parsedTestPlanId === -1
                ? 'Создание тест-плана'
                : 'Редактирование тест-плана',
          },
        ]}
      />
    )
    if (parsedTestPlanId === -1) {
      setIsCreatingNew(true)
      reset({
        name: '',
        version: '1.0.0',
        description: '',
        testCases: [],
      })
      
    } else {
      setIsCreatingNew(false)
      const data = testPlans.find((el) => el.id === parsedTestPlanId)
      if (data) {
        setTestPlan(data)
        reset({
          name: data.name,
          version: data.version,
          description: data.description || '',
          testCases: data.testCases,
        })

      }
    }
  }, [testPlanId, testPlans, project, setHeaderContent, reset])

  useEffect(() => {
    loadAllTestCases(parseInt(projectId || ''))
  }, [projectId])

  useEffect(
    () =>
      setAvailableTestCases(
        allTestCases.reduce((filtered, newVal) => {
          if (!filtered.some((prevCase) => prevCase.id === newVal.id)) {
            filtered.push(newVal)
          }
          return filtered
        }, [] as TestCase[])
      ),
    [allTestCases]
  )

  const handleSave = async (data: TestPlanForm) => {
    if (!project) return

    try {
      if (isCreatingNew) {
        const createData = {
          name: data.name,
          version: data.version,
          description: data.description,
          testCases: data.testCases.map((tc, index) => ({
            id: 0,
            testPlanId: 0,
            order: index,
            testCase: tc.testCase
          })),
          projectId: project.id,
        }
        
        await createTestPlan(project.id, createData)
        alert('Тест-план успешно создан!')
        navigate(`/app/project/${projectId}/test-plan`)
      } else if (testPlan) {
        const updateData: TestPlanUpdateData = {
          name: data.name,
          version: data.version,
          description: data.description,
          testCases: data.testCases.map((tc, index) => ({
            ...tc,
            order: index
          })),
          id: testPlan.id,
        }

        await updateTestPlan(project.id, testPlan.id, updateData)
        alert('Тест-план успешно сохранен!')
        navigate(-1)
      }
    } catch (error) {
      console.error('Ошибка при сохранении тест-плана:', error)
      alert('Произошла ошибка при сохранении тест-плана')
    }
  }

  const handleAddTestCase = () => {
    setShowAddTestCaseModal(true)
  }

  const handleSelectTestCase = (testCaseId: number, checked: boolean) => {
    if (checked) {
      const testCase = availableTestCases.find(tc => tc.id === testCaseId)
      if (testCase) {
        const newTestCase: TestCaseInTestPlan = {
          id: 0,
          testPlanId: testPlan?.id || 0,
          order: testCasesInPlan.length,
          testCase
        }
        setValue('testCases', [...testCasesInPlan, newTestCase])
      }
    } else {
      const newTestCases = testCasesInPlan.filter(tc => tc.testCase.id !== testCaseId)
      setValue('testCases', newTestCases.map((tc, index) => ({ ...tc, order: index })))
    }
  }

  const handleRemoveTestCase = (index: number) => {
    const newTestCases = [...testCasesInPlan]
    newTestCases.splice(index, 1)
    const reorderedTestCases = newTestCases.map((tc, idx) => ({ ...tc, order: idx }))
    setValue('testCases', reorderedTestCases)
  }

  const handleMoveTestCaseUp = (index: number) => {
    if (index === 0) return
    const newTestCases = [...testCasesInPlan]
    const temp = newTestCases[index]
    newTestCases[index] = newTestCases[index - 1]
    newTestCases[index - 1] = temp
    
    const reorderedTestCases = newTestCases.map((tc, idx) => ({ ...tc, order: idx }))
    setValue('testCases', reorderedTestCases)
  }

  const handleMoveTestCaseDown = (index: number) => {
    if (index === testCasesInPlan.length - 1) return
    const newTestCases = [...testCasesInPlan]
    const temp = newTestCases[index]
    newTestCases[index] = newTestCases[index + 1]
    newTestCases[index + 1] = temp
    
    const reorderedTestCases = newTestCases.map((tc, idx) => ({ ...tc, order: idx }))
    setValue('testCases', reorderedTestCases)
  }

  const saveAsNewVersion = async () => {
    if (!testPlan || !project) return

    const confirm = window.confirm(
      'Сохранить как новую версию тест-плана? Старая версия будет переведена в архив.'
    )
    if (!confirm) return

    try {
      const formData = getValues()
      const newVersionData = {
        ...formData,
        version: `${testPlan.version} (новая версия)`,
        testCases: formData.testCases.map((tc, index) => ({
          ...tc,
          order: index
        })),
        projectId: project.id,
      }

      alert('Функционал сохранения новой версии в разработке')
    } catch (error) {
      console.error('Ошибка при создании новой версии:', error)
      alert('Произошла ошибка при создании новой версии')
    }
  }

  if (
    !checkAccess([
      UserRole.PROJECT_ADMIN,
      UserRole.ANALYST,
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

  if (!project) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка проекта...</p>
        </div>
      </div>
    )
  }

  if (!isCreatingNew && !testPlan) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка тест-плана...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <form className={styles.form} onSubmit={handleSubmit(handleSave)}>
        <div className={styles.formHeader}>
          <h2>
            {isCreatingNew ? 'Создание тест-плана' : `Тест-план ID: ${testPlan?.id}`}
          </h2>
          <div className={styles.formActionsTop}>
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.primaryButton}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : isCreatingNew ? 'Создать тест-план' : 'Сохранить изменения'}
            </button>
            {!isCreatingNew && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={saveAsNewVersion}
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

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Название *</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Введите название тест-плана' }}
              render={({ field }) => (
                <input
                  {...field}
                  className={styles.input}
                  type="text"
                  placeholder="Введите название тест-плана"
                />
              )}
            />
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="version">Версия *</label>
            <Controller
              name="version"
              control={control}
              rules={{
                required: 'Введите версию',
                pattern: {
                  value: /^\d{1,3}\.\d{1,3}\.\d{1,3}$/,
                  message: 'Версия должна выглядеть как 000.000.000',
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  className={styles.input}
                  type="text"
                  placeholder={isCreatingNew ? "1.0.0" : "000.000.000"}
                  disabled={true}
                />
              )}
            />
            {errors.version && (
              <span className={styles.error}>{errors.version.message}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Описание</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className={styles.textarea}
                placeholder="Введите описание тест-плана"
                rows={4}
              />
            )}
          />
        </div>

        {!isCreatingNew && testPlan && (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Владелец:</span>
              <span className={styles.infoValue}>{testPlan.owner?.username || 'Нет'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Дата создания:</span>
              <span className={styles.infoValue}>
                {new Date(testPlan.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Последний запуск:</span>
              <span className={styles.infoValue}>
                {testPlan.lastRunAt ? new Date(testPlan.lastRunAt).toLocaleDateString() : 'Не запускался'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Статус:</span>
              <span className={styles.infoValue}>
                {testPlan.lastRunStatus}
              </span>
            </div>
          </div>
        )}

        <div className={styles.testCasesSection}>
          <div className={styles.sectionHeader}>
            <h3>Тест-кейсы в плане ({testCasesInPlan.length})</h3>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddTestCase}
              >
                + Добавить тест-кейс
              </button>
            </div>
          </div>

          {testCasesInPlan.length === 0 ? (
            <div className={styles.noTestCases}>
              <p>Нет тест-кейсов в плане. Добавьте первый тест-кейс.</p>
            </div>
          ) : (
            <div className={styles.testCasesList}>
              {testCasesInPlan.map((testCase, index) => (
                <div key={`${testCase.testCase.id}-${index}`} className={styles.testCaseItem}>
                  <div className={styles.testCaseInfo}>
                    <span className={styles.testCaseName}>
                      {testCase.testCase?.name || `Тест-кейс ID: ${testCase.testCase.id}`}
                    </span>
                    <span className={styles.testCaseVersion}>
                      Версия: {testCase.testCase?.version || 'Неизвестно'}
                    </span>
                  </div>
                  <div className={styles.testCaseActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => handleMoveTestCaseUp(index)}
                      disabled={index === 0}
                      title="Переместить вверх"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => handleMoveTestCaseDown(index)}
                      disabled={index === testCasesInPlan.length - 1}
                      title="Переместить вниз"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() => handleRemoveTestCase(index)}
                      title="Удалить из плана"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {showAddTestCaseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Добавить тест-кейсы в план</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddTestCaseModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalFilter}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" 
                     onChange={(e) => setHideAddedTestCases(e.target.checked)}
                  />
                  <span>Показать только неиспользуемые в данном тест-плане</span>
                </label>
              </div>
              <div className={styles.testCasesModalList}>
                {availableTestCases.map((testCase) => {
                  const isPresent = testCasesInPlan.some(tc => tc.testCase.id === testCase.id)
                  if(hideAddedTestCases && isPresent) return < Fragment key={testCase.id}></Fragment>
                  return (
                    <div key={testCase.id} className={styles.testCaseModalItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isPresent}
                          onChange={(e) => handleSelectTestCase(testCase.id, e.target.checked)}
                        />
                        <span className={styles.testCaseModalName}>
                          {testCase.name}
                        </span>
                      </label>
                      <span className={styles.testCaseModalVersion}>
                        Версия: {testCase.version}
                      </span>
                    </div>
                  )
                }
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={() => {
                  setHideAddedTestCases(false)
                  setShowAddTestCaseModal(false)
                }}
              >
                Отмена
              </button>
              <button
                className={`${styles.actionButton} ${styles.primaryButton}`}
                onClick={() => {
                  setHideAddedTestCases(false)
                  setShowAddTestCaseModal(false)
                }}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}