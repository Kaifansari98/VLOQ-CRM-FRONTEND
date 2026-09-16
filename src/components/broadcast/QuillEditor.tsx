"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Write content here...",
  className = "",
  minHeight = "200px",
  maxHeight = "280px",
}) => {
  // Dynamically import ReactQuill to prevent SSR issues in Next.js
  const ReactQuill = useMemo(
    () =>
      dynamic(() => import("react-quill-new"), {
        ssr: false,
        loading: () => (
          <div
            className="flex items-center justify-center p-8 border rounded-xl text-xs text-muted-foreground bg-card animate-pulse"
            style={{ minHeight }}
          >
            Loading Rich Text Editor...
          </div>
        ),
      }),
    []
  );

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["clean"],
      ],
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
  ];

  return (
    <div className={`quill-wrapper border rounded-2xl overflow-hidden bg-card ${className}`}>
      <style jsx global>{`
        .quill-wrapper .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--border, hsl(var(--border))) !important;
          background-color: var(--muted, hsl(var(--muted) / 0.4)) !important;
          padding: 8px 12px !important;
          font-family: inherit;
        }

        .quill-wrapper .ql-container.ql-snow {
          border: none !important;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .quill-wrapper .ql-editor {
          min-height: ${minHeight};
          max-height: ${maxHeight};
          overflow-y: auto;
          padding: 16px;
          color: var(--foreground, hsl(var(--foreground)));
          line-height: 1.6;
        }

        .quill-wrapper .ql-editor p {
          margin-top: 0;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .quill-wrapper .ql-editor p:last-child {
          margin-bottom: 0;
        }

        .quill-wrapper .ql-editor.ql-blank::before {
          color: var(--muted-foreground, hsl(var(--muted-foreground)));
          font-style: normal;
          left: 16px;
        }

        /* Dark mode overrides for toolbar buttons & dropdowns */
        .quill-wrapper .ql-snow .ql-stroke {
          stroke: currentColor;
        }
        .quill-wrapper .ql-snow .ql-fill {
          fill: currentColor;
        }
        .quill-wrapper .ql-snow .ql-picker {
          color: currentColor;
        }
        .quill-wrapper .ql-snow .ql-picker-options {
          background-color: var(--popover, hsl(var(--popover)));
          border-color: var(--border, hsl(var(--border)));
          border-radius: 0.5rem;
          padding: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};
