import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TestPlan,
  testPlanStatusMap,
  testPlanLastRunStatusMap,
  UserRole,
} from '@interfaces/'
import { PAGE_ENDPOINTS } from '@constants/'
import styles from './ProjectTestPlanTable.module.scss'
import {
  EditIcon,
  HistoryIcon,
  EyeIcon,
  DeleteIcon,
  PlusIcon,
  ChevronRightIcon,
  CloneIcon,
  PlayIcon,
} from '@components/'
import { useProject } from '@contexts/'

interface ProjectTestPlanTableProps {
  testPlans: TestPlan[]
  onRunTestPlan: (ids: number[]) => void
  onDelete: (ids: number[]) => void
  onClone: (ids: number[]) => void
  onOpenHistory: (id: number) => void
  onEditPlan: (id: number) => void
  onViewDetails: (id: number) => void
  projectBaseUrl: string
}

export const ProjectTestPlanTable: React.FC<ProjectTestPlanTableProps> = ({
  testPlans,
  onRunTestPlan,
  onDelete,
  onClone,
  onOpenHistory,
  onEditPlan,
  onViewDetails,
  projectBaseUrl,
}) => {
  const { checkAccess } = useProject()
  const navigate = useNavigate()
  const [expandedRows, setExpandedRows] = useState<number[]>([])
  const [selectedForDelete, setSelectedForDelete] = useState<number[]>([])
  const [selectedForRun, setSelectedForRun] = useState<number[]>([])

  const groupedPlans = testPlans.reduce(
    (acc, testPlan) => {
      if (!acc[testPlan.id]) {
        acc[testPlan.id] = []
      }
      acc[testPlan.id].push(testPlan)
      acc[testPlan.id].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      return acc
    },
    {} as Record<number, TestPlan[]>
  )

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
  }

  const handleDeleteCheckbox = (id: number, checked: boolean) => {
    setSelectedForDelete((prev) =>
      checked ? [...prev, id] : prev.filter((planId) => planId !== id)
    )
  }

  const handleRunCheckbox = (id: number, checked: boolean) => {
    setSelectedForRun((prev) =>
      checked ? [...prev, id] : prev.filter((planId) => planId !== id)
    )
  }

  const handleDeleteSelected = () => {
    onDelete(selectedForDelete)
    setSelectedForDelete([])
  }

  const handleRunSelected = () => {
    onRunTestPlan(selectedForRun)
    setSelectedForRun([])
  }

  const handleSelectAllDelete = (checked: boolean) => {
    if (checked) {
      setSelectedForDelete(Object.keys(groupedPlans).map((id) => parseInt(id)))
    } else {
      setSelectedForDelete([])
    }
  }

  const handleSelectAllRun = (checked: boolean) => {
    if (checked) {
      setSelectedForRun(Object.keys(groupedPlans).map((id) => parseInt(id)))
    } else {
      setSelectedForRun([])
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration} сек`
    if (duration < 3600) return `${Math.floor(duration / 60)} мин`
    return `${Math.floor(duration / 3600)} ч ${Math.floor((duration % 3600) / 60)} мин`
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.testPlanTable}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <div className={styles.checkboxContainer}>
                  <span className={styles.checkboxHeaderLabel}>Запуск</span>
                  <div
                    className={`${styles.checkboxGroup} ${styles.runCheckbox}`}
                  >
                    <input
                      type="checkbox"
                      id="select-all-run"
                      checked={
                        selectedForRun.length ===
                          Object.keys(groupedPlans).length &&
                        Object.keys(groupedPlans).length > 0
                      }
                      onChange={(e) => handleSelectAllRun(e.target.checked)}
                      disabled={Object.keys(groupedPlans).length === 0}
                    />
                    <span className={styles.customCheckbox}></span>
                  </div>
                </div>
              </th>
              <th className={styles.checkboxCol}>
                <div className={styles.checkboxContainer}>
                  <span className={styles.checkboxHeaderLabel}>Удалить</span>
                  <div
                    className={`${styles.checkboxGroup} ${styles.deleteCheckbox}`}
                  >
                    <input
                      type="checkbox"
                      id="select-all-delete"
                      checked={
                        selectedForDelete.length ===
                          Object.keys(groupedPlans).length &&
                        Object.keys(groupedPlans).length > 0
                      }
                      onChange={(e) => handleSelectAllDelete(e.target.checked)}
                      disabled={Object.keys(groupedPlans).length === 0}
                    />
                    <span className={styles.customCheckbox}></span>
                  </div>
                </div>
              </th>
              <th className={styles.expandCol}>
                <div className={styles.expandHeader}>Версии</div>
              </th>
              <th>ID</th>
              <th>Название</th>
              <th>Версия</th>
              <th>ТК в плане</th>
              <th>Владелец</th>
              <th>Дата создания</th>
              <th>Последний запуск</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedPlans).map(([id, versions]) => {
              const latestVersion = versions[0]
              const isExpanded = expandedRows.includes(parseInt(id))
              const hasMultipleVersions = versions.length > 1

              return (
                <React.Fragment key={id}>
                  <tr
                    className={`${styles.mainRow} ${
                      isExpanded ? styles.expanded : ''
                    }`}
                    onClick={() =>
                      hasMultipleVersions && toggleRow(parseInt(id))
                    }
                  >
                    <td className={styles.checkboxCol}>
                      <div
                        className={`${styles.checkboxGroup} ${styles.runCheckbox}`}
                      >
                        <input
                          type="checkbox"
                          id={`run-${id}`}
                          checked={selectedForRun.includes(parseInt(id))}
                          onChange={(e) =>
                            handleRunCheckbox(parseInt(id), e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={styles.customCheckbox}></span>
                      </div>
                    </td>
                    <td className={styles.checkboxCol}>
                      <div
                        className={`${styles.checkboxGroup} ${styles.deleteCheckbox}`}
                      >
                        <input
                          type="checkbox"
                          id={`delete-${id}`}
                          checked={selectedForDelete.includes(parseInt(id))}
                          onChange={(e) =>
                            handleDeleteCheckbox(parseInt(id), e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={styles.customCheckbox}></span>
                      </div>
                    </td>
                    <td className={styles.expandCol}>
                      {hasMultipleVersions && (
                        <button
                          className={`${styles.expandButton} ${
                            isExpanded ? styles.expanded : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRow(parseInt(id))
                          }}
                          title={isExpanded ? 'Свернуть' : 'Развернуть'}
                        >
                          <ChevronRightIcon />
                        </button>
                      )}
                    </td>
                    <td className={styles.idCell}>{id}</td>
                    <td className={styles.nameCell}>
                      <div className={styles.nameContent}>
                        {latestVersion.name}
                        {versions.length > 1 && (
                          <span className={styles.versionBadge}>
                            {versions.length} верс.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.versionCell}>
                      {latestVersion.version}
                    </td>
                    <td className={styles.testCasesCell}>
                      <span className={styles.testCasesCount}>
                        {latestVersion.testCaseCount}
                      </span>
                    </td>
                    <td className={styles.ownerCell}>
                      {latestVersion.owner?.username || 'Нет'}
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(latestVersion.createdAt).toLocaleDateString()}
                    </td>
                    <td className={styles.lastRunCell}>
                      {latestVersion.lastRunAt ? (
                        <div className={styles.lastRunInfo}>
                          <div className={styles.lastRunDate}>
                            {new Date(
                              latestVersion.lastRunAt
                            ).toLocaleDateString()}
                          </div>
                          <div className={styles.lastRunDuration}>
                            {formatDuration(latestVersion.duration)}
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noRun}>Не запускался</span>
                      )}
                    </td>
                    <td className={styles.statusCell}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[`status${latestVersion.lastRunStatus}`]
                        }`}
                      >
                        {testPlanLastRunStatusMap[
                          latestVersion.lastRunStatus as keyof typeof testPlanLastRunStatusMap
                        ] || latestVersion.lastRunStatus}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      {checkAccess([
                        UserRole.ANALYST,
                        UserRole.PROJECT_ADMIN,
                      ]) && (
                        <button
                          className={styles.iconButton}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onEditPlan(parseInt(id))
                          }}
                          title="Редактировать"
                        >
                          <EditIcon />
                        </button>
                      )}
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onOpenHistory(parseInt(id))
                        }}
                        title="Журнал запусков"
                      >
                        <HistoryIcon />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onViewDetails(parseInt(id))
                        }}
                        title="Просмотреть детали"
                      >
                        <EyeIcon />
                      </button>
                      {checkAccess([
                        UserRole.ANALYST,
                        UserRole.PROJECT_ADMIN,
                      ]) && (
                        <button
                          className={styles.iconButton}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onClone([parseInt(id)])
                          }}
                          title="Клонировать"
                        >
                          <CloneIcon />
                        </button>
                      )}
                    </td>
                  </tr>

                  {isExpanded &&
                    versions.slice(1).map((version, index) => (
                      <tr
                        key={`${id}-${version.version}`}
                        className={styles.versionRow}
                      >
                        <td colSpan={2}></td>
                        <td></td>
                        <td>
                          <span className={styles.oldVersionLabel}>
                            v{versions.length - index - 1}
                          </span>
                        </td>
                        <td className={styles.nameCell}>
                          <div className={styles.nameContent}>
                            {version.name}
                            <span className={styles.warningBadge}>
                              Устаревшая
                            </span>
                          </div>
                        </td>
                        <td
                          className={`${styles.versionCell} ${styles.oldVersion}`}
                        >
                          {version.version}
                        </td>
                        <td className={styles.testCasesCell}>
                          <span className={styles.testCasesCount}>
                            {version.testCaseCount}
                          </span>
                        </td>
                        <td className={styles.ownerCell}>
                          {version.owner?.username || 'Нет'}
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(version.createdAt).toLocaleDateString()}
                        </td>
                        <td className={styles.lastRunCell}>
                          <span className={styles.noRun}>Не запускался</span>
                        </td>
                        <td className={styles.statusCell}>
                          <span className={styles.noStatus}>—</span>
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            className={`${styles.iconButton} ${styles.viewButton}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDetails(version.id)
                            }}
                            title="Просмотреть версию"
                          >
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {isExpanded && (
                    <tr className={styles.detailsRow}>
                      <td colSpan={12}>
                        <div className={styles.detailsContainer}>
                          <div className={styles.detailsSection}>
                            <h4>Детали тест-плана</h4>
                            <div className={styles.detailsGrid}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Описание:
                                </span>
                                <span>
                                  {latestVersion.description || 'Нет описания'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Всего тест-кейсов:
                                </span>
                                <span>{latestVersion.testCaseCount}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Последний запуск:
                                </span>
                                <span>
                                  {latestVersion.lastRunAt
                                    ? `${new Date(latestVersion.lastRunAt).toLocaleString()}`
                                    : 'Не запускался'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Статус тест-плана:
                                </span>
                                <span>
                                  {
                                    testPlanStatusMap[
                                      latestVersion.status as keyof typeof testPlanStatusMap
                                    ]
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {latestVersion.testCases &&
                            latestVersion.testCases.length > 0 && (
                              <div className={styles.detailsSection}>
                                <h4>Тест-кейсы в плане</h4>
                                <div className={styles.testCasesList}>
                                  {latestVersion.testCases
                                    .slice(0, 5)
                                    .map((tc, index) => (
                                      <div
                                        key={tc.testCase.id}
                                        className={styles.testCaseItem}
                                        onClick={() =>
                                          tc.testCase?.id &&
                                          navigate(
                                            `${projectBaseUrl}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${tc.testCase.id}`
                                          )
                                        }
                                      >
                                        <span className={styles.testCaseName}>
                                          {tc.testCase?.name ||
                                            `Тест-кейс ${index + 1}`}
                                        </span>
                                        {tc.testCase?.version && (
                                          <span
                                            className={styles.testCaseVersion}
                                          >
                                            v{tc.testCase.version}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  {latestVersion.testCases.length > 5 && (
                                    <div className={styles.moreTestCases}>
                                      и ещё {latestVersion.testCases.length - 5}{' '}
                                      тест-кейсов...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {testPlans.length === 0 && (
          <div className={styles.noData}>
            <p>Нет тест-планов для отображения</p>
          </div>
        )}
      </div>

      <div className={styles.tableFooter}>
        <div className={styles.footerActions}>
          {checkAccess([
            UserRole.TESTER,
            UserRole.ANALYST,
            UserRole.PROJECT_ADMIN,
          ]) && (
            <button
              className={`${styles.footerButton} ${styles.runButton}`}
              onClick={handleRunSelected}
              disabled={selectedForRun.length === 0}
            >
              <PlayIcon className={styles.buttonIcon} />
              Запустить отмеченные ({selectedForRun.length})
            </button>
          )}
          {checkAccess([UserRole.ANALYST, UserRole.PROJECT_ADMIN]) && (
            <>
              <button
                className={`${styles.footerButton} ${styles.deleteButton}`}
                onClick={handleDeleteSelected}
                disabled={selectedForDelete.length === 0}
              >
                <span className={styles.buttonIcon}>
                  <DeleteIcon />
                </span>
                Удалить отмеченные ({selectedForDelete.length})
              </button>
              <button
                className={`${styles.footerButton} ${styles.primaryButton}`}
                onClick={() => navigate(window.location.pathname + '/new')}
              >
                <span className={styles.buttonIcon}>
                  <PlusIcon />
                </span>
                Создать тест-план
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
