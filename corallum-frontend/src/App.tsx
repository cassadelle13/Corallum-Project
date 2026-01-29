import { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  DollarSign, 
  // @ts-ignore
  Layers, 
  Settings,
  Plus
} from 'lucide-react';
import { FlowCanvas } from './components/FlowCanvas';
import { Sidebar } from './components/Sidebar';
import { NodeEditor } from './components/NodeEditor';
import { Toolbar } from './components/Toolbar';
import { ExecutionLogs } from './components/ExecutionLogs';
import { GlobalSidebar } from './components/GlobalSidebar';
import { HomeView } from './components/HomeView';
import { ResourcesView } from './components/ResourcesView';
import { VariablesView } from './components/VariablesView';
import { TutorialsView } from './components/TutorialsView';
import { RunsView } from './components/RunsView';
import { SchedulesView } from './components/SchedulesView';
import { SettingsView } from './components/SettingsView';
import { WorkersView } from './components/WorkersView';
import { FoldersView } from './components/FoldersView';
import { LogsView } from './components/LogsView';
import { AssetsView } from './components/AssetsView';
import { AuditLogsView } from './components/AuditLogsView';
import { CriticalAlertsView } from './components/CriticalAlertsView';
import { UserSettingsModal } from './components/UserSettingsModal';
import { GroupsView } from './components/GroupsView';
import { CommandPalette } from './components/CommandPalette';
import { AskAIModal } from './components/AskAIModal';
import { useFlowStore } from './store/flowStore';
import { apiService } from './services/api';
import { wsService } from './services/websocket';
import './App.css';
import './Futuristic.css';

