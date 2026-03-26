import { useState, useEffect, useCallback } from 'react';
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
    Filter
} from 'lucide-react';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { useNavigate } from 'react-router-dom';
import '../../../styles/FriendList.css';

const FriendList = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalFriends, setTotalFriends] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [activeTab, setActiveTab] = useState('info');

    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const navigate = useNavigate();

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const fetchPendingCount = async () => {
        try {
            const response = await authApis().get(endpoints.pending_list);
            setPendingRequestsCount(response.data.length || response.data.count || 0);
        } catch (error) {
            console.error("Error fetching pending count:", error);
        }
    };

    useEffect(() => {
        fetchFriends();
        fetchPendingCount();
    }, []);

    const fetchFriends = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setFriends([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        try {
            let url = endpoints.friend_list;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            params.append('page', currentPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            const formattedFriends = response.data.results.map(friend => ({
                id: friend.id,
                username: friend.account.username,
                last_name: friend.account.last_name,
                first_name: friend.account.first_name,
                avatar: friend.account.avatar,
                email: friend.account.email,
                phone: friend.account.phone,
                birth_date: friend.account.birth_date,
                gender: friend.account.gender,
                blood_type: friend.blood_type,
                rh_factor: friend.rh_factor,
                donation_count: friend.donation_count,
                points: friend.points,
                career: friend.career,
                organization: friend.organization,
                province: friend.province,
                sub_district: friend.sub_district,
                permanent_address: friend.permanent_address,
                weight: friend.weight,
                height: friend.height,
                bmi: friend.bmi,
                identification: friend.identification,
                last_donation: friend.last_donation,
                can_donation: friend.can_donation,
                last_login: friend.account.last_login
            }));

            if (isLoadMore) {
                setFriends(prev => [...prev, ...formattedFriends]);
            } else {
                setFriends(formattedFriends);
            }

            setHasNextPage(response.data.next !== null);
            setTotalFriends(response.data.count);

        } catch (error) {
            console.error("Error fetching friends:", error);
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
        setShowShareMenu(false);
    };

    const handleUnfriend = async (donorId) => {
        if (!window.confirm('Bạn có chắc muốn hủy kết bạn với người này?')) return;

        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.unfriend.replace('${id}', donorId));

            setFriends(prev => prev.filter(f => f.id !== donorId));
            setTotalFriends(prev => prev - 1);

            setShowDialog(false);
            setSelectedDonor(null);

            showMessage("Đã hủy kết bạn thành công", "success");
        } catch (error) {
            console.error("Error unfriending:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const debouncedSearch = useCallback(
        debounce(() => {
            setPage(1);
            fetchFriends(false);
        }, searchTerm ? 500 : 10),
        [searchTerm]
    );

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch]);

    useEffect(() => {
        if (page > 1) {
            fetchFriends(true);
        }
    }, [page]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setPage(1);
        fetchFriends(false);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    };

    const getFullName = (friend) => {
        return `${friend.last_name || ''} ${friend.first_name || ''}`.trim() || 'Chưa cập nhật';
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
        if (!bloodType || !rhFactor) return 'Chưa cập nhật';
        return `${bloodType === 0 ? 'O' : bloodType === 1 ? 'A' : bloodType === 2 ? 'B' : 'AB'}${rhFactor === 0 ? '-' : '+'}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: '15s'
                            }}
                        >
                            <Users className="w-8 h-8 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Kết nối cộng đồng</span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Danh sách bạn bè</h1>
                            <p className="text-red-100 text-lg">Cùng nhau lan tỏa yêu thương</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/search-donor')}
                                className="group flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                            >
                                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Tìm kiếm người hiến máu</span>
                            </button>

                            <button
                                onClick={() => navigate('/pending-list')}
                                className="group relative flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                            >
                                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Lời mời kết bạn</span>
                                {pendingRequestsCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex flex-wrap gap-6 mt-8 justify-center md:justify-start">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalFriends}</div>
                                <div className="text-sm text-white/80">Tổng bạn bè</div>
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
                <div className="fixed top-24 right-4 z-50 animate-slideIn">
                    <div className={`p-4 rounded-xl shadow-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success'
                            ? <CheckCircle className="w-5 h-5" />
                            : <AlertCircle className="w-5 h-5" />
                        }
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Search & Filter Section */}
            <div className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bạn bè theo tên, email hoặc số điện thoại"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
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
                                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <Filter className="h-5 w-5" />
                                <span>Bộ lọc</span>
                            </button>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-white text-red-600 shadow-sm'
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
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-white text-red-600 shadow-sm'
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
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Sắp xếp</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg"
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
                                            onClick={() => setViewMode('grid')}
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
                                            onClick={() => setViewMode('list')}
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
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                <Search className="h-4 w-4" />
                                <span>Tìm kiếm: "{searchTerm}"</span>
                                <button
                                    onClick={handleClearSearch}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                {!loading && friends.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                <span className="font-bold">{totalFriends}</span>
                            </div>
                            <span className="text-gray-600">
                                người bạn {searchTerm && "phù hợp với tìm kiếm"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded-lg mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Friends List */}
                {!loading && friends.length > 0 ? (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {friends.map((friend) => {

                                    return (
                                        <div
                                            key={friend.id}
                                            onClick={() => handleViewDetail(friend.id)}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                        >
                                            {/* Online Status */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs">
                                                    Online {formatRelativeTime(friend.last_login)}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex flex-col items-center text-center mb-4">
                                                    <div className="relative mb-3">
                                                        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                                                            {friend.avatar ? (
                                                                <img
                                                                    src={getImageUrl(friend.avatar)}
                                                                    alt={getFullName(friend)}
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-8 h-8 text-red-600" />
                                                            )}
                                                        </div>
                                                        {friend.can_donation && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-1 border-2 border-white">
                                                                <Droplet className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-600 transition-colors">
                                                        {getFullName(friend)}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3 mt-2">
                                                        {friend.blood_type && friend.rh_factor ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                                                                <Droplet className="w-3 h-3 fill-current" />
                                                                {getBloodTypeDisplay(friend.blood_type, friend.rh_factor)}
                                                            </span>
                                                        ) : (<span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                                                            <Droplet className="w-3 h-3 fill-current" />
                                                            Chưa cập nhật
                                                        </span>)}

                                                        {friend.points >= 0 && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-medium">
                                                                <Award className="w-3 h-3 fill-current" />
                                                                {friend.points} điểm
                                                            </span>
                                                        )}

                                                    </div>

                                                    <div className="w-full space-y-2 text-left">
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Mail className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                            <span className="truncate">{friend.email ? friend.email : 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Phone className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                            <span className="truncate">{friend.phone ? friend.phone : 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                            <span className="truncate">{friend.province ? friend.province : 'Chưa cập nhật'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Handle message
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1 text-sm"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        Nhắn tin
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        onClick={() => handleViewDetail(friend.id)}
                                        className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                                                        {friend.avatar ? (
                                                            <img
                                                                src={getImageUrl(friend.avatar)}
                                                                alt={getFullName(friend)}
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-6 h-6 text-red-600" />
                                                        )}
                                                    </div>

                                                    {/* Last login badge */}
                                                    {friend.last_login && (
                                                        <span className="absolute -bottom-1 -right-1 bg-green-500 text-white px-1.5 py-[3px] rounded text-[4px] shadow">
                                                            Online {formatRelativeTime(friend.last_login)}
                                                        </span>
                                                    )}
                                                </div>


                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {getFullName(friend)}
                                                        </h3>
                                                        {friend.can_donation && (
                                                            <div className="border-2 border-white rounded-full bg-red-500 w-5 h-5 flex items-center justify-center">
                                                                <Droplet className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                                        {friend.blood_type && friend.rh_factor ? (
                                                            <span className="flex items-center gap-1">
                                                                <Droplet className="w-3 h-3 text-red-500 fill-current" />
                                                                {getBloodTypeDisplay(friend.blood_type, friend.rh_factor)}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <Droplet className="w-3 h-3 text-red-500 fill-current" />
                                                                Chưa cập nhật
                                                            </span>
                                                        )}
                                                        {friend.points >= 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Award className="w-3 h-3 text-yellow-500 fill-current" />
                                                                {friend.points || 0} điểm
                                                            </span>
                                                        )}
                                                        {friend.email ? (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3 text-red-500" />
                                                                {friend.email}
                                                            </span>
                                                        ) : (<span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-red-500" />
                                                            Chưa cập nhật
                                                        </span>
                                                        )}
                                                        {friend.phone ? (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-red-500" />
                                                                {friend.phone}
                                                            </span>
                                                        ) : (<span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-red-500" />
                                                            Chưa cập nhật
                                                        </span>
                                                        )}
                                                        {friend.province ? (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-red-500" />
                                                                {friend.province}
                                                            </span>
                                                        ) : (<span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-red-500" />
                                                            Chưa cập nhật
                                                        </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Xem thêm bạn bè</span>
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
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform">
                                <Users className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè'}
                        </h3>

                        <p className="text-gray-600 mb-6">
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Hãy kết nối với mọi người trong cộng đồng'}
                        </p>

                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}

                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/search-donor')}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Tìm kiếm người hiến máu
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDialog && selectedDonor && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleCloseDialog}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" // Thay đổi ở đây
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header - Fixed */}
                        <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white p-8 rounded-t-2xl flex-shrink-0">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                            </div>

                            <button
                                onClick={handleCloseDialog}
                                className="absolute top-4 right-4 z-50 p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>

                            <div className="relative flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white/30">
                                        {selectedDonor.account?.avatar ? (
                                            <img
                                                src={getImageUrl(selectedDonor.account.avatar)}
                                                alt={getFullName(selectedDonor)}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-10 h-10 text-red-600" />
                                        )}
                                    </div>
                                    {selectedDonor.can_donation && (
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 items-center justify-center flex rounded-full p-1 border-2 border-white">
                                            <Droplet className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {selectedDonor.account?.last_name} {selectedDonor.account?.first_name}
                                    </h2>

                                    <div className="flex gap-2 mt-3">
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

                        {/* Modal Tabs - Fixed */}
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
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
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
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6"> {/* Thay đổi ở đây */}
                            {loadingDetail ? (
                                <div className="flex justify-center py-12">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-red-200 rounded-full"></div>
                                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Info Tab */}
                                    {activeTab === 'info' && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">

                                                {/* Contact + Personal */}
                                                <div>
                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <span className="text-sm">Email</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {selectedDonor.account?.email || 'Chưa cập nhật'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <span className="text-sm">Số điện thoại</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {selectedDonor.account?.phone || 'Chưa cập nhật'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <span className="text-sm">Ngày sinh</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatDate(selectedDonor.account?.birth_date) || 'Chưa cập nhật'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <span className="text-sm">Giới tính</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {getGenderText(selectedDonor.account?.gender) || 'Chưa cập nhật'}
                                                        </span>
                                                    </div>


                                                    {/* Address */}
                                                    {(selectedDonor.permanent_address || selectedDonor.province) ? (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Địa chỉ</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {selectedDonor.permanent_address}
                                                                {selectedDonor.sub_district && `, ${selectedDonor.sub_district}`}
                                                                {selectedDonor.province && `, ${selectedDonor.province}`}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Địa chỉ</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                Chưa cập nhật
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Work */}
                                                    {(selectedDonor.career || selectedDonor.organization) ? (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Công việc</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {selectedDonor.career}
                                                                {selectedDonor.organization && ` tại ${selectedDonor.organization}`}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Công việc</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                Chưa cập nhật
                                                            </p>
                                                        </div>
                                                    )}

                                                    {(selectedDonor.last_donation) ? (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Lần cuối hiến máu</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatDate(selectedDonor.last_donation)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="pt-2 justify-between items-center flex py-2">
                                                            <div className="flex items-start gap-2 text-gray-500 mb-1">
                                                                <span className="text-sm">Lần cuối hiến máu</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                Chưa cập nhật
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Health Tab */}
                                    {activeTab === 'health' && (
                                        <div className="space-y-6">
                                            {/* Blood Type */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                                        <Droplet className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    Nhóm máu
                                                </h3>
                                                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl text-center">
                                                    <div className="text-4xl font-bold text-red-600 mb-2">
                                                        {getBloodTypeDisplay(selectedDonor.blood_type, selectedDonor.rh_factor)}
                                                    </div>
                                                    <p className="text-sm text-red-700">
                                                        {selectedDonor.can_donation
                                                            ? 'Sẵn sàng hiến máu'
                                                            : 'Không sẵn sàng'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Physical Info */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                                        <Activity className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    Thông số cơ thể
                                                </h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {selectedDonor.weight ? (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Cân nặng</div>
                                                            <div className="text-lg font-bold text-gray-900">{selectedDonor.weight} kg</div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Cân nặng</div>
                                                            <div className="text-xs font-bold text-gray-900 mt-2">Chưa cập nhật</div>
                                                        </div>
                                                    )}
                                                    {selectedDonor.height ? (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Chiều cao</div>
                                                            <div className="text-lg font-bold text-gray-900">{selectedDonor.height} cm</div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Chiều cao</div>
                                                            <div className="text-xs font-bold text-gray-900 mt-2">Chưa cập nhật</div>
                                                        </div>
                                                    )}
                                                    {selectedDonor.bmi ? (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Chỉ số BMI</div>
                                                            <div className="text-lg font-bold text-gray-900">{selectedDonor.bmi.toFixed(1)}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                            <div className="text-xm text-gray-500">Chỉ số BMI</div>
                                                            <div className="text-xs font-bold text-gray-900 mt-2">Chưa cập nhật</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Action Buttons - Fixed */}
                        {!loadingDetail && (
                            <div className="border-t border-gray-200 p-6 flex gap-3 mt-1 flex-shrink-0">
                                <button
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                                    onClick={() => { }}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Nhắn tin
                                </button>

                                <button
                                    onClick={() => handleUnfriend(selectedDonor.id)}
                                    disabled={processingId === selectedDonor.id}
                                    className="px-4 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[120px]"
                                >
                                    {processingId === selectedDonor.id ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserMinus className="w-4 h-4" />
                                            Hủy kết bạn
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <FilterIcon className="hidden" />
        </div>
    );
};

const FilterIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
    </svg>
);

export default FriendList;