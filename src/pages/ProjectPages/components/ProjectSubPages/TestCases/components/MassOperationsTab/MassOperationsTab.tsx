import React, { useState } from 'react'
import styles from './MassOperationsTab.module.scss'
import { QuestionDialog } from '@components/'
import { useProject } from '@contexts/'
import { UserRole } from '@interfaces/'

interface MassOperationsTabProps {
  totalTCPositive: number
  totalTCNegative: number
  newTCPositive: number
  newTCNegative: number
  onGenerateAll: (includeNegative: boolean) => void
  onGenerateNew: (includeNegative: boolean) => void
  onRefactorAll: () => void
}

export const MassOperationsTab: React.FC<MassOperationsTabProps> = ({
  totalTCPositive,
  totalTCNegative,
  newTCPositive,
  newTCNegative,
  onGenerateAll,
  onGenerateNew,
  onRefactorAll,
}) => {
  const { project, checkAccess } = useProject()
  const [showGenerateAllDialog, setShowGenerateAllDialog] = useState(false)
  const [showGenerateNewDialog, setShowGenerateNewDialog] = useState(false)
  const [showRefactorAllDialog, setShowRefactorAllDialog] = useState(false)
  const [includeNegative, setIncludeNegative] = useState(false)

  const handleGenerateAll = () => {
    onGenerateAll(includeNegative)
    setShowGenerateAllDialog(false)
    setIncludeNegative(false)
  }

  const handleGenerateNew = () => {
    onGenerateNew(includeNegative)
    setShowGenerateNewDialog(false)
    setIncludeNegative(false)
  }

  const handleRefactorAll = () => {
    onRefactorAll()
    setShowRefactorAllDialog(false)
  }

  if (
    !checkAccess([
      UserRole.TESTER, UserRole.PROJECT_ADMIN, UserRole.ANALYST
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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Массовые операции с тест-кейсами</h2>

      <div className={styles.operationsGrid}>
        {/* Генерация всех ТК */}
        <div className={styles.operationCard}>
          <h3>Генерация всех тест-кейсов</h3>
          <p>
            Создаст полный набор тест-кейсов для проекта. Будут сгенерированы
            как позитивные, так и негативные сценарии.
          </p>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              Всего ТК: {totalTCPositive + totalTCNegative}
            </span>
            <span className={styles.statItem}>
              Негативных ТК: {totalTCNegative}
            </span>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setShowGenerateAllDialog(true)}
          >
            Запустить генерацию
          </button>
        </div>

        {/* Генерация новых ТК */}
        <div className={styles.operationCard}>
          <h3>Генерация только новых тест-кейсов</h3>
          <p>
            Создаст тест-кейсы только для нового функционала, который еще не
            покрыт тестами.
          </p>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              Новых ТК: {newTCPositive + newTCNegative}
            </span>
            <span className={styles.statItem}>
              Негативных ТК: {newTCNegative}
            </span>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setShowGenerateNewDialog(true)}
            disabled={newTCPositive + newTCNegative === 0}
          >
            {newTCPositive + newTCNegative === 0
              ? 'Нет новых ТК'
              : 'Запустить генерацию'}
          </button>
        </div>

        {/* Рефакторинг всех ТК */}
        <div className={styles.operationCard}>
          <h3>Рефакторинг всех тест-кейсов</h3>
          <p>
            Пересматривает проект и создает тест-кейсы по новому/изменившемуся
            функционалу
          </p>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              Всего ТК: {totalTCPositive + totalTCNegative}
            </span>
            <span className={styles.statItem}>
              Негативных ТК: {totalTCNegative}
            </span>
          </div>
          <button
            className={styles.refactorButton}
            onClick={() => setShowRefactorAllDialog(true)}
          >
            Запустить рефакторинг
          </button>
        </div>
      </div>

      {/* Диалог генерации всех ТК (Форма 19) */}
      <QuestionDialog
        showQuestion={showGenerateAllDialog}
        changeShowQuestion={setShowGenerateAllDialog}
        onYesClick={handleGenerateAll}
        className={styles.dialog}
        onNoClick={() => {
          setShowGenerateAllDialog(false)
          setIncludeNegative(false)
        }}
      >
        <div className={styles.dialogContent}>
          <h3>Генерация всех тест-кейсов</h3>
          <div className={styles.questionMain}>
            <p className={styles.message}>
              Будет сгенерировано TK:{' '}
              <strong>
                {includeNegative
                  ? totalTCPositive + totalTCNegative
                  : totalTCPositive}{' '}
              </strong>
            </p>

            <div className={styles.checkboxSection}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={includeNegative}
                  onChange={(e) => setIncludeNegative(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom}></span>
                Включая негативные
              </label>
            </div>
          </div>

          <p className={styles.dialogNote}>
            Нажмите <strong>"Да"</strong> для запуска генерации или{' '}
            <strong>"Нет"</strong> для отмены.
          </p>
        </div>
      </QuestionDialog>

      {/* Диалог генерации новых ТК (Форма 20) */}
      <QuestionDialog
        showQuestion={showGenerateNewDialog}
        changeShowQuestion={setShowGenerateNewDialog}
        onYesClick={handleGenerateNew}
        className={styles.dialog}
        onNoClick={() => {
          setShowGenerateNewDialog(false)
          setIncludeNegative(false)
        }}
      >
        <div className={styles.dialogContent}>
          <h3>Генерация новых тест-кейсов</h3>
          <div className={styles.questionMain}>
            <p>
              Будет сгенерировано TK:{' '}
              <strong>
                {includeNegative
                  ? newTCPositive + newTCNegative
                  : newTCPositive}{' '}
              </strong>
            </p>

            <div className={styles.checkboxSection}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={includeNegative}
                  onChange={(e) => setIncludeNegative(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom}></span>
                Включая негативные
              </label>
            </div>
          </div>

          <p className={styles.dialogNote}>
            Нажмите <strong>"Да"</strong> для запуска генерации или{' '}
            <strong>"Нет"</strong> для отмены.
          </p>
        </div>
      </QuestionDialog>

      {/* Диалог рефакторинга всех ТК (Форма 17) */}
      <QuestionDialog
        showQuestion={showRefactorAllDialog}
        changeShowQuestion={setShowRefactorAllDialog}
        onYesClick={handleRefactorAll}
        className={styles.dialog}
        onNoClick={() => setShowRefactorAllDialog(false)}
      >
        <div className={styles.dialogContent}>
          <h3>Рефакторинг всех тест-кейсов</h3>
          <p>
            Будет оптимизировано ТК:{' '}
            <strong>{totalTCPositive + totalTCNegative}</strong>
          </p>

          <p className={styles.dialogNote}>
            Нажмите <strong>"Да"</strong> для запуска рефакторинга или{' '}
            <strong>"Нет"</strong> для отмены.
          </p>
        </div>
      </QuestionDialog>
    </div>
  )
}
