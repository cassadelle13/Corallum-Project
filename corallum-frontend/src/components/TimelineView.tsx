import { useMemo } from 'react';
import * as React from 'react';
import type { Run } from '../store/flowStore';

interface TimelineViewProps {
  runs: Run[];
  viewMode: 'compact' | 'detailed' | 'gantt';
  timeRange?: { start: number; end: number };
  height?: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  runs, 
  viewMode, 
  timeRange,
  height = 200 
}) => {
  const now = Date.now();
  const defaultTimeRange = timeRange || {
    start: now - 5 * 60 * 1000, // 5 minutes ago
    end: now
  };

  const timeSpan = defaultTimeRange.end - defaultTimeRange.start;
  const pixelsPerMs = 1000 / timeSpan; // 1000px width for the time span

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  // Generate time ticks for X-axis
  const timeTicks = useMemo(() => {
    const ticks: number[] = [];
    const tickInterval = timeSpan / 6; // 6 ticks
    for (let i = 0; i <= 6; i++) {
      ticks.push(defaultTimeRange.start + i * tickInterval);
    }
    return ticks;
  }, [defaultTimeRange.start, timeSpan]);

  // Filter runs within time range
  const visibleRuns = useMemo(() => {
    return runs.filter(run => 
      run.started >= defaultTimeRange.start && 
      run.started <= defaultTimeRange.end
    );
  }, [runs, defaultTimeRange]);

  const getStatusColor = (status: Run['status']): string => {
    switch (status) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      case 'running':
        return '#f59e0b'; // yellow
      default:
        return '#64748b'; // gray
    }
  };

  const getRunPosition = (run: Run) => {
    const x = ((run.started - defaultTimeRange.start) / timeSpan) * 1000;
    const width = (run.duration / timeSpan) * 1000;
    return { x, width };
  };

  if (viewMode === 'compact') {
    return (
      <div className="timeline-view compact" style={{ height: `${height}px` }}>
        <div className="timeline-container">
          <div className="timeline-axis-y">
            <span className="axis-label">job duration (ms)</span>
            <div className="axis-ticks">
              <span>1.00</span>
              <span>4.00</span>
              <span>10.00</span>
            </div>
          </div>
          <div className="timeline-content">
            <div className="timeline-axis-x">
              {timeTicks.map((tick, i) => (
                <div key={i} className="time-tick" style={{ left: `${(i / 6) * 100}%` }}>
                  {formatTime(tick)}
                </div>
              ))}
            </div>
            <div className="timeline-chart">
              {visibleRuns.length === 0 ? (
                <div className="timeline-empty">
                  <div className="empty-line" />
                </div>
              ) : (
                visibleRuns.map((run) => {
                  const { x, width } = getRunPosition(run);
                  return (
                    <div
                      key={run.id}
                      className="timeline-bar compact"
                      style={{
                        left: `${x}px`,
                        width: `${Math.max(width, 2)}px`,
                        backgroundColor: getStatusColor(run.status),
                        height: `${Math.min(run.duration / 10, height - 40)}px`,
                        bottom: '0px'
                      }}
                      title={`${run.path} - ${formatDuration(run.duration)}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'detailed') {
    return (
      <div className="timeline-view detailed" style={{ height: `${height}px` }}>
        <div className="timeline-container">
          <div className="timeline-axis-y">
            <span className="axis-label">job duration (ms)</span>
            <div className="axis-ticks">
              <span>1.00</span>
              <span>4.00</span>
              <span>10.00</span>
            </div>
          </div>
          <div className="timeline-content">
            <div className="timeline-axis-x">
              {timeTicks.map((tick, i) => (
                <div key={i} className="time-tick" style={{ left: `${(i / 6) * 100}%` }}>
                  {formatTime(tick)}
                </div>
              ))}
            </div>
            <div className="timeline-chart">
              {visibleRuns.length === 0 ? (
                <div className="timeline-empty">
                  <div className="empty-line" />
                </div>
              ) : (
                visibleRuns.map((run) => {
                  const { x, width } = getRunPosition(run);
                  return (
                    <div
                      key={run.id}
                      className="timeline-bar detailed"
                      style={{
                        left: `${x}px`,
                        width: `${Math.max(width, 4)}px`,
                        backgroundColor: getStatusColor(run.status),
                        height: `${Math.min(run.duration / 10, height - 60)}px`,
                        bottom: '0px'
                      }}
                      title={`${run.path} - ${formatDuration(run.duration)} - ${run.status}`}
                    >
                      <div className="bar-label">{formatDuration(run.duration)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gantt view
  return (
    <div className="timeline-view gantt" style={{ height: `${Math.max(visibleRuns.length * 40, height)}px` }}>
      <div className="timeline-container">
        <div className="timeline-content">
          <div className="timeline-axis-x">
            {timeTicks.map((tick, i) => (
              <div key={i} className="time-tick" style={{ left: `${(i / 6) * 100}%` }}>
                {formatTime(tick)}
              </div>
            ))}
          </div>
          <div className="gantt-chart">
            {visibleRuns.length === 0 ? (
              <div className="timeline-empty">
                <p>No runs in this time range</p>
              </div>
            ) : (
              visibleRuns.map((run, index) => {
                const { x, width } = getRunPosition(run);
                return (
                  <div key={run.id} className="gantt-row" style={{ top: `${index * 40}px` }}>
                    <div className="gantt-label">{run.path}</div>
                    <div className="gantt-bar-container">
                      <div
                        className="gantt-bar"
                        style={{
                          left: `${x}px`,
                          width: `${Math.max(width, 4)}px`,
                          backgroundColor: getStatusColor(run.status)
                        }}
                        title={`${run.path} - ${formatDuration(run.duration)} - ${run.status}`}
                      >
                        <span className="gantt-bar-text">{formatDuration(run.duration)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



