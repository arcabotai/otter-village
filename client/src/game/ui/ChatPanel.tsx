import { useRef, useEffect } from 'react';
import { useChatStore } from '../../state/chatStore';
import { useInputStore } from '../../state/inputStore';
import { useConnectionStore } from '../../state/connectionStore';

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isOpen = useChatStore((s) => s.isOpen);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens, update inputStore
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      useInputStore.getState().setChatFocused(true);
    } else {
      useInputStore.getState().setChatFocused(false);
    }
  }, [isOpen]);

  function handleSend() {
    const input = inputRef.current;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('event', { type: 'ChatMessage', content: text });
    }
    input.value = '';
  }

  if (!isOpen) return null;

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        bottom: 80,
        right: 16,
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        fontFamily: 'system-ui',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>💬 Chat</span>
        <button
          onClick={toggleChat}
          style={{
            background: 'none',
            border: 'none',
            color: '#a0a0b0',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px',
          fontSize: 13,
          lineHeight: 1.5,
          minHeight: 120,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#a0a0b0', textAlign: 'center', padding: 20 }}>
            No messages yet
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#7ec8e3' }}>{msg.displayName}: </span>
            <span style={{ color: '#e0e0e0' }}>{msg.content}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        padding: '8px 10px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        gap: 6,
      }}>
        <input
          ref={inputRef}
          className="input"
          type="text"
          placeholder="Type a message..."
          maxLength={200}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              handleSend();
            }
            // Don't propagate game keys while typing
            e.stopPropagation();
          }}
          style={{ flex: 1, fontSize: 13, minHeight: 38, padding: '6px 10px' }}
        />
        <button
          className="btn"
          onClick={handleSend}
          style={{ padding: '6px 14px', fontSize: 13, minHeight: 38 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
