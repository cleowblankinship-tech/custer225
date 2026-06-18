import { conversations, tools } from '../../data/conversations';

export default function Sidebar({ activeId, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="wordmark">
          <span className="wordmark-petra">Petra</span>
          <span className="wordmark-assistant">Assistant</span>
        </div>
        <button className="new-conversation-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New conversation
        </button>
      </div>

      <div className="sidebar-section-label">Recent</div>
      <nav className="conversation-list">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="conv-title">{conv.title}</div>
            <div className="conv-meta">
              <span className="conv-preview">{conv.preview}</span>
              <span className="conv-time">{conv.timestamp}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-tools">
        <div className="sidebar-section-label">Tools</div>
        {tools.map((tool) => (
          <div key={tool.id} className="tool-item">
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
            {tool.status === 'coming-soon' && (
              <span className="tool-badge">Soon</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
