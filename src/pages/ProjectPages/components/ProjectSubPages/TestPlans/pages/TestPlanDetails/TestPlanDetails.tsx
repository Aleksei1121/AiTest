import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PAGE_ENDPOINTS } from '@constants/'
import { useProject, useTestPlan } from '@contexts/'
import { useHeaderStore } from '@stores/'
import { Link } from 'react-router-dom'
import { TestPlan, TestPlanRun, UserRole } from '@interfaces/'
import styles from './TestPlanDetails.module.scss'
import {
  EditIcon,
  HistoryIcon,
  EyeIcon,
  DeleteIcon,
  PlusIcon,
  ChevronRightIcon,
  PlayIcon,
  CloneIcon,
  Breadcrumbs,
} from '@components/'

export const TestPlanDetails: React.FC = () => {
  const { project, checkAccess } = useProject()
  const { testPlanId } = useParams<{ testPlanId: string }>()
  const {
    testPlan,
    testPlanRuns,
    loadTestPlan,
    loadTestPlanRuns,
    runTestPlan,
    cloneTestPlan,
    isLoading,
  } = useTestPlan()
  const { setHeaderContent } = useHeaderStore()
  const navigate = useNavigate()
  const [localTestPlan, setLocalTestPlan] = useState<TestPlan | null>(null)
  const [recentRuns, setRecentRuns] = useState<TestPlanRun[]>([])

  useEffect(() => {
    if (project && testPlanId) {
      const projectId = project.id
      const testPlanIdNum = parseInt(testPlanId)

      loadTestPlan(projectId, testPlanIdNum)
      loadTestPlanRuns(projectId, testPlanIdNum)
    }
  }, [project, testPlanId, loadTestPlan, loadTestPlanRuns])

  useEffect(() => {
    if (testPlan) {
      setLocalTestPlan(testPlan)
    }
  }, [testPlan])

  useEffect(() => {
    if (testPlanRuns && testPlanRuns.length > 0) {
      const sortedRuns = [...testPlanRuns]
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
        .slice(0, 3)
      setRecentRuns(sortedRuns)
    }
  }, [testPlanRuns])

  useEffect(() => {
    if (project && localTestPlan) {
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
              text: localTestPlan.name,
            },
          ]}
        />
      )
    }
  }, [project, localTestPlan, setHeaderContent])

  const handleRunTestPlan = async () => {
    if (!project || !localTestPlan) return

    const confirm = window.confirm(
      `Запустить тест-план "${localTestPlan.name}"?`
    )
    if (!confirm) return

    try {
      await runTestPlan(project.id, localTestPlan.id)
      alert('Тест-план запущен!')
      loadTestPlanRuns(project.id, localTestPlan.id)
    } catch (error) {
      console.error('Ошибка при запуске тест-плана:', error)
      alert('Произошла ошибка при запуске тест-плана')
    }
  }

  const handleCloneTestPlan = async () => {
    if (!project || !localTestPlan) return

    const confirm = window.confirm(
      `Клонировать тест-план "${localTestPlan.name}"?`
    )
    if (!confirm) return

    try {
      await cloneTestPlan(project.id, localTestPlan.id)
      alert('Тест-план клонирован!')
      navigate(`/app/project/${project.id}/test-plan`)
    } catch (error) {
      console.error('Ошибка при клонировании тест-плана:', error)
      alert('Произошла ошибка при клонировании тест-плана')
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '—'
    if (duration < 60) return `${duration} сек`
    if (duration < 3600) return `${Math.floor(duration / 60)} мин`
    return `${Math.floor(duration / 3600)} ч ${Math.floor((duration % 3600) / 60)} мин`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'успешно':
        return styles.successStatus
      case 'с_ошибками':
        return styles.errorStatus
      case 'запланирован':
        return styles.plannedStatus
      case 'в_работе':
        return styles.runningStatus
      default:
        return styles.defaultStatus
    }
  }

  if (isLoading || !localTestPlan) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка деталей тест-плана...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div className={styles.headerTop}>
          <h1>{localTestPlan.name}</h1>
          <div className={styles.headerActions}>
            {checkAccess([
              UserRole.TESTER,
              UserRole.ANALYST,
              UserRole.PROJECT_ADMIN,
            ]) && (
              <button
                className={`${styles.actionButton} ${styles.runButton}`}
                onClick={handleRunTestPlan}
              >
                <PlayIcon className={styles.buttonIcon} />
                Запустить тест-план
              </button>
            )}
            {checkAccess([UserRole.ANALYST, UserRole.PROJECT_ADMIN]) && (
              <>
                <button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={() => navigate(`edit`)}
                >
                  <EditIcon className={styles.buttonIcon} />
                  Редактировать
                </button>
                <button
                  className={`${styles.actionButton} ${styles.cloneButton}`}
                  onClick={handleCloneTestPlan}
                >
                  <CloneIcon className={styles.buttonIcon} />
                  Клонировать
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.testPlanInfo}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ID:</span>
              <span className={styles.infoValue}>{localTestPlan.id}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Версия:</span>
              <span className={styles.infoValue}>{localTestPlan.version}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Статус:</span>
              <span
                className={`${styles.infoValue} ${styles.statusBadge} ${getStatusColor(localTestPlan.status)}`}
              >
                {localTestPlan.status}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Владелец:</span>
              <span className={styles.infoValue}>
                {localTestPlan.owner?.username || 'Не указан'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Дата создания:</span>
              <span className={styles.infoValue}>
                {new Date(localTestPlan.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Последний запуск:</span>
              <span className={styles.infoValue}>
                {localTestPlan.lastRunAt
                  ? new Date(localTestPlan.lastRunAt).toLocaleDateString(
                      'ru-RU'
                    )
                  : 'Не запускался'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Длительность:</span>
              <span className={styles.infoValue}>
                {formatDuration(localTestPlan.duration)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                Статус последнего запуска:
              </span>
              <span
                className={`${styles.infoValue} ${styles.statusBadge} ${getStatusColor(localTestPlan.lastRunStatus)}`}
              >
                {localTestPlan.lastRunStatus}
              </span>
            </div>
          </div>

          {localTestPlan.description && (
            <div className={styles.descriptionSection}>
              <h3>Описание</h3>
              <p>{localTestPlan.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.contentSections}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>История запусков (последние 3)</h2>
            <button
              className={styles.viewAllButton}
              onClick={() => navigate('runs')}
            >
              Весь журнал <ChevronRightIcon className={styles.chevronIcon} />
            </button>
          </div>

          {recentRuns.length > 0 ? (
            <div className={styles.runsTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Дата и время запуска</th>
                    <th>Статус</th>
                    <th>Кто запускал</th>
                    <th>Время выполнения</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{run.id}</td>
                      <td>{new Date(run.startedAt).toLocaleString('ru-RU')}</td>
                      <td>
                        <span
                          className={`${styles.runStatus} ${getStatusColor(run.status)}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td>{run.triggeredBy?.username || 'Неизвестно'}</td>
                      <td>{formatDuration(run.duration)}</td>
                      <td>
                        <Link
                          className={`${styles.iconButton} ${styles.viewButton}`}
                          to={`runs/${run.id}`}
                          title="Подробнее"
                        >
                          <EyeIcon />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noRuns}>
              <p>Нет запусков тест-плана</p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Тест-кейсы в плане ({localTestPlan.testCaseCount})</h2>

          {localTestPlan.testCases && localTestPlan.testCases.length > 0 ? (
            <div className={styles.testCasesList}>
              {localTestPlan.testCases.map((testCase, index) => (
                <div key={testCase.id} className={styles.testCaseItem}>
                  <div className={styles.testCaseInfo}>
                    <div className={styles.testCaseHeader}>
                      <span className={styles.testCaseName}>
                        {testCase.testCase?.name || `Тест-кейс ${index + 1}`}
                      </span>
                      <span className={styles.testCaseOrder}>#{index + 1}</span>
                    </div>
                    <div className={styles.testCaseMeta}>
                      <span className={styles.testCaseVersion}>
                        Версия: {testCase.testCase?.version || 'Неизвестно'}
                      </span>
                      <span className={styles.testCaseId}>
                        ID: {testCase.testCase?.id || 'Не указан'}
                      </span>
                    </div>
                  </div>
                  <Link
                    className={`${styles.iconButton} ${styles.viewButton}`}
                    to={`${window.location.pathname.split(PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN)[0]}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${testCase.testCase.id}`}
                    title="Просмотреть тест-кейс"
                  >
                    <EyeIcon />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noTestCases}>
              <p>Нет тест-кейсов в плане</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
