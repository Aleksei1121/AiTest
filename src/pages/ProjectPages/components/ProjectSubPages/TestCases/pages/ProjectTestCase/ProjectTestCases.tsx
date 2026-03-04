import React, { useEffect, useState } from 'react'
import { PAGE_ENDPOINTS } from '@constants/'
import { useProject, useTestCase } from '@contexts/'
import { useHeaderStore } from '@stores/'
import { Link, useNavigate } from 'react-router-dom'
import { ProjectTestCaseTable } from '../../components/ProjectTestCaseTable/ProjectTestCaseTable'
import styles from './ProjectTestCases.module.scss'
import { Breadcrumbs, QuestionDialog } from '@components/'
import { TestCase, TestCaseStatus, UserRole } from '@interfaces/'
import { MassOperationsTab, LoadFromExcelBtn } from '../../components'

export const ProjectTestCases: React.FC = () => {
  const { project, checkAccess } = useProject()
  const {
    allTestCases: testCases,
    isLoading,
    error,
    setAllTestCases,
  } = useTestCase()
  const { setHeaderContent } = useHeaderStore()
  const navigate = useNavigate()
  const [showDiag, setShowDiag] = useState(false)
  const [showRefactorDialog, setShowRefactorDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'table' | 'operations'>('table')
  const [deleteIds, setDeleteIds] = useState<number[]>([])
  const [refactorIds, setRefactorIds] = useState<number[]>([])
  const [totalTCPositive, setTotalTCPositive] = useState(0)
  const [newTCPositive, setNewTCPositive] = useState(0)
  const [newTCNegative, setNewTCNegative] = useState(0)

  const filteredCases = testCases.reduce((filtered, newVal) => {
    if (!filtered.some((prevCase) => prevCase.id === newVal.id)) {
      filtered.push(newVal)
    }
    return filtered
  }, [] as TestCase[])

  const handleRefactor = (ids: number[]) => {
    setRefactorIds(ids)
    setShowRefactorDialog(true)
  }

  const askAboutDelete = (ids: number[]) => {
    setDeleteIds(ids)
    setShowDiag(true)
  }

  const handleDelete = () => {
    console.log('Тест-кейсы для удаления:', deleteIds)
    // API вызов для удаления
    setDeleteIds([])
    setShowDiag(false)
  }

  // Массовые операции
  const handleGenerateAll = (includeNegative: boolean) => {
    console.log('Генерация всех ТК, негативные:', includeNegative)
    console.log('Project ID:', project?.id)
    // API вызов: POST /api/projects/{projectId}/test-cases/generate-all
    // body: { includeNegative }
  }

  const handleGenerateNew = (includeNegative: boolean) => {
    console.log('Генерация новых ТК, негативные:', includeNegative)
    console.log('Project ID:', project?.id)
    // API вызов: POST /api/projects/{projectId}/test-cases/generate-new
    // body: { includeNegative }
  }

  const handleRefactorAll = () => {
    console.log('Рефакторинг всех ТК')
    console.log('Project ID:', project?.id)
    // API вызов: POST /api/projects/{projectId}/test-cases/refactor-all
  }

  const handleRefactorSelected = () => {
    console.log('Рефакторинг выбранных ТК:', refactorIds)
    // API вызов: POST /api/projects/{projectId}/test-cases/refactor-selected
    // body: { testCaseIds: refactorIds }
    setRefactorIds([])
    setShowRefactorDialog(false)
  }

  const handleArchive = (ids: number[]) => {
    console.log('перевод в архив:', ids)
    // API вызов: POST /api/projects/{projectId}/test-cases/archive-selected
    // body: { testCaseIds: ids }

    const updated = testCases.map((testCase) => {
      if (ids.includes(testCase.id)) {
        return { ...testCase, status: 0 as TestCaseStatus }
      } else return testCase
    })
    console.log(updated)
    setAllTestCases(updated)
    setShowDiag(false)
  }

  const handleOpenHistory = (id: number) => {
    console.log('История изменений для:', id)
    navigate(`${window.location.pathname}/${id}/${PAGE_ENDPOINTS.HISTORY}`)
  }

  const handleEditCase = (id: number) => {
    console.log('Редактировать тест-кейс:', id)
    navigate(`${window.location.pathname}/${id}`)
  }

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
            { text: 'Тест-кейсы' },
          ]}
        />
      )
    }
  }, [project, setHeaderContent])

  useEffect(() => {
    setTotalTCPositive(filteredCases.filter((el) => el.positive).length)
    setNewTCPositive(
      filteredCases.filter(
        (el) => el.positive && !project?.testCases.some((tc) => tc.id === el.id)
      ).length
    )
    setNewTCNegative(
      filteredCases.filter(
        (el) =>
          !el.positive && !project?.testCases.some((tc) => tc.id === el.id)
      ).length
    )
  }, [filteredCases])

  const getProjectBaseUrl = () => {
    const path = window.location.pathname
    const testCasePart = '/' + PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE
    const parts = path.split(testCasePart)
    return parts[0] || path
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Произошла ошибка</h3>
        <p>{error}</p>
        <br />
        <Link to="/" className={styles.backLink}>
          Вернуться к списку проектов
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка тест-кейсов...</p>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div>
          <h1>Тест-кейсы проекта</h1>
          <p className={styles.projectInfo}>
            Проект: <strong>{project?.name}</strong> | Всего тест-кейсов:{' '}
            <strong>{filteredCases.length}</strong>
          </p>
        </div>
        {checkAccess([
          UserRole.TESTER,
          UserRole.PROJECT_ADMIN,
          UserRole.ANALYST,
        ]) && (
          <LoadFromExcelBtn
            projectId={project?.id || -1}
            className={styles.excelBtn}
          />
        )}
      </div>

      {/* Вкладки */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'table' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('table')}
          >
            База тест-кейсов
          </button>
          {checkAccess([
            UserRole.TESTER,
            UserRole.PROJECT_ADMIN,
            UserRole.ANALYST,
          ]) && (
            <button
              className={`${styles.tab} ${activeTab === 'operations' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              Генерация ТК
            </button>
          )}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'table' ? (
            <ProjectTestCaseTable
              testCases={testCases}
              onRefactor={handleRefactor}
              onDelete={askAboutDelete}
              onOpenHistory={handleOpenHistory}
              onEditCase={handleEditCase}
              projectBaseUrl={getProjectBaseUrl()}
            />
          ) : checkAccess([
              UserRole.TESTER,
              UserRole.PROJECT_ADMIN,
              UserRole.ANALYST,
            ]) ? (
            <MassOperationsTab
              totalTCPositive={totalTCPositive}
              totalTCNegative={filteredCases.length - totalTCPositive}
              newTCPositive={newTCPositive}
              newTCNegative={newTCNegative}
              onGenerateAll={handleGenerateAll}
              onGenerateNew={handleGenerateNew}
              onRefactorAll={handleRefactorAll}
            />
          ) : (
            <></>
          )}
        </div>
      </div>

      {/* Диалог удаления ТК */}
      <QuestionDialog
        showQuestion={showDiag}
        changeShowQuestion={setShowDiag}
        onYesClick={handleDelete}
        onNoClick={() => setDeleteIds([])}
      >
        Вы уверены, что хотите удалить cледующие тест-кейсы? <br />
        {Object.values(
          testCases.reduce(
            (set, val) => {
              if (
                deleteIds.some((id) => val.id === id) &&
                (!set[val.id] ||
                  new Date(val.creationDate) >
                    new Date(set[val.id].creationDate))
              ) {
                set[val.id] = val
              }
              return set
            },
            {} as Record<number, TestCase>
          )
        ).map((tc) => (
          <div key={tc.id} className={styles.selectedItem}>
            {tc.name} (ID: {tc.id})
          </div>
        ))}
        <div className={styles.archiveSuggestionDiv}>
          Вместо этого вы можете
          <button
            className={styles.archiveBtn}
            onClick={() => handleArchive(deleteIds)}
          >
            заархивировать иx
          </button>
        </div>
      </QuestionDialog>

      <QuestionDialog
        showQuestion={showRefactorDialog}
        changeShowQuestion={setShowRefactorDialog}
        onYesClick={handleRefactorSelected}
        onNoClick={() => {
          setRefactorIds([])
        }}
      >
        <h3>Рефакторинг выбранных тест-кейсов</h3>
        <p>
          Будет оптимизировано ТК: <strong>{refactorIds.length}</strong>
        </p>
        {testCases
          .filter((tc) => refactorIds.includes(tc.id))
          // .slice(0, 5) // Показываем только первые 5
          .map((tc) => (
            <div key={tc.id} className={styles.selectedItem}>
              {tc.name} (ID: {tc.id})
            </div>
          ))}
        {refactorIds.length > 5 && (
          <div className={styles.moreItems}>
            и еще {refactorIds.length - 5} тест-кейсов...
          </div>
        )}

        <p className={styles.dialogNote}>
          Нажмите <strong>"Да"</strong> для запуска рефакторинга или{' '}
          <strong>"Нет"</strong> для отмены.
        </p>
      </QuestionDialog>
    </div>
  )
}
