import React, { useState } from 'react';
import { Folder, Plus, MoreVertical, Info, Search } from 'lucide-react';

interface FoldersViewProps {
  searchQuery?: string;
}

interface FolderData {
  id: string;
  name: string;
  scripts: number;
  flows: number;
  apps: number;
  schedules: number;
  variables: number;
  resources: number;
  participants: string;
}

export const FoldersView: React.FC<FoldersViewProps> = ({ searchQuery: externalSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const query = externalSearch || localSearch;

  const folders: FolderData[] = [
    {
      id: '1',
      name: 'app_custom',
      scripts: 0,
      flows: 0,
      apps: 0,
      schedules: 0,
      variables: 0,
      resources: 0,
      participants: '(1) g/all',
    },
    {
      id: '2',
      name: 'app_groups',
      scripts: 0,
      flows: 0,
      apps: 0,
      schedules: 0,
      variables: 0,
      resources: 0,
      participants: '(1) g/all',
    },
    {
      id: '3',
      name: 'app_themes',
      scripts: 0,
      flows: 0,
      apps: 0,
      schedules: 0,
      variables: 0,
      resources: 1,
      participants: '(1) g/all',
    },
  ];

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleNewFolder = () => {
    alert('New folder functionality coming soon!');
  };

  return (
    <div className="folders-view">
      <div className="view-header">
        <div className="header-title">
          <Folder size={20} />
          <h1>Folders</h1>
          <Info size={16} />
        </div>
        <button className="btn-action primary" onClick={handleNewFolder}>
          <Plus size={16} />
          <span>New folder</span>
        </button>
      </div>

      <div className="folders-content">
        {filteredFolders.length > 0 ? (
          <div className="folders-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scripts</th>
                  <th>Flows</th>
                  <th>Apps</th>
                  <th>Schedules</th>
                  <th>Variables</th>
                  <th>Resources</th>
                  <th>Participants</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map(folder => (
                  <tr key={folder.id}>
                    <td>
                      <div className="folder-name">
                        <Folder size={16} />
                        <span>{folder.name}</span>
                      </div>
                    </td>
                    <td>{folder.scripts}</td>
                    <td>{folder.flows}</td>
                    <td>{folder.apps}</td>
                    <td>{folder.schedules}</td>
                    <td>{folder.variables}</td>
                    <td>{folder.resources}</td>
                    <td>{folder.participants}</td>
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
            <Folder size={48} />
            <p className="empty-title"><strong>No folders found</strong></p>
            <p className="empty-description">
              {query ? `No folders match "${query}"` : 'Create a new folder to organize your workflows'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

