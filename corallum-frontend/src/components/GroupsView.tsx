import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Users, Plus, MoreVertical, Info } from 'lucide-react';

interface GroupsViewProps {
  searchQuery?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: string;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ searchQuery: externalSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const query = externalSearch || localSearch;

  const groups: Group[] = [
    {
      id: '1',
      name: 'all',
      description: 'The group that always contains all users of this workspace',
      members: '(1) ruru',
    },
  ];

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      alert(`Create group: ${newGroupName}`);
      setNewGroupName('');
      setShowNewGroupModal(false);
    }
  };

  // Position modal relative to button
  useEffect(() => {
    if (showNewGroupModal && buttonRef.current && modalRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const modalWidth = modalRef.current.offsetWidth;
      const rightPosition = window.innerWidth - buttonRect.right;
      modalRef.current.style.top = `${buttonRect.bottom + 8}px`;
      modalRef.current.style.right = `${rightPosition}px`;
    }
  }, [showNewGroupModal]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNewGroupModal(false);
      }
    };

    if (showNewGroupModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNewGroupModal]);

  return (
    <div className="groups-view">
      <div className="view-header">
        <div className="header-title">
          <Users size={20} />
          <h1>Groups</h1>
          <Info size={16} />
        </div>
        <div className="new-group-wrapper" ref={buttonRef}>
          <button 
            className="btn-action primary"
            onClick={() => setShowNewGroupModal(!showNewGroupModal)}
          >
            <Plus size={16} />
            <span>New group</span>
          </button>
          {showNewGroupModal && ReactDOM.createPortal(
            <div
              ref={modalRef}
              className="new-group-modal glass-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="new-group-form">
                <input
                  type="text"
                  className="new-group-input"
                  placeholder="New group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGroup();
                    } else if (e.key === 'Escape') {
                      setShowNewGroupModal(false);
                    }
                  }}
                  autoFocus
                />
                <button 
                  className="btn-action primary small"
                  onClick={handleCreateGroup}
                >
                  <Plus size={14} />
                  <span>Create</span>
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="groups-content">
        {filteredGroups.length > 0 ? (
          <div className="groups-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Members</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map(group => (
                  <tr key={group.id}>
                    <td>
                      <div className="group-name-section">
                        <div className="group-name">{group.name}</div>
                        <div className="group-description">{group.description}</div>
                      </div>
                    </td>
                    <td className="group-members">{group.members}</td>
                    <td>
                      <button className="btn-icon">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <p className="empty-title"><strong>No groups found</strong></p>
            <p className="empty-description">
              {query ? `No groups match "${query}"` : 'Create a new group to organize users'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

