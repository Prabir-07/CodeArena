import { Button } from '../../../components/ui/Button';

export function EditorShell({ languages, languageId, onLanguageChange, code, onCodeChange, onReset, onRun, onSubmit, running }) {
  return (
    <div className="editor-shell">
      <div className="editor-shell__toolbar">
        <label className="editor-shell__language">
          <span>Language</span>
          <select value={languageId} onChange={(event) => onLanguageChange(event.target.value)} disabled={Boolean(running)}>
            {languages.map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
          </select>
        </label>
        <Button variant="secondary" size="small" type="button" onClick={onReset} disabled={Boolean(running)}>Reset code</Button>
      </div>
      <textarea
        className="editor-shell__code"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        spellCheck={false}
        aria-label="Code editor"
      />
      <div className="editor-shell__actions">
        <Button variant="secondary" type="button" onClick={onRun} disabled={Boolean(running)}>{running === 'run' ? 'Running…' : 'Run'}</Button>
        <Button type="button" onClick={onSubmit} disabled={Boolean(running)}>{running === 'submit' ? 'Submitting…' : 'Submit'}</Button>
      </div>
    </div>
  );
}
