import { FONT_OPTIONS } from '../lib/constants';

export function TopBar({
  zoom,
  onZoom,
  pageCount,
  activePage,
  onPageChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  selectedElement,
  onStyleChange,
  onDuplicate,
  onDelete,
  darkMode,
  onToggleDarkMode,
}) {
  return (
    <header className="topbar">
      <div className="topbar-group">
        <button type="button" onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button type="button" onClick={onDuplicate} disabled={!selectedElement}>Duplicate</button>
        <button type="button" onClick={onDelete} disabled={!selectedElement}>Delete</button>
      </div>

      <div className="topbar-group">
        <button type="button" onClick={() => onZoom(Math.max(0.5, zoom - 0.1))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => onZoom(Math.min(2.5, zoom + 0.1))}>+</button>
      </div>

      <div className="topbar-group">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, activePage - 1))}
          disabled={activePage === 0}
        >
          Prev
        </button>
        <span>Page {activePage + 1} / {pageCount || 0}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, activePage + 1))}
          disabled={activePage >= pageCount - 1}
        >
          Next
        </button>
      </div>

      <div className="topbar-group topbar-style">
        <button type="button" onClick={onToggleDarkMode}>{darkMode ? 'Light' : 'Dark'}</button>
        {selectedElement?.type === 'text' && (
          <>
            <select
              value={selectedElement.style.fontFamily}
              onChange={(event) => onStyleChange({ fontFamily: event.target.value })}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
            <input
              type="number"
              min="8"
              max="72"
              value={selectedElement.style.fontSize}
              onChange={(event) => onStyleChange({ fontSize: Number(event.target.value) })}
            />
            <input
              type="color"
              value={selectedElement.style.color}
              onChange={(event) => onStyleChange({ color: event.target.value })}
            />
            <select
              value={selectedElement.style.align}
              onChange={(event) => onStyleChange({ align: event.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </>
        )}
        <button type="button" className="export-button" onClick={onExport}>Export PDF</button>
      </div>
    </header>
  );
}
