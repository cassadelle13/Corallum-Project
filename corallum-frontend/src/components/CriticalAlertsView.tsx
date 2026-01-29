import React, { useState } from 'react';
import { AlertCircle, BellOff, Settings, Maximize2, X, RefreshCw, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface CriticalAlertsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Alert {
  id: string;
  message: string;
  createdAt: string;
  acked: boolean;
  all: boolean;
}

export const CriticalAlertsView: React.FC<CriticalAlertsViewProps> = ({ isOpen, onClose }) => {
  const [nonAckedOnly, setNonAckedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [alerts] = useState<Alert[]>([]);

  if (!isOpen) return null;

  const filteredAlerts = nonAckedOnly ? alerts.filter(a => !a.acked) : alerts;

  return (
    <div className="critical-alerts-modal-overlay" onClick={onClose}>
      <div className="critical-alerts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Critical Alerts</h2>
          <div className="modal-header-actions">
            <button className="modal-icon-btn" title="Mute notifications">
              <BellOff size={18} />
            </button>
            <button className="modal-icon-btn" title="Settings">
              <Settings size={18} />
            </button>
            <button className="modal-icon-btn" title="Maximize">
              <Maximize2 size={18} />
            </button>
            <button className="modal-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="alerts-controls">
            <div className="alerts-toggle-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={nonAckedOnly}
                  onChange={(e) => setNonAckedOnly(e.target.checked)}
                />
                <span>Non-Acked only</span>
              </label>
            </div>
            <div className="alerts-count">
              <span>{filteredAlerts.length} items</span>
              <button className="refresh-btn">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="alerts-table-container">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Created At</th>
                  <th>
                    <CheckCircle size={14} />
                    Acked
                  </th>
                  <th>
                    <CheckCircle size={14} />
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-alerts">
                      <div className="empty-state">
                        <AlertCircle size={48} />
                        <p><strong>No critical alerts.</strong></p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.message}</td>
                      <td>{alert.createdAt}</td>
                      <td>
                        {alert.acked ? (
                          <CheckCircle size={16} className="checked" />
                        ) : (
                          <div className="unchecked" />
                        )}
                      </td>
                      <td>
                        {alert.all ? (
                          <CheckCircle size={16} className="checked" />
                        ) : (
                          <div className="unchecked" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="alerts-pagination">
            <div className="pagination-info">
              <span>Page: {currentPage}</span>
            </div>
            <div className="pagination-nav">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

