import { useState, useMemo, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import CrowdMap from './components/CrowdMap';
import AccessibilityPanel from './components/AccessibilityPanel';
import LanguageSelector from './components/LanguageSelector';
import { useAccessibility } from './hooks/useAccessibility';
import { UI_STRINGS } from './i18n/languages';
import { fetchGreeting } from './api';

function makeSessionId() {
  return `session-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export default function App() {
  const [language, setLanguage] = useState('en');
  const [sessionId] = useState(makeSessionId);
  const [greeting, setGreeting] = useState('');
  const acc = useAccessibility();

  const strings = useMemo(() => UI_STRINGS[language] || UI_STRINGS.en, [language]);

  useEffect(() => {
    let mounted = true;
    fetchGreeting(language)
      .then((res) => {
        if (mounted) setGreeting(res.reply);
      })
      .catch(() => {
        if (mounted) setGreeting('');
      });
    return () => {
      mounted = false;
    };
  }, [language]);

  const rootClass = [
    'app-root',
    acc.highContrast ? 'high-contrast' : '',
    acc.largeText ? 'large-text' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <header className="app-header">
        <div>
          <h1>{strings.appName}</h1>
          <p className="tagline">{strings.tagline}</p>
        </div>
        <LanguageSelector language={language} onChange={setLanguage} />
      </header>

      {greeting && <p className="greeting-banner">{greeting}</p>}

      <main className="app-main">
        <ChatWindow sessionId={sessionId} language={language} strings={strings} onSpeak={acc.speak} />
        <CrowdMap strings={strings} />
      </main>

      <AccessibilityPanel
        strings={strings}
        highContrast={acc.highContrast}
        setHighContrast={acc.setHighContrast}
        largeText={acc.largeText}
        setLargeText={acc.setLargeText}
        voiceReplies={acc.voiceReplies}
        setVoiceReplies={acc.setVoiceReplies}
      />
    </div>
  );
}
