// components/CVUploadZone.tsx
"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function CVUploadZone({ file, onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const validate = (f: File): string => {
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > 5 * 1024 * 1024) return "File size must not exceed 5MB.";
    return "";
  };

  const handleFile = (f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError("");
    onFileChange(f);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        style={{ display: "none" }}
        id="cv-file-input"
      />

      {file ? (
        /* File selected state */
        <div className="glass-card" style={{
          padding: "24px", display: "flex", alignItems: "center",
          gap: "16px", borderColor: "rgba(34, 197, 94, 0.3)"
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "12px", flexShrink: 0,
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px"
          }}>📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 600, fontSize: "14px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: "4px"
            }}>{file.name}</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {formatSize(file.size)} · PDF
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onFileChange(null); setError(""); }}
            className="btn-ghost"
            style={{ flexShrink: 0, padding: "6px 10px", fontSize: "12px" }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload CV PDF"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>
            {dragging ? "📂" : "📎"}
          </div>
          <p style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
            {dragging ? "Drop your PDF here" : "Drag & drop your CV here"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            or click to browse
          </p>
          <span className="badge badge-blue">PDF only · Max 5MB</span>
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "#f87171", marginTop: "10px" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
