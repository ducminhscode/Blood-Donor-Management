import { useContext, useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { ArrowUp, Bot, Check, ChevronUp, CircleAlert, Droplet, Edit3, Facebook, Instagram, Loader2, Mail, MapPinned, MessageCircle, Phone, Plus, SendHorizontal, Trash2, Twitter, X, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserContexts } from "../../../configs/UserContexts";
import { authApis, BASE_URL, endpoints } from "../../../configs/APIs";

const FooterChatbot = () => {
  const user = useContext(UserContexts);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionCode, setSessionCode] = useState(null);
  const [draftSessionName, setDraftSessionName] = useState("");
  const [editingSessionCode, setEditingSessionCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(false);
  const [deletingSessionCode, setDeletingSessionCode] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [connectionState, setConnectionState] = useState("idle");
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const socketMapRef = useRef(new Map());
  const syncTimeoutRef = useRef(null);
  const chatBodyRef = useRef(null);
  const initializedRef = useRef(false);
  const activeSocketSessionRef = useRef(null);
  const pendingBySessionRef = useRef({});

  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      void initializeChat();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !chatBodyRef.current) return;

    chatBodyRef.current.scrollTo({
      top: chatBodyRef.current.scrollHeight,
      behavior: isInitialLoad ? "auto" : "smooth"
    });

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [messages, open, error]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(
    () => () => {
      closeSocket();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    },
    []
  );

  const createMessageId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  const mapSession = (item) => ({
    id: item.id,
    session_code: item.session_code,
    session_name: item.session_name || "Trò chuyện mới",
    created_at: item.created_at,
    updated_at: item.updated_at
  });

  const mapMessage = (item) => ({
    id: item.id || createMessageId(),
    sender: item.sender,
    text: item.answer || item.text || "",
    createdAt: item.created_at,
    isStreaming: false
  });

  const sortSessions = (items) =>
    [...items].sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
    );

  const getWsUrl = (activeSessionCode) => {
    const apiUrl = new URL(BASE_URL);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketPath = endpoints.chat_socket.replace("${session_id}", activeSessionCode);
    return `${protocol}//${apiUrl.host}${socketPath}`;
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatSessionDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const closeSocket = (targetSessionCode = null) => {
    const closeOne = (code) => {
      const socket = socketMapRef.current.get(code);
      if (!socket) return;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
      socketMapRef.current.delete(code);
      delete pendingBySessionRef.current[code];
      if (activeSocketSessionRef.current === code) {
        activeSocketSessionRef.current = null;
      }
    };

    if (targetSessionCode) {
      closeOne(targetSessionCode);
      return;
    }

    [...socketMapRef.current.keys()].forEach(closeOne);
  };

  const refreshSessions = async (preferredSessionCode = null) => {
    setSessionLoading(true);
    try {
      const response = await authApis().get(`${endpoints.chat_sessions}?page=1`);
      const nextSessions = sortSessions((response.data?.results || []).map(mapSession));
      setSessions(nextSessions);

      const targetSessionCode =
        preferredSessionCode ||
        (nextSessions.some((item) => item.session_code === sessionCode) ? sessionCode : null) ||
        nextSessions[0]?.session_code ||
        null;

      if (targetSessionCode && targetSessionCode !== sessionCode) {
        setSessionCode(targetSessionCode);
      }

      if (!targetSessionCode) {
        setSessionCode(null);
        setMessages([]);
        closeSocket();
        setConnectionState("idle");
      }

      return nextSessions;
    } finally {
      setSessionLoading(false);
    }
  };

  const connectSocket = (targetSessionCode) => {
    if (!targetSessionCode) return;

    activeSocketSessionRef.current = targetSessionCode;
    setConnectionState("connecting");

    const existingSocket = socketMapRef.current.get(targetSessionCode);
    if (existingSocket) {
      if (existingSocket.readyState === WebSocket.OPEN) {
        setConnectionState("connected");
        setError("");
        return;
      }
      if (existingSocket.readyState === WebSocket.CONNECTING) {
        return;
      }
      closeSocket(targetSessionCode);
    }

    const socket = new WebSocket(getWsUrl(targetSessionCode));
    socketMapRef.current.set(targetSessionCode, socket);

    socket.onopen = () => {
      if (socketMapRef.current.get(targetSessionCode) !== socket) return;
      if (activeSocketSessionRef.current === targetSessionCode) {
        setConnectionState("connected");
        setError("");
      }
    };

    socket.onmessage = (event) => {
      if (socketMapRef.current.get(targetSessionCode) !== socket) return;
      if (activeSocketSessionRef.current !== targetSessionCode) return;

      try {
        const payload = JSON.parse(event.data);
        const pendingAiMessageId = pendingBySessionRef.current[targetSessionCode];

        if (payload.type === "stream") {
          setSending(true);
          setMessages((prev) =>
            prev.map((item) =>
              item.id === pendingAiMessageId
                ? { ...item, text: `${item.text || ""}${payload.token || ""}`, isStreaming: true }
                : item
            )
          );
          return;
        }

        if (payload.type === "done") {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === pendingAiMessageId
                ? { ...item, text: payload.answer || payload.text || "", isStreaming: false }
                : item
            )
          );
          delete pendingBySessionRef.current[targetSessionCode];
          setSending(false);
          void refreshSessions();
          void loadMessages(targetSessionCode, { silent: true, reconnect: false });
          return;
        }

        if (payload.type === "error") {
          setError(payload.message || "Không thể xử lý câu hỏi lúc này.");
          setMessages((prev) => prev.filter((item) => item.id !== pendingAiMessageId));
          delete pendingBySessionRef.current[targetSessionCode];
          setSending(false);
        }
      } catch (wsError) {
        console.error("Failed to parse websocket payload:", wsError);
      }
    };

    socket.onerror = () => {
      if (socketMapRef.current.get(targetSessionCode) !== socket) return;
      if (activeSocketSessionRef.current === targetSessionCode) {
        setConnectionState("error");
        setError("Kết nối chatbot thất bại. Vui lòng thử lại.");
        setSending(false);
      }
    };

    socket.onclose = () => {
      if (socketMapRef.current.get(targetSessionCode) === socket) {
        socketMapRef.current.delete(targetSessionCode);
      }
      delete pendingBySessionRef.current[targetSessionCode];

      if (activeSocketSessionRef.current === targetSessionCode) {
        setConnectionState((current) =>
          current === "connected" || current === "connecting" ? "disconnected" : current
        );
      }
    };
  };
  const loadMessages = async (targetSessionCode, options = {}) => {
    const { silent = false, reconnect = true } = options;

    setIsInitialLoad(true);

    if (!targetSessionCode) {
      setMessages([]);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const messagesUrl = endpoints.chat_session_messages.replace("${session_id}", targetSessionCode);
      const response = await authApis().get(messagesUrl);

      if (activeSocketSessionRef.current === targetSessionCode) {
        const nextMessages = (response.data || []).map(mapMessage);

        setMessages((prev) => {
          const pendingAiMessageId = pendingBySessionRef.current[targetSessionCode];
          const pendingAiMessage = prev.find((item) => item.id === pendingAiMessageId);

          if (!pendingAiMessageId || !pendingAiMessage) {
            return nextMessages;
          }

          const alreadySyncedPending = nextMessages.some((item) => item.id === pendingAiMessageId);
          if (alreadySyncedPending) {
            return nextMessages.map((item) =>
              item.id === pendingAiMessageId ? { ...item, isStreaming: true } : item
            );
          }

          const lastSyncedMessage = nextMessages[nextMessages.length - 1];
          if (lastSyncedMessage?.sender === "ai") {
            return nextMessages;
          }

          return [...nextMessages, pendingAiMessage];
        });
      }

      if (reconnect) {
        connectSocket(targetSessionCode);
      }
    } catch (loadError) {
      console.error("Failed to load chat messages:", loadError);
      setError("Không thể tải nội dung cuộc trò chuyện.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const scheduleMessageSync = (targetSessionCode, attempt = 0) => {
    if (!targetSessionCode || attempt > 6) return;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      await loadMessages(targetSessionCode, { silent: true, reconnect: false });
      if (pendingBySessionRef.current[targetSessionCode]) {
        scheduleMessageSync(targetSessionCode, attempt + 1);
      }
    }, 250 * (attempt + 1));
  };

  const createSession = async () => {
    setCreatingSession(true);
    setError("");
    try {
      const response = await authApis().post(endpoints.chat_sessions, {
        session_name: "Trò chuyện mới"
      });
      const created = mapSession(response.data);
      setSessions((prev) => sortSessions([created, ...prev]));
      setSessionCode(created.session_code);
      activeSocketSessionRef.current = created.session_code;
      setMessages([]);
      setInput("");
      setEditingSessionCode(created.session_code);
      setDraftSessionName(created.session_name);
      return created;
    } catch (createError) {
      console.error("Failed to create session:", createError);
      setError("Không thể tạo chat session mới.");
      return null;
    } finally {
      setCreatingSession(false);
    }
  };

  const initializeChat = async () => {
    if (!user) return;
    setError("");
    const existingSessions = await refreshSessions();

    if (!existingSessions?.length) {
      const created = await createSession();
      if (created?.session_code) {
        await loadMessages(created.session_code);
      }
      return;
    }

    const targetSessionCode = existingSessions[0]?.session_code;
    if (targetSessionCode) {
      setSessionCode(targetSessionCode);
      activeSocketSessionRef.current = targetSessionCode;
      await loadMessages(targetSessionCode);
    }
  };

  const handleSelectSession = async (nextSessionCode) => {
    if (!nextSessionCode || nextSessionCode === sessionCode) return;
    activeSocketSessionRef.current = nextSessionCode;
    delete pendingBySessionRef.current[nextSessionCode];
    setSending(false);
    setConnectionState("idle");
    setSessionCode(nextSessionCode);
    setEditingSessionCode(null);
    setDraftSessionName("");
    await loadMessages(nextSessionCode);
  };

  const handleCreateSession = async () => {
    const created = await createSession();
    if (created?.session_code) {
      await loadMessages(created.session_code);
    }
  };

  const handleEditSession = (session) => {
    setEditingSessionCode(session.session_code);
    setDraftSessionName(session.session_name);
  };

  const handleUpdateSession = async (session) => {
    const nextName = draftSessionName.trim();
    if (!nextName) return;

    setUpdatingSession(true);
    setError("");
    try {
      const response = await authApis().put(
        endpoints.chat_session_detail.replace("${session_id}", session.session_code),
        { session_name: nextName }
      );
      const updated = mapSession(response.data);
      setSessions((prev) =>
        sortSessions(
          prev.map((item) => (item.session_code === session.session_code ? updated : item))
        )
      );
      setEditingSessionCode(null);
      setDraftSessionName("");
    } catch (updateError) {
      console.error("Failed to update session:", updateError);
      setError("Không thể cập nhật tên chat session.");
    } finally {
      setUpdatingSession(false);
    }
  };

  const handleDeleteSession = async (session) => {
    setDeletingSessionCode(session.session_code);
    setError("");
    try {
      await authApis().delete(endpoints.chat_session_detail.replace("${session_id}", session.session_code));
      closeSocket(session.session_code);

      const remainingSessions = sessions.filter((item) => item.session_code !== session.session_code);
      setSessions(remainingSessions);
      setEditingSessionCode(null);
      setDraftSessionName("");

      if (session.session_code === sessionCode) {
        const nextSessionCode = remainingSessions[0]?.session_code || null;
        setSessionCode(nextSessionCode);

        if (nextSessionCode) {
          activeSocketSessionRef.current = nextSessionCode;
          await loadMessages(nextSessionCode);
        } else {
          setMessages([]);
          setConnectionState("idle");
        }
      }
    } catch (deleteError) {
      console.error("Failed to delete session:", deleteError);
      setError("Không thể xóa chat session.");
    } finally {
      setDeletingSessionCode(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    const activeSocket = socketMapRef.current.get(sessionCode);

    if (!text || !activeSocket || activeSocket.readyState !== WebSocket.OPEN || sending) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      sender: "human",
      text,
      createdAt: new Date().toISOString(),
      isStreaming: false
    };

    const aiMessageId = createMessageId();
    pendingBySessionRef.current[sessionCode] = aiMessageId;

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        sender: "ai",
        text: "",
        createdAt: new Date().toISOString(),
        isStreaming: true
      }
    ]);
    setInput("");
    setError("");
    setSending(true);
    scheduleMessageSync(sessionCode);

    activeSocket.send(JSON.stringify({ text }));
  };

  const connectionLabel =
    {
      idle: "Chưa kết nối",
      connecting: "Đang kết nối",
      connected: "Đang trực tuyến",
      disconnected: "Mất kết nối",
      error: "Lỗi kết nối"
    }[connectionState] || "Chưa kết nối";


  const connectionTone =
    {
      idle: "bg-slate-500",
      connecting: "bg-amber-400",
      connected: "bg-emerald-400",
      disconnected: "bg-orange-400",
      error: "bg-rose-400"
    }[connectionState] || "bg-slate-500";
  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-4">
      {open && (
        <div className="w-[64rem] h-[34rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-[0_28px_90px_rgba(15,23,42,0.24)] backdrop-blur-2xl animate-slideUp">
          <div className="relative overflow-hidden border-b border-white/20 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_36%),linear-gradient(135deg,_#7f1d1d,_#dc2626_58%,_#fb7185)] px-5 py-4 text-white">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 42%, rgba(255,255,255,0.08) 100%)" }}></div>
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg shadow-red-950/20 backdrop-blur-md">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold tracking-[0.01em] text-white">Chatbot tư vấn y tế</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                      <span className={`h-2 w-2 rounded-full ${connectionTone}`}></span>
                      {connectionLabel}
                    </span>
                  </div>
                  <p className="text-xs text-red-50/85">Hỏi nhanh về hiến máu, sức khỏe về quy trình tham gia.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-[30rem] grid-cols-[19rem_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] max-md:grid-cols-1">
            <aside className="border-r border-slate-200/80 bg-[linear-gradient(180deg,#fff7f7_0%,#fff_100%)]">
              <div className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Các đoạn chat của bạn</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={creatingSession}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 disabled:bg-gray-300"
                  >
                    {creatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Mới
                  </button>
                </div>
              </div>

              <div className="max-h-[27rem] space-y-2 overflow-y-auto px-3 py-3">
                {sessionLoading && sessions.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang tải session...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-gray-500 p-3">Chưa có đoạn chat nào</div>
                ) : (
                  sessions.map((session) => {
                    const isActive = session.session_code === sessionCode;
                    const isEditing = session.session_code === editingSessionCode;
                    const isDeleting = session.session_code === deletingSessionCode;

                    return (
                      <div
                        key={session.session_code}
                        className={`rounded-2xl border p-3 transition-all duration-300 ${isActive ? "border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 shadow-[0_12px_30px_rgba(239,68,68,0.12)]" : "border-slate-200/80 bg-white/90 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                          }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={draftSessionName}
                              onChange={(event) => setDraftSessionName(event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                              placeholder="Tên chat session"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSessionCode(null);
                                  setDraftSessionName("");
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={updatingSession}
                                onClick={() => handleUpdateSession(session)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:bg-slate-300"
                              >
                                {updatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => void handleSelectSession(session.session_code)}
                              className="min-w-0 flex-1 text-left transition-transform duration-300"
                            >
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">{session.session_name}</div>
                              <div className="mt-1 text-xs text-gray-500">Cập nhật {formatSessionDate(session.updated_at)}</div>
                            </button>

                            <div className="flex items-center gap-1 pt-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditSession(session)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-700"
                                aria-label="Chỉnh sửa đoạn chat"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => void handleDeleteSession(session)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-red-600 transition hover:bg-white hover:text-red-700 disabled:text-slate-300"
                                aria-label="Xóa đoạn chat"
                              >
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="flex min-w-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))]">
              <div
                ref={chatBodyRef}
                className="h-[21rem] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(254,242,242,0.85),_rgba(255,255,255,0)_32%),linear-gradient(180deg,#fff7f7_0%,#ffffff_28%,#f8fafc_100%)] px-5 py-5"
              >
                {loading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    <p className="text-sm">Đang tải cuộc trò chuyện...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start space-x-3 mb-4 animate-fadeIn">
                      <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-md p-3 shadow-sm max-w-[320px] border border-red-100">
                        <p className="text-sm text-gray-700">
                          Xin chào. Tôi có thể hỗ trợ thông tin về hiến máu và tư vấn y tế cơ bản cho bạn.
                        </p>
                      </div>
                    </div>

                    {messages.map((item) => {
                      const isHuman = item.sender === "human";

                      return (
                        <div
                          key={item.id}
                          className={`mb-4 flex ${isHuman ? "justify-end" : "justify-start"} animate-fadeIn`}
                        >
                          <div className={`flex max-w-[80%] flex-col ${isHuman ? "items-end" : "items-start"}`}>
                            <div
                              className={`whitespace-pre-wrap break-words rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${isHuman
                                ? "rounded-br-md bg-[linear-gradient(135deg,#dc2626,#fb7185)] text-white shadow-[0_14px_30px_rgba(239,68,68,0.28)]"
                                : "rounded-bl-md border border-white/80 bg-white/92 text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                                }`}
                            >
                              {item.isStreaming && !item.text ? (
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                </div>
                              ) : isHuman ? (
                                item.text
                              ) : (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                    code: ({ node, inline, ...props }) =>
                                      inline ? (
                                        <code className="bg-slate-700/30 rounded px-1.5 py-0.5 font-mono text-xs" {...props} />
                                      ) : (
                                        <code className="block bg-slate-700/30 rounded px-3 py-2 my-2 font-mono text-xs overflow-x-auto" {...props} />
                                      ),
                                    pre: ({ node, ...props }) => <pre className="bg-slate-700/30 rounded px-3 py-2 my-2 overflow-x-auto" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-400 pl-3 italic my-2" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                    a: ({ node, ...props }) => <a className="text-red-600 underline hover:text-red-700" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1" {...props} />,
                                  }}
                                >
                                  {item.text}
                                </ReactMarkdown>
                              )}
                            </div>
                            <span className="mt-1 px-1 text-[11px] text-slate-400">{formatTime(item.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {!loading && !messages.length && (
                      <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-400">
                        Hãy bắt đầu bằng một câu hỏi ngắn để chatbot tư vấn y tế.
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2.5 text-sm text-amber-800 shadow-sm">
                        <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit} className="border-t border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur-sm">
                <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex items-end gap-2">
                    <div className="flex min-h-[52px] flex-1 items-end rounded-[22px] bg-slate-50/80 px-2">
                      <textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        rows={1}
                        placeholder="Nhập câu hỏi hiến máu hoặc sức khỏe"
                        className="min-h-[52px] max-h-28 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSubmit(event);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || loading || sending || connectionState !== "connected" || !sessionCode}
                      className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#dc2626,#fb7185)] text-white shadow-[0_16px_30px_rgba(239,68,68,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(239,68,68,0.32)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between px-2 pb-1 text-[11px] text-slate-400">
                    <span>Enter để gửi, Shift + Enter để xuống dòng</span>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen && sessionCode) {
            connectSocket(sessionCode);
          }
        }}
        className="group relative focus:outline-none"
      >
        <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-sm ${open ? "opacity-0" : "animate-ping opacity-70"}`}></div>
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_18px_36px_rgba(15,23,42,0.26)] transform transition-all duration-500 ${open
            ? "scale-110 rotate-90 bg-slate-700"
            : "bg-[linear-gradient(135deg,#10b981,#059669)] hover:scale-110 hover:shadow-[0_22px_40px_rgba(5,150,105,0.35)]"
            }`}
        >
          {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        </div>

        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="whitespace-nowrap rounded-xl border border-slate-700/80 bg-slate-900/95 px-3 py-1.5 text-sm text-white shadow-xl backdrop-blur-sm">
            {open ? "Đóng chat" : "Chatbot tư vấn y tế"}
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></span>
          </div>
        </div>

        {!open && (
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${connectionState === "connected" ? "bg-emerald-500" : "bg-red-500"
              } animate-pulse`}
          ></span>
        )}
      </button>
    </div>
  );
};

const Footer = () => {
  const user = useContext(UserContexts);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-16 pb-8">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>

      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        ></div>
      </div>

      {user?.role === 1 && <FooterChatbot />}

      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-8 group z-50 transition-all duration-500 ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"
          }`}
        aria-label="Scroll to top"
      >
        <div className="relative">
          <svg className="absolute -top-1 -left-1 w-14 h-14 transform -rotate-90">
            <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(55, 65, 81, 0.3)" strokeWidth="2.5" />
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:from-red-700 group-hover:to-red-600 transition-all duration-300">
            <ArrowUp className="w-6 h-6 text-white group-hover:animate-bounce" />
          </div>

          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-30"></div>
        </div>

        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-gray-800/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl whitespace-nowrap border border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Lên đầu trang</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Đã cuộn {Math.round(scrollProgress)}%</div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800/95"></div>
          </div>
        </div>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                <Droplet className="relative h-9 w-9 text-red-500 drop-shadow-sm" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
                Dòng Máu Lạc Hồng
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Chung tay vì cộng đồng với những giọt máu nghĩa tình, kết nối yêu thương, lan tỏa sự sống.
            </p>
            <div className="flex space-x-3 pt-2">
              {[Facebook, Twitter, Youtube, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Liên kết nhanh
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3 text-gray-400">
              {["Trang chủ", "Về chúng tôi", "Sự kiện", "Tin tức"].map((item) => (
                <li key={item}>
                  <Link
                    to="#"
                    className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"
                  >
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Hỗ trợ
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3 text-gray-400">
              {["Câu hỏi thường gặp", "Điều kiện hiến máu", "Quy trình hiến máu", "Trung tâm kiến thức"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to="#"
                      className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"
                    >
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{item}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Liên hệ
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300">
                  <Phone className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">1900 1234</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300">
                  <Mail className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">info@dongmaulachong.vn</span>
              </li>
              <li className="flex items-start space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300 flex-shrink-0 mt-1">
                  <MapPinned className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">
                  123 Đường Cách Mạng Tháng Tám, Quận 1, TP. Hồ Chí Minh
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-gray-400">
            <p>&copy; 2026 Dòng Máu Lạc Hồng. Đã đăng ký bản quyền.</p>
            <div className="hidden md:flex space-x-2">
              <Link to="#" className="text-sm hover:text-white transition">Chính sách bảo mật</Link>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <Link to="#" className="text-sm hover:text-white transition">Điều khoản sử dụng</Link>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <Link to="#" className="text-sm hover:text-white transition">Sơ đồ trang</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Hệ thống hoạt động 24/7</span>
            </div>
            <button
              onClick={scrollToTop}
              className="md:hidden flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-all duration-300 group"
            >
              <span className="text-sm text-gray-400 group-hover:text-white">Lên đầu</span>
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-y-1 transition" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-800">
          <Link to="/privacy" className="text-xs text-gray-400 hover:text-white transition">Chính sách bảo mật</Link>
          <span className="text-gray-600">•</span>
          <Link to="/terms" className="text-xs text-gray-400 hover:text-white transition">Điều khoản sử dụng</Link>
          <span className="text-gray-600">•</span>
          <Link to="/sitemap" className="text-xs text-gray-400 hover:text-white transition">Sơ đồ trang</Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.28s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .group:hover .group-hover\:animate-bounce {
          animation: bounce 0.5s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;