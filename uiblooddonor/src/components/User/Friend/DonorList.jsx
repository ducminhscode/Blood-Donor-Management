import { useState, useEffect, useCallback, useContext } from 'react';
import {
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Building2, Heart, XCircle, MessageCircle, UserPlus,
    Clock, Activity, Weight, Ruler, CreditCard, Filter,
    CheckCircle, AlertCircle, UserCheck, UserX, UserMinus,
    Send, Ban, Sparkles, Users, Shield, BadgeCheck,
    MapPinned, Home, Globe, ThumbsUp, TrendingUp,
    MoreHorizontal, Share2, Copy, Facebook, MessageSquare,
    Bookmark, Bell, Gift, Target, Medal, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../../configs/UserContexts';
import '../../../styles/DonorList.css';

const DonorList = () => {
    const navigate = useNavigate();
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalDonors, setTotalDonors] = useState(0);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [viewMode, setViewMode] = useState('grid');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [selectedDonorForShare, setSelectedDonorForShare] = useState(null);
    
    const [friendStatuses, setFriendStatuses] = useState({});

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const currentUser = useContext(UserContexts);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        blood_type: '',
        rh_factor: '',
        province: '',
        min_donations: '',
        max_donations: '',
        can_donation: false,
        sort_by: 'recent'
    });

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

            if (filters.blood_type) params.append('blood_type', filters.blood_type);
            if (filters.rh_factor) params.append('rh_factor', filters.rh_factor);
            if (filters.province) params.append('province', filters.province);
            if (filters.min_donations) params.append('min_donations', filters.min_donations);
            if (filters.max_donations) params.append('max_donations', filters.max_donations);
            if (filters.can_donation) params.append('can_donation', 'true');
            if (filters.sort_by) params.append('ordering', filters.sort_by);

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
                    is_online: Math.random() > 0.5,
                    last_active: new Date(Date.now() - Math.random() * 86400000).toISOString()
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
            showMessage("Không thể tải danh sách donor", "error");
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

    const handleUnfriend = async (donorId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn với người này?')) {
            return;
        }
        
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.unfriend.replace('${id}', donorId));
            showMessage("Đã hủy kết bạn", "success");
            setFriendStatuses(prev => ({ ...prev, [donorId]: 'none' }));
        } catch (error) {
            console.error("Error unfriending:", error);
            showMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleMessage = (donorId) => {
        navigate(`/chat?userId=${donorId}`);
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const debouncedSearch = useCallback(
        debounce(() => {
            setPage(1);
            fetchDonors(false);
        }, 500),
        [searchTerm, filters]
    );

    useEffect(() => {
        fetchDonors();
    }, []);

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchTerm, filters, debouncedSearch]);

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
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            blood_type: '',
            rh_factor: '',
            province: '',
            min_donations: '',
            max_donations: '',
            can_donation: false,
            sort_by: 'recent'
        });
        setPage(1);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
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
        if (!bloodType) return 'Chưa cập nhật';
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
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
                    className="w-full px-4 py-3 bg-gray-400 text-white rounded-xl flex items-center justify-center gap-2"
                >
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                </button>
            );
        }

        switch (status) {
            case 'friend':
                return (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => handleMessage(donor.id)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Nhắn tin
                        </button>
                        <button
                            onClick={() => handleUnfriend(donor.id)}
                            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            title="Hủy kết bạn"
                        >
                            <UserMinus className="w-4 h-4" />
                        </button>
                    </div>
                );

            case 'pending_sent':
                return (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            disabled
                            className="flex-1 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Đã gửi lời mời
                        </button>
                        <button
                            onClick={() => handleCancelRequest(donor.id)}
                            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            title="Hủy lời mời"
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                    </div>
                );

            case 'pending_received':
                return (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => handleAcceptRequest(donor.id)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                        >
                            <UserCheck className="w-4 h-4" />
                            Chấp nhận
                        </button>
                        <button
                            onClick={() => handleRejectRequest(donor.id)}
                            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            title="Từ chối"
                        >
                            <UserX className="w-4 h-4" />
                        </button>
                    </div>
                );

            case 'none':
            default:
                return (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => handleSendRequest(donor.id)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Kết bạn
                        </button>
                    </div>
                );
        }
    };

    const bloodTypes = ['A', 'B', 'AB', 'O']
    const rhFactors = [
        { value: 'positive', label: 'Rh+' },
        { value: 'negative', label: 'Rh-' }
    ];

    const provinces = [
        'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
        'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
        'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
        'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
        'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
        'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
        'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
        'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
        'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
        'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
        'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
        'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
        'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
    ];

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
                            <Droplet className="w-8 h-8 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm group"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Cộng đồng người hiến máu</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Tìm kiếm donor</h1>
                            <p className="text-red-100 text-lg">
                                Kết nối với những người có cùng nhóm máu và sẵn sàng giúp đỡ
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{totalDonors}</div>
                                    <div className="text-sm text-white/80">Tổng donor</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Droplet className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {donors.filter(d => d.can_donation).length}
                                    </div>
                                    <div className="text-sm text-white/80">Sẵn sàng hiến</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {donors.reduce((sum, d) => sum + (d.donation_count || 0), 0)}
                                    </div>
                                    <div className="text-sm text-white/80">Lượt hiến</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {donors.reduce((sum, d) => sum + (d.points || 0), 0)}
                                    </div>
                                    <div className="text-sm text-white/80">Tổng điểm</div>
                                </div>
                            </div>
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
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, username, email..."
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
                                <Filter className="w-5 h-5" />
                                <span>Bộ lọc</span>
                                {Object.values(filters).some(v => v) && (
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                )}
                            </button>

                            {/* Sort Options */}
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className="hidden lg:block px-4 py-2 bg-gray-100 border-2 border-transparent rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                            >
                                <option value="recent">Mới nhất</option>
                                <option value="donation_count">Nhiều lượt hiến nhất</option>
                                <option value="-donation_count">Ít lượt hiến nhất</option>
                                <option value="points">Nhiều điểm nhất</option>
                                <option value="-points">Ít điểm nhất</option>
                                <option value="name">Tên A-Z</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'grid'
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
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'list'
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
                                <h3 className="font-semibold">Bộ lọc nâng cao</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nhóm máu
                                        </label>
                                        <select
                                            value={filters.blood_type}
                                            onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Tất cả</option>
                                            {bloodTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Yếu tố Rh
                                        </label>
                                        <select
                                            value={filters.rh_factor}
                                            onChange={(e) => handleFilterChange('rh_factor', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Tất cả</option>
                                            {rhFactors.map(rh => (
                                                <option key={rh.value} value={rh.value}>{rh.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỉnh/Thành phố
                                    </label>
                                    <select
                                        value={filters.province}
                                        onChange={(e) => handleFilterChange('province', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {provinces.sort().map(province => (
                                            <option key={province} value={province}>{province}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lần hiến từ
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={filters.min_donations}
                                            onChange={(e) => handleFilterChange('min_donations', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Tối thiểu"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Đến
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={filters.max_donations}
                                            onChange={(e) => handleFilterChange('max_donations', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Tối đa"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.can_donation}
                                            onChange={(e) => handleFilterChange('can_donation', e.target.checked)}
                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">Có thể hiến máu</span>
                                    </label>

                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sắp xếp theo
                                    </label>
                                    <select
                                        value={filters.sort_by}
                                        onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="recent">Mới nhất</option>
                                        <option value="donation_count">Nhiều lượt hiến nhất</option>
                                        <option value="-donation_count">Ít lượt hiến nhất</option>
                                        <option value="points">Nhiều điểm nhất</option>
                                        <option value="-points">Ít điểm nhất</option>
                                        <option value="name">Tên A-Z</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Desktop Filters */}
                    {showFilters && (
                        <div className="hidden lg:block mt-4 pt-4 border-t">
                            <div className="grid grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nhóm máu
                                    </label>
                                    <select
                                        value={filters.blood_type}
                                        onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {bloodTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Yếu tố Rh
                                    </label>
                                    <select
                                        value={filters.rh_factor}
                                        onChange={(e) => handleFilterChange('rh_factor', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {rhFactors.map(rh => (
                                            <option key={rh.value} value={rh.value}>{rh.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỉnh/Thành phố
                                    </label>
                                    <select
                                        value={filters.province}
                                        onChange={(e) => handleFilterChange('province', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {provinces.sort().map(province => (
                                            <option key={province} value={province}>{province}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số lần hiến
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Từ"
                                            value={filters.min_donations}
                                            onChange={(e) => handleFilterChange('min_donations', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Đến"
                                            value={filters.max_donations}
                                            onChange={(e) => handleFilterChange('max_donations', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="checkbox"
                                            checked={filters.can_donation}
                                            onChange={(e) => handleFilterChange('can_donation', e.target.checked)}
                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">Có thể hiến</span>
                                    </label>

                                    <button
                                        onClick={handleClearFilters}
                                        className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(searchTerm || Object.values(filters).some(v => v)) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {searchTerm && (
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
                            )}
                            {filters.blood_type && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    <Droplet className="w-3 h-3" />
                                    Nhóm máu: {filters.blood_type}
                                    <button
                                        onClick={() => handleFilterChange('blood_type', '')}
                                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filters.rh_factor && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    <Activity className="w-3 h-3" />
                                    Rh: {filters.rh_factor === 'positive' ? '+' : '-'}
                                    <button
                                        onClick={() => handleFilterChange('rh_factor', '')}
                                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filters.province && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    <MapPin className="w-3 h-3" />
                                    {filters.province}
                                    <button
                                        onClick={() => handleFilterChange('province', '')}
                                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filters.can_donation && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                    <Heart className="w-3 h-3" />
                                    Có thể hiến
                                    <button
                                        onClick={() => handleFilterChange('can_donation', false)}
                                        className="p-1 hover:bg-green-200 rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
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
                                <span className="font-bold">{totalDonors}</span>
                            </div>
                            <span className="text-gray-600">
                                người hiến máu {searchTerm && "phù hợp với tìm kiếm của bạn"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {donors.filter(d => d.is_online).length} đang hoạt động
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
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded-lg mb-2 w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Donors Grid/List */}
                {!loading && donors.length > 0 ? (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {donors.map((donor) => {
                                    const DonationIcon = getDonationLevel(donor.donation_count).icon;
                                    const levelColor = getDonationLevel(donor.donation_count).color;
                                    const levelBg = getDonationLevel(donor.donation_count).bg;
                                    
                                    return (
                                        <div
                                            key={donor.id}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                            onClick={() => handleViewDetail(donor.id)}
                                        >
                                            {/* Online Status */}
                                            <div className="absolute top-4 left-4 z-10">
                                                {donor.is_online ? (
                                                    <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="bg-gray-500/80 text-white px-2 py-1 rounded-lg text-xs">
                                                        {formatRelativeTime(donor.last_active)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Donation Level Badge */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <div className={`${levelBg} px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1`}>
                                                    <DonationIcon className={`w-4 h-4 ${levelColor}`} />
                                                    <span className="text-xs font-medium">{donor.donation_count || 0} lần</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                                                            {donor.avatar ? (
                                                                <img
                                                                    src={getImageUrl(donor.avatar)}
                                                                    alt={getFullName(donor)}
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-8 h-8 text-red-600" />
                                                            )}
                                                        </div>
                                                        {donor.can_donation && (
                                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                                                <BadgeCheck className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {getFullName(donor)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">@{donor.username}</p>
                                                        
                                                        {friendStatuses[donor.id] === 'friend' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full mt-1">
                                                                <UserCheck className="w-3 h-3" />
                                                                Bạn bè
                                                            </span>
                                                        )}
                                                        {friendStatuses[donor.id] === 'pending_sent' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded-full mt-1">
                                                                <Send className="w-3 h-3" />
                                                                Đã gửi lời mời
                                                            </span>
                                                        )}
                                                        {friendStatuses[donor.id] === 'pending_received' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full mt-1">
                                                                <UserPlus className="w-3 h-3" />
                                                                Chờ xác nhận
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {donor.blood_type && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
                                                            <Droplet className="w-3 h-3" />
                                                            {getBloodTypeDisplay(donor.blood_type, donor.rh_factor)}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                                        <Award className="w-3 h-3" />
                                                        {donor.donation_count} lần
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                                                        <Star className="w-3 h-3" />
                                                        {donor.points} điểm
                                                    </span>
                                                    {donor.can_donation && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">
                                                            <Heart className="w-3 h-3" />
                                                            Sẵn sàng
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                                    {donor.career && (
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                                            <span className="truncate">
                                                                {donor.career} {donor.organization && `tại ${donor.organization}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {(donor.permanent_address || donor.province) && !donor.is_private && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            <span className="truncate">
                                                                {donor.permanent_address || donor.province}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {renderActionButtons(donor)}
                                            </div>

                                            {/* Decorative Elements */}
                                            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-red-100 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {donors.map((donor) => (
                                    <div
                                        key={donor.id}
                                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => handleViewDetail(donor.id)}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
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
                                                    {donor.is_online && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {getFullName(donor)}
                                                        </h3>
                                                        {donor.can_donation && (
                                                            <BadgeCheck className="w-4 h-4 text-green-500" />
                                                        )}
                                                        {friendStatuses[donor.id] === 'friend' && (
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                                                Bạn bè
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                                        <span>@{donor.username}</span>
                                                        {donor.blood_type && (
                                                            <span className="flex items-center gap-1">
                                                                <Droplet className="w-3 h-3 text-red-500" />
                                                                {getBloodTypeDisplay(donor.blood_type, donor.rh_factor)}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Award className="w-3 h-3" />
                                                            {donor.donation_count} lần
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                            {donor.points} điểm
                                                        </span>
                                                        {donor.province && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-red-500" />
                                                                {donor.province}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {renderActionButtons(donor)}
                                                </div>
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
                                                <span>Xem thêm donor</span>
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
                            {searchTerm || Object.values(filters).some(v => v) 
                                ? 'Không tìm thấy donor phù hợp' 
                                : 'Chưa có donor nào trong hệ thống'}
                        </h3>

                        <p className="text-gray-600 mb-6">
                            {searchTerm || Object.values(filters).some(v => v)
                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                : 'Vui lòng quay lại sau'}
                        </p>

                        {(searchTerm || Object.values(filters).some(v => v)) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Xóa tất cả bộ lọc
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
                                    
                                    {friendStatuses[selectedDonor.id] === 'friend' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white rounded-full text-xs">
                                            <UserCheck className="w-3 h-3" />
                                            Bạn bè
                                        </span>
                                    )}
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
                                    <div className="border-t pt-6">
                                        {renderActionButtons(selectedDonor)}
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

export default DonorList;