"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  /** Called when the user types "/" in an empty editor (opens the block picker). */
  onSlash?: () => void;
}

/**
 * Tiptap-based inline rich text editor for text-family blocks.
 * Emits both HTML (rich) and plain text (fallback) on change.
 */
export function RichTextEditor({ value = "", onChange, placeholder, onSlash }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({ placeholder: placeholder || "Write here…  (type '/' for blocks)" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-text focus:outline-none min-h-[90px] px-3 py-2",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "/" && onSlash && view.state.doc.textContent.length === 0) {
          event.preventDefault();
          onSlash();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
  });

  // Sync external value changes (e.g. block "Convert to") when not actively editing
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const btnClass = (active: boolean) =>
    `p-1.5 rounded ${
      active
        ? "bg-arc-orange-100 text-arc-orange-600"
        : "text-arc-slate-500 hover:bg-arc-slate-100"
    }`;

  if (!editor) {
    return <div className="border border-arc-slate-200 rounded-lg min-h-[120px] bg-white" />;
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="border border-arc-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-arc-slate-200 bg-arc-slate-50 px-1.5 py-1">
        <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))}>
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>
          <Strikethrough className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-arc-slate-200 mx-1" />
        <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
          <Quote className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-arc-slate-200 mx-1" />
        <button type="button" title="Link" onClick={setLink} className={btnClass(editor.isActive("link"))}>
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
