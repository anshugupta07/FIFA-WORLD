import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { sendChatMessage } from '../api';

export default function ChatWindow({ sessionId, language, strings, onSpeak }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed, id: `u-${Date.now()}` };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await sendChatMessage({ sessionId, message: trimmed, language });
      const botMsg = { role: 'bot', text: res.reply, id: `b-${Date.now()}` };
      setMessages((prev) => [...prev, botMsg]);
      onSpeak?.(res.reply, language);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat-window" aria-label="Chat assistant">
      <ul className="chat-messages" ref={listRef} aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            {m.text}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="chat-error">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="chat-input-row">
        <label htmlFor="chat-input" className="visually-hidden">
          {strings.placeholder}
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={strings.placeholder}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {strings.send}
        </button>
      </form>
    </section>
  );
}

ChatWindow.propTypes = {
  sessionId: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  strings: PropTypes.object.isRequired,
  onSpeak: PropTypes.func,
};
