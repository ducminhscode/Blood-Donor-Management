import { Fragment, useEffect, useState, useContext, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../configs/firebase";
import { collection, addDoc, onSnapshot, serverTimestamp, doc, setDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { UserContexts } from "../../../configs/UserContexts";
import { IoSend, IoAttach, IoHappy } from "react-icons/io5";
import { getImageUrl } from "../../../utils/Image";
import { authApis, endpoints } from "../../../configs/APIs";
import { formatDate, formatTime } from "../../../utils/Format";
import EmojiPicker from "emoji-picker-react";
import { CalendarDays, ExternalLink, MapPin, Search, Share2, X } from "lucide-react";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return "Vừa xong";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffSeconds / 86400)} ngày trước`;
};

const getOnlineStatus = (lastLoginDate) => {
  if (!lastLoginDate) return { text: "Offline", color: "gray", isOnline: false };
  const lastLogin = new Date(lastLoginDate);
  const now = new Date();
  const diffMinutes = Math.floor((now - lastLogin) / (1000 * 60));

  if (diffMinutes < 1) {
    return { text: "Đang hoạt động", color: "green", isOnline: true };
  }
  if (diffMinutes < 5) {
    return { text: "Vừa hoạt động", color: "yellow", isOnline: false };
  }
  return { text: formatRelativeTime(lastLoginDate), color: "gray", isOnline: false };
};

export default function ChatPanel({ selectedUser, setPreviews, currentEmail, onMessagesRead }) {
  const user = useContext(UserContexts);
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const chatHistoryRef = useRef(null);
  const inputRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const hasMarkedRead = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const isInitialLoad = useRef(true);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
  );

  const hasChatContext = !!(user && selectedUser);
  const current = currentEmail || user?.email || "";
  const other = selectedUser?.account?.email || selectedUser?.email || "";
  const chatId = [current, other].filter(Boolean).sort().join("_");

  const messagesColl = useMemo(
    () => (hasChatContext && chatId ? collection(db, "chats", chatId, "messages") : null),
    [hasChatContext, chatId]
  );

  const getEventStatus = (event) => {
    if (!event) return "ended";
    if (event.is_expire === true) return "ended";

    const start = new Date(event.time_start).getTime();
    if (!Number.isFinite(start)) return "ended";

    return start > Date.now() ? "upcoming" : "ongoing";
  };

  const getEventStatusLabel = (event) => {
    const status = getEventStatus(event);
    if (status === "ongoing") return "Đang diễn ra";
    if (status === "upcoming") return "Sắp diễn ra";
    return "Đã kết thúc";
  };

  const getDisplayName = () => {
    const acc = selectedUser.account || selectedUser;
    return `${acc.last_name || ""} ${acc.first_name || ""}`.trim() || acc.username || other;
  };

  const getAvatar = () => {
    const acc = selectedUser.account || selectedUser;
    return acc.avatar ? getImageUrl(acc.avatar) : "/default-avatar.png";
  };

  const getPreviewText = (message) => {
    if (!message) return "";

    if (message.lastMessageType === "event" || message.messageType === "event") {
      return `Đã chia sẻ hoạt động hiến máu: ${message.eventTitle || message.event?.title || "Hoạt động hiến máu"}`;
    }

    if (message.lastMessageType === "file" || message.isFile) {
      return message.text || "Đã gửi tệp";
    }

    return message.text || "";
  };

  const scrollToBottom = (behavior = "smooth") => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (!messagesColl) return undefined;

    const lastLoginDate = selectedUser.last_login || selectedUser.account?.last_login;
    const status = getOnlineStatus(lastLoginDate);
    setOnlineStatus(status);

    const interval = setInterval(() => {
      const updatedStatus = getOnlineStatus(lastLoginDate);
      setOnlineStatus(updatedStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUser, messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    const markRead = async () => {
      if (hasMarkedRead.current) return;

      const messagesQuery = query(messagesColl, orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        const unreadMessages = snapshot.docs.filter((item) => {
          const data = item.data();
          return data.sender === other && !data.read;
        });

        if (unreadMessages.length > 0 && !hasMarkedRead.current) {
          hasMarkedRead.current = true;

          for (const msgDoc of unreadMessages) {
            await updateDoc(doc(db, "chats", chatId, "messages", msgDoc.id), {
              read: true,
              readAt: serverTimestamp()
            });
          }

          if (onMessagesRead) {
            onMessagesRead(other);
          }
        }

        unsubscribe();
      });
    };

    markRead();
  }, [chatId, other, messagesColl, onMessagesRead]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    const messagesQuery = query(messagesColl, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      setMessages(msgs);

      if (msgs.length > 0) {
        const lastMessage = msgs[msgs.length - 1];
        setPreviews((prev) => ({
          ...prev,
          [other]: {
            text: getPreviewText(lastMessage),
            sender: lastMessage.sender,
            timestamp: lastMessage.timestamp,
            read: lastMessage.read || false,
            lastMessageType: lastMessage.lastMessageType || lastMessage.messageType || (lastMessage.isFile ? "file" : "text"),
            eventTitle: lastMessage.eventTitle || lastMessage.event?.title || ""
          }
        }));
      } else {
        setPreviews((prev) => {
          const newPreviews = { ...prev };
          delete newPreviews[other];
          return newPreviews;
        });
      }
    });

    return () => unsubscribe();
  }, [chatId, other, messagesColl, setPreviews]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    if (messages.length > 0) {
      if (isInitialLoad.current) {
        scrollToBottom("auto");
        isInitialLoad.current = false;
      } else {
        scrollToBottom("smooth");
      }
    }
  }, [messages, messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    isInitialLoad.current = true;
  }, [selectedUser, messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser, messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest(".emoji-picker-container")) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showEmojiPicker, messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.dataset.theme === "dark");
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, [messagesColl]);

  useEffect(() => {
    if (!messagesColl) return undefined;

    if (!showEventPicker || events.length > 0 || eventsLoading) return undefined;

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError("");

      try {
        const [ongoingRes, upcomingRes] = await Promise.all([
          authApis().get(`${endpoints.donation_event}?status=ongoing&page=1&page_size=100`),
          authApis().get(`${endpoints.donation_event}?status=upcoming&page=1&page_size=100`)
        ]);

        const merged = [...(ongoingRes.data?.results || []), ...(upcomingRes.data?.results || [])];
        const uniqueEvents = [];
        const seenIds = new Set();

        for (const event of merged) {
          if (!event?.id || seenIds.has(event.id)) continue;
          seenIds.add(event.id);
          uniqueEvents.push(event);
        }

        setEvents(uniqueEvents);
      } catch (error) {
        console.error("Error fetching shareable events:", error);
        setEventsError("Không tải được danh sách hoạt động hiến máu.");
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, [showEventPicker, events.length, eventsLoading, messagesColl]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await addDoc(messagesColl, {
        text: text.trim(),
        sender: current,
        timestamp: serverTimestamp(),
        read: false,
        messageType: "text"
      });

      const chatsRef = doc(db, "chats", chatId);
      await setDoc(chatsRef, {
        participants: [current, other],
        lastMessage: text.trim(),
        lastSender: current,
        lastMessageType: "text",
        updatedAt: serverTimestamp()
      }, { merge: true });

      setText("");

      setTimeout(() => scrollToBottom("smooth"), 100);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const shareEvent = async (event) => {
    if (!event) return;

    const sharedText = `Đã chia sẻ hoạt động hiến máu: ${event.title}`;

    try {
      await addDoc(messagesColl, {
        text: sharedText,
        sender: current,
        timestamp: serverTimestamp(),
        read: false,
        messageType: "event",
        eventId: event.id,
        eventTitle: event.title,
        eventPath: `/event/${event.id}`,
        event: {
          id: event.id,
          title: event.title,
          description: event.description || "",
          image_url: event.image_url || null,
          province: event.province || "",
          sub_district: event.sub_district || "",
          location: event.location || "",
          time_start: event.time_start,
          is_expire: !!event.is_expire
        }
      });

      const chatsRef = doc(db, "chats", chatId);
      await setDoc(chatsRef, {
        participants: [current, other],
        lastMessage: sharedText,
        lastSender: current,
        lastMessageType: "event",
        eventId: event.id,
        eventTitle: event.title,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowEventPicker(false);
      setEventSearch("");
      setTimeout(() => scrollToBottom("smooth"), 100);
    } catch (error) {
      console.error("Error sharing event:", error);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      alert("Định dạng file không được hỗ trợ. Vui lòng chọn file ảnh, PDF hoặc text");
      return;
    }

    try {
      const loadingMessage = await addDoc(messagesColl, {
        text: `Đang tải ${file.name}...`,
        sender: current,
        timestamp: serverTimestamp(),
        isFile: true,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        read: false,
        messageType: "file"
      });

      setTimeout(() => scrollToBottom("smooth"), 100);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;

          await updateDoc(doc(db, "chats", chatId, "messages", loadingMessage.id), {
            text: `${file.name}`,
            fileData: base64String,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size,
            isFile: true,
            uploadedAt: serverTimestamp()
          });

          const chatsRef = doc(db, "chats", chatId);
          await setDoc(chatsRef, {
            participants: [current, other],
            lastMessage: `${file.name}`,
            lastSender: current,
            lastMessageType: "file",
            updatedAt: serverTimestamp()
          }, { merge: true });

          setTimeout(() => scrollToBottom("smooth"), 100);
        } catch (error) {
          console.error("Error uploading file:", error);
          await updateDoc(doc(db, "chats", chatId, "messages", loadingMessage.id), {
            text: `Không thể tải ${file.name}`,
            isFile: true,
            error: true
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Có lỗi xảy ra khi gửi file");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const shouldShowAvatar = (index, isOwn) => {
    if (isOwn) return false;
    if (index === 0) return true;
    return messages[index - 1]?.sender !== messages[index]?.sender;
  };

  const filteredEvents = events.filter((event) => {
    const keyword = eventSearch.trim().toLowerCase();
    if (!keyword) return true;

    return [event.title, event.description, event.province, event.sub_district, event.location]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(keyword));
  });

  const toDateValue = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === "function") return timestamp.toDate();
    if (timestamp.seconds !== undefined) return new Date(timestamp.seconds * 1000);

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isSameCalendarDay = (a, b) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const getMessageDateLabel = (date) => {
    if (!date) return "";

    const today = new Date();
    if (isSameCalendarDay(date, today)) return "Hôm nay";

    return formatDate(date);
  };

  return (
    <>
      {!hasChatContext ? null : (
    <div className="chat-panel flex-1 flex flex-col bg-white">
      <div className="chat-panel-header px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={getAvatar()}
              alt={getDisplayName()}
              className="w-14 h-14 rounded-full object-cover border-2 border-red-500"
            />
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${onlineStatus?.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">{getDisplayName()}</h4>
            <p className={`text-xs flex items-center gap-1.5 ${onlineStatus?.color === "green"
              ? "text-green-500"
              : onlineStatus?.color === "yellow"
                ? "text-yellow-500"
                : "text-gray-400"
              }`}>
              {onlineStatus?.isOnline && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              {onlineStatus?.text || "Offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="chat-panel-body flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-gray-50" ref={chatHistoryRef}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="chat-panel-empty-avatar w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-2">
              <img
                src={getAvatar()}
                alt={getDisplayName()}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <h4 className="text-xl font-semibold text-gray-600">{getDisplayName()}</h4>
            <p className="text-gray-400">Bắt đầu chia sẻ những câu chuyện thú vị cùng nhau</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isOwn = m.sender === current;
            const showAvatar = shouldShowAvatar(index, isOwn);
            const isFile = m.isFile;
            const isEvent = m.messageType === "event" || !!m.event;
            const currentMessageDate = toDateValue(m.timestamp);
            const previousMessageDate = toDateValue(messages[index - 1]?.timestamp);
            const showDateSeparator = index === 0 || !isSameCalendarDay(currentMessageDate, previousMessageDate);

            return (
              <Fragment key={m.id}>
                {showDateSeparator && currentMessageDate && (
                  <div className="flex justify-center my-2">
                    <div className="px-4 py-1.5 rounded-full bg-white/90 border border-gray-200 text-xs font-medium text-gray-500 shadow-sm">
                      {getMessageDateLabel(currentMessageDate)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 max-w-[80%] ${isOwn ? "self-end flex-row-reverse" : ""}`}
                >
                  {!isOwn && showAvatar && (
                    <img
                      src={getAvatar()}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover self-end flex-shrink-0"
                    />
                  )}
                  {!isOwn && !showAvatar && (
                    <div className="w-9 flex-shrink-0"></div>
                  )}
                  <div className={`max-w-full px-4 py-3 rounded-2xl ${isOwn
                    ? "bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md shadow-md"
                    : "chat-panel-message-other bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                    }`}>
                    {isEvent ? (
                      <div className="w-[300px] max-w-full space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-red-100 flex-shrink-0">
                            {m.event?.image_url ? (
                              <img
                                src={getImageUrl(m.event.image_url)}
                                alt={m.event?.title || "Hoạt động hiến máu"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white">
                                <CalendarDays size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] mb-1">
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                                {getEventStatusLabel(m.event)}
                              </span>
                              <span className={isOwn ? "text-white/70" : "text-gray-400"}>Hoạt động hiến máu</span>
                            </div>
                            <div className={`text-sm font-semibold break-words ${isOwn ? "text-white" : "text-gray-900"}`}>
                              {m.event?.title || m.eventTitle || "Hoạt động hiến máu"}
                            </div>
                            <div className={`text-xs mt-1 ${isOwn ? "text-white/80" : "text-gray-500"}`}>
                              {formatDate(m.event?.time_start)} {formatTime(m.event?.time_start)}
                            </div>
                            {(m.event?.province || m.event?.sub_district || m.event?.location) && (
                              <div className={`text-xs mt-1 flex items-start gap-1 ${isOwn ? "text-white/80" : "text-gray-500"}`}>
                                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">
                                  {[m.event?.location, m.event?.sub_district, m.event?.province].filter(Boolean).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(m.eventPath || `/event/${m.eventId || m.event?.id}`)}
                            className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-2 transition-colors ${isOwn
                              ? "bg-white/15 hover:bg-white/25 text-white"
                              : "bg-red-50 hover:bg-red-100 text-red-600"
                              }`}
                          >
                            Xem chi tiết
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ) : isFile ? (
                      <div className="flex items-center gap-2">
                        {m.fileType?.startsWith("image/") ? (
                          <div className="relative group">
                            <img
                              src={m.fileData}
                              alt={m.fileName}
                              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(m.fileData, "_blank")}
                            />
                          </div>
                        ) : (
                          <a
                            href={m.fileData}
                            download={m.fileName}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <span className="text-sm">{m.fileName}</span>
                            <span className="text-xs opacity-70">
                              ({Math.round(m.fileSize / 1024)} KB)
                            </span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed break-words">{m.text}</div>
                    )}
                    <div className={`text-[10px] text-right mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                      {m.timestamp?.toDate?.()?.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) ||
                        m.timestamp?.toLocaleTimeString?.("vi-VN", { hour: "2-digit", minute: "2-digit" }) ||
                        ""}
                      {!isOwn && !m.read && !isFile && !isEvent && (
                        <span className="ml-2 inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      <form className="chat-panel-form px-6 py-5 bg-white border-t border-gray-100 flex items-center gap-3" onSubmit={sendMessage}>
        <div className="relative emoji-picker-container">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="cursor-pointer chat-panel-icon-button w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-red-100 hover:text-red-500 transition-all duration-200 text-gray-500"
          >
            <IoHappy size={24} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
                theme={isDarkTheme ? "dark" : "light"}
                searchPlaceholder="Tìm kiếm emoji..."
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowEventPicker(true)}
          className="cursor-pointer chat-panel-icon-button w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-red-100 hover:text-red-500 transition-all duration-200 text-gray-500"
          title="Chia sẻ hoạt động hiến máu"
        >
          <Share2 size={20} />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer chat-panel-icon-button w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-red-100 hover:text-red-500 transition-all duration-200 text-gray-500"
        >
          <IoAttach size={22} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="application/pdf,text/plain"
        />

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Soạn tin nhắn..."
          className="chat-panel-input flex-1 px-5 py-3 border-2 border-gray-200 rounded-full text-sm outline-none transition-all duration-200 bg-gray-50 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
        />

        <button
          type="submit"
          className={`cursor-pointer w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 shadow-md ${!text.trim()
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : "bg-gradient-to-br from-red-500 to-red-600 hover:scale-105 hover:shadow-lg text-white"
            }`}
          disabled={!text.trim()}
        >
          <IoSend size={20} />
        </button>
      </form>

      {showEventPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowEventPicker(false)}>
          <div
            className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chia sẻ hoạt động hiến máu</h3>
                <p className="text-sm text-gray-500">Gửi hoạt động hiến máu đang diễn ra hoặc sắp diễn ra cho bạn bè.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEventPicker(false)}
                className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Tìm theo tên hoạt động hiến máu, địa điểm..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {eventsLoading ? (
                <div className="py-16 text-center text-gray-500">Đang tải hoạt động hiến máu...</div>
              ) : eventsError ? (
                <div className="py-16 text-center text-red-500">{eventsError}</div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-gray-500">Không tìm thấy hoạt động hiến máu phù hợp.</div>
              ) : (
                <div className="grid gap-3">
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => shareEvent(event)}
                      className="cursor-pointer text-left w-full p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200 bg-white flex items-start gap-4"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {event.image_url ? (
                          <img
                            src={getImageUrl(event.image_url)}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                            <CalendarDays size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
                            {getEventStatusLabel(event)}
                          </span>
                          <span className="text-xs text-gray-400">Nhấn để chia sẻ</span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {event.description || "Cùng nhau lan tỏa thông tin về hoạt động hiến máu này."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(event.time_start)} {formatTime(event.time_start)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {[event.location, event.sub_district, event.province].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
}
