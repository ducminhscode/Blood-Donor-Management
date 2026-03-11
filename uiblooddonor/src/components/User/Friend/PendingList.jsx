import { useState, useEffect } from 'react';
import { 
    User, Search, Loader, ChevronRight, X, Mail, Phone,
    Calendar, MapPin, Droplet, Award, Star, Briefcase,
    Heart, XCircle, UserCheck, UserX, Clock, ArrowLeft,
    CheckCircle, AlertCircle, UserPlus, MessageCircle,
    Activity, Weight, Ruler, CreditCard, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../../configs/APIs';
import { getImageUrl } from '../../../utils/Image';

const PendingList = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

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
                requested_at: donor.created_at
            }));
            setRequests(formattedRequests);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            showMessage("Không thể tải danh sách lời mời", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

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

    const getGenderText = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (!bloodType) return 'Chưa cập nhật';
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
    };

    const filteredRequests = requests.filter(request => {
        const fullName = getFullName(request).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
               request.username.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50">
            
            <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-red-500 rounded-lg transition"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">Lời mời kết bạn</h1>
                                <p className="text-red-50 mt-2">
                                    Bạn có {requests.length} lời mời đang chờ xử lý
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
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
                ) : filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                                onClick={() => handleViewDetail(request.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto md:mx-0">
                                            {request.avatar ? (
                                                <img
                                                    src={getImageUrl(request.avatar)}
                                                    alt={getFullName(request)}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-8 h-8 text-red-600" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {getFullName(request)}
                                                </h3>
                                                <p className="text-gray-500">@{request.username}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span>Gửi lời mời {formatDate(request.requested_at)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span>{request.email || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                <span>{request.phone || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(request.birth_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Heart className="w-4 h-4" />
                                                <span>{request.gender === 0 ? 'Nam' : request.gender === 1 ? 'Nữ' : 'Khác'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {request.blood_type && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full">
                                                    <Droplet className="w-4 h-4" />
                                                    Nhóm máu: {getBloodTypeDisplay(request.blood_type, request.rh_factor)}
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
                                        </div>

                                        {(request.permanent_address || request.province || request.career) && (
                                            <div className="mt-4 space-y-1 text-sm text-gray-500">
                                                {request.career && (
                                                    <p>💼 {request.career} {request.organization && `tại ${request.organization}`}</p>
                                                )}
                                                {(request.permanent_address || request.province) && (
                                                    <p>📍 {request.permanent_address}
                                                        {request.sub_district && `, ${request.sub_district}`}
                                                        {request.province && `, ${request.province}`}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleAccept(request.id)}
                                                disabled={processingId === request.id}
                                                className="flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-green-300 flex items-center justify-center gap-2"
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
                                                className="flex-1 md:flex-none px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <UserX className="w-4 h-4" />
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {searchTerm ? 'Không tìm thấy lời mời' : 'Chưa có lời mời kết bạn'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm 
                                ? 'Thử tìm kiếm với từ khóa khác' 
                                : 'Khi có ai đó gửi lời mời, họ sẽ xuất hiện ở đây'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/search-donor')}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Tìm kiếm bạn bè
                            </button>
                        )}
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
                                            onClick={() => handleAccept(selectedDonor.id)}
                                            disabled={processingId === selectedDonor.id}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-green-400"
                                        >
                                            {processingId === selectedDonor.id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UserCheck className="w-4 h-4" />
                                            )}
                                            Chấp nhận
                                        </button>
                                        <button 
                                            onClick={() => handleReject(selectedDonor.id)}
                                            disabled={processingId === selectedDonor.id}
                                            className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
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