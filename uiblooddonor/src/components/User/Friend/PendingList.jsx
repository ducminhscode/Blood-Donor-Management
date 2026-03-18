import { useState, useEffect } from 'react';
import { 
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Heart, XCircle, UserCheck, UserX, Clock, ArrowLeft,
    CheckCircle, AlertCircle, UserPlus, MessageCircle,
    Activity, Weight, Ruler, CreditCard, Building2,
    Sparkles, Users, BadgeCheck, ThumbsUp, Shield,
    Clock as ClockIcon, CalendarDays, UserCog,
    MoreHorizontal, Share2, Copy, Facebook, MessageSquare,
    Gift, Target, Medal, Trophy, Bell, BellRing
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import '../../../styles/PendingList.css';

const PendingList = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedFilter, setSelectedFilter] = useState('all');

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await authApis().get(endpoints.pending_list);
            const formattedRequests = response.data.map(donor => ({
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
                requested_at: donor.created_at,
                is_online: Math.random() > 0.5 // Mock data
            }));

            // Sort by requested_at
            const sorted = [...formattedRequests].sort((a, b) => {
                if (selectedFilter === 'recent') {
                    return new Date(b.requested_at) - new Date(a.requested_at);
                }
                if (selectedFilter === 'oldest') {
                    return new Date(a.requested_at) - new Date(b.requested_at);
                }
                return 0;
            });

            setRequests(sorted);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            showMessage("Không thể tải danh sách lời mời", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, [selectedFilter]);

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
        setActiveTab('info');
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const handleAccept = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.accept_friend.replace('${id}', donorId));
            setRequests(prev => prev.filter(r => r.id !== donorId));
            showMessage("Đã chấp nhận lời mời kết bạn", "success");
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
            showMessage("Đã từ chối lời mời kết bạn", "success");
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const getFullName = (donor) => {
        return `${donor.last_name || ''} ${donor.first_name || ''}`.trim() || 'Chưa cập nhật';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không rõ';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Vừa xong';
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffHours < 48) return 'Hôm qua';
        return `${Math.floor(diffHours / 24)} ngày trước`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Không rõ';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getGenderText = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (!bloodType) return 'Chưa cập nhật';
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
    };

    const getDonationLevel = (count) => {
        if (count >= 20) return { label: 'Huy chương vàng', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' };
        if (count >= 10) return { label: 'Huy chương bạc', icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50' };
        if (count >= 5) return { label: 'Huy chương đồng', icon: Medal, color: 'text-amber-600', bg: 'bg-amber-50' };
        return { label: 'Người hiến máu', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' };
    };

    const filteredRequests = requests.filter(request => {
        const fullName = getFullName(request).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
               request.username.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                            <Bell className="w-8 h-8 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-3 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm group"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                    <UserPlus className="w-4 h-4" />
                                    <span className="text-sm font-medium">Kết nối bạn bè</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">Lời mời kết bạn</h1>
                                <p className="text-red-100 text-lg">
                                    Kết nối với những người muốn làm bạn với bạn
                                </p>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="hidden md:block">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <BellRing className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold">{requests.length}</div>
                                        <div className="text-sm text-white/80">Lời mời đang chờ</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Mobile */}
                    <div className="grid grid-cols-3 gap-3 mt-6 md:hidden">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <div className="text-xl font-bold">{requests.length}</div>
                            <div className="text-xs text-white/80">Chờ xử lý</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <div className="text-xl font-bold">
                                {requests.filter(r => r.can_donation).length}
                            </div>
                            <div className="text-xs text-white/80">Có thể hiến</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <div className="text-xl font-bold">
                                {requests.reduce((sum, r) => sum + (r.donation_count || 0), 0)}
                            </div>
                            <div className="text-xs text-white/80">Lượt hiến</div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
                    </svg>
                </div>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className="fixed top-24 right-4 z-50 animate-slideIn">
                    <div className={`p-4 rounded-xl shadow-lg flex items-center gap-3 ${
                        message.type === 'success' 
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
                        <div className="w-full md:w-96">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
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
                                onClick={() => setSelectedFilter('all')}
                                className={`px-4 py-2 rounded-lg transition-all ${
                                    selectedFilter === 'all' 
                                        ? 'bg-white text-red-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setSelectedFilter('recent')}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${
                                    selectedFilter === 'recent' 
                                        ? 'bg-white text-red-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                Mới nhất
                            </button>
                            <button
                                onClick={() => setSelectedFilter('oldest')}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${
                                    selectedFilter === 'oldest' 
                                        ? 'bg-white text-red-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <CalendarDays className="w-4 h-4" />
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
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                            <span className="text-sm text-gray-500 self-center">
                                Tìm thấy {filteredRequests.length} kết quả
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {!loading && filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequests.map((request) => {
                            const DonationIcon = getDonationLevel(request.donation_count).icon;
                            const levelColor = getDonationLevel(request.donation_count).color;
                            const levelBg = getDonationLevel(request.donation_count).bg;

                            return (
                                <div
                                    key={request.id}
                                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                    onClick={() => handleViewDetail(request.id)}
                                >
                                    {/* Online Status */}
                                    <div className="absolute top-4 left-4 z-10">
                                        {request.is_online ? (
                                            <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                                Online
                                            </span>
                                        ) : (
                                            <span className="bg-gray-500/80 text-white px-2 py-1 rounded-lg text-xs">
                                                Hoạt động {formatDate(request.requested_at)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Donation Level Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`${levelBg} px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1`}>
                                            <DonationIcon className={`w-4 h-4 ${levelColor}`} />
                                            <span className="text-xs font-medium">{request.donation_count || 0} lần</span>
                                        </div>
                                    </div>

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
                                                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                                            <BadgeCheck className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {getFullName(request)}
                                                        </h3>
                                                        <p className="text-gray-500">@{request.username}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                                                        <Clock className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-600">
                                                            Gửi lời mời {formatDate(request.requested_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{request.email || 'Chưa cập nhật'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span>{request.phone || 'Chưa cập nhật'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(request.birth_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Heart className="w-4 h-4 text-gray-400" />
                                                        <span>{getGenderText(request.gender)}</span>
                                                    </div>
                                                </div>

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {request.blood_type && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full">
                                                            <Droplet className="w-4 h-4" />
                                                            {getBloodTypeDisplay(request.blood_type, request.rh_factor)}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                                                        <Award className="w-4 h-4" />
                                                        {request.donation_count} lần hiến
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full">
                                                        <Star className="w-4 h-4" />
                                                        {request.points} điểm
                                                    </span>
                                                    {request.can_donation && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
                                                            <Heart className="w-4 h-4" />
                                                            Sẵn sàng hiến
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Location & Work */}
                                                {(request.permanent_address || request.province || request.career) && (
                                                    <div className="mt-4 space-y-1 text-sm text-gray-500">
                                                        {request.career && (
                                                            <p className="flex items-center gap-1">
                                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                                {request.career} {request.organization && `tại ${request.organization}`}
                                                            </p>
                                                        )}
                                                        {(request.permanent_address || request.province) && (
                                                            <p className="flex items-center gap-1">
                                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                                {request.permanent_address}
                                                                {request.sub_district && `, ${request.sub_district}`}
                                                                {request.province && `, ${request.province}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleAccept(request.id)}
                                                        disabled={processingId === request.id}
                                                        className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-500/25 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <UserCheck className="w-4 h-4" />
                                                        )}
                                                        Chấp nhận
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

                                    {/* Decorative Elements */}
                                    <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-red-100 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            );
                        })}
                    </div>
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
                                onClick={() => setSearchTerm('')}
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

            {/* Detail Modal */}
            {showDialog && selectedDonor && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleCloseDialog}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white p-8 rounded-t-2xl">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                            </div>

                            <button
                                onClick={handleCloseDialog}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
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
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                            <BadgeCheck className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {selectedDonor.account?.last_name} {selectedDonor.account?.first_name}
                                    </h2>
                                    <p className="text-red-100 mb-2">@{selectedDonor.account?.username}</p>
                                    
                                    <div className="flex gap-2">
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs">
                                            Gửi lời mời: {formatDateTime(selectedDonor.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Tabs */}
                        <div className="border-b border-gray-200 px-6">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`py-4 px-2 font-medium transition-all relative ${
                                        activeTab === 'info'
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
                                    className={`py-4 px-2 font-medium transition-all relative ${
                                        activeTab === 'health'
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Sức khỏe
                                    {activeTab === 'health' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('donation')}
                                    className={`py-4 px-2 font-medium transition-all relative ${
                                        activeTab === 'donation'
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Lịch sử hiến
                                    {activeTab === 'donation' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
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
                                            {/* Contact Info */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                                        <User className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    Thông tin liên hệ
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <Mail className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">Email</div>
                                                            <div className="text-sm font-medium">{selectedDonor.account?.email || 'Chưa cập nhật'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <Phone className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">Số điện thoại</div>
                                                            <div className="text-sm font-medium">{selectedDonor.account?.phone || 'Chưa cập nhật'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personal Info */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                                        <Heart className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    Thông tin cá nhân
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">Ngày sinh</div>
                                                            <div className="text-sm font-medium">{formatDate(selectedDonor.account?.birth_date)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <Heart className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">Giới tính</div>
                                                            <div className="text-sm font-medium">{getGenderText(selectedDonor.account?.gender)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {(selectedDonor.permanent_address || selectedDonor.province) && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                                            <MapPin className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        Địa chỉ
                                                    </h3>
                                                    <div className="p-4 bg-gray-50 rounded-xl">
                                                        <p className="text-sm text-gray-700">
                                                            {selectedDonor.permanent_address}
                                                            {selectedDonor.sub_district && `, ${selectedDonor.sub_district}`}
                                                            {selectedDonor.province && `, ${selectedDonor.province}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Work */}
                                            {(selectedDonor.career || selectedDonor.organization) && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                                            <Briefcase className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        Công việc
                                                    </h3>
                                                    <div className="p-4 bg-gray-50 rounded-xl">
                                                        <p className="text-sm text-gray-700">
                                                            {selectedDonor.career}
                                                            {selectedDonor.organization && ` tại ${selectedDonor.organization}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
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
                                                            ? 'Có thể hiến máu' 
                                                            : 'Chưa đủ điều kiện hiến máu'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Physical Info */}
                                            {(selectedDonor.weight || selectedDonor.height || selectedDonor.bmi) && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                                            <Activity className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        Thông số cơ thể
                                                    </h3>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {selectedDonor.weight && (
                                                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <Weight className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                                                                <div className="text-lg font-bold text-gray-900">{selectedDonor.weight}</div>
                                                                <div className="text-xs text-gray-500">kg</div>
                                                            </div>
                                                        )}
                                                        {selectedDonor.height && (
                                                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <Ruler className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                                                                <div className="text-lg font-bold text-gray-900">{selectedDonor.height}</div>
                                                                <div className="text-xs text-gray-500">cm</div>
                                                            </div>
                                                        )}
                                                        {selectedDonor.bmi && (
                                                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                                <Activity className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                                                                <div className="text-lg font-bold text-gray-900">{selectedDonor.bmi.toFixed(1)}</div>
                                                                <div className="text-xs text-gray-500">BMI</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Donation Tab */}
                                    {activeTab === 'donation' && (
                                        <div className="space-y-6">
                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                                                    <div className="text-2xl font-bold text-red-600">{selectedDonor.donation_count || 0}</div>
                                                    <div className="text-sm text-gray-600">Lần hiến máu</div>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                                                    <div className="text-2xl font-bold text-red-600">{selectedDonor.points || 0}</div>
                                                    <div className="text-sm text-gray-600">Điểm thưởng</div>
                                                </div>
                                            </div>

                                            {/* Last Donation */}
                                            {selectedDonor.last_donation && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3">Lần hiến gần nhất</h3>
                                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-red-600" />
                                                        <div>
                                                            <div className="font-medium">{formatDate(selectedDonor.last_donation)}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {selectedDonor.can_donation ? 'Đã đủ điều kiện hiến tiếp' : 'Chưa đủ thời gian để hiến tiếp'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Donation Level */}
                                            {selectedDonor.donation_count > 0 && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3">Cấp độ hiến máu</h3>
                                                    <div className="p-4 bg-gray-50 rounded-xl">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            {(() => {
                                                                const level = getDonationLevel(selectedDonor.donation_count);
                                                                const Icon = level.icon;
                                                                return (
                                                                    <>
                                                                        <Icon className={`w-8 h-8 ${level.color}`} />
                                                                        <div>
                                                                            <div className="font-medium">{level.label}</div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {selectedDonor.donation_count} lần hiến
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-red-600 h-2 rounded-full" 
                                                                style={{ width: `${Math.min((selectedDonor.donation_count / 20) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                            <span>0</span>
                                                            <span>5</span>
                                                            <span>10</span>
                                                            <span>15</span>
                                                            <span>20+</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="border-t pt-6 flex gap-3">
                                        <button 
                                            onClick={() => handleAccept(selectedDonor.id)}
                                            disabled={processingId === selectedDonor.id}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-400"
                                        >
                                            {processingId === selectedDonor.id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserCheck className="w-4 h-4" />
                                                    Chấp nhận
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => handleReject(selectedDonor.id)}
                                            disabled={processingId === selectedDonor.id}
                                            className="flex-1 px-4 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <UserX className="w-4 h-4" />
                                            Từ chối
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingList;