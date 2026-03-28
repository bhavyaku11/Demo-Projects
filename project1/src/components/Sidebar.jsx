import { TOOL_IDS } from '../lib/constants';

const tools = [
  { id: TOOL_IDS.SELECT, label: 'Select' },
  { id: TOOL_IDS.TEXT, label: 'Text' },
  { id: TOOL_IDS.DRAW, label: 'Shape' },
  { id: TOOL_IDS.HIGHLIGHT, label: 'Highlight' },
  { id: TOOL_IDS.IMAGE, label: 'Image' },
  { id: TOOL_IDS.SIGNATURE, label: 'Signature' },
  { id: TOOL_IDS.COMMENT, label: 'Comment' },
];

export function Sidebar({ activeTool, onToolChange, fileName, onFilePick, darkMode }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <h1>PDF Studio</h1>
          <p>Local-first editor</p>
        </div>
      </div>

      <label className="upload-card">
        <input type="file" accept="application/pdf" onChange={onFilePick} hidden />
        <span>Open PDF</span>
        <small>{fileName || 'Supports large local files'}</small>
      </label>

      <nav className="tool-list">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={tool.id === activeTool ? 'tool-button active' : 'tool-button'}
            onClick={() => onToolChange(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>{darkMode ? 'Dark mode' : 'Light mode'}</span>
        <small>Edits stay on this device</small>
      </div>
    </aside>
  );
}
