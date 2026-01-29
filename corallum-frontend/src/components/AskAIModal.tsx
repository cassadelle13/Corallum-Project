import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X } from 'lucide-react';

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskAIModal: React.FC<AskAIModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      alert(`AI Query: ${query}`);
      setQuery('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const showSuggestions = query.length === 0;

  return (
    <>
      <div className="ask-ai-overlay" onClick={onClose}></div>
      <div className={`ask-ai-container ${isOpen ? 'open' : ''}`}>
        {showSuggestions && (
          <div className="ask-ai-results">
            <div className="ask-ai-suggestions">
              <div className="suggestions-list">
                <button className="suggestion-item" onClick={() => setQuery('How do I create a new workflow?')}>
                  How do I create a new workflow?
                </button>
                <button className="suggestion-item" onClick={() => setQuery('Explain how to use triggers')}>
                  Explain how to use triggers
                </button>
                <button className="suggestion-item" onClick={() => setQuery('Show me examples of integrations')}>
                  Show me examples of integrations
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="ask-ai-search-bar">
          <Sparkles size={20} className="ask-ai-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="ask-ai-input"
            placeholder="Ask AI anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="button" 
            className="ask-ai-send-btn" 
            onClick={handleSubmit}
            disabled={!query.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

