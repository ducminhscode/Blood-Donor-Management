import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Droplet, Heart, Share2, ArrowLeft, Users, Award, CheckCircle, AlertCircle, XCircle, Phone, Mail, Globe, Navigation, Copy, ChevronRight, Sparkles, Target, Shield, ThumbsUp, Bookmark, Bell, CalendarDays, MapPinned, Building2, User, UserCheck, MessageCircle, Share, ExternalLink, ClipboardClock, AlarmClock, CalendarCog, BadgeCheck, X, FileText, Ambulance, AlertTriangle, Hospital, Syringe, HeartPulse, Stethoscope, TrendingUp, Loader2, Eye, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import { UserContexts } from '../../configs/UserContexts';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// OpenStreetMap Component
const OpenStreetMap = ({ address, hospital }) => {
    const [position, setPosition] = useState([10.8231, 106.6297]);
    const [mapError, setMapError] = useState(false);
    const [loading, setLoading] = useState(false);
    const fullAddress = `${hospital?.hospital_address || ''} ${hospital?.sub_district || ''} ${hospital?.province || ''}`.trim();
    const encodedAddress = encodeURIComponent(fullAddress);

    const geocodeAddress = async () => {
        if (!fullAddress) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                setMapError(false);
            } else {
                setMapError(true);
            }
        } catch (error) {
            console.error("Error geocoding address:", error);
            setMapError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        geocodeAddress();
    }, [fullAddress]);

    const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodedAddress}`;

    return (
        <div className="space-y-3">
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 group shadow-md">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        <p className="text-gray-500 text-sm ml-2">Đang tải bản đồ...</p>
                    </div>
                ) : !mapError ? (
                    <MapContainer
                        center={position}
                        zoom={15}
                        scrollWheelZoom={false}
                        className="w-full h-full"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={position}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{hospital?.name}</p>
                                    <p className="text-gray-600">{hospital?.hospital_address}, {hospital?.sub_district}, {hospital?.province}</p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">Không thể xác định vị trí trên bản đồ</p>
                        <p className="text-gray-400 text-xs mt-1 max-w-xs text-center">{fullAddress}</p>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium shadow-md"
                    >
                        <Navigation className="w-4 h-4" />
                        Chỉ đường (OpenStreetMap)
                    </a>
                </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900">Địa chỉ bệnh viện:</p>
                    <p>{hospital?.hospital_address}, {hospital?.sub_district}, {hospital?.province}</p>
                </div>
            </div>
        </div>
    );
};

// Info Row Component
const InfoRow = ({ icon: Icon, label, value, href }) => {
    const content = (
        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="p-2 bg-white rounded-lg shadow-sm">
                <Icon className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-500">{label}</p>
                {href ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-red-600 hover:underline flex items-center gap-1"
                    >
                        {value}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                ) : (
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                )}
            </div>
        </div>
    );

    return content;
};

// Staff Detail Dialog
const StaffDetailDialog = ({ isOpen, onClose, staff }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Stethoscope className="w-5 h-5" />
                                Thông tin nhân viên y tế
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg overflow-hidden">
                                {staff?.account?.avatar ? (
                                    <img
                                        src={getImageUrl(staff.account.avatar)}
                                        alt={`${staff.account.last_name} ${staff.account.first_name}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-red-600" />
                                )}
                            </div>

                            <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                                {`${staff?.account?.last_name || ''} ${staff?.account?.first_name || ''}`}
                                {staff?.is_verified && (
                                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                                )}
                            </h4>
                            <p className="text-sm text-gray-500">{staff?.degree || 'Nhân viên y tế'}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Hospital className="w-4 h-4 text-red-500" />
                                    Bệnh viện trực thuộc
                                </h5>
                                <div className="space-y-2">
                                    <p className="font-semibold text-gray-900">
                                        {staff?.hospital?.name || 'Đang cập nhật'}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-start gap-1">
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            {[
                                                staff?.hospital?.hospital_address,
                                                staff?.hospital?.sub_district,
                                                staff?.hospital?.province
                                            ].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1 truncate">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {staff?.account?.email || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1 truncate">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {staff?.account?.phone || 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Khoa</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {staff?.department || 'Khoa'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Chuyên môn</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {staff?.degree || 'Đa khoa'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Kinh nghiệm</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {staff?.experience_years || 0} năm
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Response Dialog Component
const ResponseDialog = ({ isOpen, onClose, onSubmit, user, emergencyRequest }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit();
        } finally {
            setLoading(false);
        }
    };

    const getBloodTypeText = (bloodType) => {
        const bloodTypes = {
            0: 'O',
            1: 'A',
            2: 'B',
            3: 'AB'
        };
        return bloodTypes[bloodType] || 'Chưa cập nhật';
    };

    const getRhFactorText = (rhFactor) => {
        return rhFactor ? '+' : '-';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Xác nhận hỗ trợ</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 mb-6 border border-red-100">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <h4 className="font-semibold text-red-800">Xác nhận hỗ trợ cấp cứu</h4>
                            </div>
                            <p className="text-red-700 text-sm">
                                Bạn có chắc chắn muốn hỗ trợ cho yêu cầu cấp cứu này?
                            </p>
                            <p className="text-red-600 text-xs mt-2">
                                * Bạn sẽ nhận được 200 điểm khi hoàn thành hỗ trợ
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Bệnh nhân:</span>
                                <span className="font-semibold text-gray-900">{emergencyRequest?.patient_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Nhóm máu:</span>
                                <span className="font-bold text-red-600">
                                    {getBloodTypeText(emergencyRequest?.blood_type)}{getRhFactorText(emergencyRequest?.rh_factor)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Lượng máu cần:</span>
                                <span className="font-semibold text-gray-900">{emergencyRequest?.blood_volume}ml</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <HeartPulse className="w-5 h-5" />
                                        <span>Xác nhận hỗ trợ</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getBloodTypeText = (bloodType) => {
    const bloodTypes = {
        0: 'O',
        1: 'A',
        2: 'B',
        3: 'AB'
    };
    return bloodTypes[bloodType] || 'Chưa cập nhật';
};

const getRhFactorText = (rhFactor) => {
    return rhFactor ? '+' : '-';
};

const getDonationTypeText = (donationType) => {
    const types = {
        0: 'Toàn phần',
        1: 'Tiểu cầu',
        2: 'Huyết tương',
        3: 'Bạch cầu'
    };
    return types[donationType] || 'Không xác định';
};

const EmergencyRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [message, setMessage] = useState({ text: '', type: '' });
    const user = useContext(UserContexts);

    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [responseLoading, setResponseLoading] = useState(false);
    const [hasResponded, setHasResponded] = useState(false);
    const [myResponse, setMyResponse] = useState(null);

    const [relatedRequests, setRelatedRequests] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        fetchRequestDetail();
        checkMyResponse();
    }, [id]);

    useEffect(() => {
        if (request?.hospital?.id) {
            fetchRelatedRequests(request.hospital.id);
        }
    }, [request]);

    const fetchRequestDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.emergency_request_detail.replace('${id}', id);
            const response = await authApis().get(url);
            setRequest(response.data);
        } catch (err) {
            console.error("Error fetching emergency request detail:", err);
            setError("Không thể tải thông tin yêu cầu cấp cứu. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const checkMyResponse = async () => {
        if (!user || user.role !== 1) return;

        try {
            const donorResponse = await authApis().get(endpoints.donor_me);
            const currentDonorId = donorResponse.data.id;

            const response = await authApis().get(endpoints.emergency_responses, {
                params: {
                    emergency_request: id
                }
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                const myResponseData = response.data.results.find(r => r.donor?.id === currentDonorId);

                if (myResponseData) {
                    setHasResponded(true);
                    setMyResponse(myResponseData);
                } else {
                    setHasResponded(false);
                }
            } else {
                setHasResponded(false);
            }
        } catch (error) {
            console.error("Error checking response:", error);
            setHasResponded(false);
        }
    };

    const fetchRelatedRequests = async (hospitalId) => {
        setLoadingRelated(true);
        try {
            const response = await authApis().get(endpoints.emergency_request, {
                params: {
                    limit: 4,
                }
            });

            let requests = [];
            if (response.data && response.data.results) {
                requests = response.data.results;
            } else if (Array.isArray(response.data)) {
                requests = response.data;
            }

            const filteredRequests = requests
                .filter(r => r.id !== parseInt(id) && r.hospital?.id === hospitalId && !r.is_expire)
                .slice(0, 3);

            setRelatedRequests(filteredRequests);
        } catch (error) {
            console.error("Error fetching related requests:", error);
            setRelatedRequests([]);
        } finally {
            setLoadingRelated(false);
        }
    };

    const handleResponseClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowResponseForm(true);
    };

    const handleSubmitResponse = async () => {
        setResponseLoading(true);
        try {
            const url = endpoints.emergency_response.replace('${id}', id);
            const response = await authApis().post(url, { status_response: 1 });

            if (response.status === 200 || response.status === 201) {
                showMessage('Đăng ký hỗ trợ thành công', 'success');
                setShowResponseForm(false);
                setHasResponded(true);
                setMyResponse(response.data);
                await fetchRequestDetail();
            }
        } catch (error) {
            console.error("Error responding to emergency:", error);

            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        showMessage('Bạn không đủ điều kiện hiến máu hoặc đã đăng ký rồi.', 'error');
                        break;
                    case 401:
                        showMessage('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
                        navigate('/login');
                        break;
                    case 403:
                        showMessage('Bạn không có quyền hỗ trợ yêu cầu này.', 'error');
                        break;
                    case 404:
                        showMessage('Không tìm thấy yêu cầu cấp cứu.', 'error');
                        break;
                    default:
                        showMessage('Đăng ký thất bại. Vui lòng thử lại sau.', 'error');
                }
            } else {
                showMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
            }
        } finally {
            setResponseLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const getStatusInfo = () => {
        if (request?.is_expire) {
            return {
                label: 'Đã hết hạn',
                color: 'bg-gradient-to-r from-gray-500 to-gray-600',
                icon: XCircle,
                textColor: 'text-gray-500'
            };
        }
        if (request?.critical) {
            return {
                label: 'CẤP CỨU KHẨN CẤP',
                color: 'bg-gradient-to-r from-red-500 to-red-600',
                icon: AlertTriangle,
                textColor: 'text-red-600'
            };
        }
        return {
            label: 'Đang cần hỗ trợ',
            color: 'bg-gradient-to-r from-orange-500 to-orange-600',
            icon: HeartPulse,
            textColor: 'text-orange-600'
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <div className="h-96 bg-gray-200 rounded-2xl mb-6"></div>
                                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                                </div>
                                <div>
                                    <div className="h-64 bg-gray-200 rounded-2xl mb-4"></div>
                                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy yêu cầu'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Yêu cầu cấp cứu bạn đang tìm không tồn tại hoặc đã hết hạn'}
                        </p>
                        <button
                            onClick={() => navigate('/list-emergency-request')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />

            {/* Message Toast */}
            {message.text && (
                <div className="fixed top-24 right-4 z-[1000] animate-slideInRight">
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
                            <Ambulance className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/list-emergency-request")}
                            className="hover:text-white transition-colors"
                        >
                            Yêu cầu cấp cứu
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Chi tiết</span>
                    </div>

                    <button
                        onClick={() => navigate("/list-emergency-request")}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại danh sách</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            <Ambulance className="w-8 h-8" />
                            Yêu cầu máu cấp cứu
                        </h1>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid gap-8">
                    <div className="space-y-6">
                        {/* Title Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <span className={`${status.color} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-md flex items-center gap-1 ${request.critical && !request.is_expire ? 'animate-pulse' : ''}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {status.label}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Yêu cầu máu cho bệnh nhân {request.patient_name}
                                    </h1>
                                </div>

                                {/* Response Button */}
                                <div className="hidden lg:block">
                                    {!user ? (
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                                        >
                                            <span>Đăng nhập để hỗ trợ</span>
                                        </button>
                                    ) : user.role === 1 && (
                                        !hasResponded ? (
                                            <button
                                                onClick={handleResponseClick}
                                                disabled={request.is_expire}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <HeartPulse className="w-5 h-5" />
                                                <span>Hỗ trợ ngay</span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-semibold">Đã đăng ký hỗ trợ</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-600 leading-relaxed">
                                {request.emergency_note || 'Yêu cầu hỗ trợ máu cấp cứu khẩn cấp.'}
                            </p>

                            {/* Response Button - Mobile */}
                            <div className="lg:hidden mt-4">
                                {!user ? (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                                    >
                                        <span>Đăng nhập để hỗ trợ</span>
                                    </button>
                                ) : user.role === 1 && (
                                    !hasResponded ? (
                                        <button
                                            onClick={handleResponseClick}
                                            disabled={request.is_expire}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <HeartPulse className="w-5 h-5" />
                                            <span>Hỗ trợ ngay</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-semibold">Đã đăng ký hỗ trợ</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-6">
                                    {[
                                        { id: 'info', label: 'Thông tin chi tiết', icon: FileText },
                                        { id: 'location', label: 'Bệnh viện', icon: Hospital },
                                        { id: 'organizer', label: 'Nhân viên y tế', icon: User }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-2 font-medium transition-all relative flex items-center gap-2 ${activeTab === tab.id
                                                ? 'text-red-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6">
                                {activeTab === 'info' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoRow
                                                icon={User}
                                                label="Bệnh nhân"
                                                value={request.patient_name}
                                            />
                                            <InfoRow
                                                icon={Phone}
                                                label="Số điện thoại liên hệ"
                                                value={request.phone}
                                            />
                                            <InfoRow
                                                icon={Syringe}
                                                label="Nhóm máu cần"
                                                value={`${getBloodTypeText(request.blood_type)}${getRhFactorText(request.rh_factor)}`}
                                            />
                                            <InfoRow
                                                icon={Droplet}
                                                label="Lượng máu cần"
                                                value={`${request.blood_volume}ml`}
                                            />
                                            <InfoRow
                                                icon={Activity}
                                                label="Loại hiến máu"
                                                value={getDonationTypeText(request.donation_type)}
                                            />
                                            <InfoRow
                                                icon={CalendarDays}
                                                label="Ngày tạo yêu cầu"
                                                value={formatDate(request.created_at)}
                                            />
                                        </div>

                                        <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" />
                                                Lưu ý quan trọng
                                            </h4>
                                            <ul className="space-y-2 text-sm text-red-700">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Yêu cầu cấp cứu cần được hỗ trợ càng sớm càng tốt</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Mang theo CMND/CCCD khi đến bệnh viện</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Ăn nhẹ trước khi hiến máu</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Không sử dụng rượu bia trước khi hiến 24h</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'location' && (
                                    <div className="space-y-4">
                                        <OpenStreetMap
                                            address={request.hospital?.hospital_address}
                                            hospital={request.hospital}
                                        />
                                    </div>
                                )}

                                {activeTab === 'organizer' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                                                    {request.staff?.hospital?.image_url ? (
                                                        <img
                                                            src={getImageUrl(request.staff.hospital.image_url)}
                                                            alt={request.staff.hospital.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="w-8 h-8 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-1">
                                                        {request.staff?.hospital?.name || 'Đang cập nhật'}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {[
                                                            request.staff?.hospital?.hospital_address,
                                                            request.staff?.hospital?.sub_district,
                                                            request.staff?.hospital?.province
                                                        ].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoRow
                                                icon={User}
                                                label="Nhân viên y tế"
                                                value={
                                                    <button
                                                        onClick={() => setIsStaffDialogOpen(true)}
                                                        className="flex items-center gap-1 hover:text-red-600 transition-colors group"
                                                    >
                                                        <span>{`${request.staff?.account?.last_name || ''} ${request.staff?.account?.first_name || ''}`}</span>
                                                        {request.staff?.is_verified && (
                                                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                        )}
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                }
                                            />
                                            <InfoRow
                                                icon={Phone}
                                                label="Hotline"
                                                value={`${request.staff?.emergency_phone || 'Chưa cập nhật'}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Emergency Requests */}
                {relatedRequests.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-red-500" />
                            Yêu cầu cấp cứu cùng bệnh viện {request.hospital?.name}
                        </h2>

                        {loadingRelated ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                                        <div className="h-32 bg-gray-200 rounded-t-xl"></div>
                                        <div className="p-4 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedRequests.map((relatedRequest) => (
                                    <div
                                        key={relatedRequest.id}
                                        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden border border-gray-100 hover:border-red-200"
                                        onClick={() => navigate(`/emergency-request/${relatedRequest.id}`)}
                                    >
                                        <div className="h-32 bg-gradient-to-br from-red-500 to-red-700 relative overflow-hidden flex items-center justify-center">
                                            <AlertTriangle className="w-12 h-12 text-white opacity-50" />
                                            <div className="absolute top-2 right-2">
                                                <span className={`${relatedRequest.critical && !relatedRequest.is_expire ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white text-xs px-2 py-1 rounded-full shadow-md`}>
                                                    {relatedRequest.critical && !relatedRequest.is_expire ? 'Cấp cứu' : 'Cần hỗ trợ'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                                                {relatedRequest.patient_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Droplet className="w-3 h-3" />
                                                Nhóm máu: {getBloodTypeText(relatedRequest.blood_type)}{getRhFactorText(relatedRequest.rh_factor)}
                                            </p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Syringe className="w-3 h-3" />
                                                Cần {relatedRequest.blood_volume}ml
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {relatedRequests.length > 0 && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => navigate('/list-emergency-request')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 shadow-sm border border-gray-200"
                                >
                                    Xem thêm yêu cầu
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <StaffDetailDialog
                isOpen={isStaffDialogOpen}
                onClose={() => setIsStaffDialogOpen(false)}
                staff={request?.staff}
            />

            <ResponseDialog
                isOpen={showResponseForm}
                onClose={() => setShowResponseForm(false)}
                onSubmit={handleSubmitResponse}
                user={user}
                emergencyRequest={request}
            />

            <Footer />

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

export default EmergencyRequestDetail;