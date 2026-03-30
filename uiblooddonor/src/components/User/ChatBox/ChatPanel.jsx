import { useEffect, useState, useContext, useRef } from "react";
import { db } from "../../../configs/firebase";
import { collection, addDoc, onSnapshot, serverTimestamp, doc, setDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { UserContexts } from "../../../configs/UserContexts";
import { IoSend, IoAttach, IoHappy } from "react-icons/io5";
import { getImageUrl } from "../../../utils/Image";
import EmojiPicker from 'emoji-picker-react';

export default function ChatPanel({ selectedUser, setPreviews, currentEmail, onMessagesRead }) {
  const user = useContext(UserContexts);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const chatHistoryRef = useRef(null);
  const inputRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const hasMarkedRead = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const isInitialLoad = useRef(true);

  if (!user || !selectedUser) return null;

  const current = currentEmail || user.email;
  const other = selectedUser.account?.email || selectedUser.email;
  const chatId = [current, other].sort().join("_");

  const messagesColl = collection(db, "chats", chatId, "messages");

  const getDisplayName = () => {
    const acc = selectedUser.account || selectedUser;
    return `${acc.last_name || ''} ${acc.first_name || ''}`.trim() || acc.username || other;
  };

  const getAvatar = () => {
    const acc = selectedUser.account || selectedUser;
    return acc.avatar
      ? getImageUrl(acc.avatar)
      : '/default-avatar.png';
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffSeconds / 86400)} ngày trước`;
  };

  const getOnlineStatus = (lastLoginDate) => {
    if (!lastLoginDate) return { text: 'Offline', color: 'gray', isOnline: false };
    const lastLogin = new Date(lastLoginDate);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastLogin) / (1000 * 60));

    if (diffMinutes < 1) {
      return { text: 'Đang hoạt động', color: 'green', isOnline: true };
    }
    if (diffMinutes < 5) {
      return { text: 'Vừa hoạt động', color: 'yellow', isOnline: false };
    }
    return { text: formatRelativeTime(lastLoginDate), color: 'gray', isOnline: false };
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

  useEffect(() => {
    const lastLoginDate = selectedUser.last_login || selectedUser.account?.last_login;
    const status = getOnlineStatus(lastLoginDate);
    setOnlineStatus(status);

    const interval = setInterval(() => {
      const updatedStatus = getOnlineStatus(lastLoginDate);
      setOnlineStatus(updatedStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    const markRead = async () => {
      if (hasMarkedRead.current) return;

      const messagesQuery = query(messagesColl, orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        const unreadMessages = snapshot.docs.filter(doc => {
          const data = doc.data();
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
    const messagesQuery = query(messagesColl, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);

      if (msgs.length > 0) {
        const lastMessage = msgs[msgs.length - 1];
        setPreviews(prev => ({
          ...prev,
          [other]: {
            text: lastMessage.text,
            sender: lastMessage.sender,
            timestamp: lastMessage.timestamp,
            read: lastMessage.read || false
          }
        }));
      } else {
        setPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[other];
          return newPreviews;
        });
      }
    });

    return () => unsubscribe();
  }, [chatId, other, setPreviews]);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        scrollToBottom('auto');
        isInitialLoad.current = false;
      } else {
        scrollToBottom('smooth');
      }
    }
  }, [messages]);

  useEffect(() => {
    isInitialLoad.current = true;
  }, [selectedUser]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await addDoc(messagesColl, {
        text: text.trim(),
        sender: current,
        timestamp: serverTimestamp(),
        read: false
      });

      const chatsRef = doc(db, "chats", chatId);
      await setDoc(chatsRef, {
        participants: [current, other],
        lastMessage: text.trim(),
        lastSender: current,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setText("");

      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Định dạng file không được hỗ trợ. Vui lòng chọn file ảnh, PDF hoặc text');
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
        read: false
      });

      setTimeout(() => scrollToBottom('smooth'), 100);

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
            lastMessageType: 'file',
            updatedAt: serverTimestamp()
          }, { merge: true });

          setTimeout(() => scrollToBottom('smooth'), 100);

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
      alert('Có lỗi xảy ra khi gửi file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const shouldShowAvatar = (index, isOwn) => {
    if (isOwn) return false;
    if (index === 0) return true;
    return messages[index - 1]?.sender !== messages[index]?.sender;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={getAvatar()}
              alt={getDisplayName()}
              className="w-14 h-14 rounded-full object-cover border-2 border-red-500"
            />
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${onlineStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">{getDisplayName()}</h4>
            <p className={`text-xs flex items-center gap-1.5 ${onlineStatus?.color === 'green' ? 'text-green-500' :
              onlineStatus?.color === 'yellow' ? 'text-yellow-500' :
                'text-gray-400'
              }`}>
              {onlineStatus?.isOnline && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              {onlineStatus?.text || 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-gray-50" ref={chatHistoryRef}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-2">
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

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[80%] ${isOwn ? 'self-end flex-row-reverse' : ''}`}
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
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                  }`}>
                  {isFile ? (
                    <div className="flex items-center gap-2">
                      {m.fileType?.startsWith('image/') ? (
                        <div className="relative group">
                          <img
                            src={m.fileData}
                            alt={m.fileName}
                            className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(m.fileData, '_blank')}
                          />
                          <span className="text-xs text-gray-500 mt-1 block">{m.fileName}</span>
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
                  <div className={`text-[10px] text-right mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'
                    }`}>
                    {m.timestamp?.toDate?.()?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) ||
                      m.timestamp?.toLocaleTimeString?.('vi-VN', { hour: '2-digit', minute: '2-digit' }) ||
                      ''}
                    {!isOwn && !m.read && !isFile && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="px-6 py-5 bg-white border-t border-gray-100 flex items-center gap-3" onSubmit={sendMessage}>
        <div className="relative emoji-picker-container">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-red-100 hover:text-red-500 transition-all duration-200 text-gray-500"
          >
            <IoHappy size={24} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
                theme="light"
                searchPlaceholder="Tìm kiếm emoji..."
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-red-100 hover:text-red-500 transition-all duration-200 text-gray-500"
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
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn"
          className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-full text-sm outline-none transition-all duration-200 bg-gray-50 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
        />

        <button
          type="submit"
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 shadow-md ${!text.trim()
            ? 'bg-gray-300 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-br from-red-500 to-red-600 hover:scale-105 hover:shadow-lg text-white'
            }`}
          disabled={!text.trim()}
        >
          <IoSend size={20} />
        </button>
      </form>
    </div>
  );
}