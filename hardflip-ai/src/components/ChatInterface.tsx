"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface ChatInterfaceProps {
  goalId: string;
  initialMessages: Message[];
  goalTitle: string;
  milestones: Milestone[];
}

export function ChatInterface({
  goalId,
  initialMessages,
  goalTitle,
  milestones,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFirstLoad = messages.length === 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get response.");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMessage.id),
          userMessage,
          {
            id: data.id,
            role: "assistant" as const,
            content: data.content,
            createdAt: new Date(data.createdAt),
          },
        ]);
      }
    } catch {
      setError("Network error. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <strong key={i}>{line.slice(2, -2)}</strong>;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        }
        if (line === "") return <br key={i} />;
        return <span key={i}>{line}<br /></span>;
      });
  };

  const starterPrompts = [
    "I'm ready to start. Where do I begin?",
    "Break down my first action step.",
    "I'm feeling stuck. Push me.",
    "What should I do today?",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Welcome message for new conversations */}
        {isFirstLoad && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 font-bold text-sm">
              AI
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="p-4 rounded-2xl rounded-tl-sm bg-surface border border-border">
                <p className="text-text-primary leading-relaxed">
                  Let&apos;s talk about <strong>&quot;{goalTitle}&quot;</strong>.{" "}
                  I&apos;m your accountability coach, and I won&apos;t let you make excuses.
                  {milestones.length > 0 && (
                    <>
                      {" "}I&apos;ve already broken your goal into {milestones.length} milestones.{" "}
                    </>
                  )}
                  <strong>So — what&apos;s your first move?</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-slide-up ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                message.role === "assistant"
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-accent/20 border border-accent/40 text-accent"
              }`}
            >
              {message.role === "assistant" ? "AI" : "ME"}
            </div>

            {/* Bubble */}
            <div
              className={`flex-1 max-w-2xl ${
                message.role === "user" ? "flex flex-col items-end" : ""
              }`}
            >
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-surface border border-border text-text-primary"
                    : "rounded-tr-sm bg-primary text-white"
                }`}
              >
                <div className="chat-content whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
              <span className="text-xs text-text-muted mt-1 px-1">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 font-bold text-xs">
              AI
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-surface border border-border">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
                <span className="text-text-muted text-xs ml-1">Coach is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-surface px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Talk to your coach... (Enter to send, Shift+Enter for newline)"
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none disabled:opacity-50"
                style={{ minHeight: "48px", maxHeight: "160px" }}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              loading={loading}
              variant="primary"
              size="md"
              className="shrink-0"
            >
              {loading ? "" : "Send →"}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">
            Your AI coach remembers your commitments and won&apos;t let you off the hook.
          </p>
        </div>
      </div>
    </div>
  );
}
