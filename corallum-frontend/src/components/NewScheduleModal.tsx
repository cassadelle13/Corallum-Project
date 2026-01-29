import React, { useState } from 'react';
import { X, Info, User, Folder, Clock, Percent, Code, Workflow, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState('');
  const [pathType, setPathType] = useState<'user' | 'folder'>('user');
  const [pathSegments, setPathSegments] = useState(['ruru', 'swift_schedule']);
  const [description, setDescription] = useState('');
  const [cron, setCron] = useState('0 0 12 * *');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [pauseSchedule, setPauseSchedule] = useState(false);
  const [runnableType, setRunnableType] = useState<'script' | 'flow'>('script');
  const [noOverlap, setNoOverlap] = useState(false);
  const [scriptArgs, setScriptArgs] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState('error-handler');
  const [muteWorkspaceErrorHandler, setMuteWorkspaceErrorHandler] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState<'slack' | 'teams' | 'email' | 'custom'>('slack');
  const [failureThreshold, setFailureThreshold] = useState(1);

  const upcomingEvents = [
    'Wed, 31 Dec 2025, 12:00:00 GMT+3',
    'Thu, 01 Jan 2026, 12:00:00 GMT+3',
    'Fri, 02 Jan 2026, 12:00:00 GMT+3',
    'Sat, 03 Jan 2026, 12:00:00 GMT+3',
    'Sun, 04 Jan 2026, 12:00:00 GMT+3',
  ];

  const handleSave = () => {
    alert('Schedule saved!');
    onClose();
  };

  if (!isOpen) return null;

  const fullPath = pathType === 'user' 
    ? `u/${pathSegments.join('/')}` 
    : `f/${pathSegments.join('/')}`;

  return (
    <div className="new-schedule-modal-overlay" onClick={onClose}>
      <div className="new-schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="new-schedule-header">
          <div className="new-schedule-title">
            <h2>New schedule</h2>
          </div>
          <div className="new-schedule-header-actions">
            <button className="btn-action primary" onClick={handleSave}>
              Save
            </button>
            <button className="modal-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="new-schedule-content">
          {/* Metadata Section */}
          <div className="schedule-section">
            <h3 className="schedule-section-title">Metadata</h3>
            
            <div className="form-field">
              <label>Summary</label>
              <input
                type="text"
                className="form-input"
                placeholder="Short summary to be displayed when listed."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Path</label>
              <div className="path-toggle-group">
                <button
                  className={`path-toggle-btn ${pathType === 'user' ? 'active' : ''}`}
                  onClick={() => setPathType('user')}
                >
                  <User size={14} />
                  <span>User</span>
                </button>
                <button
                  className={`path-toggle-btn ${pathType === 'folder' ? 'active' : ''}`}
                  onClick={() => setPathType('folder')}
                >
                  <Folder size={14} />
                  <span>Folder</span>
                </button>
              </div>
              <div className="path-segments">
                <span className="path-separator">/</span>
                {pathSegments.map((segment, index) => (
                  <React.Fragment key={index}>
                    <span className="path-segment">{segment}</span>
                    {index < pathSegments.length - 1 && <span className="path-separator">/</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="form-field">
                <label>Full path</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullPath}
                  readOnly
                />
              </div>
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                className="form-textarea"
                placeholder="What this schedule does and how to use it."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="schedule-section">
            <h3 className="schedule-section-title">Schedule</h3>
            
            <div className="form-field">
              <label>Cron</label>
              <div className="cron-input-group">
                <input
                  type="text"
                  className="form-input"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                />
                <button className="btn-secondary small">
                  <Clock size={14} />
                  <span>Cron builder</span>
                </button>
                <button className="btn-secondary small">
                  <Percent size={14} />
                  <span>Croner</span>
                </button>
              </div>
            </div>

            <div className="form-field">
              <label>Timezone</label>
              <input
                type="text"
                className="form-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <div className="form-field">
              <div className="toggle-item">
                <div className="toggle-item-content">
                  <span>Pause schedule until...</span>
                  <Info size={14} />
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={pauseSchedule}
                    onChange={(e) => setPauseSchedule(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="form-field">
              <label>Estimated upcoming events ({timezone}):</label>
              <div className="upcoming-events">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="event-item">{event}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Runnable Section */}
          <div className="schedule-section">
            <h3 className="schedule-section-title">Runnable</h3>
            
            <div className="form-field">
              <label>Pick a script or flow to be triggered by the schedule*</label>
              <div className="runnable-toggle-group">
                <button
                  className={`runnable-toggle-btn ${runnableType === 'script' ? 'active' : ''}`}
                  onClick={() => setRunnableType('script')}
                >
                  <Code size={14} />
                  <span>Script</span>
                </button>
                <button
                  className={`runnable-toggle-btn ${runnableType === 'flow' ? 'active' : ''}`}
                  onClick={() => setRunnableType('flow')}
                >
                  <Workflow size={14} />
                  <span>Flow</span>
                </button>
              </div>
              <div className="script-picker-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pick a script"
                />
                <button className="icon-btn">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="form-field">
              <div className="toggle-item">
                <div className="toggle-item-content">
                  <span>no overlap</span>
                  <Info size={14} />
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={noOverlap}
                    onChange={(e) => setNoOverlap(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="form-field">
              <label>Pick a script and fill its argument here</label>
              <textarea
                className="form-textarea"
                value={scriptArgs}
                onChange={(e) => setScriptArgs(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          {/* Advanced Section */}
          <div className="schedule-section collapsible">
            <button 
              className="schedule-section-header-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h3 className="schedule-section-title">Advanced</h3>
              {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {showAdvanced && (
              <div className="advanced-content">
                <div className="advanced-tabs">
                  {['error-handler', 'recovery-handler', 'success-handler', 'retries', 'dynamic-skip', 'custom-tag'].map((tab) => (
                    <button
                      key={tab}
                      className={`advanced-tab ${advancedTab === tab ? 'active' : ''}`}
                      onClick={() => setAdvancedTab(tab)}
                    >
                      {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>

                {advancedTab === 'error-handler' && (
                  <div className="advanced-tab-content">
                    <h4 className="advanced-subtitle">Error handler</h4>
                    
                    <div className="form-field">
                      <div className="toggle-item">
                        <span>Mute workspace error handler for this schedule</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={muteWorkspaceErrorHandler}
                            onChange={(e) => setMuteWorkspaceErrorHandler(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Notification method</label>
                      <div className="notification-buttons">
                        {['slack', 'teams', 'email', 'custom'].map((method) => (
                          <button
                            key={method}
                            className={`notification-btn ${notificationMethod === method ? 'active' : ''}`}
                            onClick={() => setNotificationMethod(method as any)}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {notificationMethod === 'slack' && (
                      <div className="alert-warning">
                        <AlertCircle size={16} />
                        <div>
                          <span>Workspace not connected to Slack.</span>
                          <button className="link-btn">Open workspace slack settings</button>
                        </div>
                      </div>
                    )}

                    <div className="form-field">
                      <label>Triggered when schedule failed</label>
                      <div className="threshold-input-group">
                        <select className="form-select small">
                          <option>&gt;=</option>
                          <option>&lt;=</option>
                          <option>==</option>
                        </select>
                        <input
                          type="number"
                          className="form-input small"
                          value={failureThreshold}
                          onChange={(e) => setFailureThreshold(Number(e.target.value))}
                        />
                        <span>time</span>
                      </div>
                    </div>

                    <div className="form-field">
                      <button className="btn-secondary">Set as default</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

