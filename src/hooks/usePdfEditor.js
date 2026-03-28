import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { DEFAULT_TEXT_STYLE, DEFAULT_ZOOM, MAX_FILE_SIZE_MB, TOOL_IDS } from '../lib/constants';
import { exportEditedPdf } from '../lib/pdfExport';
import { pdfjsLib } from '../lib/pdfWorker';
import { useUndoRedo } from './useUndoRedo';

const initialEditorState = {
  elementsByPage: {},
  selectedId: null,
};

function createId(prefix = 'item') {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function usePdfEditor() {
  const [fileName, setFileName] = useState('');
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageMeta, setPageMeta] = useState([]);
  const [textLayers, setTextLayers] = useState({});
  const [activeTool, setActiveTool] = useState(TOOL_IDS.SELECT);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [activePage, setActivePage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Upload a PDF to begin.');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [ocrPageIndex, setOcrPageIndex] = useState(null);
  const [textDraft, setTextDraft] = useState({ text: 'New text', style: DEFAULT_TEXT_STYLE });
  const objectUrlsRef = useRef([]);

  const editor = useUndoRedo(initialEditorState);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const elementsByPage = editor.state.elementsByPage;
  const selectedElement = useMemo(() => {
    if (!editor.state.selectedId) {
      return null;
    }
    return Object.values(elementsByPage)
      .flat()
      .find((item) => item.id === editor.state.selectedId) || null;
  }, [editor.state.selectedId, elementsByPage]);

  const updateElements = useCallback((updater) => {
    editor.setState((current) => ({
      ...current,
      elementsByPage: updater(current.elementsByPage),
    }));
  }, [editor]);

  const setSelectedId = useCallback((selectedId) => {
    editor.setState((current) => ({ ...current, selectedId }));
  }, [editor]);

  const loadPdf = useCallback(async (file) => {
    if (!file) {
      return;
    }
    setError('');
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_FILE_SIZE_MB}MB safeguard. Increase the limit in src/lib/constants.js if needed.`);
      return;
    }

    setIsBusy(true);
    setLoadingMessage('Loading PDF and extracting layout...');

    try {
      const bytes = await file.arrayBuffer();
      const nextDoc = await pdfjsLib.getDocument({
        data: bytes,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise;

      const meta = [];
      const nextTextLayers = {};
      for (let index = 0; index < nextDoc.numPages; index += 1) {
        const page = await nextDoc.getPage(index + 1);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        meta.push({
          pageIndex: index,
          width: viewport.width,
          height: viewport.height,
          scaleBase: 1,
        });
        nextTextLayers[index] = textContent.items.map((item) => {
          const [a, b, c, d, e, f] = item.transform;
          return {
            id: createId('text-content'),
            text: item.str,
            x: e / viewport.width,
            y: 1 - (f / viewport.height),
            width: Math.max(0.02, item.width / viewport.width),
            height: Math.max(0.014, Math.abs(d) / viewport.height),
            fontSize: Math.max(8, Math.abs(d)),
          };
        });
      }

      setPdfDoc(nextDoc);
      setSourceBytes(bytes);
      setPageMeta(meta);
      setTextLayers(nextTextLayers);
      setFileName(file.name);
      setActivePage(0);
      setZoom(DEFAULT_ZOOM);
      editor.resetState(initialEditorState);
      setLoadingMessage(`Loaded ${file.name}`);
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load PDF. The file may be encrypted or unsupported.');
    } finally {
      setIsBusy(false);
    }
  }, [editor]);

  const addElement = useCallback((pageIndex, element) => {
    updateElements((current) => {
      const nextPageElements = [...(current[pageIndex] || []), element];
      return { ...current, [pageIndex]: nextPageElements };
    });
    setSelectedId(element.id);
  }, [setSelectedId, updateElements]);

  const addTextElement = useCallback((pageIndex, position, overrides = {}) => {
    addElement(pageIndex, {
      id: createId('text'),
      type: 'text',
      pageIndex,
      text: overrides.text ?? textDraft.text,
      x: position.x,
      y: position.y,
      width: overrides.width ?? 0.24,
      height: overrides.height ?? 0.05,
      style: {
        ...DEFAULT_TEXT_STYLE,
        ...textDraft.style,
        ...(overrides.style || {}),
      },
    });
  }, [addElement, textDraft]);

  const replaceTextItem = useCallback((pageIndex, sourceItem, replacementText) => {
    addElement(pageIndex, {
      id: createId('text'),
      type: 'text',
      pageIndex,
      text: replacementText,
      x: sourceItem.x,
      y: sourceItem.y - sourceItem.height,
      width: Math.max(0.05, sourceItem.width),
      height: Math.max(0.025, sourceItem.height * 1.45),
      eraseRect: true,
      style: {
        ...DEFAULT_TEXT_STYLE,
        ...textDraft.style,
        fontSize: Math.max(10, sourceItem.fontSize),
      },
      sourceTextId: sourceItem.id,
    });
  }, [addElement, textDraft.style]);

  const updateElement = useCallback((elementId, updater) => {
    updateElements((current) => {
      const next = {};
      for (const [pageIndex, items] of Object.entries(current)) {
        next[pageIndex] = items.map((item) => (
          item.id === elementId ? updater(item) : item
        ));
      }
      return next;
    });
  }, [updateElements]);

  const removeElement = useCallback((elementId) => {
    updateElements((current) => {
      const next = {};
      for (const [pageIndex, items] of Object.entries(current)) {
        next[pageIndex] = items.filter((item) => item.id !== elementId);
      }
      return next;
    });
    if (editor.state.selectedId === elementId) {
      setSelectedId(null);
    }
  }, [editor.state.selectedId, setSelectedId, updateElements]);

  const duplicateSelected = useCallback(() => {
    if (!selectedElement) {
      return;
    }
    addElement(selectedElement.pageIndex, {
      ...selectedElement,
      id: createId(selectedElement.type),
      x: clamp(selectedElement.x + 0.02, 0, 0.9),
      y: clamp(selectedElement.y + 0.02, 0, 0.9),
    });
  }, [addElement, selectedElement]);

  const addImageElement = useCallback((pageIndex, file, signature = false) => {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    addElement(pageIndex, {
      id: createId(signature ? 'signature' : 'image'),
      type: signature ? 'signature' : 'image',
      pageIndex,
      src: url,
      x: 0.15,
      y: 0.15,
      width: 0.22,
      height: 0.12,
      style: {},
    });
  }, [addElement]);

  const runOcrForPage = useCallback(async (pageIndex, canvas) => {
    if (!canvas) {
      return;
    }
    setOcrPageIndex(pageIndex);
    try {
      const result = await Tesseract.recognize(canvas, 'eng');
      const lines = result.data.lines || [];
      setTextLayers((current) => ({
        ...current,
        [pageIndex]: lines.map((line) => ({
          id: createId('ocr'),
          text: line.text,
          x: line.bbox.x0 / canvas.width,
          y: line.bbox.y0 / canvas.height,
          width: (line.bbox.x1 - line.bbox.x0) / canvas.width,
          height: (line.bbox.y1 - line.bbox.y0) / canvas.height,
          fontSize: Math.max(10, line.bbox.y1 - line.bbox.y0),
        })),
      }));
    } catch (ocrError) {
      console.error(ocrError);
      setError('OCR failed for this page.');
    } finally {
      setOcrPageIndex(null);
    }
  }, []);

  const exportPdf = useCallback(async () => {
    if (!sourceBytes || !pageMeta.length) {
      return;
    }
    setIsBusy(true);
    setLoadingMessage('Generating edited PDF...');
    try {
      const bytes = await exportEditedPdf({
        sourceBytes,
        pageDimensions: pageMeta,
        elementsByPage,
      });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName.replace(/\.pdf$/i, '') + '-edited.pdf';
      anchor.click();
      setLoadingMessage('Edited PDF exported.');
    } catch (exportError) {
      console.error(exportError);
      setError('Failed to export the edited PDF.');
    } finally {
      setIsBusy(false);
    }
  }, [elementsByPage, fileName, pageMeta, sourceBytes]);

  return {
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
    selectedId: editor.state.selectedId,
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
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
    undo: editor.undo,
    redo: editor.redo,
    textDraft,
    setTextDraft,
  };
}
