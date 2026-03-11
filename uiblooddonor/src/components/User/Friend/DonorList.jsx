import { useState, useEffect, useCallback, useContext } from 'react';
import {
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Building2, Heart, XCircle, MessageCircle, UserPlus,
    Clock, Activity, Weight, Ruler, CreditCard, Filter,
    CheckCircle, AlertCircle, UserCheck, UserX, UserMinus,
    Send, Ban, UserMinus as UnfriendIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../../configs/UserContexts';

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
    
    const [friendStatuses, setFriendStatuses] = useState({});

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const currentUser = useContext(UserContexts);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        blood_type: '',
        rh_factor: '',
        province: '',
        min_donations: '',
        can_donation: false
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
            if (filters.can_donation) params.append('can_donation', 'true');

            params.append('page', currentPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            const formattedDonors = response.data.results.filter(donor => donor.account.id !== currentUser?.id).map(donor => ({
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
                is_private: donor.is_private
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
    };

    const handleSendRequest = async (donorId) => {
        setProcessingId(donorId);
        try {
            await authApis().post(endpoints.request_friend.replace('${id}', donorId));
            showMessage("Đã gửi lời mời kết bạn", "success");
            // Update friend status
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
            can_donation: false
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

    const getGenderText = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (!bloodType) return 'Chưa cập nhật';
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
    };

    const renderActionButtons = (donor) => {
        const status = friendStatuses[donor.id] || 'none';
        const isLoading = processingId === donor.id;

        if (isLoading) {
            return (
                <button
                    disabled
                    className="flex-1 px-3 py-2 bg-gray-400 text-white text-sm rounded-lg flex items-center justify-center gap-1"
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
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Nhắn tin
                        </button>
                        <button
                            onClick={() => handleUnfriend(donor.id)}
                            className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-1"
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
                            className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Đã gửi lời mời
                        </button>
                        <button
                            onClick={() => handleCancelRequest(donor.id)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1"
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
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
                        >
                            <UserCheck className="w-4 h-4" />
                            Chấp nhận
                        </button>
                        <button
                            onClick={() => handleRejectRequest(donor.id)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1"
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
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1"
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
        <div className="min-h-screen bg-gray-50">
            
            <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-red-500 rounded-lg transition"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Tìm kiếm donor</h1>
                            <p className="text-red-50 mt-2">
                                Tìm thấy {totalDonors} người hiến máu trong hệ thống
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
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
                )}

                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc username..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <Filter className="w-5 h-5" />
                            <span>Bộ lọc</span>
                            {Object.values(filters).some(v => v) && (
                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    Số lần hiến tối thiểu
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.min_donations}
                                    onChange={(e) => handleFilterChange('min_donations', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Nhập số lần"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.can_donation}
                                        onChange={(e) => handleFilterChange('can_donation', e.target.checked)}
                                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Có thể hiến máu</span>
                                </label>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : donors.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {donors.map((donor) => (
                                <div
                                    key={donor.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
                                    onClick={() => handleViewDetail(donor.id)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
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
                                                        {donor.permanent_address}
                                                        {donor.sub_district && `, ${donor.sub_district}`}
                                                        {donor.province && `, ${donor.province}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {renderActionButtons(donor)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>Đang tải...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Xem thêm</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {searchTerm || Object.values(filters).some(v => v) 
                                ? 'Không tìm thấy donor phù hợp' 
                                : 'Chưa có donor nào trong hệ thống'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || Object.values(filters).some(v => v)
                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                : 'Vui lòng quay lại sau'}
                        </p>
                    </div>
                )}
            </div>

            {showDialog && selectedDonor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleCloseDialog}
                >
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-red-600 to-red-400 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
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
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {selectedDonor.account?.last_name} {selectedDonor.account?.first_name}
                                        </h2>
                                        <p className="text-red-100">@{selectedDonor.account?.username}</p>
                                        
                                        {friendStatuses[selectedDonor.id] === 'friend' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full mt-1">
                                                <UserCheck className="w-3 h-3" />
                                                Bạn bè
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseDialog}
                                    className="p-1 hover:bg-red-700 rounded-lg transition"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {loadingDetail ? (
                                <div className="flex justify-center py-8">
                                    <Loader className="w-8 h-8 text-red-600 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <User className="w-5 h-5 text-red-600" />
                                            Thông tin cơ bản
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span>{selectedDonor.account?.email || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                <span>{selectedDonor.account?.phone || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(selectedDonor.account?.birth_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Heart className="w-4 h-4" />
                                                <span>{getGenderText(selectedDonor.account?.gender)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Droplet className="w-5 h-5 text-red-600" />
                                            Thông tin hiến máu
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Droplet className="w-4 h-4 text-red-500" />
                                                <span>Nhóm máu: {getBloodTypeDisplay(selectedDonor.blood_type, selectedDonor.rh_factor)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Award className="w-4 h-4" />
                                                <span>{selectedDonor.donation_count || 0} lần hiến</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Star className="w-4 h-4" />
                                                <span>{selectedDonor.points || 0} điểm</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Lần cuối: {formatDate(selectedDonor.last_donation)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Activity className="w-4 h-4" />
                                                <span className={selectedDonor.can_donation ? 'text-green-600' : 'text-red-600'}>
                                                    {selectedDonor.can_donation ? 'Có thể hiến' : 'Chưa thể hiến'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedDonor.weight || selectedDonor.height || selectedDonor.bmi) && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-red-600" />
                                                Thông tin sức khỏe
                                            </h3>
                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                {selectedDonor.weight && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Weight className="w-4 h-4" />
                                                        <span>{selectedDonor.weight} kg</span>
                                                    </div>
                                                )}
                                                {selectedDonor.height && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Ruler className="w-4 h-4" />
                                                        <span>{selectedDonor.height} cm</span>
                                                    </div>
                                                )}
                                                {selectedDonor.bmi && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Activity className="w-4 h-4" />
                                                        <span>BMI: {selectedDonor.bmi.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedDonor.permanent_address || selectedDonor.province) && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-red-600" />
                                                Địa chỉ
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {selectedDonor.permanent_address}
                                                {selectedDonor.sub_district && `, ${selectedDonor.sub_district}`}
                                                {selectedDonor.province && `, ${selectedDonor.province}`}
                                            </p>
                                        </div>
                                    )}

                                    {(selectedDonor.career || selectedDonor.organization) && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Briefcase className="w-5 h-5 text-red-600" />
                                                Công việc
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {selectedDonor.career}
                                                {selectedDonor.organization && ` tại ${selectedDonor.organization}`}
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
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