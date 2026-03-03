import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApiService } from '../../services/mockApiService';
import { PlannerTask } from '../../types/planner';
import { PAGE_ENDPOINTS } from '@constants/';
import { useHeaderStore } from '@stores/';
import Breadcrumbs from '@components/BreadCrumbs/BreadCrumbs';
import styles from './PlannerPage.module.scss';

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
  key: keyof PlannerTask | 'result' | null;
  direction: SortDirection;
}

const PlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const navigate = useNavigate();
  const { setHeaderContent } = useHeaderStore();

  useEffect(() => {
    setHeaderContent(
      <Breadcrumbs
        items={[
          { text: 'ЯМП', link: PAGE_ENDPOINTS.INDEX },
          { text: 'Планировщик' },
        ]}
      />
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await mockApiService.getPlannerTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getTaskTypeLabel = (type: PlannerTask['taskType']) => {
    const map: Record<PlannerTask['taskType'], string> = {
      generation: 'Генерация ТК',
      refactoring: 'Рефакторинг ТК',
      new_feature_generation: 'Генерация ТК (новый функционал)',
      script_generation: 'Генерация скриптов',
      script_refactoring: 'Рефакторинг скриптов',
      new_script_generation: 'Генерация скриптов (новые ТК)',
      autotesting: 'Автотестирование',
    };
    return map[type];
  };

  const getTaskResult = (task: PlannerTask) => {
    switch (task.taskType) {
      case 'generation':
        return task.parsingResult
          ? `${task.parsingResult.total} ТК (пред. ${task.parsingResult.warnings})`
          : '-';
      case 'refactoring':
        return task.refactoringResult
          ? `${task.refactoringResult.totalChecked} ТК (без изм. ${task.refactoringResult.unchanged})`
          : '-';
      case 'new_feature_generation':
        return task.newFeatureResult
          ? `${task.newFeatureResult.totalChecked} ТК (новых драфт ${task.newFeatureResult.newDraft})`
          : '-';
      case 'script_generation':
        return task.scriptGenerationResult
          ? `${task.scriptGenerationResult.processedTestCases} ТК → ${task.scriptGenerationResult.generatedScripts} скриптов`
          : '-';
      case 'script_refactoring':
        return task.scriptRefactoringResult
          ? `${task.scriptRefactoringResult.totalChecked} скриптов (без изм. ${task.scriptRefactoringResult.unchanged})`
          : '-';
      case 'new_script_generation':
        return task.newScriptGenerationResult
          ? `${task.newScriptGenerationResult.createdScripts} скриптов`
          : '-';
      case 'autotesting':
        return task.autotestingResult
          ? `${task.autotestingResult.testCases.length} ТК`
          : '-';
      default:
        return '-';
    }
  };

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedTasks = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return tasks;

    const sorted = [...tasks].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'projectName':
          aValue = a.projectName;
          bValue = b.projectName;
          break;
        case 'owner':
          aValue = a.owner;
          bValue = b.owner;
          break;
        case 'taskType':
          aValue = getTaskTypeLabel(a.taskType);
          bValue = getTaskTypeLabel(b.taskType);
          break;
        case 'startTime':
          aValue = a.startTime;
          bValue = b.startTime;
          break;
        case 'endTime':
          aValue = a.endTime || '';
          bValue = b.endTime || '';
          break;
        case 'result':
          aValue = getTaskResult(a);
          bValue = getTaskResult(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tasks, sortConfig]);

  const getSortIndicator = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : sortConfig.direction === 'desc' ? ' ↓' : '';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка задач...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button className={styles.backLink} onClick={() => navigate(`${PAGE_ENDPOINTS.OUTLET}/planner`)}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <h1>Планировщик</h1>
        <div className={styles.projectInfo}>
          Список всех задач по проектам
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div onClick={() => requestSort('projectName')} style={{ cursor: 'pointer' }}>
              Проект{getSortIndicator('projectName')}
            </div>
            <div onClick={() => requestSort('owner')} style={{ cursor: 'pointer' }}>
              Владелец{getSortIndicator('owner')}
            </div>
            <div onClick={() => requestSort('taskType')} style={{ cursor: 'pointer' }}>
              Тип задачи{getSortIndicator('taskType')}
            </div>
            <div onClick={() => requestSort('result')} style={{ cursor: 'pointer' }}>
              Результат{getSortIndicator('result')}
            </div>
            <div onClick={() => requestSort('startTime')} style={{ cursor: 'pointer' }}>
              Время начала{getSortIndicator('startTime')}
            </div>
            <div onClick={() => requestSort('endTime')} style={{ cursor: 'pointer' }}>
              Время завершения{getSortIndicator('endTime')}
            </div>
            <div></div>
          </div>
          {sortedTasks.map(task => (
            <div key={task.id} className={styles.tableRow}>
              <div>{task.projectName}</div>
              <div>{task.owner}</div>
              <div>{getTaskTypeLabel(task.taskType)}</div>
              <div>{getTaskResult(task)}</div>
              <div>{formatDate(task.startTime)}</div>
              <div>{formatDate(task.endTime)}</div>
              <div>
                <button
                  className={styles.detailsButton}
                  onClick={() => navigate(`${PAGE_ENDPOINTS.OUTLET}/planner/task/${task.id}`)}
                >
                  Подробности
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;