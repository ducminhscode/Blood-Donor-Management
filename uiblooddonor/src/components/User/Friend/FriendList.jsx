import { useState, useEffect, useCallback } from 'react';
import {
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Building2, Heart, XCircle, MessageCircle, UserPlus,
    Clock, Activity, Weight, Ruler, CreditCard, UserMinus,
    CheckCircle, AlertCircle
} from 'lucide-react';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';
import debounce from 'lodash.debounce';
import { useNavigate } from 'react-router-dom';

const FriendList = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalFriends, setTotalFriends] = useState(0);

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

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
                can_donation: friend.can_donation
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
        }, 500),
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

    const getGenderText = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (!bloodType) return 'Chưa cập nhật';
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Danh sách bạn bè</h1>
                            <p className="text-red-50 mt-2">Có {totalFriends} người bạn</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/search-donor')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm"
                            >
                                <Search className="w-5 h-5" />
                                <span>Tìm kiếm mọi người</span>
                            </button>

                            <button
                                onClick={() => navigate('/pending-list')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm relative"
                            >
                                <UserPlus className="w-5 h-5" />
                                <span>Lời mời kết bạn</span>
                                {pendingRequestsCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên..."
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
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : friends.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                                    onClick={() => handleViewDetail(friend.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
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

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {getFullName(friend)}
                                            </h3>
                                            <p className="text-sm text-gray-500">@{friend.username}</p>

                                            <div className="flex gap-3 mt-1 text-xs text-gray-600">
                                                {friend.blood_type && (
                                                    <span>
                                                        Nhóm máu: {friend.blood_type}
                                                        {friend.rh_factor === 'positive' ? '+' : '-'}
                                                    </span>
                                                )}
                                                <span>• {friend.donation_count} lần hiến</span>
                                                <span>• {friend.points} điểm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            <span>Đang tải...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Xem thêm</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {searchTerm ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy kết nối với mọi người'}
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

                                    {selectedDonor.identification && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <CreditCard className="w-5 h-5 text-red-600" />
                                                CMND/CCCD
                                            </h3>
                                            <p className="text-sm text-gray-600">{selectedDonor.identification}</p>
                                        </div>
                                    )}

                                    <div className="border-t pt-4 flex gap-3">
                                        <button 
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                            onClick={() => {}}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Nhắn tin
                                        </button>
                                        <button 
                                            onClick={() => handleUnfriend(selectedDonor.id)}
                                            disabled={processingId === selectedDonor.id}
                                            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {processingId === selectedDonor.id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UserMinus className="w-4 h-4" />
                                            )}
                                            Hủy kết bạn
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

export default FriendList;