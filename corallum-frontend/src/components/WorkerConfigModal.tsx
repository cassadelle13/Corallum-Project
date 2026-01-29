import React, { useState } from 'react';
import { X, Info, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';

interface WorkerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerGroupName: string;
}

export const WorkerConfigModal: React.FC<WorkerConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  workerGroupName 
}) => {
  const [workersAssignment, setWorkersAssignment] = useState<'any' | 'dedicated'>('any');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(25);
  const [autoscalingEnabled, setAutoscalingEnabled] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['worker-scripts'])
  );

  const allTags = [
    'deno', 'python3', 'go', 'bash', 'powershell', 'dependency', 'flow', 'hub', 
    'other', 'bun', 'php', 'nativets', 'postgresql', 'mysql', 'graphql', 
    'snowflake', 'mssql', 'bigquery', 'rust', 'ansible', 'csharp', 'oracledb', 
    'nu', 'java', 'duckdb', 'ruby'
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="worker-config-modal-overlay" onClick={onClose}>
      <div className="worker-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="worker-config-header">
          <div className="worker-config-title">
            <h2>Worker config '{workerGroupName}'</h2>
          </div>
          <div className="worker-config-header-right">
            <span className="read-only-badge">Read only</span>
            <button className="modal-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="read-only-banner">
          <Info size={16} />
          <span>Read-only mode. Only superadmin or devops role can edit the worker config.</span>
        </div>

        <div className="worker-config-content">
          <div className="config-section">
            <h3 className="config-section-title">Workers assignment</h3>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="workers-assignment"
                  value="any"
                  checked={workersAssignment === 'any'}
                  onChange={() => setWorkersAssignment('any')}
                />
                <span>Any jobs within worker tags</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="workers-assignment"
                  value="dedicated"
                  checked={workersAssignment === 'dedicated'}
                  onChange={() => setWorkersAssignment('dedicated')}
                />
                <span>Dedicated to a script/flow</span>
              </label>
            </div>
          </div>

          <div className="config-section">
            <div className="config-section-header">
              <h3 className="config-section-title">Tags to listen to</h3>
              <div className="config-section-actions">
                <button className="btn-secondary small">Reset to all tags</button>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="tags-grid">
              {allTags.map(tag => (
                <button key={tag} className="tag-button">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <div className="config-section-header">
              <h3 className="config-section-title">
                High-priority tags
                <Info size={14} />
              </h3>
            </div>
            <input
              type="text"
              className="config-input"
              placeholder="Select items"
            />
          </div>

          <div className="config-section">
            <div className="config-section-header">
              <h3 className="config-section-title">
                Alerts
                <Info size={14} />
              </h3>
            </div>
            <div className="toggle-item">
              <span>Send an alert when the number of alive workers falls below a given threshold</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {alertsEnabled && (
              <div className="alert-threshold">
                <span>Triggered when number of workers in group is lower than</span>
                <input
                  type="number"
                  className="config-input small"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="config-section collapsible">
            <button 
              className="config-section-header-btn"
              onClick={() => toggleSection('env-vars')}
            >
              <h3 className="config-section-title">
                Environment variables passed to jobs
                <Info size={14} />
              </h3>
              {expandedSections.has('env-vars') ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedSections.has('env-vars') && (
              <div className="config-section-content">
                {/* Environment variables content */}
              </div>
            )}
          </div>

          <div className="config-section collapsible">
            <button 
              className="config-section-header-btn"
              onClick={() => toggleSection('autoscaling')}
            >
              <h3 className="config-section-title">
                Autoscaling
                <span className="beta-badge">Beta</span>
              </h3>
              {expandedSections.has('autoscaling') ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedSections.has('autoscaling') && (
              <div className="config-section-content">
                <div className="toggle-item">
                  <span>Enabled</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={autoscalingEnabled}
                      onChange={(e) => setAutoscalingEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="config-section collapsible">
            <button 
              className="config-section-header-btn"
              onClick={() => toggleSection('python-deps')}
            >
              <h3 className="config-section-title">Python dependencies overrides</h3>
              {expandedSections.has('python-deps') ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedSections.has('python-deps') && (
              <div className="config-section-content">
                {/* Python dependencies content */}
              </div>
            )}
          </div>

          <div className="config-section collapsible">
            <button 
              className="config-section-header-btn"
              onClick={() => toggleSection('worker-scripts')}
            >
              <h3 className="config-section-title">
                Worker scripts
                <Info size={14} />
              </h3>
              {expandedSections.has('worker-scripts') ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedSections.has('worker-scripts') && (
              <div className="config-section-content">
                <p className="config-description">
                  Run at start of the workers. More lightweight than requiring custom worker images.
                </p>
                <button className="config-link">
                  Init script
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

