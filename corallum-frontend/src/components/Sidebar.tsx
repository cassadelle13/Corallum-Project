import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  GitBranch, 
  Repeat, 
  Code, 
  Database,
  AlertCircle,
  Clock,
  CheckCircle,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  FileText,
  Server,
  Webhook,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  RotateCw,
  Bot,
  ArrowDownRight,
  Plus,
  Users,
  Briefcase,
  Building,
  Layout,
  CreditCard,
  Cpu,
  Wand2
} from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { AIWorkflowGenerator } from './AIWorkflowGenerator';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NodeType {
  type: string;
  icon: any;
  label: string;
  description: string;
}

interface NodeCategory {
  name: string;
  icon: any;
  nodes: NodeType[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { addNode, setNodes, setEdges } = useFlowStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Triggers', 'Operators', 'Integrations', 'AI Agents'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const categories: NodeCategory[] = [
    {
      name: 'Triggers',
      icon: Play,
      nodes: [
        { type: 'trigger', icon: Play, label: 'Manual Trigger', description: 'Запускает workflow вручную' },
        { type: 'webhook', icon: Webhook, label: 'Webhook', description: 'HTTP trigger endpoint' },
        { type: 'schedule', icon: Calendar, label: 'Schedule', description: 'Cron-based trigger' },
        { type: 'manual', icon: Play, label: 'Manual Start', description: 'Manual workflow start' },
      ]
    },
    {
      name: 'Operators',
      icon: Code,
      nodes: [
        { type: 'action', icon: Code, label: 'Action', description: 'Execute custom action' },
        { type: 'flow', icon: Menu, label: 'Flow Step', description: 'Workflow step processor' },
        { type: 'branch', icon: GitBranch, label: 'Branch', description: 'Conditional branching' },
        { type: 'forloop', icon: RotateCw, label: 'For Loop', description: 'Iterate over collection' },
        { type: 'whileloop', icon: RotateCw, label: 'While Loop', description: 'Loop while condition true' },
        { type: 'script', icon: Code, label: 'Script', description: 'Execute custom script' },
        { type: 'delay', icon: Clock, label: 'Delay', description: 'Wait for specified time' },
        { type: 'error', icon: AlertCircle, label: 'Error Handler', description: 'Handle workflow errors' },
        { type: 'merge', icon: GitBranch, label: 'Merge Data', description: 'Объединяет несколько потоков данных' },
        { type: 'split', icon: GitBranch, label: 'Split Data', description: 'Разделяет данные на несколько потоков' },
      ]
    },
    {
      name: 'Integrations',
      icon: Globe,
      nodes: [
        { type: 'http', icon: Globe, label: 'HTTP Request', description: 'Make HTTP API calls' },
        { type: 'database', icon: Database, label: 'Database', description: 'Execute SQL queries' },
        { type: 'slack', icon: MessageSquare, label: 'Slack', description: 'Send Slack messages' },
        { type: 'email', icon: Mail, label: 'Email', description: 'Send email notifications' },
        { type: 'file', icon: FileText, label: 'File Storage', description: 'Upload/download files' },
        { type: 'api', icon: Server, label: 'REST API', description: 'External API integration' },
        { type: 'telegram', icon: MessageSquare, label: 'Telegram Bot', description: 'Telegram Bot API интеграция' },
        { type: 'vk', icon: Users, label: 'VK API', description: 'ВКонтакте API интеграция' },
        { type: 'amocrm', icon: Briefcase, label: 'amoCRM', description: 'amoCRM API интеграция' },
        { type: 'bitrix24', icon: Building, label: 'Bitrix24', description: 'Bitrix24 API интеграция' },
        { type: 'yandex', icon: Globe, label: 'Yandex Services', description: 'Yandex Forms/Metrika/Disk API' },
        { type: 'tilda', icon: Layout, label: 'Tilda Webhook', description: 'Tilda CMS webhook обработка' },
        { type: 'payment', icon: CreditCard, label: 'Multi-Payment Gateway', description: 'Поддержка всех основных РФ платежных систем' },
      ]
    },
    {
      name: 'Resources',
      icon: Cpu,
      nodes: [
        { type: 'model', icon: Cpu, label: 'AI Model', description: 'Machine learning model' },
        { type: 'memory', icon: Database, label: 'Memory Store', description: 'Vector memory storage' },
        { type: 'embedding', icon: Cpu, label: 'Embedding', description: 'Text embedding generation' },
      ]
    },
    {
      name: 'AI Agents',
      icon: Bot,
      nodes: [
        { type: 'aiagent', icon: Bot, label: 'AI Agent', description: 'AI-powered processing' },
      ]
    }
  ];

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAIWorkflowGenerated = (workflow: any) => {
    // Устанавливаем сгенерированный workflow
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
    setShowAIGenerator(false);
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="sidebar"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="sidebar-header">
        <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Component Library</h3>
          <button onClick={onToggle} className="close-btn" style={{ padding: '4px' }}>
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
        <p className="sidebar-subtitle">Drag or tap to add to canvas</p>
        
        <div className="sidebar-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search components..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* AI Workflow Generator */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowAIGenerator(!showAIGenerator)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          <Wand2 size={20} />
          <span className="font-medium">AI Workflow Generator</span>
        </button>
        
        {showAIGenerator && (
          <div className="mt-4">
            <AIWorkflowGenerator onWorkflowGenerated={handleAIWorkflowGenerated} />
          </div>
        )}
      </div>

      <div className="sidebar-content">
        {filteredCategories.map(category => (
          <div key={category.name} className="sidebar-category">
            <div 
              className="category-header"
              onClick={() => toggleCategory(category.name)}
            >
              <div className="category-title">
                <category.icon size={16} />
                <span>{category.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="category-count">{category.nodes.length}</span>
                {expandedCategories.has(category.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            
            {expandedCategories.has(category.name) && (
              <div className="category-nodes">
                {category.nodes.map(nodeType => (
                  <div 
                    key={nodeType.label}
                    className="sidebar-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', nodeType.type);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => addNode(nodeType.type)}
                  >
                    <div className="sidebar-item-icon">
                      <nodeType.icon size={18} />
                    </div>
                    <div className="sidebar-item-content">
                      <div className="sidebar-item-label">{nodeType.label}</div>
                      <div className="sidebar-item-description">{nodeType.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-btn">
          <Globe size={16} />
          Import from Hub
        </button>
      </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