function App() {
  const { nodes, edges, selectedNode, setSelectedNode, addExecutionLog, clearExecutionLogs } = useFlowStore();
  const [testResult, setTestResult] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalSidebarCollapsed, setIsGlobalSidebarCollapsed] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isEditingFlow, setIsEditingFlow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);

  // Инициализация API и WebSocket (Windmill style)
  useEffect(() => {
    const initializeApi = async () => {
      try {
        // Сначала проверяем API
        const health = await apiService.healthCheck();
        console.log('API Health:', health);
        
        // Если API доступен, подключаем WebSocket
        try {
          await wsService.connect('demo');
          
          // Подписываемся на обновления
          wsService.subscribe('job_update', (message: any) => {
            console.log('Job update received:', message.data);
            // Здесь можно обновить UI в реальном времени
          });
          
          wsService.subscribe('workflow_update', (message: any) => {
            console.log('Workflow update received:', message.data);
            // Здесь можно обновить статус workflow
          });
        } catch (wsError) {
          console.warn('WebSocket not available, continuing without real-time updates:', wsError);
        }
        
      } catch (error) {
        console.warn('API not available, using mock data mode:', error);
        // Продолжаем работу без API - будут использоваться мок-данные
      }
    };
    
    initializeApi();
    
    // Cleanup при размонтировании
    return () => {
      wsService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (testResult) {
      const timer = setTimeout(() => {
        setTestResult(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [testResult]);

  useEffect(() => {
    const handleOpenCommandPalette = () => {
      setShowCommandPalette(true);
    };

    const handleOpenAskAI = () => {
      setShowAskAI(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowAskAI(true);
      }
      if (e.key === 'Escape') {
        if (showCommandPalette) {
          setShowCommandPalette(false);
        }
        if (showAskAI) {
          setShowAskAI(false);
        }
      }
    };

    window.addEventListener('openCommandPalette', handleOpenCommandPalette);
    window.addEventListener('openAskAI', handleOpenAskAI);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('openCommandPalette', handleOpenCommandPalette);
      window.removeEventListener('openAskAI', handleOpenAskAI);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCommandPalette, showAskAI]);

  const handleTest = async () => {
    clearExecutionLogs();
    setIsLogsOpen(true);

    try {
      addExecutionLog({
        id: `log-${Date.now()}`,
        nodeId: 'start',
        status: 'running',
        message: 'Starting workflow execution...',
        timestamp: Date.now()
      });

      for (const node of nodes) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isSuccess = Math.random() > 0.1;
        
        addExecutionLog({
          id: `log-${Date.now()}-${node.id}`,
          nodeId: node.id,
          status: isSuccess ? 'success' : 'error',
          message: isSuccess ? `Node ${node.data.label} completed` : `Node ${node.data.label} failed`,
          timestamp: Date.now()
        });

        if (!isSuccess) break;
      }

      try {
        const response = await apiService.executeNode('test', {
          input: "Test input",
          thread_id: "test-" + Date.now()
        });
        setTestResult(response);
      } catch (e) {
        setTestResult({ status: 'completed', message: 'Execution finished (Demo Mode)' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = () => {
    localStorage.setItem('corallum-flow', JSON.stringify({ nodes, edges }));
    alert('✓ Flow saved successfully!');
  };

  const handleExport = () => {
    const flow = { nodes, edges };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `corallum-flow-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="app-container">
      <GlobalSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'home') setIsEditingFlow(false);
        }} 
        isCollapsed={isGlobalSidebarCollapsed || isEditingFlow}
        onOpenUserSettings={() => setShowUserSettings(true)}
        onToggleCollapse={() => setIsGlobalSidebarCollapsed(!isGlobalSidebarCollapsed)}
      />
      
      <div className="main-content">
        {activeTab === 'home' && !isEditingFlow && (
          <HomeView 
            onCreateFlow={() => {
              console.log('🔧 App: onCreateFlow called, setting isEditingFlow to true');
              setIsEditingFlow(true);
            }} 
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'home' && isEditingFlow && (
          <>
            {console.log('🔧 Rendering FlowCanvas - isEditingFlow:', isEditingFlow, 'activeTab:', activeTab)}
            <div className={`app ${isSidebarOpen ? 'sidebar-open' : ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Toolbar 
              onTest={handleTest} 
              onSave={handleSave}
              onSaveDraft={() => alert('Draft Saved!')}
              onExport={handleExport}
              onDeploy={() => alert('Workflow Deployed to Production!')}
            />
            <div className="app-content">
              <Sidebar 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              />
              <div className="main-area">
                <FlowCanvas onNodeClick={setSelectedNode} />
              </div>
              {selectedNode && (
                <NodeEditor 
                  node={selectedNode} 
                  onClose={() => setSelectedNode(null)} 
                />
              )}
            </div>
            <ExecutionLogs isOpen={isLogsOpen} onToggle={() => setIsLogsOpen(!isLogsOpen)} />
            <button 
              className="hamburger-toggle-button"
              data-sidebar-toggle="true"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Hide Component Library" : "Show Component Library"}
            >
              <Plus size={18} style={{ transform: isSidebarOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
            </button>
          </div>
          </>
        )}

        {activeTab === 'runs' && (
          <RunsView searchQuery={searchQuery} />
        )}

        {activeTab === 'variables' && (
          <VariablesView searchQuery={searchQuery} />
        )}

        {activeTab === 'resources' && (
          <ResourcesView searchQuery={searchQuery} />
        )}

        {activeTab === 'tutorials' && (
          <TutorialsView searchQuery={searchQuery} />
        )}

        {activeTab === 'schedules' && (
          <SchedulesView searchQuery={searchQuery} />
        )}

        {activeTab === 'assets' && (
          <AssetsView searchQuery={searchQuery} />
        )}

        {activeTab === 'settings' && (
          <SettingsView searchQuery={searchQuery} />
        )}

        {activeTab === 'workers' && (
          <WorkersView searchQuery={searchQuery} />
        )}

        {activeTab === 'folders' && (
          <FoldersView searchQuery={searchQuery} />
        )}

        {activeTab === 'groups' && (
          <GroupsView searchQuery={searchQuery} />
        )}

        {activeTab === 'logs' && (
          <LogsView searchQuery={searchQuery} />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsView searchQuery={searchQuery} />
        )}
      </div>

      <CriticalAlertsView
        isOpen={showCriticalAlerts || activeTab === 'critical-alerts'}
        onClose={() => {
          setShowCriticalAlerts(false);
          if (activeTab === 'critical-alerts') {
            setActiveTab('home');
          }
        }}
      />

      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setShowCommandPalette(false);
        }}
      />

      <AskAIModal
        isOpen={showAskAI}
        onClose={() => setShowAskAI(false)}
      />

      {testResult && (
        <div className="test-panel glass-panel">
          <div className="test-panel-header">
            <h3>Execution Result</h3>
            <button onClick={() => setTestResult(null)}>&times;</button>
          </div>
          <div className="test-panel-content">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
// Trigger Vercel rebuild - UI Update 2026-01-03 - Final Fix Attempt

// Rebuild Trigger: Restore Original Design + Vertical Placement - 2026-01-03-v3
