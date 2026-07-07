import PropTypes from 'prop-types';

export default function AccessibilityPanel({
  strings,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  voiceReplies,
  setVoiceReplies,
}) {
  return (
    <section className="accessibility-panel" aria-label={strings.accessibility}>
      <h2>{strings.accessibility}</h2>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
          aria-checked={highContrast}
        />
        {strings.highContrast}
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={largeText}
          onChange={(e) => setLargeText(e.target.checked)}
          aria-checked={largeText}
        />
        {strings.largeText}
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={voiceReplies}
          onChange={(e) => setVoiceReplies(e.target.checked)}
          aria-checked={voiceReplies}
        />
        {strings.voiceReplies}
      </label>
    </section>
  );
}

AccessibilityPanel.propTypes = {
  strings: PropTypes.object.isRequired,
  highContrast: PropTypes.bool.isRequired,
  setHighContrast: PropTypes.func.isRequired,
  largeText: PropTypes.bool.isRequired,
  setLargeText: PropTypes.func.isRequired,
  voiceReplies: PropTypes.bool.isRequired,
  setVoiceReplies: PropTypes.func.isRequired,
};
