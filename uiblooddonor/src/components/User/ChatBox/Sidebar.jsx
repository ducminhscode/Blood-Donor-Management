import React, { useEffect, useState } from "react";
import { Search, Users, Loader2, MessageSquare } from "lucide-react";
import { getImageUrl } from "../../../utils/Image";

export default function Sidebar({
    users,
    currentEmail,
    selectedUser,
    onSelect,
    previews = {},
    onEndReach,
    loading
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const loadingRef = React.useRef(false);
    const [onlineStatuses, setOnlineStatuses] = useState({});

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (
            !loadingRef.current &&
            scrollHeight > clientHeight &&
            scrollTop + clientHeight >= scrollHeight - 10
        ) {
            loadingRef.current = true;
            Promise.resolve(onEndReach())
                .finally(() => {
                    loadingRef.current = false;
                });
        }
    };

    const filteredUsers = users.filter(user => {
        const account = user.account || user;
        const fullName = `${account.last_name || ''} ${account.first_name || ''}`.trim() || account.username;
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const getPreviewText = (email, p) => {
        if (!p || !p.text || p.text === undefined) return "Chưa có tin nhắn";

        if (p.sender === currentEmail) {
            return `Bạn: ${p.text}`;
        }
        return p.text;
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

        if (diffMinutes < 5) {
            return { text: 'Đang hoạt động', color: 'green', isOnline: true };
        }
        if (diffMinutes < 30) {
            return { text: 'Vừa hoạt động', color: 'yellow', isOnline: false };
        }
        return { text: formatRelativeTime(lastLoginDate), color: 'gray', isOnline: false };
    };

    useEffect(() => {
        const fetchOnlineStatuses = async () => {
            const statuses = {};
            for (const user of users) {
                const account = user.account || user;
                const lastLoginDate = account.last_login;
                if (lastLoginDate) {
                    statuses[account.email] = getOnlineStatus(lastLoginDate);
                } else {
                    statuses[account.email] = { text: 'Offline', color: 'gray', isOnline: false };
                }
            }
            setOnlineStatuses(statuses);
        };

        fetchOnlineStatuses();

        const interval = setInterval(fetchOnlineStatuses, 30000);
        return () => clearInterval(interval);
    }, [users]);

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';

        try {
            if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
                const date = timestamp.toDate();
                return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
            if (timestamp?.seconds !== undefined) {
                const date = new Date(timestamp.seconds * 1000);
                return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
            return '';
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    };

    return (
        <div className="chat-sidebar w-[380px] bg-white border-r border-gray-100 flex flex-col">
            <div className="chat-sidebar-header p-6 border-b border-gray-100">
                <div className="flex items-center gap-2.5 mb-5">
                    <MessageSquare className="text-red-500" size={20} />
                    <h3 className="text-xl font-bold text-gray-900 m-0">Tin nhắn</h3>
                    <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {users.length}
                    </span>
                </div>
                <div className="relative">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="chat-sidebar-search w-full py-3 pl-10 pr-3 border border-gray-200 rounded-full text-sm bg-gray-50 transition-all duration-200 focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                    />
                </div>
            </div>

            <div className="chat-sidebar-list flex-1 overflow-y-auto p-2" onScroll={handleScroll}>
                {loading && users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-gray-400">
                        <Loader2 className="animate-spin mb-3" size={32} />
                        <p>Đang tải danh sách...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-gray-400">
                        <Users size={48} />
                        <p className="mt-2">Không tìm thấy bạn bè</p>
                    </div>
                ) : (
                    filteredUsers.map(u => {
                        const account = u.account || u;
                        const fullName = `${account.last_name || ''} ${account.first_name || ''}`.trim() || account.username;
                        const email = account.email;
                        const avatar = account.avatar
                            ? getImageUrl(account.avatar)
                            : '/default-avatar.png';

                        const p = previews[email] || {};
                        const previewText = getPreviewText(email, p);
                        const isActive = selectedUser?.account?.email === email || selectedUser?.email === email;
                        const userOnlineStatus = onlineStatuses[email] || { text: 'Offline', color: 'gray', isOnline: false };

                        return (
                            <div
                                key={email || u.id}
                                className={`chat-sidebar-item flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 mb-1 ${isActive
                                    ? 'chat-sidebar-item-active bg-red-50 border-l-3 border-l-red-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => onSelect(u)}
                            >
                                <div className="relative">
                                    <img
                                        className="w-13 h-13 rounded-full object-cover border-2 border-white shadow-sm"
                                        src={avatar}
                                        alt={fullName}
                                        onError={(e) => {
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                    <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${userOnlineStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-800 mb-1 truncate">
                                        {fullName}
                                    </div>
                                    <div className={`text-xs ${p.sender !== currentEmail && p.text && !p.read ? 'font-bold text-gray-900' : 'text-gray-500'} truncat`}>
                                        {previewText}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[11px] text-gray-400">
                                        {p.timestamp && formatMessageTime(p.timestamp)}
                                    </div>
                                    {p.sender !== currentEmail && p.text && !p.read && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                {loading && users.length > 0 && (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-500">
                        <Loader2 className="animate-spin" size={16} />
                        <span>Đang tải thêm...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
