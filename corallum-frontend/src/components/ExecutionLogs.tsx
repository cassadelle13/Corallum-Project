import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Clock,
  Trash2,
  ChevronDown,
  Filter,
  Download
} from 'lucide-react';
import { useFlowStore } from '../store/flowStore';

interface ExecutionLogsProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ExecutionLogs: React.FC<ExecutionLogsProps> = ({ isOpen, onToggle }) => {
  const { executionLogs, clearExecutionLogs, nodes } = useFlowStore();
  const [filter, setFilter] = useState<'all' | 'running' | 'success' | 'error'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionLogs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader className="status-icon running" size={16} />;
      case 'success':
        return <CheckCircle className="status-icon success" size={16} />;
      case 'error':
        return <XCircle className="status-icon error" size={16} />;
      case 'pending':
        return <Clock className="status-icon pending" size={16} />;
      default:
        return <Clock className="status-icon" size={16} />;
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const filteredLogs = executionLogs.filter(log => 
    filter === 'all' || log.status === filter
  );

  const handleExportLogs = () => {
    const logsText = executionLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] [${log.status.toUpperCase()}] ${getNodeLabel(log.nodeId)}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusCount = (status: string) => {
    return executionLogs.filter(log => log.status === status).length;
  };

  return (
    <>
      {!isOpen && (
        <button 
          className="execution-logs-button-collapsed"
          onClick={onToggle}
          title="Execution Logs"
        >
          <span className="logs-button-text">&gt;_</span>
        </button>
      )}
      <div className={`execution-logs-panel glass-panel ${isOpen ? 'open' : 'closed'}`}>
        <div className="logs-header" onClick={onToggle}>
          <div className="logs-title">
            <Terminal size={18} />
            <h3>Execution Logs</h3>
            {executionLogs.length > 0 && (
              <span className="logs-count">{executionLogs.length}</span>
            )}
          </div>
          <div className="logs-actions">
            <div className="status-summary">
              <span className="status-badge running">
                <Loader size={12} />
                {getStatusCount('running')}
              </span>
              <span className="status-badge success">
                <CheckCircle size={12} />
                {getStatusCount('success')}
              </span>
              <span className="status-badge error">
                <XCircle size={12} />
                {getStatusCount('error')}
              </span>
            </div>
            <button 
              className="logs-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleExportLogs();
              }}
              title="Export logs"
            >
              <Download size={16} />
            </button>
            <button 
              className="logs-btn"
              onClick={(e) => {
                e.stopPropagation();
                clearExecutionLogs();
              }}
              title="Clear logs"
            >
              <Trash2 size={16} />
            </button>
            <button 
              className="logs-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        <div className="logs-filters">
          <div className="filter-group">
            <Filter size={14} />
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'running' ? 'active' : ''}`}
              onClick={() => setFilter('running')}
            >
              Running
            </button>
            <button
              className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
              onClick={() => setFilter('success')}
            >
              Success
            </button>
            <button
              className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              Error
            </button>
          </div>
        </div>

        <div className="logs-content">
          {filteredLogs.length === 0 ? (
            <div className="logs-empty">
              <Terminal size={48} />
              <p>No execution logs yet</p>
              <span>Run your workflow to see logs here</span>
            </div>
          ) : (
            <div className="logs-list">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`log-entry ${log.status}`}>
                  <div className="log-status">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className="log-node">{String(getNodeLabel(log.nodeId))}</span>
                      <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div className="log-message">{log.message}</div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
