"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

type TiptapEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Escribe aquí…",
  className = "",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent underline" } }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] rounded-b-lg border border-t-0 border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground outline-none prose prose-invert prose-sm max-w-none",
      },
      placeholder,
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={
        "rounded-lg border border-white/20 bg-white/5 overflow-hidden " + className
      }
    >
      <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-xs font-medium ${
            editor.isActive("bold")
              ? "bg-white/20 text-foreground"
              : "bg-white/5 text-muted hover:text-foreground"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-xs font-medium italic ${
            editor.isActive("italic")
              ? "bg-white/20 text-foreground"
              : "bg-white/5 text-muted hover:text-foreground"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-xs ${
            editor.isActive("bulletList")
              ? "bg-white/20 text-foreground"
              : "bg-white/5 text-muted hover:text-foreground"
          }`}
        >
          • Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-xs ${
            editor.isActive("orderedList")
              ? "bg-white/20 text-foreground"
              : "bg-white/5 text-muted hover:text-foreground"
          }`}
        >
          1. Lista
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("URL del enlace:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={`rounded px-2 py-1 text-xs ${
            editor.isActive("link")
              ? "bg-white/20 text-foreground"
              : "bg-white/5 text-muted hover:text-foreground"
          }`}
        >
          Enlace
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
