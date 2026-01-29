import React, { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { Node } from '@xyflow/react';

interface DataMapperProps {
  currentNodeId: string;
  availableNodes: Node[];
  onInsertReference?: (reference: string) => void;
}

interface NodeOutput {
  field: string;
  type: string;
  description?: string;
}

export const DataMapper: React.FC<DataMapperProps> = ({ 
  currentNodeId, 
  availableNodes
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeOutputs = (node: Node): NodeOutput[] => {
    // Mock outputs based on node type - in real implementation, 
    // this would be derived from node's schema or execution results
    const outputsByType: Record<string, NodeOutput[]> = {
      'action': [
        { field: 'result', type: 'any', description: 'Action result' },
        { field: 'status', type: 'string', description: 'Execution status' }
      ],
      'database': [
        { field: 'rows', type: 'array', description: 'Query results' },
        { field: 'count', type: 'number', description: 'Row count' }
      ],
      'script': [
        { field: 'output', type: 'any', description: 'Script output' },
        { field: 'logs', type: 'string', description: 'Execution logs' }
      ],
      'default': [
        { field: 'output', type: 'any', description: 'Node output' }
      ]
    };

    const nodeType = node.type || 'default';
    return outputsByType[nodeType] || outputsByType['default'];
  };

  const handleCopyReference = (reference: string) => {
    navigator.clipboard.writeText(reference);
    setCopiedRef(reference);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const previousNodes = availableNodes.filter(n => n.id !== currentNodeId);

  if (previousNodes.length === 0) {
    return (
      <div className="data-mapper-empty">
        <Database size={48} className="empty-icon" />
        <h4>No Data Sources Available</h4>
        <p>Connect nodes to this node to access their outputs</p>
      </div>
    );
  }

  return (
    <div className="data-mapper">
      <div className="data-mapper-header">
        <Database size={16} />
        <h4>Available Data Sources</h4>
      </div>
      
      <div className="data-mapper-content">
        {previousNodes.map(node => {
          const isExpanded = expandedNodes.has(node.id);
          const outputs = getNodeOutputs(node);
          
          return (
            <div key={node.id} className="data-node">
              <div 
                className="data-node-header"
                onClick={() => toggleNode(node.id)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Database size={14} />
                <span className="data-node-name">{String(node.data.label || node.id)}</span>
                <span className="data-node-id">{node.id}</span>
              </div>
              
              {isExpanded && (
                <div className="data-node-outputs">
                  {outputs.map(output => {
                    const reference = `{{nodes.${node.id}.output.${output.field}}}`;
                    const isCopied = copiedRef === reference;
                    
                    return (
                      <div key={output.field} className="data-output-item">
                        <div className="output-info">
                          <span className="output-field">{output.field}</span>
                          <span className="output-type">{output.type}</span>
                        </div>
                        {output.description && (
                          <p className="output-description">{output.description}</p>
                        )}
                        <div className="output-reference">
                          <code>{reference}</code>
                          <button
                            className="btn-copy-ref"
                            onClick={() => handleCopyReference(reference)}
                            title="Copy reference"
                          >
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Whole node output reference */}
                  <div className="data-output-item whole-output">
                    <div className="output-info">
                      <span className="output-field">* (entire output)</span>
                      <span className="output-type">object</span>
                    </div>
                    <div className="output-reference">
                      <code>{`{{nodes.${node.id}.output}}`}</code>
                      <button
                        className="btn-copy-ref"
                        onClick={() => handleCopyReference(`{{nodes.${node.id}.output}}`)}
                        title="Copy reference"
                      >
                        {copiedRef === `{{nodes.${node.id}.output}}` ? 
                          <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="data-mapper-footer">
        <div className="reference-syntax">
          <h5>Reference Syntax</h5>
          <p>Use <code>{`{{nodes.NODE_ID.output.FIELD}}`}</code> to reference data</p>
        </div>
      </div>
    </div>
  );
};
