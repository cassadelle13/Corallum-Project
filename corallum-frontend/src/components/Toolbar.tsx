import React, { useState } from 'react';
import { 
  Play, 
  Save, 
  Download,
  Rocket
} from 'lucide-react';

interface ToolbarProps {
  onTest: () => void;
  onSave: () => void;
  onExport: () => void;
  onDeploy?: () => void;
  onSaveDraft?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onTest, 
  onSave, 
  onExport,
  onDeploy,
  onSaveDraft
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft();
      } else {
        onSave();
      }
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      if (onDeploy) {
        await onDeploy();
      } else {
        alert('Deploy functionality: Workflow will be deployed to production!');
      }
      setTimeout(() => setIsDeploying(false), 2000);
    } catch (error) {
      setIsDeploying(false);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
      </div>

      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={handleSaveDraft} disabled={isSaving}>
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>

        <button className="toolbar-btn" onClick={onExport}>
          <Download size={18} />
          <span>Export</span>
        </button>

        <button className="toolbar-btn primary" onClick={onTest}>
          <Play size={18} />
          <span>Test Run</span>
        </button>

        <button 
          className="toolbar-btn success" 
          onClick={handleDeploy}
          disabled={isDeploying}
        >
          <Rocket size={18} />
          <span>{isDeploying ? 'Deploying...' : 'Deploy'}</span>
        </button>
      </div>
    </div>
  );
};
