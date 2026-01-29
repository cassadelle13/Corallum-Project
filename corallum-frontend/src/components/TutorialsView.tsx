import React, { useState } from 'react';
import { 
  Info, 
  Check, 
  RefreshCw, 
  Shield, 
  Code, 
  User,
  GraduationCap,
  Network,
  Wrench,
  Clock,
  Circle
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface TutorialsViewProps {
  searchQuery?: string;
}

export const TutorialsView: React.FC<TutorialsViewProps> = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'developer' | 'operator'>('admin');
  const [activeCategory, setActiveCategory] = useState<'quickstart' | 'app-editor'>('quickstart');
  const [tutorials, setTutorials] = useState<Tutorial[]>([
    {
      id: '1',
      title: 'Workspace onboarding',
      description: 'Discover the basics of Corallum with a quick tour of the workspace.',
      icon: GraduationCap,
      status: 'not-started'
    },
    {
      id: '2',
      title: 'Build a flow',
      description: 'Learn how to build workflows in Corallum with our interactive tutorial.',
      icon: Network,
      status: 'not-started'
    },
    {
      id: '3',
      title: 'Fix a broken flow',
      description: 'Learn how to monitor and debug your script and flow executions.',
      icon: Wrench,
      status: 'not-started'
    },
    {
      id: '4',
      title: 'Discover your monitoring dashboard',
      description: 'Learn how to monitor, filter, and manage your script and flow executions.',
      icon: Clock,
      status: 'not-started'
    }
  ]);

  const completedCount = tutorials.filter(t => t.status === 'completed').length;
  const totalCount = tutorials.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const handleMarkAllCompleted = () => {
    setTutorials(tutorials.map(t => ({ ...t, status: 'completed' as const })));
  };

  const handleResetAll = () => {
    setTutorials(tutorials.map(t => ({ ...t, status: 'not-started' as const })));
  };

  const handleMarkCategoryCompleted = () => {
    setTutorials(tutorials.map(t => ({ ...t, status: 'completed' as const })));
  };

  const handleResetCategory = () => {
    setTutorials(tutorials.map(t => ({ ...t, status: 'not-started' as const })));
  };

  const handleTutorialClick = (id: string) => {
    setTutorials(tutorials.map(t => 
      t.id === id 
        ? { ...t, status: t.status === 'completed' ? 'not-started' : 'completed' }
        : t
    ));
  };

  const roles = [
    { id: 'admin', label: 'Admin (me)', icon: Shield },
    { id: 'developer', label: 'Developer', icon: Code },
    { id: 'operator', label: 'Operator', icon: User },
  ];

  const categories = [
    { id: 'quickstart', label: 'Quickstart' },
    { id: 'app-editor', label: 'App Editor' },
  ];

  return (
    <div className="tutorials-view">
      <div className="tutorials-header">
        <div className="tutorials-title-section">
          <h1>Tutorials</h1>
          <button className="info-icon-btn" title="Information">
            <Info size={16} />
          </button>
        </div>
        
        <div className="tutorials-header-actions">
          <button className="btn-action secondary" onClick={handleMarkAllCompleted}>
            <Check size={16} />
            <span>Mark all as completed</span>
          </button>
          <button className="btn-action secondary" onClick={handleResetAll}>
            <RefreshCw size={16} />
            <span>Reset all</span>
          </button>
        </div>
      </div>

      <div className="tutorials-role-section">
        <div className="role-selector">
          <span className="role-label">View as an</span>
          <div className="role-buttons">
            {roles.map((role) => {
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.id}
                  className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role.id as 'admin' | 'developer' | 'operator')}
                >
                  <RoleIcon size={16} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="role-description">
          This allows you to see which tutorials your team members can access
        </p>
      </div>

      <div className="tutorials-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`tutorial-category ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id as 'quickstart' | 'app-editor')}
          >
            <Circle size={14} />
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="tutorials-progress-section">
        <div className="progress-info">
          <span className="progress-text">
            Progress: {completedCount} of {totalCount} tutorials completed
          </span>
          <div className="progress-actions">
            <button className="btn-action small" onClick={handleMarkCategoryCompleted}>
              <Check size={14} />
              <span>Mark as completed</span>
            </button>
            <button className="btn-action small" onClick={handleResetCategory}>
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="tutorials-list">
        {tutorials.map((tutorial) => {
          const TutorialIcon = tutorial.icon;
          return (
            <div 
              key={tutorial.id} 
              className={`tutorial-item glass-panel ${tutorial.status === 'completed' ? 'completed' : ''}`}
              onClick={() => handleTutorialClick(tutorial.id)}
            >
              <div className="tutorial-icon">
                <TutorialIcon size={20} />
              </div>
              <div className="tutorial-content">
                <h3 className="tutorial-title">{tutorial.title}</h3>
                <p className="tutorial-description">{tutorial.description}</p>
              </div>
              <div className="tutorial-status">
                <span className="status-text">
                  {tutorial.status === 'completed' ? 'Completed' : 'Not started'}
                </span>
                <div className={`status-radio ${tutorial.status === 'completed' ? 'checked' : ''}`}>
                  {tutorial.status === 'completed' && <div className="radio-fill" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

