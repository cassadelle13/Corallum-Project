import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Search, 
  Info, 
  Calendar, 
  ArrowRightLeft,
  Link,
  Zap,
  Database,
  Radio,
  Wifi,
  Mail,
  Cloud
} from 'lucide-react';
import { NewScheduleModal } from './NewScheduleModal';
import { apiService } from '../services/api';

interface SchedulesViewProps {
  searchQuery?: string;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({ searchQuery: externalSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [pathFilter, setPathFilter] = useState<'schedule' | 'script-flow'>('schedule');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [onlyF, setOnlyF] = useState(false);
  const [showNewScheduleMenu, setShowNewScheduleMenu] = useState(false);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const query = externalSearch || localSearch;

  const triggerMenuItems = [
    { id: 'http', icon: Link, label: 'HTTP' },
    { id: 'websockets', icon: Zap, label: 'WebSockets' },
    { id: 'postgres', icon: Database, label: 'Postgres' },
    { id: 'kafka', icon: Radio, label: 'Kafka (EE)' },
    { id: 'nats', icon: Radio, label: 'NATS (EE)' },
    { id: 'aws-sqs', icon: Cloud, label: 'AWS SQS (EE)' },
    { id: 'gcp-pubsub', icon: Cloud, label: 'GCP Pub/Sub (EE)' },
    { id: 'mqtt', icon: Wifi, label: 'MQTT' },
    { id: 'email', icon: Mail, label: 'Email' },
  ];

  // Загружаем schedules из API
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        const scheduleData = await apiService.listSchedules();
        setSchedules(scheduleData);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        // Используем мок-данные при ошибке
        setSchedules([
          { id: 1, name: 'Daily Backup', path: 'f/backup_script', enabled: true, schedule: '0 2 * * *' },
          { id: 2, name: 'Weekly Report', path: 'f/report_generator', enabled: true, schedule: '0 9 * * 1' },
          { id: 3, name: 'Hourly Sync', path: 'f/data_sync', enabled: false, schedule: '0 * * * *' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const handleNewSchedule = async () => {
    try {
      const newSchedule = await apiService.createSchedule({
        name: 'New Schedule',
        path: 'f/new_script',
        enabled: true,
        schedule: '0 12 * * *'
      });
      setSchedules([...schedules, newSchedule]);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    }
  };

  // Position menu relative to button
  useEffect(() => {
    if (showNewScheduleMenu && buttonRef.current && menuRef.current) {
      const updatePosition = () => {
        if (buttonRef.current && menuRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          menuRef.current.style.top = `${buttonRect.bottom + 8}px`;
          menuRef.current.style.right = `${window.innerWidth - buttonRect.right}px`;
        }
      };
      
      // Update position immediately
      updatePosition();
      
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showNewScheduleMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNewScheduleMenu &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNewScheduleMenu(false);
      }
    };

    if (showNewScheduleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNewScheduleMenu]);

  return (
    <div className="schedules-view">
      <div className="schedules-header">
        <div className="schedules-title-section">
          <h1>Schedules</h1>
          <button className="info-icon-btn" title="Information">
            <Info size={16} />
          </button>
        </div>
        
        <div 
          ref={buttonRef}
          className="new-schedule-wrapper"
        >
          <button 
            className="btn-action primary"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewScheduleMenu(!showNewScheduleMenu);
            }}
          >
            <Plus size={16} />
            <span>New schedule</span>
          </button>
          {showNewScheduleMenu && createPortal(
            <div 
              ref={menuRef}
              className="new-schedule-menu glass-panel"
              onClick={(e) => e.stopPropagation()}
            >
              {triggerMenuItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="new-schedule-menu-item"
                    onClick={() => {
                      setShowNewScheduleModal(true);
                      setShowNewScheduleMenu(false);
                    }}
                  >
                    <ItemIcon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="schedules-filters">
        <div className="schedules-search-bar glass-panel">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search schedule"
            value={query}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className="schedules-filter-section">
          <div className="path-filter-group">
            <span className="filter-label">Filter by path of</span>
            <div className="path-filter-buttons">
              <button
                className={`path-filter-btn ${pathFilter === 'schedule' ? 'active' : ''}`}
                onClick={() => setPathFilter('schedule')}
              >
                <Calendar size={14} />
                <span>Schedule</span>
              </button>
              <button
                className={`path-filter-btn ${pathFilter === 'script-flow' ? 'active' : ''}`}
                onClick={() => setPathFilter('script-flow')}
              >
                <ArrowRightLeft size={14} />
                <span>Script/Flow</span>
              </button>
            </div>
          </div>

          <div className="status-filter-group">
            <button
              className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`status-filter-btn ${statusFilter === 'enabled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('enabled')}
            >
              Enabled
            </button>
            <button
              className={`status-filter-btn ${statusFilter === 'disabled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('disabled')}
            >
              Disabled
            </button>
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
      </div>

      <div className="schedules-content">
        <div className="empty-schedules-state">
          <p className="empty-title">No schedules</p>
        </div>
      </div>

      <NewScheduleModal
        isOpen={showNewScheduleModal}
        onClose={() => setShowNewScheduleModal(false)}
      />
    </div>
  );
};

