import { useMemo, useState } from 'react';

const scenarios = [
  {
    title: 'Crowd flow reroute',
    prompt: 'Suggest the fastest route for fans leaving Gate B during heavy congestion.',
    intent: 'navigation'
  },
  {
    title: 'Accessibility support',
    prompt: 'Help a wheelchair user reach the accessible entrance with the least walking distance.',
    intent: 'accessibility'
  },
  {
    title: 'Transit guidance',
    prompt: 'Recommend the best public transit options for fans arriving from downtown.',
    intent: 'transportation'
  },
  {
    title: 'Sustainability action',
    prompt: 'Create a low-emission plan for volunteers moving between zones during peak hour.',
    intent: 'sustainability'
  }
];

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageValid, setImageValid] = useState(true);
  const [imagePreview, setImagePreview] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Persist theme to localStorage and set data attribute for CSS
  useState(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore (e.g., SSR or restricted environment)
    }
  });

  const insightCards = useMemo(() => [
    { label: 'Live crowd pressure', value: 'High near Gate B', tone: 'alert' },
    { label: 'Accessible routes', value: '4 priority paths open', tone: 'good' },
    { label: 'Transit load', value: 'Metro Line 2 82% full', tone: 'warn' },
    { label: 'Eco initiatives', value: '20 shuttles on electric mode', tone: 'good' }
  ], []);

  const askAssistant = async (prompt, image) => {
    setLoading(true);
    setError('');

    try {
      const payload = { prompt };
      const url = (image || '').trim();
      if (url && /^(https?:)\/\//i.test(url)) {
        payload.imageUrl = url;
      }

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Unable to generate guidance.');
      }

      setAnswer(data.reply);
    } catch (err) {
      setError(err.message || 'Unable to generate guidance.');
      setAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">FIFA World Cup 2026 • GenAI Stadium Operations</p>
          <h1>Smart venue guidance for organizers, fans, and staff.</h1>
          <p className="hero-copy">
            This command center combines multilingual support, crowd-aware routing, accessibility guidance,
            and sustainability insights to improve the tournament experience in real time.
          </p>
        </div>
        <div className="status-panel">
          <h2>Operational snapshot</h2>
          {insightCards.map((card) => (
            <div key={card.label} className={`metric ${card.tone}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <h3>Suggested scenarios</h3>
          <div className="scenario-list">
            {scenarios.map((item) => (
              <button key={item.title} onClick={() => askAssistant(item.prompt)} type="button">
                <strong>{item.title}</strong>
                <span>{item.prompt}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Ask the AI operations assistant</h3>
          <label className="sr-only" htmlFor="assistant-input">Ask the AI operations assistant</label>
          <textarea
            id="assistant-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask for navigation advice, accessibility help, transport reroutes, or sustainability actions..."
          />

          <label htmlFor="image-url" style={{ display: 'block', marginTop: 8 }}>Optional image URL (e.g., screenshot of a crowd area)</label>
          <input
            id="image-url"
            value={imageUrl}
            onChange={(e) => {
              const v = e.target.value;
              setImageUrl(v);
              // client-side validation
              try {
                const u = new URL(v);
                if (u.protocol === 'http:' || u.protocol === 'https:') {
                  setImageValid(true);
                  setImagePreview(v);
                } else {
                  setImageValid(false);
                  setImagePreview('');
                }
              } catch (err) {
                if (v.trim() === '') {
                  setImageValid(true);
                  setImagePreview('');
                } else {
                  setImageValid(false);
                  setImagePreview('');
                }
              }
            }}
            placeholder="https://example.com/crowd.jpg"
            style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 6, border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Optional image URL"
          />

          {!imageValid && <div className="error-text" role="alert">Image URL must be a valid http:// or https:// address.</div>}

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" onError={(e) => { setImageValid(false); e.currentTarget.style.display = 'none'; }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button className="primary" onClick={() => askAssistant(question || scenarios[0].prompt, imageUrl)} type="button" disabled={!imageValid || loading}>
              {loading ? 'Generating guidance...' : 'Generate guidance'}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark';
                setTheme(next);
                try { document.documentElement.setAttribute('data-theme', next); localStorage.setItem('theme', next); } catch (e) {}
              }}
              style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit' }}
            >
              Toggle theme
            </button>
          </div>
          <div className="answer-box" role="status" aria-live="polite">
            <h4>Response</h4>
            {error ? <p className="error-text">{error}</p> : <p>{answer || 'The assistant will provide a multilingual, venue-aware recommendation tailored to current conditions.'}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
