import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Home, 
  PlayCircle, 
  DollarSign, 
  Layers, 
  Package, 
  BookOpen, 
  Calendar, 
  User, 
  Settings, 
  Cpu, 
  Folder, 
  List,
  Search,
  MessageSquare,
  Plus,
  Eye,
  AlertCircle,
  Link2,
  Plug,
  Database,
  Network,
  Cloud,
  Wifi,
  Mail,
  Crown,
  Moon,
  Sun,
  LogOut,
  TrendingUp,
  UserCircle,
  Building,
  Users,
  Menu
} from 'lucide-react';

interface GlobalSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed?: boolean;
  onOpenUserSettings?: () => void;
  onToggleCollapse?: () => void;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ activeTab, setActiveTab, isCollapsed, onOpenUserSettings, onToggleCollapse }) => {
  const [showLogsMenu, setShowLogsMenu] = useState(false);
  const logsButtonRef = useRef<HTMLButtonElement>(null);
  const logsMenuRef = useRef<HTMLDivElement>(null);
  
  const [showTriggerMenu, setShowTriggerMenu] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  const [showFoldersMenu, setShowFoldersMenu] = useState(false);
  const foldersButtonRef = useRef<HTMLButtonElement>(null);
  const foldersMenuRef = useRef<HTMLDivElement>(null);

  const mainNav = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'runs', icon: PlayCircle, label: 'Runs' },
    { id: 'variables', icon: DollarSign, label: 'Variables' },
    { id: 'resources', icon: Layers, label: 'Resources' },
    { id: 'assets', icon: Package, label: 'Assets' },
    { id: 'tutorials', icon: BookOpen, label: 'Tutorials' },
  ];

  const triggersNav = [
    { id: 'schedules', icon: Calendar, label: 'Schedules' },
  ];

  const bottomNav = [
    { id: 'user', icon: User, label: 'User (admin@...)' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'workers', icon: Cpu, label: 'Workers' },
    { id: 'folders', icon: Folder, label: 'Folders & Group...' },
    { id: 'logs', icon: List, label: 'Logs' },
  ];

  const logsMenuItems = [
    { id: 'audit-logs', icon: Eye, label: 'Audit logs' },
    { id: 'critical-alerts', icon: AlertCircle, label: 'Critical alerts' },
  ];

  const triggerMenuItems = [
    { id: 'http', icon: Link2, label: 'HTTP' },
    { id: 'websockets', icon: Plug, label: 'WebSockets' },
    { id: 'postgres', icon: Database, label: 'Postgres' },
    { id: 'kafka', icon: Network, label: 'Kafka' },
    { id: 'nats', icon: Network, label: 'NATS' },
    { id: 'sqs', icon: Cloud, label: 'SQS' },
    { id: 'gcp-pubsub', icon: Cloud, label: 'GCP Pub/Sub' },
    { id: 'mqtt', icon: Wifi, label: 'MQTT' },
    { id: 'email', icon: Mail, label: 'Email' },
  ];

  const settingsMenuItems = [
    { id: 'account', icon: UserCircle, label: 'Account' },
    { id: 'workspace', icon: Building, label: 'Workspace' },
  ];

  const foldersMenuItems = [
    { id: 'folders', icon: Folder, label: 'Folders' },
    { id: 'groups', icon: Users, label: 'Groups' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logsMenuRef.current &&
        !logsMenuRef.current.contains(event.target as Node) &&
        logsButtonRef.current &&
        !logsButtonRef.current.contains(event.target as Node)
      ) {
        setShowLogsMenu(false);
      }
      if (
        triggerMenuRef.current &&
        !triggerMenuRef.current.contains(event.target as Node) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(event.target as Node)
      ) {
        setShowTriggerMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
      if (
        foldersMenuRef.current &&
        !foldersMenuRef.current.contains(event.target as Node) &&
        foldersButtonRef.current &&
        !foldersButtonRef.current.contains(event.target as Node)
      ) {
        setShowFoldersMenu(false);
      }
    };

    if (showLogsMenu || showTriggerMenu || showUserMenu || showSettingsMenu || showFoldersMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLogsMenu, showTriggerMenu, showUserMenu, showSettingsMenu, showFoldersMenu]);

  useEffect(() => {
    const updateLogsMenuPosition = () => {
      if (showLogsMenu && logsButtonRef.current && logsMenuRef.current) {
        const buttonRect = logsButtonRef.current.getBoundingClientRect();
        const menuRect = logsMenuRef.current.getBoundingClientRect();
        const menuHeight = menuRect.height;
        logsMenuRef.current.style.top = `${buttonRect.bottom - menuHeight}px`;
        logsMenuRef.current.style.left = `${buttonRect.right + 4}px`;
      }
    };

    if (showLogsMenu) {
      // Use requestAnimationFrame to ensure menu is rendered before measuring
      requestAnimationFrame(() => {
        updateLogsMenuPosition();
      });
      window.addEventListener('scroll', updateLogsMenuPosition, true);
      window.addEventListener('resize', updateLogsMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateLogsMenuPosition, true);
        window.removeEventListener('resize', updateLogsMenuPosition);
      };
    }
  }, [showLogsMenu]);

  useEffect(() => {
    const updateTriggerMenuPosition = () => {
      if (showTriggerMenu && triggerButtonRef.current && triggerMenuRef.current) {
        const buttonRect = triggerButtonRef.current.getBoundingClientRect();
        const menuRect = triggerMenuRef.current.getBoundingClientRect();
        const menuHeight = menuRect.height;
        triggerMenuRef.current.style.top = `${buttonRect.bottom - menuHeight}px`;
        triggerMenuRef.current.style.left = `${buttonRect.right + 4}px`;
      }
    };

    if (showTriggerMenu) {
      // Use requestAnimationFrame to ensure menu is rendered before measuring
      requestAnimationFrame(() => {
        updateTriggerMenuPosition();
      });
      window.addEventListener('scroll', updateTriggerMenuPosition, true);
      window.addEventListener('resize', updateTriggerMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateTriggerMenuPosition, true);
        window.removeEventListener('resize', updateTriggerMenuPosition);
      };
    }
  }, [showTriggerMenu]);

  useEffect(() => {
    const updateUserMenuPosition = () => {
      if (showUserMenu && userButtonRef.current && userMenuRef.current) {
        const buttonRect = userButtonRef.current.getBoundingClientRect();
        const menuRect = userMenuRef.current.getBoundingClientRect();
        const menuHeight = menuRect.height;
        userMenuRef.current.style.top = `${buttonRect.bottom - menuHeight}px`;
        userMenuRef.current.style.left = `${buttonRect.right + 4}px`;
      }
    };

    if (showUserMenu) {
      // Use requestAnimationFrame to ensure menu is rendered before measuring
      requestAnimationFrame(() => {
        updateUserMenuPosition();
      });
      window.addEventListener('scroll', updateUserMenuPosition, true);
      window.addEventListener('resize', updateUserMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateUserMenuPosition, true);
        window.removeEventListener('resize', updateUserMenuPosition);
      };
    }
  }, [showUserMenu]);

  useEffect(() => {
    const updateSettingsMenuPosition = () => {
      if (showSettingsMenu && settingsButtonRef.current && settingsMenuRef.current) {
        const buttonRect = settingsButtonRef.current.getBoundingClientRect();
        const menuRect = settingsMenuRef.current.getBoundingClientRect();
        const menuHeight = menuRect.height;
        settingsMenuRef.current.style.top = `${buttonRect.bottom - menuHeight}px`;
        settingsMenuRef.current.style.left = `${buttonRect.right + 4}px`;
      }
    };

    if (showSettingsMenu) {
      requestAnimationFrame(() => {
        updateSettingsMenuPosition();
      });
      window.addEventListener('scroll', updateSettingsMenuPosition, true);
      window.addEventListener('resize', updateSettingsMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateSettingsMenuPosition, true);
        window.removeEventListener('resize', updateSettingsMenuPosition);
      };
    }
  }, [showSettingsMenu]);

  useEffect(() => {
    const updateFoldersMenuPosition = () => {
      if (showFoldersMenu && foldersButtonRef.current && foldersMenuRef.current) {
        const buttonRect = foldersButtonRef.current.getBoundingClientRect();
        const menuRect = foldersMenuRef.current.getBoundingClientRect();
        const menuHeight = menuRect.height;
        foldersMenuRef.current.style.top = `${buttonRect.bottom - menuHeight}px`;
        foldersMenuRef.current.style.left = `${buttonRect.right + 4}px`;
      }
    };

    if (showFoldersMenu) {
      requestAnimationFrame(() => {
        updateFoldersMenuPosition();
      });
      window.addEventListener('scroll', updateFoldersMenuPosition, true);
      window.addEventListener('resize', updateFoldersMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateFoldersMenuPosition, true);
        window.removeEventListener('resize', updateFoldersMenuPosition);
      };
    }
  }, [showFoldersMenu]);

  const handleLogsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLogsMenu(!showLogsMenu);
  };

  const handleLogsMenuItemClick = (itemId: string) => {
    setActiveTab(itemId);
    setShowLogsMenu(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTriggerMenu(!showTriggerMenu);
  };

  const handleTriggerMenuItemClick = (itemId: string) => {
    alert(`Create ${triggerMenuItems.find(item => item.id === itemId)?.label} trigger`);
    setShowTriggerMenu(false);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleSettingsMenuItemClick = (itemId: string) => {
    if (itemId === 'account') {
      if (onOpenUserSettings) {
        onOpenUserSettings();
      }
      setShowSettingsMenu(false);
    } else if (itemId === 'workspace') {
      setActiveTab('settings');
      setShowSettingsMenu(false);
    }
  };

  const handleFoldersClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFoldersMenu(!showFoldersMenu);
  };

  const handleFoldersMenuItemClick = (itemId: string) => {
    setActiveTab(itemId);
    setShowFoldersMenu(false);
  };

  return (
    <div className={`global-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!isCollapsed && <span>Corallum</span>}
      </div>

      <div className="sidebar-search-trigger">
        <button 
          className="search-button"
          onClick={() => {
            // Command palette will be opened via App.tsx
            const event = new CustomEvent('openCommandPalette');
            window.dispatchEvent(event);
          }}
          title="Search (Ctrl+k)"
        >
          <Search size={18} className="search-button-icon" />
          {!isCollapsed && <span>Search Ctrl+k</span>}
        </button>
        <button 
          className="ask-ai-button"
          onClick={() => {
            const event = new CustomEvent('openAskAI');
            window.dispatchEvent(event);
          }}
          title="Ask AI (Ctrl+L)"
        >
          <MessageSquare size={18} className="ask-ai-button-icon" />
          {!isCollapsed && <span>Ask AI Ctrl+L</span>}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {mainNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="nav-section">
          {!isCollapsed && <div className="section-label">TRIGGERS</div>}
          {triggersNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
          <div className="add-trigger-wrapper">
            <button
              ref={triggerButtonRef}
              className="nav-item add-trigger"
              onClick={handleTriggerClick}
            >
              <Plus size={18} />
            </button>
            {showTriggerMenu && ReactDOM.createPortal(
              <div
                ref={triggerMenuRef}
                className="trigger-menu glass-panel"
                onClick={(e) => e.stopPropagation()}
              >
                {triggerMenuItems.map((menuItem) => {
                  const MenuIcon = menuItem.icon;
                  return (
                    <button
                      key={menuItem.id}
                      className="trigger-menu-item"
                      onClick={() => handleTriggerMenuItemClick(menuItem.id)}
                    >
                      <MenuIcon size={16} />
                      <span>{menuItem.label}</span>
                    </button>
                  );
                })}
              </div>,
              document.body
            )}
          </div>
        </div>
      </nav>

      <div className="sidebar-footer-nav">
        {bottomNav.map((item) => {
          if (item.id === 'logs') {
            return (
              <div key={item.id} className="logs-nav-wrapper">
                <button
                  ref={logsButtonRef}
                  className={`nav-item ${activeTab === 'audit-logs' || activeTab === 'critical-alerts' ? 'active' : ''}`}
                  onClick={handleLogsClick}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
                {showLogsMenu && ReactDOM.createPortal(
                  <div
                    ref={logsMenuRef}
                    className="logs-menu glass-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {logsMenuItems.map((menuItem) => {
                      const MenuIcon = menuItem.icon;
                      return (
                        <button
                          key={menuItem.id}
                          className={`logs-menu-item ${activeTab === menuItem.id ? 'active' : ''}`}
                          onClick={() => handleLogsMenuItemClick(menuItem.id)}
                        >
                          <MenuIcon size={16} />
                          <span>{menuItem.label}</span>
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
              </div>
            );
          }
          if (item.id === 'user') {
            return (
              <div key={item.id} className="user-nav-wrapper">
                <button
                  ref={userButtonRef}
                  className="nav-item"
                  onClick={handleUserClick}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
                {showUserMenu && ReactDOM.createPortal(
                  <div
                    ref={userMenuRef}
                    className="user-menu glass-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="user-menu-header">
                      <div className="user-menu-email">rusik13022000s@gmail.com</div>
                      <div className="user-menu-role">
                        <Crown size={14} />
                        <span>Admin of this workspace</span>
                      </div>
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <button className="user-menu-item">
                      <Settings size={16} />
                      <span>Account settings</span>
                    </button>
                    <button 
                      className="user-menu-item"
                      onClick={() => setIsDarkTheme(!isDarkTheme)}
                    >
                      {isDarkTheme ? <Moon size={16} /> : <Sun size={16} />}
                      <span>Switch theme</span>
                    </button>
                    <button className="user-menu-item danger">
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                    
                    <div className="user-menu-divider"></div>
                    
                    <div className="user-menu-usage">
                      <div className="usage-item">
                        <span className="usage-label">0/1000 user execs</span>
                        <div className="usage-progress">
                          <div className="usage-progress-bar" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      <div className="usage-item">
                        <span className="usage-label">0/1000 free workspace execs</span>
                        <div className="usage-progress">
                          <div className="usage-progress-bar" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <button className="user-menu-upgrade">
                      <TrendingUp size={16} />
                      <span>Upgrade</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            );
          }
          if (item.id === 'settings') {
            return (
              <div key={item.id} className="settings-nav-wrapper">
                <button
                  ref={settingsButtonRef}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={handleSettingsClick}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
                {showSettingsMenu && ReactDOM.createPortal(
                  <div
                    ref={settingsMenuRef}
                    className="settings-menu glass-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {settingsMenuItems.map((menuItem) => {
                      const MenuIcon = menuItem.icon;
                      return (
                        <button
                          key={menuItem.id}
                          className="settings-menu-item"
                          onClick={() => handleSettingsMenuItemClick(menuItem.id)}
                        >
                          <MenuIcon size={16} />
                          <span>{menuItem.label}</span>
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
              </div>
            );
          }
          if (item.id === 'folders') {
            return (
              <div key={item.id} className="folders-nav-wrapper">
                <button
                  ref={foldersButtonRef}
                  className={`nav-item ${activeTab === 'folders' || activeTab === 'groups' ? 'active' : ''}`}
                  onClick={handleFoldersClick}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
                {showFoldersMenu && ReactDOM.createPortal(
                  <div
                    ref={foldersMenuRef}
                    className="folders-menu glass-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {foldersMenuItems.map((menuItem) => {
                      const MenuIcon = menuItem.icon;
                      return (
                        <button
                          key={menuItem.id}
                          className={`folders-menu-item ${activeTab === menuItem.id ? 'active' : ''}`}
                          onClick={() => handleFoldersMenuItemClick(menuItem.id)}
                        >
                          <MenuIcon size={16} />
                          <span>{menuItem.label}</span>
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
              </div>
            );
          }
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          className="nav-item collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={18} />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
};
