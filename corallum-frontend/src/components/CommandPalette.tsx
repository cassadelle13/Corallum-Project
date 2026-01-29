import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, PlayCircle, DollarSign, Layers, Calendar, ArrowRight, Hash } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  hasSubmenu?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      action: () => {
        onNavigate('home');
        onClose();
      },
    },
    {
      id: 'runs',
      label: 'Go to Runs',
      icon: PlayCircle,
      action: () => {
        onNavigate('runs');
        onClose();
      },
    },
    {
      id: 'variables',
      label: 'Go to Variables',
      icon: DollarSign,
      action: () => {
        onNavigate('variables');
        onClose();
      },
    },
    {
      id: 'resources',
      label: 'Go to Resources',
      icon: Layers,
      action: () => {
        onNavigate('resources');
        onClose();
      },
    },
    {
      id: 'schedules',
      label: 'Go to Schedules',
      icon: Calendar,
      action: () => {
        onNavigate('schedules');
        onClose();
      },
    },
    {
      id: 'search-runs',
      label: 'Search across completed runs (EE)',
      icon: Search,
      action: () => {
        alert('Search across completed runs');
        onClose();
      },
      hasSubmenu: true,
    },
    {
      id: 'search-content',
      label: 'Search scripts/flows/apps based on content',
      icon: Search,
      action: () => {
        alert('Search scripts/flows/apps');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp' && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  const showResults = filteredCommands.length > 0;

  return (
    <>
      <div className="command-palette-overlay" onClick={onClose}></div>
      <div className={`command-palette-container ${isOpen ? 'open' : ''}`}>
        <div className="command-palette-search-bar">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search or type '?' for search options"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>

        {showResults && (
          <div className="command-palette-results">
            <div className="command-palette-list">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={command.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon size={16} />
                    <span>{command.label}</span>
                    {command.hasSubmenu && <ArrowRight size={14} className="submenu-icon" />}
                  </button>
                );
              })}
            </div>
            <div className="command-palette-footer">
              <Hash size={12} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

