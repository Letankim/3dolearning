"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Send, Bot, User, Settings, MessageSquare, Trash2, HelpCircle, Zap } from "lucide-react"
import { fetchWithRetry } from "../utils/fetch-with-retry"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  isAgentSuggestion?: boolean
  suggestedContent?: string
  originalContent?: string
}

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  docTitle: string
  docContent: string
  onUpdateContent?: (newContent: string) => void
}

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemma-3n-e4b-it", name: "Gemma 3N E4B IT" },
]

type ChatMode = "ask" | "agent"

export default function AIChatPanel({
  isOpen,
  onClose,
  docId,
  docTitle,
  docContent,
  onUpdateContent,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [showSettings, setShowSettings] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("ask")
  const [pendingChanges, setPendingChanges] = useState<{
    messageId: string
    newContent: string
    originalContent: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    if (docId) {
      const savedMessages = localStorage.getItem(`chat_history_${docId}`)
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages))
        } catch (error) {
          console.error("Error loading chat history:", error)
        }
      }
    }
  }, [docId])

  // Save chat history to localStorage
  useEffect(() => {
    if (docId && messages.length > 0) {
      localStorage.setItem(`chat_history_${docId}`, JSON.stringify(messages))
    }
  }, [messages, docId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const chatHistory = messages
        .slice(-5)
        .map((msg) => `${msg.role === "user" ? "Người dùng" : "AI"}: ${msg.content}`)
        .join("\n")

      let context = `
Tài liệu hiện tại:
Tiêu đề: ${docTitle}
ID: ${docId}
Nội dung: ${docContent.substring(0, 2000)}${docContent.length > 2000 ? "..." : ""}

Lịch sử cuộc trò chuyện:
${chatHistory}

Câu hỏi mới: ${userMessage.content}
      `

      if (chatMode === "agent") {
        context += `

Chế độ: AGENT - Bạn có thể đề xuất thay đổi nội dung tài liệu.
Nếu người dùng yêu cầu chỉnh sửa, hãy trả lời theo format:
[AGENT_SUGGESTION]
Nội dung mới đề xuất ở đây
[/AGENT_SUGGESTION]

Sau đó giải thích lý do thay đổi.`
      } else {
        context += `

Chế độ: ASK - Chỉ trả lời câu hỏi, không đề xuất thay đổi tài liệu.`
      }

      context += `\n\nHãy trả lời bằng tiếng Việt.`

      const response = await fetchWithRetry(context)

      const isAgentSuggestion = response.includes("[AGENT_SUGGESTION]") && response.includes("[/AGENT_SUGGESTION]")
      let suggestedContent = ""
      let cleanResponse = response

      if (isAgentSuggestion) {
        const suggestionMatch = response.match(/\[AGENT_SUGGESTION\]([\s\S]*?)\[\/AGENT_SUGGESTION\]/)
        if (suggestionMatch) {
          suggestedContent = suggestionMatch[1].trim()
          cleanResponse = response.replace(/\[AGENT_SUGGESTION\][\s\S]*?\[\/AGENT_SUGGESTION\]/, "").trim()
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanResponse || "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.",
        timestamp: Date.now(),
        isAgentSuggestion,
        suggestedContent,
        originalContent: docContent,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (isAgentSuggestion && suggestedContent) {
        setPendingChanges({
          messageId: assistantMessage.id,
          newContent: suggestedContent,
          originalContent: docContent,
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptSuggestion = () => {
    if (pendingChanges && onUpdateContent) {
      onUpdateContent(pendingChanges.newContent)
      setPendingChanges(null)

      // Add confirmation message
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Đã áp dụng thay đổi vào tài liệu!",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, confirmMessage])
    }
  }

  const handleRejectSuggestion = () => {
    if (pendingChanges) {
      setPendingChanges(null)

      // Add rejection message
      const rejectMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ Đã hủy thay đổi. Nội dung tài liệu giữ nguyên.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, rejectMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChatHistory = () => {
    setMessages([])
    setPendingChanges(null)
    localStorage.removeItem(`chat_history_${docId}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 mt-[70px]">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Cài đặt"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={clearChatHistory}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-red-600"
            title="Xóa lịch sử chat"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setChatMode("ask")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              chatMode === "ask" ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-emerald-50"
            }`}
          >
            <HelpCircle size={16} />
            Ask
          </button>
          <button
            onClick={() => setChatMode("agent")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              chatMode === "agent" ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-emerald-50"
            }`}
          >
            <Zap size={16} />
            Agent
          </button>
        </div>
        <p className="text-xs text-slate-600">
          {chatMode === "ask" ? "Hỏi đáp về nội dung tài liệu" : "AI có thể đề xuất chỉnh sửa tài liệu"}
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chọn mô hình AI:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {pendingChanges && (
        <div className="p-4 border-b border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Đề xuất thay đổi</span>
          </div>
          <p className="text-xs text-orange-700 mb-3">AI đề xuất cập nhật nội dung tài liệu. Bạn có đồng ý không?</p>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptSuggestion}
              className="flex-1 px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 transition-colors"
            >
              Đồng ý
            </button>
            <button
              onClick={handleRejectSuggestion}
              className="flex-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm">
              {chatMode === "ask" ? "Hỏi tôi về nội dung tài liệu này!" : "Yêu cầu tôi chỉnh sửa tài liệu!"}
            </p>
            <p className="text-xs mt-2">
              {chatMode === "ask"
                ? "Tôi có thể giúp bạn hiểu rõ hơn về tài liệu"
                : "Tôi có thể đề xuất và thực hiện thay đổi"}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isAgentSuggestion ? "bg-orange-100" : "bg-emerald-100"
                  }`}
                >
                  {message.isAgentSuggestion ? (
                    <Zap size={16} className="text-orange-600" />
                  ) : (
                    <Bot size={16} className="text-emerald-600" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white"
                    : message.isAgentSuggestion
                      ? "bg-orange-50 text-slate-800 border border-orange-200"
                      : "bg-gray-100 text-slate-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.isAgentSuggestion && message.suggestedContent && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div className="font-medium text-orange-700 mb-1">Nội dung đề xuất:</div>
                    <div className="text-slate-600 max-h-20 overflow-y-auto">
                      {message.suggestedContent.substring(0, 200)}
                      {message.suggestedContent.length > 200 && "..."}
                    </div>
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString("vi-VN")}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-emerald-600" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={chatMode === "ask" ? "Hỏi về tài liệu này..." : "Yêu cầu chỉnh sửa tài liệu..."}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Nhấn Enter để gửi, Shift+Enter để xuống dòng</p>
      </div>
    </div>
  )
}
