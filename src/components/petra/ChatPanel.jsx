import { useState, useRef, useEffect } from 'react';
import {
  DistributionClauseResponse,
  SpreadsheetComparisonResponse,
  MartinezBriefingResponse,
  SimpleResponse,
} from './MessageContent';

function AttachmentChip({ attachment }) {
  return (
    <div className="attachment-chip">
      <span className="attachment-icon">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
          <rect x="1" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4 5h6M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </span>
      <div className="attachment-info">
        <span className="attachment-name">{attachment.name}</span>
        <span className="attachment-meta">{attachment.size} · {attachment.pages} pages</span>
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="message message-user">
      <div className="message-bubble">
        {message.attachment && <AttachmentChip attachment={message.attachment} />}
        {message.content && <p>{message.content}</p>}
      </div>
      <div className="message-time">{message.timestamp}</div>
    </div>
  );
}

function AssistantMessage({ message }) {
  const renderContent = () => {
    switch (message.type) {
      case 'distribution-clause':
        return <DistributionClauseResponse />;
      case 'spreadsheet-comparison':
        return <SpreadsheetComparisonResponse />;
      case 'martinez-briefing':
        return <MartinezBriefingResponse />;
      default:
        return <SimpleResponse content={message.content} />;
    }
  };

  return (
    <div className="message message-assistant">
      <div className="assistant-avatar">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8.5" fill="#9A7611" fillOpacity="0.12" stroke="#9A7611" strokeWidth="1"/>
          <path d="M9 5v4l2.5 2.5" stroke="#9A7611" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="9" r="1" fill="#9A7611"/>
        </svg>
      </div>
      <div className="assistant-content">
        {renderContent()}
        <div className="message-time">{message.timestamp}</div>
      </div>
    </div>
  );
}

function DemoTooltip({ x, y, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="demo-tooltip" style={{ left: x, top: y }}>
      Demo mode — responses are pre-written for this preview.
    </div>
  );
}

export default function ChatPanel({ conversation }) {
  const [inputValue, setInputValue] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.id]);

  const handleSend = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left - 200, y: rect.top - 48 });
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) handleSend(e);
    }
  };

  return (
    <main className="chat-panel">
      <div className="demo-banner">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M6.5 4v3.5M6.5 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Demo Preview — Not Connected to Live Client Data
      </div>

      <div className="chat-header">
        <div className="chat-header-title">{conversation.title}</div>
        <div className="chat-header-meta">{conversation.timestamp}</div>
      </div>

      <div className="messages-area">
        {conversation.messages.map((msg) =>
          msg.role === 'user' ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AssistantMessage key={msg.id} message={msg} />
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-box">
          <button className="input-action-btn" title="Attach document">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 7.5l-6 6a4 4 0 01-5.657-5.657l6.364-6.364a2.5 2.5 0 013.535 3.535L5.379 11.38a1 1 0 01-1.415-1.414l6.364-6.364"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about a client document, build a spreadsheet, or draft a report…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`send-btn ${inputValue.trim() ? 'send-btn-active' : ''}`}
            onClick={inputValue.trim() ? handleSend : undefined}
            title="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8H2M14 8l-4-4M14 8l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="input-footer">
          <span className="claude-badge">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" fill="#D97706" fillOpacity="0.15" stroke="#D97706" strokeWidth="0.8"/>
              <path d="M5 2.5v2.5l1.5 1.5" stroke="#D97706" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            AI: Claude
          </span>
        </div>
      </div>

      {tooltip && (
        <DemoTooltip x={tooltip.x} y={tooltip.y} onClose={() => setTooltip(null)} />
      )}
    </main>
  );
}
