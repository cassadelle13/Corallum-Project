import React, { useState, useMemo, useEffect } from 'react';
import {
  Info,
  Calendar,
  ChevronDown,
  RefreshCw,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Filter
} from 'lucide-react';
import { TimelineView } from './TimelineView';
import { useFlowStore } from '../store/flowStore';
import { apiService } from '../services/api';
import type { Run } from '../store/flowStore';

interface RunsViewProps {
  searchQuery?: string;
}

export const RunsView: React.FC<RunsViewProps> = () => {
  const { getRuns } = useFlowStore();
  const allRuns = getRuns();

  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<'admins' | 'all'>('admins');
  const [filterBy, setFilterBy] = useState<'path' | 'user' | 'folder'>('path');
  const [kindFilter, setKindFilter] = useState<'all' | 'run' | 'dep'>('run');
  const [statusFilter, setStatusFilter] = useState<'all' | Run['status']>('all');
  const [timelineView, setTimelineView] = useState<'duration' | 'concurrency'>('duration');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'gantt'>('compact');
  const [showSchedules, setShowSchedules] = useState(true);
  const [showPlannedLater, setShowPlannedLater] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pathFilter, setPathFilter] = useState('');

  // Загружаем executions из API
  useEffect(() => {
    const loadExecutions = async () => {
      try {
        setLoading(true);
        const executionData = await apiService.listExecutions();
        setExecutions(executionData);
      } catch (error) {
        console.error('Failed to load executions:', error);
        // Используем мок-данные при ошибке
        setExecutions(allRuns);
      } finally {
        setLoading(false);
      }
    };

    loadExecutions();
  }, [allRuns]);

  // Filter runs based on current filters
  const filteredRuns = useMemo(() => {
    let filtered = [...executions];

    if (kindFilter !== 'all') {
      filtered = filtered.filter(run => run.kind === kindFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    if (pathFilter) {
      filtered = filtered.filter(run => 
        run.path.toLowerCase().includes(pathFilter.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.started - a.started);
  }, [allRuns, kindFilter, statusFilter, pathFilter]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getStatusIcon = (status: Run['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'running':
        return <PlayCircle size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const executionData = await apiService.listExecutions();
      setExecutions(executionData);
    } catch (error) {
      console.error('Failed to refresh executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await apiService.cancelExecution(executionId);
      // Обновляем список после отмены
      handleRefresh();
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      alert('Failed to cancel execution');
    }
  };

  return (
    <div className="runs-view">
      <div className="runs-header">
        <div className="runs-title-section">
          <h1>Runs</h1>
          <button className="info-icon-btn" title="Information">
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="runs-filters">
        <div className="filter-row">
          <div className="date-filters">
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="text"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="text"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="workspace-filters">
            <button
              className={`workspace-btn ${activeWorkspace === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveWorkspace('admins')}
            >
              Admins
            </button>
            <button
              className={`workspace-btn ${activeWorkspace === 'all' ? 'active' : ''}`}
              onClick={() => setActiveWorkspace('all')}
            >
              All
            </button>
          </div>

          <div className="filter-by-group">
            <span className="filter-label">Filter by:</span>
            <button
              className={`filter-btn ${filterBy === 'path' ? 'active' : ''}`}
              onClick={() => setFilterBy('path')}
            >
              Path
            </button>
            <button
              className={`filter-btn ${filterBy === 'user' ? 'active' : ''}`}
              onClick={() => setFilterBy('user')}
            >
              User
            </button>
            <button
              className={`filter-btn ${filterBy === 'folder' ? 'active' : ''}`}
              onClick={() => setFilterBy('folder')}
            >
              Folder
            </button>
            <button className="filter-btn">
              <MoreVertical size={14} />
            </button>
          </div>

          {filterBy === 'path' && (
            <div className="path-input">
              <input
                type="text"
                placeholder="Please select"
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
              />
              <ChevronDown size={16} />
            </div>
          )}

          <div className="kind-filters">
            <button
              className={`kind-btn ${kindFilter === 'all' ? 'active' : ''}`}
              onClick={() => setKindFilter('all')}
            >
              All
            </button>
            <button
              className={`kind-btn ${kindFilter === 'run' ? 'active' : ''}`}
              onClick={() => setKindFilter('run')}
            >
              Runs
              <Info size={12} />
            </button>
            <button
              className={`kind-btn ${kindFilter === 'dep' ? 'active' : ''}`}
              onClick={() => setKindFilter('dep')}
            >
              Deps
              <Info size={12} />
            </button>
            <button className="kind-btn">
              <MoreVertical size={14} />
            </button>
          </div>

          <div className="status-filters">
            <button
              className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`status-btn ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => setStatusFilter('success')}
              title="Success"
            >
              <CheckCircle size={16} />
            </button>
            <button
              className={`status-btn ${statusFilter === 'error' ? 'active' : ''}`}
              onClick={() => setStatusFilter('error')}
              title="Error"
            >
              <AlertCircle size={16} />
            </button>
            <button
              className={`status-btn ${statusFilter === 'running' ? 'active' : ''}`}
              onClick={() => setStatusFilter('running')}
              title="Running"
            >
              <PlayCircle size={16} />
            </button>
            <button
              className={`status-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
              title="Pending"
            >
              <Clock size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="runs-timeline-section">
        <div className="timeline-header">
          <div className="timeline-tabs">
            <button
              className={`timeline-tab ${timelineView === 'duration' ? 'active' : ''}`}
              onClick={() => setTimelineView('duration')}
            >
              Duration
            </button>
            <button
              className={`timeline-tab ${timelineView === 'concurrency' ? 'active' : ''}`}
              onClick={() => setTimelineView('concurrency')}
            >
              Concurrency
            </button>
          </div>
          <div className="timeline-controls">
            <button className="load-more-btn">
              Load more
              <Info size={12} />
            </button>
            <select
              className="view-mode-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'compact' | 'detailed' | 'gantt')}
            >
              <option value="compact">Compact</option>
              <option value="detailed">Detailed</option>
              <option value="gantt">Gantt</option>
            </select>
          </div>
        </div>
        <div className="timeline-wrapper glass-panel">
          <TimelineView
            runs={filteredRuns}
            viewMode={viewMode}
            height={200}
          />
        </div>
      </div>

      <div className="runs-table-controls">
        <button className="batch-actions-btn">
          Batch actions
          <ChevronDown size={16} />
        </button>
        <div className="table-toggles">
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showSchedules}
              onChange={(e) => setShowSchedules(e.target.checked)}
            />
            <Calendar size={14} />
            <span>Schedules</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showPlannedLater}
              onChange={(e) => setShowPlannedLater(e.target.checked)}
            />
            <Clock size={14} />
            <span>Planned later</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh</span>
          </label>
        </div>
        <div className="runs-dropdown">
          <select className="runs-select">
            <option>Last 1000 runs</option>
            <option>Last 500 runs</option>
            <option>Last 100 runs</option>
          </select>
          <button className="refresh-btn" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="runs-table-container glass-panel">
        <table className="runs-table">
          <thead>
            <tr>
              <th>bs</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Path</th>
              <th>Triggered by</th>
              <th>Tag</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  Loading executions...
                </td>
              </tr>
            ) : filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  No jobs found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => (
                <tr key={run.id}>
                  <td>{getStatusIcon(run.status)}</td>
                  <td>{formatDate(run.started)}</td>
                  <td>{formatDuration(run.duration)}</td>
                  <td>{run.path}</td>
                  <td>{run.triggeredBy}</td>
                  <td>{run.tag || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="runs-footer">
        <span className="footer-path">localhost:8000/runs</span>
        <span className="footer-pagination">Per page: 1000</span>
      </div>
    </div>
  );
};


