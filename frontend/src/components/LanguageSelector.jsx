import PropTypes from 'prop-types';
import { LANGUAGES } from '../i18n/languages';

export default function LanguageSelector({ language, onChange }) {
  return (
    <label className="language-selector">
      <span className="visually-hidden">Select language</span>
      <select value={language} onChange={(e) => onChange(e.target.value)} aria-label="Select language">
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

LanguageSelector.propTypes = {
  language: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
