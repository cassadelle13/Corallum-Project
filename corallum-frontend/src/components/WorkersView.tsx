import React, { useState } from 'react';
import { Cpu, Info, Search, Settings, RefreshCw } from 'lucide-react';
import { WorkerConfigModal } from './WorkerConfigModal';

interface WorkersViewProps {
  searchQuery?: string;
}

interface Worker {
  id: string;
  host: string;
  ip: string;
  startTime: string;
  jobsRan: number;
  memory: { total: string; windmill: string };
  limits: { host: string; worker: string };
  version: string;
  status: string;
  isAlive: boolean;
}

export const WorkersView: React.FC<WorkersViewProps> = () => {
  const [activeGroup, setActiveGroup] = useState('default');
  const [localSearch, setLocalSearch] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const workerGroups = [
    { id: 'default', label: 'default 50 workers', count: 50, memory: '100.00 GB' },
    { id: 'reports', label: 'reports 1 worker', count: 1, memory: '2.00 GB' },
    { id: 'test', label: 'test 1 worker', count: 1, memory: '2.00 GB' },
  ];

  const getTagsForGroup = (groupId: string) => {
    if (groupId === 'default') {
      return ['deno', 'python3', 'go', 'bash', 'powershell', 'dependency', 'flow', 'hub', 'other', 'bun', 'csharp', 'oracledb', 'nu', 'java', 'duckdb', '+1'];
    } else if (groupId === 'reports') {
      return ['deno', 'python3', 'go', 'bash', 'powershell', 'dependency', 'flow', 'hub', 'other', 'bun', 'chromium'];
    } else if (groupId === 'test') {
      return ['test'];
    }
    return [];
  };

  const getWorkersForGroup = (groupId: string): Worker[] => {
    if (groupId === 'default') {
      return [
        {
          id: 'wk-default-22qxr-HOq9U',
          host: 'windmill-workers-default-68cf957d9b-22qxr',
          ip: '54.227.220.13',
          startTime: '27.12, 20:53',
          jobsRan: 6129,
          memory: { total: '1182MB', windmill: '52MB' },
          limits: { host: '--', worker: '2048MB' },
          version: 'v1.601.1',
          status: 'Alive 1s ago',
          isAlive: true,
        },
        {
          id: 'wk-default-2srts-73vdH',
          host: 'windmill-workers-default-68cf957d9b-2srts',
          ip: '54.227.220.13',
          startTime: '27.12, 20:52',
          jobsRan: 6220,
          memory: { total: '1182MB', windmill: '52MB' },
          limits: { host: '--', worker: '2048MB' },
          version: 'v1.601.1',
          status: 'Alive 2s ago',
          isAlive: true,
        },
      ];
    } else if (groupId === 'reports') {
      return [
        {
          id: 'wk-reports-d7ctn-09X9x',
          host: 'windmill-workers-reports-68c45fdd8d-d7ctn',
          ip: '34.233.201.5',
          startTime: '27.12, 20:47',
          jobsRan: 4880,
          memory: { total: '1182MB', windmill: '52MB' },
          limits: { host: '--', worker: '2048MB' },
          version: 'v1.601.1',
          status: 'Alive 1s ago',
          isAlive: true,
        },
      ];
    } else if (groupId === 'test') {
      return [
        {
          id: 'wk-test-d8xlj-9TUJj',
          host: 'windmill-workers-test-6d5c57ff4d-d8xlj',
          ip: '34.233.201.5',
          startTime: '27.12, 20:47',
          jobsRan: 7,
          memory: { total: '72MB', windmill: '33MB' },
          limits: { host: '--', worker: '2048MB' },
          version: 'v1.601.1',
          status: 'Alive 3s ago',
          isAlive: true,
        },
      ];
    }
    return [];
  };

  const activeGroupData = workerGroups.find(g => g.id === activeGroup);
  const workers = getWorkersForGroup(activeGroup);
  const tags = getTagsForGroup(activeGroup);

  const filteredWorkers = workers.filter(worker =>
    worker.host.toLowerCase().includes(localSearch.toLowerCase()) ||
    worker.id.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="workers-view">
      <div className="view-header">
        <div className="header-title">
          <Cpu size={20} />
          <h1>Workers</h1>
          <Info size={16} />
        </div>
      </div>

      <div className="workers-content">
        <div className="worker-group-tabs">
          {workerGroups.map(group => (
            <button
              key={group.id}
              className={`group-tab ${activeGroup === group.id ? 'active' : ''}`}
              onClick={() => setActiveGroup(group.id)}
            >
              {group.label}
            </button>
          ))}
        </div>

        {activeGroupData && (
          <div className="worker-group-details">
            <div className="group-header">
              <div className="group-info">
                <span>
                  Worker group: <strong>{activeGroupData.id}</strong> - {activeGroupData.count} worker{activeGroupData.count !== 1 ? 's' : ''}
                </span>
                <Info size={14} />
                <span className="group-memory">- {activeGroupData.memory}</span>
              </div>
              <button 
                className="btn-action primary"
                onClick={() => setShowConfigModal(true)}
              >
                <Settings size={14} />
                <span>See config</span>
              </button>
            </div>

            <div className="worker-tags">
              <span className="tags-label">Tags:</span>
              {tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="active-workers-section">
              <div className="section-header">
                <h4>Active workers</h4>
                <div className="search-bar glass-panel">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder={`Search workers in group '${activeGroupData.id}'`}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="workers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Worker</th>
                      <th>Worker start</th>
                      <th>Jobs ran</th>
                      <th>Memory usage (Windmill)</th>
                      <th>Limits</th>
                      <th>Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map(worker => (
                      <tr key={worker.id}>
                        <td>
                          <div className="worker-info">
                            <div className="worker-host">Host: {worker.host}</div>
                            <div className="worker-ip">IP: {worker.ip}</div>
                            <div className="worker-id">{worker.id}</div>
                          </div>
                        </td>
                        <td>{worker.startTime}</td>
                        <td>{worker.jobsRan}</td>
                        <td>
                          <div>{worker.memory.total}</div>
                          <div className="memory-detail">({worker.memory.windmill})</div>
                        </td>
                        <td>
                          <div>{worker.limits.host}</div>
                          <div>{worker.limits.worker}</div>
                        </td>
                        <td>{worker.version}</td>
                        <td>
                          <span className={`status-badge ${worker.isAlive ? 'alive' : ''}`}>
                            {worker.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="autoscaling-section">
              <div className="section-header">
                <h4>Autoscaling events</h4>
                <button className="refresh-btn">
                  <RefreshCw size={16} />
                </button>
              </div>
              <p className="autoscaling-message">
                No events. Is autoscaling configured in the worker group config?
              </p>
            </div>
          </div>
        )}
      </div>

      <WorkerConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        workerGroupName={activeGroupData?.id || 'default'}
      />
    </div>
  );
};

