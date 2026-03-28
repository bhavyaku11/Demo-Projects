export function InspectorPanel({
  selectedElement,
  textDraft,
  onTextDraftChange,
  onSelectedContentChange,
  onAddImage,
  onAddSignature,
}) {
  return (
    <aside className="inspector">
      <section>
        <h2>Insert Text</h2>
        <textarea
          value={textDraft.text}
          onChange={(event) => onTextDraftChange({ ...textDraft, text: event.target.value })}
          rows={4}
        />
      </section>

      <section>
        <h2>Add Asset</h2>
        <label className="ghost-upload">
          <input type="file" accept="image/png,image/jpeg" hidden onChange={onAddImage} />
          <span>Insert image</span>
        </label>
        <label className="ghost-upload">
          <input type="file" accept="image/png,image/jpeg" hidden onChange={onAddSignature} />
          <span>Add signature</span>
        </label>
      </section>

      <section>
        <h2>Selection</h2>
        {selectedElement ? (
          <>
            <p><strong>Type:</strong> {selectedElement.type}</p>
            {selectedElement.type === 'text' || selectedElement.type === 'comment' ? (
              <textarea
                value={selectedElement.text}
                rows={5}
                onChange={(event) => onSelectedContentChange(event.target.value)}
              />
            ) : (
              <p>Drag to reposition. Resize from the lower-right handle.</p>
            )}
          </>
        ) : (
          <p>Select an overlay element or click a text box to start editing.</p>
        )}
      </section>
    </aside>
  );
}
