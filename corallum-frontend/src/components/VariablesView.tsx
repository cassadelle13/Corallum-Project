import React, { useState } from 'react';
import { Plus, Search, Info, Building, DollarSign } from 'lucide-react';

interface VariablesViewProps {
  searchQuery?: string;
}

export const VariablesView: React.FC<VariablesViewProps> = ({ searchQuery: externalSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('workspace');
  const [onlyF, setOnlyF] = useState(false);
  const query = externalSearch || localSearch;

  const tabs = [
    { id: 'workspace', label: 'Workspace', icon: Building },
    { id: 'contextual', label: '$ Contextual', icon: DollarSign, hasInfo: true },
  ];

  const handleNewVariable = () => {
    alert('New variable functionality coming soon!');
  };

  return (
    <div className="variables-view">
      <div className="variables-header">
        <div className="variables-title-section">
          <h1>Variables</h1>
          <button className="info-icon-btn" title="Information">
            <Info size={16} />
          </button>
        </div>
        
        <button className="btn-action primary" onClick={handleNewVariable}>
          <Plus size={16} />
          <span>New variable</span>
        </button>
      </div>

      <div className="variables-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`variable-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {tab.hasInfo && (
              <button 
                className="tab-info-icon" 
                title="Information"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Contextual variables information');
                }}
              >
                <Info size={12} />
              </button>
            )}
          </button>
        ))}
      </div>

      <div className="variables-filters">
        <div className="variables-search-bar glass-panel">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search Variable"
            value={query}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        
        <div className="toggle-filter">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={onlyF}
              onChange={(e) => setOnlyF(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">Only f/*</span>
        </div>
      </div>

      <div className="variables-content">
        <div className="empty-variables-state">
          <p className="empty-title"><strong>No variables found</strong></p>
          <p className="empty-description">
            Try changing the filters or creating a new variable
          </p>
        </div>
      </div>
    </div>
  );
};

