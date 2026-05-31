import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { authApis, endpoints } from "../../../configs/APIs";
import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import { UserContexts } from "../../../configs/UserContexts";
import { MessageCircle, Users } from "lucide-react";
import { db } from "../../../configs/firebase";
import { collection, query, onSnapshot, limit, orderBy, doc, updateDoc } from "firebase/firestore";
import { Helmet } from "react-helmet-async";

export default function ChatBox() {
    const user = useContext(UserContexts);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [previews, setPreviews] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [q] = useSearchParams();
    const unsubscribeRef = useRef(null);
    const location = useLocation();
    const hasSelectedFromState = useRef(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            let url = `${endpoints['friend_list']}?page=${page}`;
            const kw = q.get('kw');
            if (kw) url += `&kw=${kw}`;

            const res = await authApis().get(url);
            const { results, next } = res.data;

            if (!results || results.length === 0) {
                setPage(0);
                setUsers([]);
                return;
            }

            const filteredUsers = results.filter(u => u.account?.role === 1);

            if (page === 1) {
                setUsers(filteredUsers);
            } else {
                setUsers(prev => [...prev, ...filteredUsers]);
            }

            if (!next) setPage(0);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    }, [page, q]);

    const markMessagesAsRead = useCallback(async (otherEmail) => {
        if (!user?.email) return;

        const chatId = [user.email, otherEmail].sort().join("_");
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const unreadMessages = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.sender === otherEmail && !data.read;
            });

            for (const msgDoc of unreadMessages) {
                await updateDoc(doc(db, "chats", chatId, "messages", msgDoc.id), {
                    read: true,
                    readAt: new Date()
                });
            }

            unsubscribe();
        });
    }, [user]);

    useEffect(() => {
        if (location.state?.selectedFriend && users.length > 0 && !hasSelectedFromState.current) {
            const friendFromState = location.state.selectedFriend;

            const foundUser = users.find(u => u.id === friendFromState.id);

            if (foundUser) {
                setSelectedUser(foundUser);
                markMessagesAsRead(foundUser.account?.email || foundUser.email);
                hasSelectedFromState.current = true;

                window.history.replaceState({}, document.title);
            }
        }
    }, [users, location.state, markMessagesAsRead]);

    useEffect(() => {
        if (!user?.email || users.length === 0) return;

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        const allChatsListeners = [];

        users.forEach(u => {
            const otherEmail = u.account?.email || u.email;
            const chatId = [user.email, otherEmail].sort().join("_");
            const messagesRef = collection(db, "chats", chatId, "messages");
            const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    setPreviews(prev => {
                        const newPreviews = { ...prev };
                        delete newPreviews[otherEmail];
                        return newPreviews;
                    });
                    return;
                }

                const lastMessage = snapshot.docs[0].data();
                const lastMessageData = {
                    text: lastMessage.text,
                    sender: lastMessage.sender,
                    timestamp: lastMessage.timestamp,
                    read: lastMessage.read || false,
                    lastMessageType: lastMessage.lastMessageType || lastMessage.messageType || (lastMessage.isFile ? "file" : "text"),
                    eventTitle: lastMessage.eventTitle || lastMessage.event?.title || "",
                    event: lastMessage.event || null
                };

                setPreviews(prev => ({
                    ...prev,
                    [otherEmail]: lastMessageData
                }));
            });

            allChatsListeners.push(unsubscribe);
        });

        unsubscribeRef.current = () => {
            allChatsListeners.forEach(unsub => unsub());
        };

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [user, users]);

    useEffect(() => {
        if (page > 0) fetchUsers();
    }, [page, fetchUsers]);

    useEffect(() => {
        setPage(1);
        setUsers([]);
        setSelectedUser(null);
        setPreviews({});
        hasSelectedFromState.current = false;
    }, [q]);

    const loadMore = () => {
        if (!loading && page > 0) {
            setPage(prev => prev + 1);
        }
    };

    const handleSelectUser = useCallback(async (user) => {
        setSelectedUser(user);
        const otherEmail = user.account?.email || user.email;
        await markMessagesAsRead(otherEmail);
    }, [markMessagesAsRead]);

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Đang tải...</p>
            </div>
        </div>
    );

    return (
        <div className="chat-page min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
            <Helmet>
                <title>Trò chuyện | Dòng Máu Lạc Hồng</title>
                </Helmet>
            <div className="chat-shell max-w-[1400px] mx-auto h-[calc(87vh-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex">
                <Sidebar
                    users={users}
                    currentEmail={user.email}
                    selectedUser={selectedUser}
                    onSelect={handleSelectUser}
                    previews={previews}
                    onEndReach={loadMore}
                    loading={loading}
                />
                {selectedUser ? (
                    <ChatPanel
                        selectedUser={selectedUser}
                        setPreviews={setPreviews}
                        currentEmail={user.email}
                        onMessagesRead={markMessagesAsRead}
                    />
                ) : (
                    <div className="chat-empty-state flex-1 flex items-center justify-center bg-gradient-to-br from-red-50/30 to-orange-50/30">
                        <div className="text-center px-8">
                            <div className="relative mb-8 inline-block">
                                <MessageCircle
                                    className="text-red-200"
                                    size={80}
                                    strokeWidth={1.5}
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                Kết nối yêu thương
                            </h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                Chọn một người bạn từ danh sách bên trái để bắt đầu trò chuyện
                            </p>
                            <div className="chat-empty-pill inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                                <Users size={18} className="text-red-400" />
                                <span className="text-sm text-gray-600 font-medium">
                                    {users.length} người bạn
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
