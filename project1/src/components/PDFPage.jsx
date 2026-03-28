import { useEffect, useRef, useState } from 'react';
import { TOOL_IDS } from '../lib/constants';

const browserFontMap = {
  Helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  HelveticaBold: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  TimesRoman: '"Times New Roman", Georgia, serif',
  TimesRomanBold: '"Times New Roman", Georgia, serif',
  Courier: '"Courier New", Courier, monospace',
};

function pagePoint(event, rect) {
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

export function PDFPage({
  pdfDoc,
  pageInfo,
  zoom,
  activeTool,
  overlays,
  textItems,
  selectedId,
  onSelected,
  onAddText,
  onReplaceText,
  onAddShape,
  onMoveElement,
  onResizeElement,
  onRunOcr,
  isOcrActive,
}) {
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const renderRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setIsVisible(entries[0].isIntersecting);
        }
      },
      { rootMargin: '600px' },
    );
    if (pageRef.current) {
      observer.observe(pageRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function renderPage() {
      if (!isVisible || !pdfDoc || !canvasRef.current) {
        return;
      }
      const page = await pdfDoc.getPage(pageInfo.pageIndex + 1);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { alpha: false });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      if (renderRef.current) {
        renderRef.current.cancel();
      }
      renderRef.current = page.render({ canvasContext: context, viewport });
      await renderRef.current.promise;
    }

    renderPage().catch((error) => {
      if (error?.name !== 'RenderingCancelledException') {
        console.error(error);
      }
    });

    return () => {
      if (renderRef.current) {
        renderRef.current.cancel();
      }
    };
  }, [isVisible, pageInfo.pageIndex, pdfDoc, zoom]);

  function handleCanvasClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = pagePoint(event, rect);
    if (activeTool === TOOL_IDS.TEXT) {
      onAddText(pageInfo.pageIndex, point);
    }
    if (activeTool === TOOL_IDS.HIGHLIGHT) {
      onAddShape(pageInfo.pageIndex, {
        id: crypto.randomUUID(),
        type: 'highlight',
        pageIndex: pageInfo.pageIndex,
        x: point.x,
        y: point.y,
        width: 0.2,
        height: 0.03,
        style: {},
      });
    }
    if (activeTool === TOOL_IDS.DRAW) {
      onAddShape(pageInfo.pageIndex, {
        id: crypto.randomUUID(),
        type: 'shape',
        pageIndex: pageInfo.pageIndex,
        x: point.x,
        y: point.y,
        width: 0.18,
        height: 0.08,
        style: { color: '#2563eb', strokeWidth: 2, fill: false },
      });
    }
    if (activeTool === TOOL_IDS.COMMENT) {
      onAddShape(pageInfo.pageIndex, {
        id: crypto.randomUUID(),
        type: 'comment',
        pageIndex: pageInfo.pageIndex,
        x: point.x,
        y: point.y,
        width: 0.22,
        height: 0.12,
        text: 'Comment',
        style: {},
      });
    }
  }

  function beginDrag(event, item, mode) {
    event.stopPropagation();
    const rect = pageRef.current.getBoundingClientRect();
    const point = pagePoint(event, rect);
    setDragState({
      elementId: item.id,
      mode,
      origin: point,
      startX: item.x,
      startY: item.y,
      startWidth: item.width,
      startHeight: item.height,
    });
    onSelected(item.id);
  }

  function moveDrag(event) {
    if (!dragState || !pageRef.current) {
      return;
    }
    const rect = pageRef.current.getBoundingClientRect();
    const point = pagePoint(event, rect);
    const deltaX = point.x - dragState.origin.x;
    const deltaY = point.y - dragState.origin.y;
    if (dragState.mode === 'move') {
      onMoveElement(dragState.elementId, {
        x: Math.max(0, dragState.startX + deltaX),
        y: Math.max(0, dragState.startY + deltaY),
      });
    }
    if (dragState.mode === 'resize') {
      onResizeElement(dragState.elementId, {
        width: Math.max(0.04, dragState.startWidth + deltaX),
        height: Math.max(0.02, dragState.startHeight + deltaY),
      });
    }
  }

  function endDrag() {
    setDragState(null);
  }

  return (
    <section className="page-shell" ref={pageRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerLeave={endDrag}>
      <div className="page-meta">
        <span>Page {pageInfo.pageIndex + 1}</span>
        {!textItems?.length && (
          <button type="button" onClick={() => onRunOcr(pageInfo.pageIndex, canvasRef.current)} disabled={isOcrActive}>
            {isOcrActive ? 'OCR running...' : 'Run OCR'}
          </button>
        )}
      </div>

      <div
        className="page-stage"
        style={{ width: pageInfo.width * zoom, height: pageInfo.height * zoom }}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="pdf-canvas" />

        <div className="text-hit-layer">
          {textItems?.map((item) => (
            <button
              key={item.id}
              type="button"
              className="text-hit"
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${item.width * 100}%`,
                height: `${item.height * 100}%`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                const replacement = window.prompt('Replace text', item.text);
                if (replacement !== null) {
                  onReplaceText(pageInfo.pageIndex, item, replacement);
                }
              }}
              title={item.text}
            />
          ))}
        </div>

        <div className="overlay-layer">
          {overlays?.map((item) => (
            <div
              key={item.id}
              className={item.id === selectedId ? 'overlay-item selected' : 'overlay-item'}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${item.width * 100}%`,
                height: `${item.height * 100}%`,
                color: item.style?.color,
                textAlign: item.style?.align,
                fontSize: `${(item.style?.fontSize || 14) * zoom}px`,
                fontFamily: browserFontMap[item.style?.fontFamily] || browserFontMap.Helvetica,
                background: item.eraseRect ? '#ffffff' : 'transparent',
              }}
              onPointerDown={(event) => beginDrag(event, item, 'move')}
              onClick={(event) => {
                event.stopPropagation();
                onSelected(item.id);
              }}
            >
              {item.type === 'text' && <div className="overlay-text">{item.text}</div>}
              {item.type === 'highlight' && <div className="overlay-highlight" />}
              {item.type === 'shape' && <div className="overlay-shape" style={{ borderColor: item.style.color }} />}
              {item.type === 'comment' && <div className="overlay-comment">{item.text}</div>}
              {(item.type === 'image' || item.type === 'signature') && <img src={item.src} alt={item.type} />}
              <button
                type="button"
                className="resize-handle"
                onPointerDown={(event) => beginDrag(event, item, 'resize')}
                aria-label="Resize"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
