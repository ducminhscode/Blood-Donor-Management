import { useState, useEffect, useCallback, useContext } from 'react';
import {
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Heart, XCircle, UserCheck, UserX, Clock, ArrowLeft,
    CheckCircle, AlertCircle, UserPlus, MessageCircle,
    Activity, Weight, Ruler, CreditCard, Building2,
    Sparkles, Users, BadgeCheck, ThumbsUp, Shield,
    Clock as ClockIcon, CalendarDays, UserCog,
    MoreHorizontal, Share2, Copy, Facebook, MessageSquare,
    Gift, Target, Medal, Trophy, Bell, BellRing,
    VenusAndMars
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../../configs/UserContexts';
import '../../../styles/PendingList.css';
import { formatDate } from '../../../utils/Format';

const PendingList = () => {
    const navigate = useNavigate();
    const currentUser = useContext(UserContexts);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRequests, setTotalRequests] = useState(0);
    const [sortBy, setSortBy] = useState('recent');
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [totalPendingRequests, setTotalPendingRequests] = useState(0);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const fetchPendingRequests = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setRequests([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        try {
            let url = endpoints.pending_list;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            params.append('page', currentPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            const formattedRequests = response.data.results.map(donor => ({
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
                identification: donor.identification,
                last_donation: donor.last_donation,
                can_donation: donor.can_donation,
                requested_at: donor.friend_request_created_at,
                last_login: donor.account.last_login
            }));

            let sortedRequests = [...formattedRequests];
            if (sortBy === 'recent') {
                sortedRequests.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
            } else if (sortBy === 'oldest') {
                sortedRequests.sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at));
            }

            if (isLoadMore) {
                setRequests(prev => [...prev, ...sortedRequests]);
            } else {
                setRequests(sortedRequests);
            }

            setHasNextPage(response.data.next !== null);
            setTotalRequests(response.data.count);

        } catch (error) {
            console.error("Error fetching pending requests:", error);
            showMessage("Không thể tải danh sách lời mời", "error");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, [sortBy]);

    const fetchDonorDetail = async (donorId) => {
        try {
            const url = endpoints.donor_detail.replace('${id}', donorId);
            const response = await authApis().get(url);
            setSelectedDonor(response.data);
        } catch (error) {
            console.error("Error fetching donor detail:", error);
            showMessage("Không thể tải thông tin chi tiết", "error");
        } finally {
        }
    };

    const handleViewDetail = (donorId) => {
        fetchDonorDetail(donorId);
    };

    const handleAccept = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.accept_friend.replace('${id}', donorId));
            setRequests(prev => prev.filter(r => r.id !== donorId));
            setTotalRequests(prev => prev - 1);
            showMessage("Đã chấp nhận lời mời kết bạn", "success");

            if (selectedDonor?.id === donorId) {
                setSelectedDonor(null);
            }
        } catch (error) {
            console.error("Error accepting friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (donorId) => {
        if (!window.confirm('Bạn có chắc muốn từ chối lời mời này?')) return;

        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.reject_friend.replace('${id}', donorId));
            setRequests(prev => prev.filter(r => r.id !== donorId));
            setTotalRequests(prev => prev - 1);
            showMessage("Đã từ chối lời mời kết bạn", "success");

            if (selectedDonor?.id === donorId) {
                setSelectedDonor(null);
            }
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const debouncedSearch = useCallback(
        debounce(() => {
            setPage(1);
            fetchPendingRequests(false);
        }, searchTerm ? 500 : 10),
        [searchTerm, sortBy]
    );

    useEffect(() => {
        const fetchTotal = async () => {
            const response = await authApis().get(endpoints.pending_list);
            setTotalPendingRequests(response.data.count);
        };
        fetchTotal();
    }, []);

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchTerm, sortBy, debouncedSearch]);

    useEffect(() => {
        if (page > 1) {
            fetchPendingRequests(true);
        }
    }, [page]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setPage(1);
        fetchPendingRequests(false);
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

    const formatDateInvite = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) return 'Vừa xong';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
        return `${Math.floor(diffSeconds / 86400)} ngày trước`;
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
                            <UserPlus className="w-8 h-8 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-26">
                    <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <span>Danh sách bạn bè</span>
                        <span>/</span>
                        <span className='text-white'>Lời mời kết bạn</span>
                    </nav>
                    <button
                        onClick={() => navigate("/friend-list")}
                        className="flex p-2 mb-6 hover:bg-white/20 hover:text-white rounded-xl transition-all backdrop-blur-sm group"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Danh sách bạn bè</span>
                    </button>

                    {/* Flex container for title and stat card */}
                    <div className="flex items-start justify-between gap-8">
                        {/* Left side - Title */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <UserPlus className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold">Lời mời kết bạn</h1>
                            </div>
                            <p className="text-red-100 text-lg">
                                Kết nối với những người muốn làm bạn với bạn
                            </p>
                        </div>

                        {/* Right side - Stats Card */}
                        <div className="hidden md:block flex-shrink-0">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <BellRing className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold">{totalPendingRequests}</div>
                                        <div className="text-sm text-white/80">Lời mời đang chờ</div>
                                    </div>
                                </div>
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
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
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

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => handleSortChange('recent')}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${sortBy === 'recent'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Mới nhất
                            </button>
                            <button
                                onClick={() => handleSortChange('oldest')}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${sortBy === 'oldest'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Cũ nhất
                            </button>
                        </div>
                    </div>

                    {/* Search Result Info */}
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
                {!loading && requests.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                <span className="font-bold">{totalRequests}</span>
                            </div>
                            <span className="text-gray-600">
                                lời mời kết bạn {searchTerm && "phù hợp với tìm kiếm"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                                <div className="flex gap-6">
                                    <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 rounded-lg w-48 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Requests List */}
                {!loading && requests.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {requests.map((request) => {

                                return (
                                    <div
                                        key={request.id}
                                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => handleViewDetail(request.id)}
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    <div className="relative">
                                                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                                                            {request.avatar ? (
                                                                <img
                                                                    src={getImageUrl(request.avatar)}
                                                                    alt={getFullName(request)}
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-10 h-10 text-red-600" />
                                                            )}
                                                        </div>
                                                        {request.can_donation && (
                                                            <div className="absolute -bottom-1 -right-1 bg-red-500 items-center justify-between rounded-full p-1 border-2 border-white">
                                                                <Droplet className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {getFullName(request)}
                                                            </h3>
                                                            <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                                Online {formatRelativeTime(request.last_login)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                                                            <span className="text-gray-600">
                                                                {formatDateInvite(request.requested_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Contact Info */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="w-4 h-4 text-red-400" />
                                                            <span className="truncate">{request.email || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4 text-red-400" />
                                                            <span>{request.phone || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4 text-red-400" />
                                                            <span>{formatDate(request.birth_date) || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <VenusAndMars className="w-4 h-4 text-red-400" />
                                                            <span>{getGenderText(request.gender) || 'Chưa cập nhật'}</span>
                                                        </div>
                                                        {(request.career) ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Briefcase className="w-4 h-4 text-red-400" />
                                                                <span>{request.career} {request.organization && `tại ${request.organization}`}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Briefcase className="w-4 h-4 text-red-400" />
                                                                <span>Chưa cập nhật</span>
                                                            </div>
                                                        )}

                                                        {(request.permanent_address || request.province || request.career) ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <MapPin className="w-4 h-4 text-red-400" />
                                                                <span>{request.permanent_address}
                                                                    {request.sub_district && `, ${request.sub_district}`}
                                                                    {request.province && `, ${request.province}`}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <MapPin className="w-4 h-4 text-red-400" />
                                                                <span>Chưa cập nhật</span>
                                                            </div>
                                                        )}

                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleAccept(request.id)}
                                                            disabled={processingId === request.id}
                                                            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
                                                        >
                                                            {processingId === request.id ? (
                                                                <Loader className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="w-4 h-4" />
                                                                    Chấp nhận
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={processingId === request.id}
                                                            className="flex-1 md:flex-none px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>

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
                                                <span>Xem thêm lời mời</span>
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
                                <UserPlus className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy lời mời' : 'Chưa có lời mời kết bạn'}
                        </h3>

                        <p className="text-gray-600 mb-6">
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Khi có ai đó gửi lời mời, họ sẽ xuất hiện ở đây'}
                        </p>

                        {searchTerm ? (
                            <button
                                onClick={handleClearSearch}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Xóa tìm kiếm
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/search-donor')}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Tìm kiếm bạn bè
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingList;