import { useEffect, useState } from 'react';
import { InspectorPanel } from './components/InspectorPanel';
import { PDFPage } from './components/PDFPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TOOL_IDS } from './lib/constants';
import { usePdfEditor } from './hooks/usePdfEditor';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const {
    fileName,
    pdfDoc,
    pageMeta,
    textLayers,
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    activePage,
    setActivePage,
    loadingMessage,
    error,
    isBusy,
    loadPdf,
    elementsByPage,
    selectedElement,
    selectedId,
    setSelectedId,
    addTextElement,
    replaceTextItem,
    updateElement,
    removeElement,
    duplicateSelected,
    addImageElement,
    addElement,
    runOcrForPage,
    ocrPageIndex,
    exportPdf,
    canUndo,
    canRedo,
    undo,
    redo,
    textDraft,
    setTextDraft,
  } = usePdfEditor();

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    function handleKeyDown(event) {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        const target = event.target;
        const isTyping = target instanceof HTMLElement
          && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
        if (!isTyping) {
          event.preventDefault();
          removeElement(selectedElement.id);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, removeElement, selectedElement, undo]);

  function handleFilePick(event) {
    const file = event.target.files?.[0];
    if (file) {
      loadPdf(file);
      event.target.value = '';
    }
  }

  function handleAssetPick(signature = false) {
    return (event) => {
      const file = event.target.files?.[0];
      if (file && pageMeta.length) {
        addImageElement(activePage, file, signature);
      }
      event.target.value = '';
    };
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        fileName={fileName}
        onFilePick={handleFilePick}
        darkMode={darkMode}
      />

      <main className="workspace">
        <TopBar
          zoom={zoom}
          onZoom={setZoom}
          pageCount={pageMeta.length}
          activePage={activePage}
          onPageChange={setActivePage}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onExport={exportPdf}
          selectedElement={selectedElement}
          onStyleChange={(stylePatch) => {
            if (!selectedElement) {
              return;
            }
            updateElement(selectedElement.id, (current) => ({
              ...current,
              style: { ...current.style, ...stylePatch },
            }));
          }}
          onDuplicate={duplicateSelected}
          onDelete={() => selectedElement && removeElement(selectedElement.id)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
        />

        <div className="status-bar">
          <span>{loadingMessage}</span>
          {isBusy && <div className="spinner" />}
          {error && <span className="error-text">{error}</span>}
          <span>{pdfDoc ? `${pageMeta.length} pages` : 'No file loaded'}</span>
        </div>

        <div className="editor-layout">
          <section className="page-column">
            {pageMeta.length === 0 && (
              <div className="empty-state">
                <h2>Production-ready local PDF editing</h2>
                <p>Open a PDF, click text to replace it, add overlays, run OCR for scanned pages, and export without sending the file to a server.</p>
              </div>
            )}

            {pageMeta.map((page) => (
              <PDFPage
                key={page.pageIndex}
                pdfDoc={pdfDoc}
                pageInfo={page}
                zoom={zoom}
                activeTool={activeTool}
                overlays={elementsByPage[page.pageIndex] || []}
                textItems={textLayers[page.pageIndex] || []}
                selectedId={selectedId}
                onSelected={(id) => {
                  setSelectedId(id);
                  setActivePage(page.pageIndex);
                  setActiveTool(TOOL_IDS.SELECT);
                }}
                onAddText={(pageIndex, point) => {
                  setActivePage(pageIndex);
                  addTextElement(pageIndex, point);
                }}
                onReplaceText={replaceTextItem}
                onAddShape={(pageIndex, item) => {
                  setActivePage(pageIndex);
                  addElement(pageIndex, item);
                }}
                onMoveElement={(elementId, patch) => {
                  updateElement(elementId, (current) => ({ ...current, ...patch }));
                }}
                onResizeElement={(elementId, patch) => {
                  updateElement(elementId, (current) => ({ ...current, ...patch }));
                }}
                onRunOcr={runOcrForPage}
                isOcrActive={ocrPageIndex === page.pageIndex}
              />
            ))}
          </section>

          <InspectorPanel
            selectedElement={selectedElement}
            textDraft={textDraft}
            onTextDraftChange={setTextDraft}
            onSelectedContentChange={(value) => {
              if (!selectedElement) {
                return;
              }
              updateElement(selectedElement.id, (current) => ({ ...current, text: value }));
            }}
            onAddImage={handleAssetPick(false)}
            onAddSignature={handleAssetPick(true)}
          />
        </div>
      </main>
    </div>
  );
}
