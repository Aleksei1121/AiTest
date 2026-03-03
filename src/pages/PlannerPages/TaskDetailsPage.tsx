import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockApiService } from '../../services/mockApiService';
import { PlannerTask } from '../../types/planner';
import { QuestionDialog } from '@components/QuestionDialog/questionDiag';
import { PAGE_ENDPOINTS } from '@constants/';
import { useHeaderStore } from '@stores/';
import { Breadcrumbs } from '@components/BreadCrumbs/BreadCrumbs';
import styles from './TaskDetailsPage.module.scss';

const TaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<PlannerTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const navigate = useNavigate();
  const loadingRef = useRef(false);
  const { setHeaderContent } = useHeaderStore();

  useEffect(() => {
    setHeaderContent(
      <Breadcrumbs
        items={[
          { text: 'ЯМП', link: PAGE_ENDPOINTS.INDEX },
          { text: 'Планировщик', link: `${PAGE_ENDPOINTS.OUTLET}/planner` },
          { text: 'Подробности задачи' },
        ]}
      />
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError('Превышено время загрузки. Попробуйте позже.');
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    if (!id) {
      navigate(`${PAGE_ENDPOINTS.OUTLET}/planner`);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    loadTask(id);
  }, [id, navigate]);

  const loadTask = async (taskId: string) => {
    try {
      const data = await mockApiService.getPlannerTaskDetails(taskId);
      if (data) {
        setTask(data);
        setError(null);
      } else {
        setError('Задача не найдена');
      }
    } catch (err) {
      setError('Ошибка загрузки задачи');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleArchiveAction = () => {
    alert('Операция выполнена (заглушка)'); 
    setShowArchiveConfirm(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка деталей задачи...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className={styles.errorContainer}>
        <h3>Ошибка</h3>
        <p>{error || 'Задача не найдена'}</p>
        <button className={styles.backLink} onClick={() => navigate(`${PAGE_ENDPOINTS.OUTLET}/planner`)}>
          Вернуться к списку
        </button>
      </div>
    );
  }

  const renderTaskSpecificDetails = () => {
    switch (task.taskType) {
      case 'generation':
        return (
          <div className={styles.section}>
            <h3>Генерация ТК</h3>
            <p><strong>Всего сгенерировано:</strong> {task.parsingResult?.total}</p>
            <p><strong>Предупреждений:</strong> {task.parsingResult?.warnings}</p>
            {task.warningTestCases && task.warningTestCases.length > 0 && (
              <>
                <h4>ТК с предупреждениями:</h4>
                <ul>
                  {task.warningTestCases.map(tc => (
                    <li key={tc.id}>
                      <Link to={`${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${task.projectId}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${tc.id}`}>
                        {tc.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );

      case 'refactoring':
        return (
          <div className={styles.section}>
            <h3>Рефакторинг ТК</h3>
            <p><strong>Всего проверено:</strong> {task.refactoringResult?.totalChecked}</p>
            <p><strong>Без изменений:</strong> {task.refactoringResult?.unchanged}</p>
            <p><strong>Создано новых версий (драфт):</strong> {task.refactoringResult?.draftNewVersions}</p>
            {task.warningTestCases && task.warningTestCases.length > 0 && (
              <>
                <h4>ТК с предупреждениями:</h4>
                <ul>
                  {task.warningTestCases.map(tc => (
                    <li key={tc.id}>
                      <Link to={`${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${task.projectId}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${tc.id}`}>
                        {tc.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button className={styles.archiveButton} onClick={() => setShowArchiveConfirm(true)}>
              Перенести все старые ТК в Архив, новые сделать активными
            </button>
          </div>
        );

      case 'new_feature_generation':
        return (
          <div className={styles.section}>
            <h3>Генерация ТК (новый функционал)</h3>
            <p><strong>Всего проверено:</strong> {task.newFeatureResult?.totalChecked}</p>
            <p><strong>Сгенерировано новых ТК (драфт):</strong> {task.newFeatureResult?.newDraft}</p>
            <p><strong>Устаревших ТК:</strong> {task.newFeatureResult?.deprecated}</p>
            {task.warningTestCases && task.warningTestCases.length > 0 && (
              <>
                <h4>ТК с предупреждениями:</h4>
                <ul>
                  {task.warningTestCases.map(tc => (
                    <li key={tc.id}>
                      <Link to={`${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${task.projectId}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${tc.id}`}>
                        {tc.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button className={styles.archiveButton} onClick={() => setShowArchiveConfirm(true)}>
              Перенести все устаревшие ТК в Архив, новые сделать активными
            </button>
          </div>
        );

      case 'script_generation':
        return (
          <div className={styles.section}>
            <h3>Генерация скриптов</h3>
            <p><strong>Обработано ТК:</strong> {task.scriptGenerationResult?.processedTestCases}</p>
            <p><strong>Сгенерировано скриптов:</strong> {task.scriptGenerationResult?.generatedScripts}</p>
          </div>
        );

      case 'script_refactoring':
        return (
          <div className={styles.section}>
            <h3>Рефакторинг скриптов</h3>
            <p><strong>Всего проверено:</strong> {task.scriptRefactoringResult?.totalChecked}</p>
            <p><strong>Без изменений:</strong> {task.scriptRefactoringResult?.unchanged}</p>
            <p><strong>Создано новых версий (драфт):</strong> {task.scriptRefactoringResult?.draftNewVersions}</p>
          </div>
        );

      case 'new_script_generation':
        return (
          <div className={styles.section}>
            <h3>Генерация скриптов для новых ТК</h3>
            <p><strong>Создано новых скриптов:</strong> {task.newScriptGenerationResult?.createdScripts}</p>
          </div>
        );

      case 'autotesting':
        return (
          <div className={styles.section}>
            <h3>Автотестирование</h3>
            <p><strong>Название прогона:</strong> {task.autotestingResult?.testPlanName}</p>
            <p><strong>Список ТК:</strong></p>
            <ul>
              {task.autotestingResult?.testCases.map(tc => (
                <li key={tc.id}>
                  <Link to={`${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.PROJECT}/${task.projectId}/${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}/${tc.id}`}>
                    {tc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <button className={styles.backButton} onClick={() => navigate(`${PAGE_ENDPOINTS.OUTLET}/planner`)}>
          Назад к списку
        </button>
        <h1>Подробности задачи</h1>
      </div>

      <div className={styles.contentCard}>
        <div className={styles.taskHeader}>
          <p><strong>Проект:</strong> {task.projectName}</p>
          <p><strong>Владелец:</strong> {task.owner}</p>
          <p><strong>Время начала:</strong> {formatDate(task.startTime)}</p>
          <p><strong>Время завершения:</strong> {formatDate(task.endTime)}</p>
        </div>

        {renderTaskSpecificDetails()}
      </div>

      <QuestionDialog
        open={showArchiveConfirm}
        onConfirm={handleArchiveAction}
        onCancel={() => setShowArchiveConfirm(false)}
        title="Подтверждение"
        message="Вы уверены, что хотите перенести все старые ТК в архив, а новые сделать активными?"
      />
    </div>
  );
};

export default TaskDetailsPage;