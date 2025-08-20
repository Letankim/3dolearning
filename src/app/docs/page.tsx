"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Share2,
  Lock,
  Unlock,
  Save,
  Bold,
  Italic,
  List,
  Heading,
  Underline as UnderlineIcon,
  Strikethrough,
  Quote,
  Code2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table2,
  Rows,
  Columns,
  Scissors,
  Trash2,
  Download,
  Eraser,
} from "lucide-react";

// TipTap core
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import ImageExt from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";

// Lowlight v3
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("xml", xml);
lowlight.register("html", xml);
lowlight.register("css", css);
lowlight.register("json", json);
lowlight.register("bash", bash);
lowlight.register("python", python);

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";

interface DocumentDto {
  docId: string;
  title: string;
  content: string;
  passwordHash?: string;
}

interface ApiErrorResponse {
  error: string;
}

// Use environment variables for sensitive data
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://3docorp.id.vn/save_docs.php";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "3docorp_fixed_key_2025";

export default function DocsPage() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const [title, setTitle] = useState<string>("Untitled Document");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [showDocSelection, setShowDocSelection] = useState<boolean>(!docId);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [needsSave, setNeedsSave] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>("#111827");
  const [highlightColor, setHighlightColor] = useState<string>("#fff59d");

  // Derive current doc
  const currentDoc = useMemo(
    () => (docId ? documents.find((d) => d.docId === docId) : undefined),
    [docId, documents]
  );

  // Load documents from localStorage
  const loadDocuments = useCallback(async () => {
    try {
      const stored = localStorage.getItem("documentList");
      if (!stored) {
        setDocuments([]);
        return;
      }
      const parsed = JSON.parse(stored);
      setDocuments(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to load documents from localStorage:", e);
      setDocuments([]);
    }
  }, []);

  // Persist document list to localStorage
  const persistDocumentList = useCallback((docs: DocumentDto[]) => {
    try {
      localStorage.setItem("documentList", JSON.stringify(docs));
    } catch (e) {
      console.error("Failed to persist document list:", e);
    }
  }, []);

  // Save document to API
  const saveDocument = useCallback(
    async (doc: DocumentDto) => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify(doc),
        });
        const data: ApiErrorResponse | { success: boolean } = await response.json();
        if (!response.ok) {
          throw new Error((data as ApiErrorResponse).error || "Failed to save document");
        }

        const updated = documents.filter((d) => d.docId !== doc.docId).concat(doc);
        setDocuments(updated);
        persistDocumentList(updated);
        setNeedsSave(false);
        setLastSavedAt(new Date().toLocaleTimeString());
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        setError(`Lưu tài liệu thất bại: ${errorMessage}`);
      }
    },
    [documents, persistDocumentList]
  );

  // Fetch document from API
  const fetchDocument = useCallback(async (id: string): Promise<DocumentDto | null> => {
    try {
      const res = await fetch(`${API_URL}?docId=${id}`, {
        method: "GET",
        headers: { "X-API-Key": API_KEY },
      });
      const data: DocumentDto | ApiErrorResponse = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error((data as ApiErrorResponse).error || "Failed to fetch document");
      }
      return data as DocumentDto;
    } catch (e) {
      setError("Không tìm thấy tài liệu hoặc lỗi khi tải");
      return null;
    }
  }, []);

  // Create new document
  const createNewDocument = useCallback(async () => {
    const newTitle = prompt("Nhập tiêu đề tài liệu:");
    if (!newTitle || newTitle.trim() === "") {
      alert("Tiêu đề tài liệu không được để trống.");
      return;
    }
    const newDocId = Math.random().toString(36).slice(2, 10);
    const newDoc: DocumentDto = { docId: newDocId, title: newTitle.trim(), content: "" };
    await saveDocument(newDoc);
    window.location.href = `/docs?docId=${newDocId}`;
  }, [saveDocument]);

  // Password handling
  const comparePassword = useCallback(async (plain: string, hashed: string): Promise<boolean> => {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(plain, hashed);
  }, []);

  const hashPassword = useCallback(async (plain: string): Promise<string> => {
    const bcrypt = await import("bcryptjs");
    const saltRounds = 10;
    return bcrypt.hash(plain, saltRounds);
  }, []);

  const verifyPassword = useCallback(
    async (doc: DocumentDto) => {
      setError("");
      if (!doc.passwordHash) {
        setIsAuthenticated(true);
        return;
      }
      if (password) {
        const ok = await comparePassword(password, doc.passwordHash);
        if (ok) setIsAuthenticated(true);
        else setError("Mật khẩu không đúng");
      } else {
        setError("Vui lòng nhập mật khẩu");
      }
    },
    [password, comparePassword]
  );

  // Share document
  const shareDocument = useCallback(
    async (doc: DocumentDto) => {
      const sharePassword = prompt(
        "Nhập mật khẩu để chia sẻ tài liệu (để trống nếu không cần mật khẩu):"
      );
      const updated: DocumentDto = {
        ...doc,
        passwordHash: sharePassword ? await hashPassword(sharePassword) : undefined,
      };
      await saveDocument(updated);
      const shareLink = `${window.location.origin}/docs?docId=${doc.docId}`;
      await navigator.clipboard.writeText(
        `${shareLink}${sharePassword ? `\nMật khẩu: ${sharePassword}` : ""}`
      );
      alert(`Đã copy liên kết chia sẻ!`);
    },
    [hashPassword, saveDocument]
  );

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      Color.configure({ types: ["textStyle"] }),
      TextStyle,
      Underline,
      LinkExtension.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      CharacterCount.configure({ limit: 50000 }),
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] }
      }),
      Placeholder.configure({ placeholder: "Nhập nội dung ở đây..." }),
    ],
    content: "",
    onUpdate: () => {
      if (isAuthenticated && currentDoc) setNeedsSave(true);
    },
    editorProps: {
      attributes: { class: "prose max-w-none focus:outline-none" },
      handlePaste: (view, event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.includes("image")) {
            const file = item.getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = () => {
              editor?.chain().focus().setImage({ src: String(reader.result) }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // Initialize editor and load document
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadDocuments();
      if (docId) {
        const doc = await fetchDocument(docId);
        if (doc) {
          setDocuments((prev) => prev.filter((d) => d.docId !== doc.docId).concat(doc));
          setTitle(doc.title);
          if (editor) {
            editor.commands.setContent(doc.content || "");
          }
          setIsAuthenticated(!doc.passwordHash);
        }
      }
      setLoading(false);
    };
    initialize();
  }, [docId, editor, fetchDocument, loadDocuments]);

  // Autosave
  useEffect(() => {
    if (!isAuthenticated || !currentDoc || !editor || !needsSave) return;
    const timer = setTimeout(() => {
      const updated: DocumentDto = {
        ...currentDoc,
        title,
        content: editor.getHTML(),
      };
      saveDocument(updated);
    }, 1500);
    return () => clearTimeout(timer);
  }, [needsSave, isAuthenticated, currentDoc, editor, title, saveDocument]);

  // Prevent navigation if unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (needsSave) {
        e.preventDefault();
        e.returnValue = "Bạn có thay đổi chưa lưu";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [needsSave]);

  // Ctrl/Cmd + S manual save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (editor && currentDoc) {
          const payload: DocumentDto = { ...currentDoc, title, content: editor.getHTML() };
          saveDocument(payload);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, currentDoc, saveDocument, title]);

  const handleSave = useCallback(async () => {
    if (editor && currentDoc) {
      await saveDocument({ ...currentDoc, title, content: editor.getHTML() });
    }
  }, [editor, currentDoc, title, saveDocument]);

  const filteredDocuments = useMemo(
    () => documents.filter((d) => d.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [documents, searchTerm]
  );

  // Toolbar helpers
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = prompt("Dán liên kết (URL):", editor.getAttributes("link").href || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = prompt("Dán URL ảnh hoặc để trống để tải file");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0] || null;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => editor.chain().focus().setImage({ src: String(reader.result) }).run();
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const exportHtml = useCallback(() => {
    if (!editor) return;
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title></head><body>${editor.getHTML()}</body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9\-_]+/gi, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, title]);

  // --- UI RENDERING ---
  if (showDocSelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="ml-4 flex-1">
                <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Chọn tài liệu</h1>
                <p className="text-sm text-slate-600 font-open-sans">
                  Chọn hoặc tạo tài liệu mới để chỉnh sửa
                </p>
              </div>
              <Image
                src="https://letankim.id.vn/3do/assets/images/logo.jpg"
                alt="3DO Logo"
                width={24}
                height={24}
                className="rounded"
              />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative">
              <FileText
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-open-sans"
              />
            </div>
            <button
              onClick={createNewDocument}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <FileText size={16} />
              Tạo tài liệu mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <button
                key={doc.docId}
                onClick={() => (window.location.href = `/docs?docId=${doc.docId}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-emerald-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText size={24} className="text-emerald-600 flex-shrink-0" />
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    ID: {doc.docId}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 font-work-sans line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-sm text-slate-600 font-open-sans line-clamp-2">
                  {doc.content ? "Đã chỉnh sửa" : "Trống"}
                </p>
              </button>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2 font-work-sans">
                Không tìm thấy tài liệu
              </h3>
              <p className="text-slate-500 font-open-sans">
                Tạo tài liệu mới hoặc thử tìm kiếm với từ khóa khác
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-open-sans">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!currentDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <FileText size={48} className="text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">
            Không tìm thấy tài liệu
          </h3>
          <p className="text-slate-600 mb-6 font-open-sans">Tài liệu không tồn tại hoặc đã bị xóa.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowDocSelection(true)}
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Chọn tài liệu khác
            </button>
            <Link href="/">
              <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Về trang chủ
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <Lock size={48} className="text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">Nhập mật khẩu</h3>
          <p className="text-slate-600 mb-6 font-open-sans">Nhập mật khẩu để truy cập tài liệu.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu tài liệu"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-open-sans mb-4"
          />
          <button
            onClick={() => verifyPassword(currentDoc)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Unlock size={16} />
            Mở tài liệu
          </button>
          {error && <p className="text-red-500 mt-4 font-open-sans">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-2">
            <Link href="/docs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="ml-2 flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setNeedsSave(true);
                }}
                className="text-lg font-semibold text-slate-800 font-work-sans border-none focus:outline-none bg-transparent"
              />
              <p className="text-xs text-slate-500 font-open-sans">Tài liệu ID: {docId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="https://letankim.id.vn/3do/assets/images/logo.jpg"
                alt="3DO Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <div className="text-xs text-slate-500 pr-2">
                {needsSave ? "Đang có thay đổi…" : lastSavedAt ? `Đã lưu lúc ${lastSavedAt}` : ""}
              </div>
              <button
                onClick={handleSave}
                disabled={!needsSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  needsSave
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Save size={16} />
                Lưu
              </button>
              <button
                onClick={() => shareDocument(currentDoc)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Share2 size={16} />
                Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Undo/Redo */}
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Hoàn tác (Ctrl+Z)"
              disabled={!editor?.can().undo()}
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Làm lại (Ctrl+Y)"
              disabled={!editor?.can().redo()}
            >
              <Redo2 size={16} />
            </button>

            {/* Marks */}
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("bold") ? "bg-emerald-600 text-white" : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Đậm"
              disabled={!editor}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("italic")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Nghiêng"
              disabled={!editor}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("underline")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Gạch chân"
              disabled={!editor}
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("strike")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Gạch ngang"
              disabled={!editor}
            >
              <Strikethrough size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("codeBlock")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Khối mã"
              disabled={!editor}
            >
              <Code2 size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("blockquote")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Trích dẫn"
              disabled={!editor}
            >
              <Quote size={16} />
            </button>

            {/* Lists */}
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("bulletList")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Danh sách"
              disabled={!editor}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("orderedList")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Danh sách số"
              disabled={!editor}
            >
              1.
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("taskList")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Checklist"
              disabled={!editor}
            >
              ✓
            </button>

            {/* Headings */}
            <select
              value={
                editor?.isActive("heading", { level: 1 })
                  ? "h1"
                  : editor?.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor?.isActive("heading", { level: 3 })
                  ? "h3"
                  : editor?.isActive("heading", { level: 4 })
                  ? "h4"
                  : "p"
              }
              onChange={(e) => {
                const val = e.target.value;
                const chain = editor?.chain().focus();
                if (!chain) return;
                if (val === "p") chain.setParagraph().run();
                else chain.toggleHeading({ level: Number(val.replace("h", "")) as 1 | 2 | 3 | 4 }).run();
              }}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700"
              title="Tiêu đề"
              disabled={!editor}
            >
              <option value="p">Đoạn văn</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>
            <Heading size={16} className="text-slate-400" />

            {/* Alignment */}
            <button
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive({ textAlign: "left" })
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Căn trái"
              disabled={!editor}
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive({ textAlign: "center" })
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Căn giữa"
              disabled={!editor}
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive({ textAlign: "right" })
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Căn phải"
              disabled={!editor}
            >
              <AlignRight size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive({ textAlign: "justify" })
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Giãn đều"
              disabled={!editor}
            >
              <AlignJustify size={16} />
            </button>

            {/* Text color & highlight */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100">
              <Palette size={16} className="text-slate-600" />
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  editor?.chain()?.focus()?.setColor(e.target.value).run();
                }}
                title="Màu chữ"
                disabled={!editor}
              />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100">
              <Highlighter size={16} className="text-slate-600" />
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                  editor?.chain().focus().toggleHighlight({ color: e.target.value }).run();
                }}
                title="Đánh dấu"
                disabled={!editor}
              />
            </div>

            {/* Links */}
            <button
              onClick={setLink}
              className={`px-2 py-2 rounded-lg ${
                editor?.isActive("link")
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-slate-700"
              } hover:bg-emerald-500 hover:text-white`}
              title="Chèn liên kết"
              disabled={!editor}
            >
              <LinkIcon size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().unsetLink().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Bỏ liên kết"
              disabled={!editor || !editor.isActive("link")}
            >
              <Unlink size={16} />
            </button>

            {/* Images */}
            <button
              onClick={insertImage}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Chèn ảnh"
              disabled={!editor}
            >
              <ImageIcon size={16} />
            </button>

            {/* Table controls */}
            <button
              onClick={() =>
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Chèn bảng"
              disabled={!editor}
            >
              <Table2 size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().addColumnAfter().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Thêm cột"
              disabled={!editor}
            >
              <Columns size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().addRowAfter().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Thêm hàng"
              disabled={!editor}
            >
              <Rows size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().deleteColumn().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Xóa cột"
              disabled={!editor}
            >
              <Scissors size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().deleteRow().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Xóa hàng"
              disabled={!editor}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().deleteTable().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Xóa bảng"
              disabled={!editor}
            >
              <Trash2 size={16} />
            </button>

            {/* Clear formatting & export */}
            <button
              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Xóa định dạng"
              disabled={!editor}
            >
              <Eraser size={16} />
            </button>
            <button
              onClick={exportHtml}
              className="px-2 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-emerald-500 hover:text-white"
              title="Xuất HTML"
              disabled={!editor}
            >
              <Download size={16} />
            </button>
          </div>

          {/* Editor */}
          <div className="min-h-[500px] border rounded-lg">
            <EditorContent editor={editor} />
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <div>
              {editor && (
                <>
                  <span>Từ: {editor.storage.characterCount.words()}</span>
                  <span className="mx-2">|</span>
                  <span>Ký tự: {editor.storage.characterCount.characters()}</span>
                </>
              )}
            </div>
            <div>
              <span>Gợi ý: Dùng Ctrl/Cmd+S để lưu nhanh</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          font-size: 16px;
          font-family: "Open Sans", sans-serif;
          min-height: 420px;
          padding: 1rem;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
        }
        .ProseMirror table th,
        .ProseMirror table td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}