import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestCase, testCaseStatusMap, UserRole } from '@interfaces/'
import { PAGE_ENDPOINTS } from '@constants/'
import styles from './ProjectTestCaseTable.module.scss'
import {
  EditIcon,
  HistoryIcon,
  EyeIcon,
  DeleteIcon,
  RefactorIcon,
  PlusIcon,
  ChevronRightIcon,
} from '@components/'
import { useProject } from '@contexts/'

interface ProjectTestCaseTableProps {
  testCases: TestCase[]
  onRefactor: (ids: number[]) => void
  onDelete: (ids: number[]) => void
  onOpenHistory: (id: number) => void
  onEditCase: (id: number) => void
  projectBaseUrl: string
}

export const ProjectTestCaseTable: React.FC<ProjectTestCaseTableProps> = ({
  testCases,
  onRefactor,
  onDelete,
  onOpenHistory,
  onEditCase,
  projectBaseUrl,
}) => {
  const { checkAccess } = useProject()
  const navigate = useNavigate()
  const [displayCase, setDisplayCase] = useState<TestCase>()
  const [expandedRows, setExpandedRows] = useState<number[]>([])
  const [selectedForDelete, setSelectedForDelete] = useState<number[]>([])
  const [selectedForRefactor, setSelectedForRefactor] = useState<number[]>([])

  // group test-cases by ID (diff versions with single id)
  const groupedCases = testCases.reduce(
    (acc, testCase) => {
      if (!acc[testCase.id]) {
        acc[testCase.id] = []
      }
      // sort new -> old
      acc[testCase.id].push(testCase)
      acc[testCase.id].sort(
        (a, b) =>
          new Date(b.creationDate).getTime() -
          new Date(a.creationDate).getTime()
      )
      return acc
    },
    {} as Record<number, TestCase[]>
  )

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
  }

  const handleDeleteCheckbox = (id: number, checked: boolean) => {
    setSelectedForDelete((prev) =>
      checked ? [...prev, id] : prev.filter((caseId) => caseId !== id)
    )
  }

  const handleRefactorCheckbox = (id: number, checked: boolean) => {
    setSelectedForRefactor((prev) =>
      checked ? [...prev, id] : prev.filter((caseId) => caseId !== id)
    )
  }

  const handleDeleteSelected = () => {
    onDelete(selectedForDelete)
    setSelectedForDelete([])
  }

  const handleRefactorSelected = () => {
    onRefactor(selectedForRefactor)
    setSelectedForRefactor([])
  }

  const handleTestPlanClick = (testPlanId: number) => {
    navigate(
      `${projectBaseUrl}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN}/${testPlanId}`
    )
  }

  const handleSelectAllDelete = (checked: boolean) => {
    if (checked) {
      setSelectedForDelete(Object.keys(groupedCases).map((id) => parseInt(id)))
    } else {
      setSelectedForDelete([])
    }
  }

  const handleSelectAllRefactor = (checked: boolean) => {
    if (checked) {
      setSelectedForRefactor(
        Object.keys(groupedCases).map((id) => parseInt(id))
      )
    } else {
      setSelectedForRefactor([])
    }
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.testCaseTable}>
          <thead>
            <tr>
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
                          Object.keys(groupedCases).length &&
                        Object.keys(groupedCases).length > 0
                      }
                      onChange={(e) => handleSelectAllDelete(e.target.checked)}
                      disabled={Object.keys(groupedCases).length === 0}
                    />
                    <span className={styles.customCheckbox}></span>
                  </div>
                </div>
              </th>
              <th className={styles.checkboxCol}>
                <div className={styles.checkboxContainer}>
                  <span className={styles.checkboxHeaderLabel}>
                    Рефакторинг
                  </span>
                  <div
                    className={`${styles.checkboxGroup} ${styles.refactorCheckbox}`}
                  >
                    <input
                      type="checkbox"
                      id="select-all-refactor"
                      checked={
                        selectedForRefactor.length ===
                          Object.keys(groupedCases).length &&
                        Object.keys(groupedCases).length > 0
                      }
                      onChange={(e) =>
                        handleSelectAllRefactor(e.target.checked)
                      }
                      disabled={Object.keys(groupedCases).length === 0}
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
              <th>Статус</th>
              <th>Версия</th>
              <th>Дата создания</th>
              <th>Владелец</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedCases).map(([id, versions]) => {
              const latestVersion = versions[0]
              const isExpanded = expandedRows.includes(parseInt(id))

              return (
                <React.Fragment key={id}>
                  {/* main row */}
                  <tr
                    className={`${styles.mainRow} ${isExpanded ? styles.expanded : ''}`}
                    onClick={(e) => {
                      setDisplayCase(latestVersion)
                      // toggleRow(parseInt(id))
                      Array.from(
                        e.currentTarget.parentElement?.children || []
                      ).forEach((el) => el.classList.remove(styles.expanded))
                      e.currentTarget.classList.add(styles.expanded)
                    }}
                  >
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
                    <td className={styles.checkboxCol}>
                      <div
                        className={`${styles.checkboxGroup} ${styles.refactorCheckbox}`}
                      >
                        <input
                          type="checkbox"
                          id={`refactor-${id}`}
                          checked={selectedForRefactor.includes(parseInt(id))}
                          onChange={(e) =>
                            handleRefactorCheckbox(
                              parseInt(id),
                              e.target.checked
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={styles.customCheckbox}></span>
                      </div>
                    </td>
                    <td className={styles.expandCol}>
                      <button
                        className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRow(parseInt(id))
                          setDisplayCase(latestVersion)
                        }}
                        title={isExpanded ? 'Свернуть' : 'Развернуть'}
                      >
                        <ChevronRightIcon />
                      </button>
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
                    <td className={styles.statusCell}>
                      <span
                        className={`${styles.statusBadge} ${styles[`status${latestVersion.status}`]}`}
                      >
                        {testCaseStatusMap[latestVersion.status]}
                      </span>
                    </td>
                    <td className={styles.versionCell}>
                      {latestVersion.version}
                    </td>
                    <td className={styles.dateCell}>
                      {latestVersion.creationDate.toLocaleDateString()}
                    </td>
                    <td className={styles.ownerCell}>
                      <a
                        href={`${window.location.origin}${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.ACCOUNT.INDEX}/${latestVersion.owner.id}`}
                      >
                        {latestVersion.owner.username}
                      </a>
                    </td>
                    <td className={styles.actionsCell}>
                      {checkAccess([
                        UserRole.TESTER,
                        UserRole.PROJECT_ADMIN,
                        UserRole.ANALYST,
                        UserRole.AUTOMATOR,
                      ]) && (
                        <button
                          className={styles.iconButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditCase(parseInt(id))
                          }}
                          title="Редактировать"
                        >
                          <EditIcon />
                        </button>
                      )}
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenHistory(parseInt(id))
                        }}
                        title="История изменений"
                      >
                        <HistoryIcon />
                      </button>
                    </td>
                  </tr>

                  {/* dropdown with versions */}
                  {isExpanded &&
                    versions.slice(1).map((version, index) => (
                      <tr
                        key={`${id}-${version.version}`}
                        className={styles.versionRow}
                        onClick={(e) => {
                          setDisplayCase(versions[index + 1])
                          Array.from(
                            e.currentTarget.parentElement?.children || []
                          ).forEach((el) =>
                            el.classList.remove(styles.expanded)
                          )
                          e.currentTarget.classList.add(styles.expanded)
                        }}
                      >
                        <td colSpan={2}></td>
                        <td></td>
                        <td>
                          {/* <span className={styles.oldVersionLabel}>
                           -
                          </span> */}
                        </td>
                        <td className={styles.nameCell}>
                          <div className={styles.nameContent}>
                            {version.name}
                            <span className={styles.warningBadge}>
                              Устаревшая
                            </span>
                          </div>
                        </td>
                        <td className={styles.statusCell}>
                          <span
                            className={`${styles.statusBadge} ${styles[`status${version.status}`]} ${styles.oldStatus}`}
                          >
                            {testCaseStatusMap[version.status]}
                          </span>
                        </td>
                        <td
                          className={`${styles.versionCell} ${styles.oldVersion}`}
                        >
                          {version.version}
                        </td>
                        <td className={styles.dateCell}>
                          {version.creationDate.toLocaleDateString()}
                        </td>
                        <td className={styles.ownerCell}>
                          <a
                            href={`${window.location.origin}${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.ACCOUNT.INDEX}/${version.owner.id}`}
                          >
                            {version.owner.username}
                          </a>
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            className={`${styles.iconButton} ${styles.viewButton}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Передаем id и версию для просмотра
                              navigate(
                                `${projectBaseUrl}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${version.id}/view?version=${version.version}`
                              )
                            }}
                            title="Просмотреть версию"
                          >
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {/* details test-case */}
                  {isExpanded && (
                    <tr className={styles.detailsRow}>
                      <td colSpan={10}>
                        <div className={styles.detailsContainer}>
                          <div className={styles.detailsSection}>
                            <h4>Детали тест-кейса</h4>
                            <div className={styles.detailsGrid}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Позитивный:
                                </span>
                                <span>
                                  {displayCase?.positive ? 'Да' : 'Нет'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Скрипты:
                                </span>
                                <span>
                                  {displayCase?.scriptIds
                                    .map((s) => s.name)
                                    .join(', ') || 'Нет'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Предусловие:
                                </span>
                                <span>
                                  {displayCase?.precondition || 'Нет'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Используется в тест-кейсах:
                                </span>
                                <span>
                                  {displayCase?.relatedTestCases
                                    .map((tc) => tc.name)
                                    .join(', ') || 'Нет'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>
                                  Входит в тест-планы:
                                </span>
                                <span>
                                  {displayCase?.usedInTestPlans ? 'Да' : 'Нет'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {(displayCase?.testPlans.length || 0) > 0 && (
                            <div className={styles.detailsSection}>
                              <h4>Тест-планы</h4>
                              <div className={styles.testPlansList}>
                                {displayCase?.testPlans.map((plan) => (
                                  <div
                                    key={plan.id}
                                    className={styles.testPlanItem}
                                    onClick={() => handleTestPlanClick(plan.id)}
                                  >
                                    <span className={styles.testPlanName}>
                                      {plan.name}
                                    </span>
                                    <span className={styles.testPlanDate}>
                                      {plan.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
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

        {testCases.length === 0 && (
          <div className={styles.noData}>
            <p>Нет тест-кейсов для отображения</p>
          </div>
        )}
      </div>

      {/* footer with actions */}
      <div className={styles.tableFooter}>
        {checkAccess([
          UserRole.TESTER,
          UserRole.PROJECT_ADMIN,
          UserRole.ANALYST,
        ]) && (
          <div className={styles.footerActions}>
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
              className={`${styles.footerButton} ${styles.refactorButton}`}
              onClick={handleRefactorSelected}
              disabled={selectedForRefactor.length === 0}
            >
              <span className={styles.buttonIcon}>
                <RefactorIcon />
              </span>
              Рефакторинг отмеченных ({selectedForRefactor.length})
            </button>
            <button
              className={`${styles.footerButton} ${styles.primaryButton}`}
              onClick={() => navigate(window.location.pathname + '/new')}
            >
              <span className={styles.buttonIcon}>
                <PlusIcon />
              </span>
              Создать тест-кейс
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
