import React, { useState, useEffect, useRef } from 'react';
import './ChatSection.css';
import './EnterpriseSection.css';

// Helper to generate a consistent, premium gradient for avatars based on user's name
const getAvatarGradient = (name) => {
  const colors = [
    ['#6366f1', '#4f46e5'], // Indigo/Violet
    ['#0ea5e9', '#0284c7'], // Sky/Ocean
    ['#10b981', '#059669'], // Emerald/Green
    ['#f59e0b', '#d97706'], // Amber/Orange
    ['#ec4899', '#db2777'], // Pink/Rose
    ['#3b82f6', '#2563eb'], // Blue/Royal
    ['#8b5cf6', '#7c3aed'], // Violet/Purple
    ['#ef4444', '#dc2626'], // Red/Crimson
  ];
  if (!name) return `linear-gradient(135deg, ${colors[0].join(', ')})`;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[index].join(', ')})`;
};

export default function ChatSection({ user }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [ws, setWs] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const clearTypingTimeoutsRef = useRef({});

  const department = user?.department;

  // Fetch department members
  useEffect(() => {
    if (!department) return;
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('acme_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/users/department/${encodeURIComponent(department)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (err) {
        console.error('Failed to fetch department members:', err);
      }
    };
    fetchMembers();
  }, [department]);

  // WebSocket and history setup
  useEffect(() => {
    if (!department) return;

    // Fetch initial history
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('acme_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/chat/history/${encodeURIComponent(department)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();

    // Connect WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/api/chat/ws/${encodeURIComponent(department)}/${user.id}`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      try {
        if (event.data === 'update') return;
        const newMsg = JSON.parse(event.data);
        if (newMsg.type === 'api_log') return;
        
        if (newMsg.type === 'typing') {
          if (newMsg.sender_id === user.id) return;
          
          setTypingUsers(prev => ({
            ...prev,
            [newMsg.sender_id]: newMsg.name
          }));
          
          if (clearTypingTimeoutsRef.current[newMsg.sender_id]) {
            clearTimeout(clearTypingTimeoutsRef.current[newMsg.sender_id]);
          }
          
          clearTypingTimeoutsRef.current[newMsg.sender_id] = setTimeout(() => {
            setTypingUsers(prev => {
              const newState = { ...prev };
              delete newState[newMsg.sender_id];
              return newState;
            });
          }, 3000);
          return;
        }
        
        // Chat message
        if (newMsg.content || newMsg.type === 'message') {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // Check if we are scrolled up to show "New messages below" instead of auto-scrolling
          if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
            if (isScrolledUp && newMsg.sender_id !== user.id) {
              setHasUnreadMessages(true);
            }
          }
          
          // clear their typing status immediately
          if (newMsg.sender_id) {
            setTypingUsers(prev => {
              const newState = { ...prev };
              delete newState[newMsg.sender_id];
              return newState;
            });
          }
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
      Object.values(clearTypingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [department, user?.id]);

  // Auto-scroll on initial load or own message
  useEffect(() => {
    if (!hasUnreadMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers, hasUnreadMessages]);

  // Track scroll position to hide "Scroll to Bottom" button when at bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isAtBottom && hasUnreadMessages) {
      setHasUnreadMessages(false);
    }
  };

  const scrollToBottom = () => {
    setHasUnreadMessages(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({ type: 'message', content: inputValue.trim() }));
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (ws && ws.readyState === WebSocket.OPEN && e.key !== 'Enter') {
      if (!typingTimeoutRef.current) {
        ws.send(JSON.stringify({ type: 'typing' }));
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    }
  };

  if (!department) {
    return (
      <div className="chat-section-root">
        <div className="chat-no-department">
          <div className="chat-no-dept-icon">💬</div>
          <h3>No Department Assigned</h3>
          <p>You need to be assigned to a department in your profile to participate in team chat.</p>
        </div>
      </div>
    );
  }

  // Format messages with date dividers
  const renderMessages = () => {
    let lastDateStr = null;
    const elements = [];

    messages.forEach((msg, idx) => {
      const msgDate = new Date(msg.timestamp);
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateStr = msgDate.toLocaleDateString();
      if (msgDate.toDateString() === today.toDateString()) {
        dateStr = "Today";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateStr = "Yesterday";
      } else {
        dateStr = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (dateStr !== lastDateStr) {
        elements.push(
          <div key={`date-${dateStr}`} className="chat-date-divider">
            <span>{dateStr}</span>
          </div>
        );
        lastDateStr = dateStr;
      }

      const isOwn = msg.sender_id === user.id;
      const initials = (msg.sender?.name || 'U').charAt(0).toUpperCase();
      const avatarStyle = msg.sender?.profile_pic_url
        ? { backgroundImage: `url(${msg.sender.profile_pic_url})`, backgroundSize: 'cover' }
        : { background: getAvatarGradient(msg.sender?.name || 'User') };

      elements.push(
        <div key={msg.id || idx} className={`chat-message-wrapper ${isOwn ? 'own-message' : 'other-message'}`}>
          <div className="chat-avatar" style={avatarStyle}>
            {!msg.sender?.profile_pic_url && initials}
          </div>
          
          <div className="chat-message-content">
            <div className="chat-sender-info">
              <span>{isOwn ? 'You' : msg.sender?.name}</span>
              <span className="chat-time">
                {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="chat-bubble">
              {msg.content}
            </div>
          </div>
        </div>
      );
    });
    
    return elements;
  };

  const typingNames = Object.values(typingUsers);
  let typingText = '';
  if (typingNames.length === 1) typingText = `${typingNames[0]} is typing...`;
  else if (typingNames.length === 2) typingText = `${typingNames[0]} and ${typingNames[1]} are typing...`;
  else if (typingNames.length > 2) typingText = `Several people are typing...`;

  return (
    <div className="chat-section-root">
      <div className="es-command-bar chat-header-override">
        <div className="es-cmd-left">
          <div className="es-breadcrumb">
            <span className="chat-status-pulse"></span>
            ⬡ Team Communication / <span>Department Chat</span>
          </div>
          <h1 className="es-page-title">{department}</h1>
          <p className="es-page-sub">Real-time collaboration and messaging</p>
        </div>
        
        <div className="chat-header-members">
          <div className="chat-members-avatars">
            {members.slice(0, 4).map((member) => (
              <div 
                key={member.id} 
                className="chat-header-avatar"
                style={{ 
                  background: member.profile_pic_url ? 'none' : getAvatarGradient(member.name) 
                }}
                title={member.name}
              >
                {member.profile_pic_url ? (
                  <img src={member.profile_pic_url} alt={member.name} />
                ) : (
                  (member.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {members.length > 4 && (
              <div className="chat-header-avatar-more" title={`${members.length - 4} more members`}>
                +{members.length - 4}
              </div>
            )}
          </div>
          <span className="chat-members-count">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
      
      <div 
        ref={messagesContainerRef} 
        className="chat-messages-container"
        onScroll={handleScroll}
      >
        {isLoadingHistory ? (
          <div className="chat-loading">
            <div className="chat-spinner"></div>
            Loading messages...
          </div>
        ) : (
          renderMessages()
        )}
        
        {typingText && (
          <div className="chat-typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-text">{typingText}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {hasUnreadMessages && (
        <button className="chat-scroll-bottom-btn" onClick={scrollToBottom} title="Scroll to bottom">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          New messages below
        </button>
      )}
      
      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-input-form">

          
          <input
            type="text"
            className="chat-input"
            placeholder={`Message ${department}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
