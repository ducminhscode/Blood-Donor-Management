import { useState, useEffect, useCallback, useContext } from 'react';
import {
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Building2, Heart, XCircle, MessageCircle, UserPlus,
    Clock, Activity, Weight, Ruler, CreditCard, UserMinus,
    CheckCircle, AlertCircle, Sparkles, Users, UserCheck,
    UserX, Shield, ThumbsUp, Gift, MoreHorizontal, Share2,
    Copy, Facebook, Twitter, Mail as MailIcon, MessageSquare,
    Phone as PhoneIcon, MapPinned, Home, FileText, Globe,
    Cake, Hash, BadgeCheck, Medal, Trophy, Target,
    Filter, Send, Ban, Loader2, TrendingUp, CalendarDays,
    VenusAndMars, BadgeInfo
} from 'lucide-react';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { useNavigate } from 'react-router-dom';
import { UserContexts } from '../../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

const DonorList = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalDonors, setTotalDonors] = useState(0);
    const [sortBy, setSortBy] = useState('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [activeTab, setActiveTab] = useState('info');

    const currentUser = useContext(UserContexts);
    const [friendStatuses, setFriendStatuses] = useState({});
    const navigate = useNavigate();

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const fetchFriendStatuses = async (donorIds) => {
        if (!donorIds.length) return;

        try {
            const donorIdsString = donorIds.join(',');
            const response = await authApis().get(
                `${endpoints.donor}friend-status/?donor_ids=${donorIdsString}`
            );
            setFriendStatuses(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error("Error fetching friend statuses:", error);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const fetchDonors = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setDonors([]);
            setFriendStatuses({});
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        try {
            let url = endpoints.donor;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            let ordering = '-last_login';
            if (sortBy === 'donation_count') ordering = '-donation_count';
            else if (sortBy === 'points') ordering = '-points';
            else if (sortBy === 'name') ordering = 'last_name,first_name';
            params.append('ordering', ordering);

            params.append('page', currentPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            const formattedDonors = response.data.results
                .filter(donor => donor.account.id !== currentUser?.id)
                .map(donor => ({
                    id: donor.id,
                    username: donor.account.username,
                    last_name: donor.account.last_name,
                    first_name: donor.account.first_name,
                    avatar: donor.account.avatar,
                    email: donor.account.email,
                    phone: donor.account.phone,
                    birth_date: donor.account.birth_date,
                    gender: donor.account.gender,
                    blood_type: donor.blood_type,
                    rh_factor: donor.rh_factor,
                    donation_count: donor.donation_count,
                    points: donor.points,
                    career: donor.career,
                    organization: donor.organization,
                    province: donor.province,
                    sub_district: donor.sub_district,
                    permanent_address: donor.permanent_address,
                    weight: donor.weight,
                    height: donor.height,
                    bmi: donor.bmi,
                    can_donation: donor.can_donation,
                    last_donation: donor.last_donation,
                    is_private: donor.is_private,
                    last_login: donor.account.last_login
                }));

            if (isLoadMore) {
                setDonors(prev => [...prev, ...formattedDonors]);
            } else {
                setDonors(formattedDonors);
            }

            setHasNextPage(response.data.next !== null);
            setTotalDonors(response.data.count - 1);

            const donorIds = formattedDonors.map(d => d.id);
            await fetchFriendStatuses(donorIds);

        } catch (error) {
            console.error("Error fetching donors:", error);
            showMessage("Không thể tải danh sách người hiến máu", "error");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const fetchDonorDetail = async (donorId) => {
        setLoadingDetail(true);
        try {
            const url = endpoints.donor_detail.replace('${id}', donorId);
            const response = await authApis().get(url);
            setSelectedDonor(response.data);
            setShowDialog(true);

            if (!friendStatuses[donorId]) {
                await fetchFriendStatuses([donorId]);
            }
        } catch (error) {
            console.error("Error fetching donor detail:", error);
            showMessage("Không thể tải thông tin chi tiết", "error");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = (donorId) => {
        fetchDonorDetail(donorId);
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setSelectedDonor(null);
        setActiveTab('info');
    };

    const handleSendRequest = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.request_friend.replace('${id}', donorId));
            showMessage("Đã gửi lời mời kết bạn", "success");
            setFriendStatuses(prev => ({ ...prev, [donorId]: 'pending_sent' }));
        } catch (error) {
            console.error("Error sending friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleAcceptRequest = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.accept_friend.replace('${id}', donorId));
            showMessage("Đã chấp nhận lời mời kết bạn", "success");
            setFriendStatuses(prev => ({ ...prev, [donorId]: 'friend' }));
        } catch (error) {
            console.error("Error accepting friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectRequest = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.reject_friend.replace('${id}', donorId));
            showMessage("Đã từ chối lời mời kết bạn", "success");
            setFriendStatuses(prev => ({ ...prev, [donorId]: 'none' }));
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelRequest = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.cancel_request.replace('${id}', donorId));
            showMessage("Đã hủy lời mời kết bạn", "success");
            setFriendStatuses(prev => ({ ...prev, [donorId]: 'none' }));
        } catch (error) {
            console.error("Error canceling friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const debouncedSearch = useCallback(
        debounce(() => {
            setPage(1);
            fetchDonors(false);
        }, searchTerm ? 500 : 10),
        [searchTerm, sortBy]
    );

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchTerm, sortBy, debouncedSearch]);

    useEffect(() => {
        if (page > 1) {
            fetchDonors(true);
        }
    }, [page]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setPage(1);
        fetchDonors(false);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setPage(1);
    };

    const getFullName = (donor) => {
        return `${donor.last_name || ''} ${donor.first_name || ''}`.trim() || 'Chưa cập nhật';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
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

    const getGenderText = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (bloodType === undefined || rhFactor === undefined) return 'Chưa cập nhật';
        const bloodMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        return `${bloodMap[bloodType] || '?'}${rhFactor === 0 ? '-' : '+'}`;
    };

    const getDonationLevel = (count) => {
        if (count >= 20) return { label: 'Huy chương vàng', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' };
        if (count >= 10) return { label: 'Huy chương bạc', icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50' };
        if (count >= 5) return { label: 'Huy chương đồng', icon: Medal, color: 'text-amber-600', bg: 'bg-amber-50' };
        return { label: 'Người hiến máu', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' };
    };

    const renderActionButtons = (donor) => {
        const status = friendStatuses[donor.id] || 'none';
        const isLoading = processingId === donor.id;

        if (isLoading) {
            return (
                <button
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-400 text-white rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                </button>
            );
        }

        switch (status) {
            case 'friend':
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/chat', { state: { selectedFriend: donor } });
                        }}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Nhắn tin
                    </button>
                );

            case 'pending_sent':
                return (
                    <div className="flex gap-2 w-full">
                        <button
                            disabled
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Đã gửi lời mời
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRequest(donor.id);
                            }}
                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-2"
                            title="Hủy lời mời"
                        >
                            <UserMinus className="w-4 h-4" />
                        </button>
                    </div>
                );

            case 'pending_received':
                return (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(donor.id);
                            }}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                        >
                            <UserCheck className="w-4 h-4" />
                            Chấp nhận
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRejectRequest(donor.id);
                            }}
                            className="px-4 py-2.5 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2"
                            title="Từ chối"
                        >
                            <UserX className="w-4 h-4" />
                        </button>
                    </div>
                );

            case 'none':
            default:
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSendRequest(donor.id);
                        }}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <UserPlus className="w-4 h-4" />
                        Kết bạn
                    </button>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Tìm kiếm người hiến máu | Dòng Máu Lạc Hồng</title>
            </Helmet>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${15 + Math.random() * 10}s`
                            }}
                        >
                            <Users className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Cộng đồng hiến máu</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Tìm kiếm người hiến máu</h1>
                            <p className="text-red-100 text-lg">Kết nối với những người có cùng nhóm máu và sẵn sàng giúp đỡ</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate("/friend-list")}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm"
                            >
                                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Danh sách bạn bè</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex flex-wrap gap-4 mt-8">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalDonors}</div>
                                <div className="text-sm text-white/80">Người hiến máu</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className="fixed top-24 right-4 z-50 animate-slideInRight">
                    <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${message.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                        {message.type === 'success'
                            ? <CheckCircle className="w-5 h-5" />
                            : <AlertCircle className="w-5 h-5" />
                        }
                        <span className="font-medium">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Search & Filter Section */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <Filter className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng lưới"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'list'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng danh sách"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chế độ xem
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setViewMode('grid');
                                                setShowFilters(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            <span>Dạng lưới</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('list');
                                                setShowFilters(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'list'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                            <span>Dạng danh sách</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Search Indicator */}
                    {searchTerm && (
                        <div className="mt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                <Search className="h-4 w-4" />
                                <span>Tìm kiếm: "{searchTerm}"</span>
                                <button
                                    onClick={handleClearSearch}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                {!loading && donors.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                <span className="font-bold text-lg">{totalDonors}</span>
                            </div>
                            <span className="text-gray-600">
                                người hiến máu {searchTerm && "phù hợp với tìm kiếm"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Donors List */}
                {!loading && donors.length > 0 ? (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {donors.map((donor) => {
                                    const DonationIcon = getDonationLevel(donor.donation_count).icon;
                                    const levelColor = getDonationLevel(donor.donation_count).color;
                                    const levelBg = getDonationLevel(donor.donation_count).bg;
                                    const status = friendStatuses[donor.id];

                                    return (
                                        <div
                                            key={donor.id}
                                            onClick={() => handleViewDetail(donor.id)}
                                            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                {status === 'friend' && donor.last_login && (
                                                    <span className="inline-flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium shadow-md">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                        Online {formatRelativeTime(donor.last_login)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="relative mb-4">
                                                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            {donor.avatar ? (
                                                                <img
                                                                    src={getImageUrl(donor.avatar)}
                                                                    alt={getFullName(donor)}
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-10 h-10 text-red-600" />
                                                            )}
                                                        </div>
                                                        {donor.can_donation && (
                                                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full p-1.5 border-2 border-white shadow-md">
                                                                <Droplet className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors mb-2">
                                                        {getFullName(donor)}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                                                            <Droplet className="w-3 h-3" />
                                                            {getBloodTypeDisplay(donor.blood_type, donor.rh_factor)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-medium">
                                                            <Award className="w-3 h-3" />
                                                            {donor.points || 0} điểm
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${levelBg} ${levelColor}`}>
                                                            <DonationIcon className="w-3 h-3" />
                                                            {donor.donation_count || 0} lần
                                                        </span>
                                                        {status === 'friend' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                                                                <UserCheck className="w-3 h-3" />
                                                                Bạn bè
                                                            </span>
                                                        )}
                                                        {status === 'pending_sent' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-medium">
                                                                <Send className="w-3 h-3" />
                                                                Đã gửi
                                                            </span>
                                                        )}
                                                        {status === 'pending_received' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium">
                                                                <UserPlus className="w-3 h-3" />
                                                                Chờ phản hồi
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="w-full space-y-2 text-left mb-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                            <span className="truncate">{donor.email || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                            <span>{donor.phone || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                            <span className="truncate">{donor.province || 'Chưa cập nhật'}</span>
                                                        </div>
                                                    </div>

                                                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                                                        {renderActionButtons(donor)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {donors.map((donor) => {
                                    const status = friendStatuses[donor.id];

                                    return (
                                        <div
                                            key={donor.id}
                                            onClick={() => handleViewDetail(donor.id)}
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                                                            {donor.avatar ? (
                                                                <img
                                                                    src={getImageUrl(donor.avatar)}
                                                                    alt={getFullName(donor)}
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-6 h-6 text-red-600" />
                                                            )}
                                                        </div>
                                                        {donor.can_donation && (
                                                            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white">
                                                                <Droplet className="w-2 h-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {getFullName(donor)}
                                                            </h3>
                                                            {status === 'friend' && donor.last_login && (
                                                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                    {formatRelativeTime(donor.last_login)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Droplet className="w-3 h-3 text-red-500" />
                                                                {getBloodTypeDisplay(donor.blood_type, donor.rh_factor)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Award className="w-3 h-3 text-yellow-500" />
                                                                {donor.points || 0} điểm
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Droplet className="w-3 h-3 text-blue-500" />
                                                                {donor.donation_count || 0} lần hiến
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3 text-gray-400" />
                                                                {donor.email || 'Chưa cập nhật'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-gray-400" />
                                                                {donor.phone || 'Chưa cập nhật'}
                                                            </span>
                                                            {donor.province && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                                    {donor.province}
                                                                </span>
                                                            )}
                                                            {status === 'pending_sent' && (
                                                                <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                                                    <Send className="w-3 h-3" />
                                                                    Đã gửi
                                                                </span>
                                                            )}
                                                            {status === 'pending_received' && (
                                                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                    <UserPlus className="w-3 h-3" />
                                                                    Chờ phản hồi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>Xem thêm người hiến máu</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}
                    </>
                ) : !loading && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Users className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm
                                ? 'Không tìm thấy người hiến máu phù hợp'
                                : 'Chưa có người hiến máu nào'}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc tìm kiếm'
                                : 'Hãy kết nối với mọi người trong cộng đồng để lan tỏa yêu thương'}
                        </p>

                        {searchTerm ? (
                            <button
                                onClick={handleClearSearch}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
                                Xóa tìm kiếm
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/friend-list')}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <Users className="w-5 h-5" />
                                Xem danh sách bạn bè
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDialog && selectedDonor && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
                    onClick={handleCloseDialog}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white p-6 rounded-t-2xl flex-shrink-0">
                            <button
                                onClick={handleCloseDialog}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors z-10"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                                        {selectedDonor.account?.avatar ? (
                                            <img
                                                src={getImageUrl(selectedDonor.account.avatar)}
                                                alt={getFullName(selectedDonor)}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-red-600" />
                                        )}
                                    </div>
                                    {selectedDonor.can_donation && (
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full p-1 border-2 border-white">
                                            <Droplet className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold">
                                        {selectedDonor.account?.last_name} {selectedDonor.account?.first_name}
                                    </h2>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs">
                                            {selectedDonor.donation_count || 0} lần hiến máu
                                        </span>
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs">
                                            {selectedDonor.points || 0} điểm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Tabs */}
                        <div className="border-b border-gray-200 px-6 flex-shrink-0">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`py-4 px-2 font-medium transition-all relative ${activeTab === 'info'
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Thông tin cơ bản
                                    {activeTab === 'info' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('health')}
                                    className={`py-4 px-2 font-medium transition-all relative ${activeTab === 'health'
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Sức khỏe
                                    {activeTab === 'health' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingDetail ? (
                                <div className="flex justify-center py-12">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-red-200 rounded-full"></div>
                                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'info' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                                    <p className="font-medium text-gray-900">{selectedDonor.account?.email || 'Chưa cập nhật'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                                                    <p className="font-medium text-gray-900">{selectedDonor.account?.phone || 'Chưa cập nhật'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Ngày sinh</p>
                                                    <p className="font-medium text-gray-900">{formatDate(selectedDonor.account?.birth_date)}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Giới tính</p>
                                                    <p className="font-medium text-gray-900">{getGenderText(selectedDonor.account?.gender)}</p>
                                                </div>
                                                <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedDonor.permanent_address || selectedDonor.sub_district || selectedDonor.province
                                                            ? `${selectedDonor.permanent_address || ''}${selectedDonor.sub_district ? `, ${selectedDonor.sub_district}` : ''}${selectedDonor.province ? `, ${selectedDonor.province}` : ''}`
                                                            : 'Chưa cập nhật'}
                                                    </p>
                                                </div>
                                                <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Công việc</p>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedDonor.career
                                                            ? `${selectedDonor.career}${selectedDonor.organization ? ` tại ${selectedDonor.organization}` : ''}`
                                                            : 'Chưa cập nhật'}
                                                    </p>
                                                </div>
                                                <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Lần cuối hiến máu</p>
                                                    <p className="font-medium text-gray-900">{formatDate(selectedDonor.last_donation)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'health' && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl text-center">
                                                <p className="text-sm text-gray-600 mb-2">Nhóm máu</p>
                                                <p className="text-4xl font-bold text-red-600 mb-2">
                                                    {getBloodTypeDisplay(selectedDonor.blood_type, selectedDonor.rh_factor)}
                                                </p>
                                                <p className={`text-sm font-medium ${selectedDonor.can_donation ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedDonor.can_donation ? '✓ Sẵn sàng hiến máu' : '✗ Không sẵn sàng hiến máu'}
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-red-500" />
                                                    Thông số cơ thể
                                                </h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                        <p className="text-xs text-gray-500 mb-1">Cân nặng</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {selectedDonor.weight ? `${selectedDonor.weight} kg` : '---'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                        <p className="text-xs text-gray-500 mb-1">Chiều cao</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {selectedDonor.height ? `${selectedDonor.height} cm` : '---'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                        <p className="text-xs text-gray-500 mb-1">BMI</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {selectedDonor.bmi ? selectedDonor.bmi.toFixed(1) : '---'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {!loadingDetail && (
                            <div className="border-t border-gray-200 p-6 flex gap-3 flex-shrink-0">
                                {renderActionButtons(selectedDonor)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default DonorList;
