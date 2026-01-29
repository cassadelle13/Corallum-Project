import React, { useState } from 'react';
import { List, Search, Calendar, RefreshCw, Eye, Info } from 'lucide-react';

interface LogsViewProps {
  searchQuery?: string;
}

export const LogsView: React.FC<LogsViewProps> = () => {
  const [activeLogType, setActiveLogType] = useState('service');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  const logTypes = [
    { id: 'audit', label: 'Audit logs', icon: Eye },
    { id: 'service', label: 'Service logs', icon: List },
  ];

  const services = [
    { id: 'default', name: 'default', host: '...olyakova', activity: [20, 40, 30, 50, 60] },
  ];

  const ActiveIcon = logTypes.find(t => t.id === activeLogType)?.icon || List;

  return (
    <div className="logs-view">
      <div className="view-header">
        <div className="header-title">
          <ActiveIcon size={20} />
          <h1>{logTypes.find(t => t.id === activeLogType)?.label || 'Logs'}</h1>
          <Info size={16} />
        </div>
      </div>

      <div className="logs-content">
        <div className="logs-sidebar">
          <div className="log-type-selector">
            {logTypes.map(type => {
              const TypeIcon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`log-type-btn ${activeLogType === type.id ? 'active' : ''}`}
                  onClick={() => setActiveLogType(type.id)}
                >
                  <TypeIcon size={16} />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {activeLogType === 'service' && (
            <>
              <div className="logs-filters">
                <div className="search-bar glass-panel">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>min datetime</label>
                  <div className="date-input glass-panel">
                    <Calendar size={14} />
                    <span>29.12, 08:28</span>
                  </div>
                </div>

                <div className="filter-group">
                  <label>Last 1000 logfiles</label>
                  <div className="select-input glass-panel">
                    <span>1000</span>
                    <RefreshCw size={14} />
                  </div>
                </div>

                <div className="filter-group">
                  <label>max datetime</label>
                  <div className="date-input glass-panel">
                    <Calendar size={14} />
                    <span>29.12, 08:37</span>
                  </div>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <span>auto-refresh</span>
                  </label>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={errorsOnly}
                      onChange={(e) => setErrorsOnly(e.target.checked)}
                    />
                    <span>errors &gt; 0</span>
                  </label>
                </div>
              </div>

              <div className="service-selector">
                <label>Select a service</label>
                <div className="service-list">
                  <div className="service-category">
                    <strong>standalones</strong>
                    {services.map(service => (
                      <div
                        key={service.id}
                        className={`service-item ${selectedService === service.id ? 'active' : ''}`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <span>{service.name}</span>
                        <div className="activity-bars">
                          {service.activity.map((height, idx) => (
                            <div key={idx} className="activity-bar" style={{ height: `${height}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="logs-display">
          {selectedService ? (
            <div className="log-content">
              <div className="log-viewer">
                <pre className="log-text">
                  {`[2024-12-29 08:28:00] INFO: Service started
[2024-12-29 08:28:15] INFO: Worker connected
[2024-12-29 08:30:00] INFO: Processing jobs...
[2024-12-29 08:35:00] INFO: Job completed successfully`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <List size={48} />
              <p><strong>Select a host to see its logs</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

