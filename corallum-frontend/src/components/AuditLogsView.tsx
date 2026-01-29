import React, { useState } from 'react';
import { Eye, Info, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLogsViewProps {
  searchQuery?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  operation: string;
  operationType: 'create' | 'update' | 'delete' | 'read';
  resource: string;
  date: string;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [perPage, setPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const auditLogs: AuditLog[] = [
    {
      id: '125484404',
      timestamp: '30.12, 22:54',
      username: 'rusik13022000s@gmail.com',
      operation: 'workspaces.create',
      operationType: 'create',
      resource: 'test',
      date: 'December 30, 2025',
    },
  ];

  const groupedLogs = auditLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'create':
        return '#10b981';
      case 'update':
        return '#3b82f6';
      case 'delete':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="audit-logs-view">
      <div className="view-header">
        <div className="header-title">
          <Eye size={20} />
          <h1>Audit logs</h1>
          <Info size={16} />
        </div>
        <button className="btn-action">
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </div>

      <div className="audit-logs-content">
        <div className="audit-timeline-graph">
          <div className="timeline-header">
            <div className="timeline-label">Time</div>
            <div className="timeline-ticks">
              <span>22:46</span>
              <span>23:30</span>
              <span>00:14</span>
              <span>00:58</span>
              <span>01:42</span>
            </div>
          </div>
          <div className="timeline-canvas">
            <svg width="100%" height="100" viewBox="0 0 800 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <circle cx="150" cy="50" r="4" fill="#10b981" />
              <text x="150" y="40" fill="#10b981" fontSize="10" textAnchor="middle">
                rusik13022000s@gmail.com
              </text>
            </svg>
          </div>
        </div>

        <div className="audit-logs-table-container">
          <div className="audit-logs-table-wrapper">
            <table className="audit-logs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Username</th>
                  <th>Operation</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedLogs).map(([date, logs]) => (
                  <React.Fragment key={date}>
                    <tr className="date-separator">
                      <td colSpan={5}>{date}</td>
                    </tr>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={selectedLog?.id === log.id ? 'selected' : ''}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td>{log.id}</td>
                        <td>{log.timestamp}</td>
                        <td>
                          <div className="username-cell">
                            {log.username}
                            <button className="filter-icon-btn">
                              <Filter size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="operation-cell">
                            <span
                              className="operation-badge"
                              style={{ backgroundColor: getOperationColor(log.operationType) }}
                            >
                              {log.operationType.charAt(0).toUpperCase() + log.operationType.slice(1)}
                            </span>
                            <span className="operation-text">{log.operation}</span>
                          </div>
                        </td>
                        <td>
                          <div className="resource-cell">
                            {log.resource}
                            <button className="filter-icon-btn">
                              <Filter size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit-log-details">
            {selectedLog ? (
              <div className="log-details-panel">
                <h3>Log Details</h3>
                <div className="detail-item">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedLog.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Timestamp:</span>
                  <span className="detail-value">{selectedLog.timestamp}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{selectedLog.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Operation:</span>
                  <span className="detail-value">{selectedLog.operation}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Resource:</span>
                  <span className="detail-value">{selectedLog.resource}</span>
                </div>
              </div>
            ) : (
              <div className="no-log-selected">
                <p>No log selected</p>
              </div>
            )}
          </div>
        </div>

        <div className="audit-logs-pagination">
          <div className="pagination-controls">
            <span>Per page:</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="pagination-select"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <div className="pagination-nav">
            <button className="pagination-btn" disabled={currentPage === 1}>
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="pagination-info">Page {currentPage}</span>
            <button className="pagination-btn">
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

