import React, { useState } from 'react';
import { X, Sun, Moon, Settings, Info, Trash2, ChevronRight } from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Token {
  id: string;
  prefix: string;
  label: string;
  expiration: string;
  scopes: string[];
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [codeCompletion, setCodeCompletion] = useState(true);
  const [metadataCompletion, setMetadataCompletion] = useState(true);
  const [flowStepCompletion, setFlowStepCompletion] = useState(true);
  const [generateMcpUrl, setGenerateMcpUrl] = useState(false);
  const [limitTokenPermissions, setLimitTokenPermissions] = useState(false);
  const [tokenLabel, setTokenLabel] = useState('');
  const [tokenExpiration, setTokenExpiration] = useState('No expiration');
  
  const [tokens] = useState<Token[]>([
    {
      id: '1',
      prefix: 'yL5BEBYSB8****',
      label: 'Ephemeral lsp token',
      expiration: '02.01, 22:57',
      scopes: []
    },
    {
      id: '2',
      prefix: 'Z2196GcHhK****',
      label: 'session',
      expiration: '02.01, 22:52',
      scopes: []
    }
  ]);

  const handleDeleteToken = (id: string) => {
    alert(`Delete token ${id}`);
  };

  const handleCreateToken = () => {
    alert('Create new token');
  };

  if (!isOpen) return null;

  return (
    <div className="user-settings-modal-overlay" onClick={onClose}>
      <div className="user-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Settings</h2>
          <div className="modal-header-right">
            <span className="modal-version">Windmill EE v1.601.1</span>
            <button className="modal-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="settings-section">
            <div className="settings-toggle-item">
              <div className="toggle-item-content">
                {isDarkTheme ? <Moon size={16} /> : <Sun size={16} />}
                <span>Theme</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isDarkTheme}
                  onChange={(e) => setIsDarkTheme(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-field">
              <label>Email</label>
              <div className="settings-value">rusik13022000s@gmail.com</div>
            </div>
            <div className="settings-field">
              <label>Password</label>
              <button className="btn-secondary">Change password</button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">AI user settings</h3>
            <div className="settings-toggle-item">
              <div className="toggle-item-content">
                <span>Code completion</span>
                <Info size={14} />
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={codeCompletion}
                  onChange={(e) => setCodeCompletion(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-toggle-item">
              <div className="toggle-item-content">
                <span>Metadata completion</span>
                <Info size={14} />
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={metadataCompletion}
                  onChange={(e) => setMetadataCompletion(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-toggle-item">
              <div className="toggle-item-content">
                <span>Flow step input completion</span>
                <Info size={14} />
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={flowStepCompletion}
                  onChange={(e) => setFlowStepCompletion(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <button className="settings-link">
              Custom system prompts
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Tokens</h3>
            <p className="settings-description">
              Authenticate to the Windmill API with access tokens.
            </p>

            <div className="token-form">
              <h4>Add a new token:</h4>
              <div className="token-form-field">
                <label className="token-toggle-label">
                  <input
                    type="checkbox"
                    checked={generateMcpUrl}
                    onChange={(e) => setGenerateMcpUrl(e.target.checked)}
                    disabled
                  />
                  <span>Generate MCP URL</span>
                  <Info size={12} />
                </label>
              </div>
              <div className="token-form-field">
                <label className="token-toggle-label">
                  <input
                    type="checkbox"
                    checked={limitTokenPermissions}
                    onChange={(e) => setLimitTokenPermissions(e.target.checked)}
                    disabled
                  />
                  <span>Limit token permissions</span>
                  <Info size={12} />
                </label>
              </div>
              <div className="token-form-field">
                <label>Label (optional)</label>
                <input
                  type="text"
                  className="token-input"
                  value={tokenLabel}
                  onChange={(e) => setTokenLabel(e.target.value)}
                  placeholder="Enter label"
                />
              </div>
              <div className="token-form-field">
                <label>Expires In (optional)</label>
                <input
                  type="text"
                  className="token-input"
                  value={tokenExpiration}
                  onChange={(e) => setTokenExpiration(e.target.value)}
                />
              </div>
              <div className="token-form-actions">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-action primary" onClick={handleCreateToken}>
                  New token
                </button>
              </div>
            </div>

            <div className="tokens-list">
              <h4>List of existing tokens:</h4>
              <table className="tokens-table">
                <thead>
                  <tr>
                    <th>Prefix</th>
                    <th>Label</th>
                    <th>Expiration</th>
                    <th>Scopes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td>{token.prefix}</td>
                      <td>{token.label}</td>
                      <td>{token.expiration}</td>
                      <td></td>
                      <td>
                        <button
                          className="token-delete-btn"
                          onClick={() => handleDeleteToken(token.id)}
                          title="Delete token"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

