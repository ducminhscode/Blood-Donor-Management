import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Droplet, Heart, Share2, ArrowLeft, Users, Award, CheckCircle, AlertCircle, XCircle, Phone, Mail, Globe, Navigation, Copy, ChevronRight, Sparkles, Target, Shield, ThumbsUp, Bookmark, Bell, CalendarDays, MapPinned, Building2, User, UserCheck, MessageCircle, Share, ExternalLink, ClipboardClock, AlarmClock, CalendarCog, BadgeCheck, X, FileText, UserCircle, IdCard, Briefcase, Home, CalendarClock, Clock3, Clock12, Ban, CheckCircle2, Timer, Hourglass, UserPlus, UserMinus, Edit, Printer, Download, Send, MessageSquare, CalendarCheck, ClipboardCheck, Mars, Venus, Stethoscope, Ambulance, AlertTriangle, Syringe, Hospital, HeartPulse, Loader2, Eye, TrendingUp, RefreshCw, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { UserContexts } from '../../configs/UserContexts';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OpenStreetMap = ({ location, province, subDistrict }) => {
    const [position, setPosition] = useState([10.8231, 106.6297]);
    const [mapError, setMapError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [provinceName, setProvinceName] = useState('');
    const [districtName, setDistrictName] = useState('');

    const fetchProvinceName = async (provinceCode) => {
        if (!provinceCode) return;
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}`);
            const data = await response.json();
            setProvinceName(data.name);
        } catch (error) {
            console.error("Error fetching province name:", error);
            setProvinceName(province);
        }
    };

    const fetchDistrictName = async (districtCode) => {
        if (!districtCode) return;
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}`);
            const data = await response.json();
            setDistrictName(data.name);
        } catch (error) {
            console.error("Error fetching district name:", error);
            setDistrictName(subDistrict);
        }
    };

    useEffect(() => {
        if (province && !isNaN(province)) {
            fetchProvinceName(province);
        } else {
            setProvinceName(province);
        }

        if (subDistrict && !isNaN(subDistrict)) {
            fetchDistrictName(subDistrict);
        } else {
            setDistrictName(subDistrict);
        }
    }, [province, subDistrict]);

    const fullAddress = `${location || ''} ${districtName || ''} ${provinceName || ''}`.trim();
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
                                    <p className="font-semibold">{location}</p>
                                    <p className="text-gray-600">{districtName}, {provinceName}</p>
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
                    <p className="font-semibold text-gray-900">Địa chỉ:</p>
                    <p>{location}, {districtName}, {provinceName}</p>
                </div>
            </div>
        </div>
    );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, className = "" }) => {
    return (
        <div className={`bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value || 'Chưa cập nhật'}</p>
                </div>
            </div>
        </div>
    );
};

// Status Badge Component
const StatusBadge = ({ statusResponse, statusRegistration }) => {
    const getStatusConfig = () => {
        if (statusResponse === 1) {
            if (statusRegistration === 4) {
                return {
                    label: 'Đã hoàn thành',
                    color: 'bg-gradient-to-r from-emerald-500 to-green-500',
                    textColor: 'text-white',
                    icon: ClipboardCheck,
                    glow: 'shadow-lg shadow-emerald-500/30'
                };
            }
            if (statusRegistration === 3) {
                return {
                    label: 'Đã Check-in',
                    color: 'bg-gradient-to-r from-purple-500 to-purple-600',
                    textColor: 'text-white',
                    icon: UserCheck,
                    glow: 'shadow-lg shadow-purple-500/30'
                };
            }
            if (statusRegistration === 1) {
                return {
                    label: 'Đã xác nhận',
                    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
                    textColor: 'text-white',
                    icon: CheckCircle2,
                    glow: 'shadow-lg shadow-green-500/30'
                };
            }
            return {
                label: 'Đã chấp nhận',
                color: 'bg-gradient-to-r from-green-500 to-emerald-500',
                textColor: 'text-white',
                icon: CheckCircle2,
                glow: 'shadow-lg shadow-green-500/30'
            };
        }
        if (statusResponse === 2) {
            return {
                label: 'Đã từ chối',
                color: 'bg-gradient-to-r from-red-500 to-red-600',
                textColor: 'text-white',
                icon: XCircle,
                glow: 'shadow-lg shadow-red-500/30'
            };
        }
        return {
            label: 'Đang xử lý',
            color: 'bg-gradient-to-r from-gray-500 to-gray-600',
            textColor: 'text-white',
            icon: Timer,
            glow: 'shadow-lg shadow-gray-500/30'
        };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.color} ${config.textColor} ${config.glow}`}>
            <Icon className="w-4 h-4" />
            {config.label}
        </span>
    );
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

const EmergencyResponseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const user = useContext(UserContexts);

    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const [hasMedicalCheckup, setHasMedicalCheckup] = useState(false);
    const [checkingMedical, setCheckingMedical] = useState(false);

    const checkMedicalCheckup = async () => {
        if (!response?.emergency_request?.id || !id) return;

        setCheckingMedical(true);
        try {
            const url = endpoints.emergency_medical_checkup
                .replace('${id}', response.emergency_request.id)
                .replace('${response_id}', id);
            await authApis().get(url);
            setHasMedicalCheckup(true);
        } catch (error) {
            setHasMedicalCheckup(false);
        } finally {
            setCheckingMedical(false);
        }
    };

    useEffect(() => {
        if (response?.emergency_request?.id && id) {
            checkMedicalCheckup();
        }
    }, [response?.emergency_request?.id, id]);

    useEffect(() => {
        fetchResponseDetail();
    }, [id]);

    const fetchResponseDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.emergency_responses_detail.replace('${id}', id);
            const responseData = await authApis().get(url);
            setResponse(responseData.data);
        } catch (err) {
            console.error("Error fetching response detail:", err);
            if (err.response?.status === 404) {
                setError("Không tìm thấy thông tin phản hồi.");
            } else {
                setError("Không thể tải thông tin phản hồi. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <div className="animate-pulse">
                            <div className="h-8 w-64 bg-gray-200 rounded-lg mb-6"></div>
                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                                    <div className="space-y-4">
                                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="h-64 bg-gray-200 rounded-2xl mb-4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !response) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy thông tin phản hồi'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Thông tin phản hồi bạn đang tìm không tồn tại hoặc đã bị xóa'}
                        </p>
                        <button
                            onClick={() => navigate('/emergency-response')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại danh sách phản hồi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const emergency = response.emergency_request;
    const isAccepted = response.status_response === 1;
    const isCompleted = response.status_registration === 4;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
                            onClick={() => navigate("/emergency-response")}
                            className="hover:text-white transition-colors"
                        >
                            Phản hồi cấp cứu
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Chi tiết phản hồi</span>
                    </div>

                    <button
                        onClick={() => navigate("/emergency-response")}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại danh sách phản hồi</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            <Ambulance className="w-8 h-8" />
                            Chi tiết phản hồi cấp cứu
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
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        Bệnh nhân: {emergency?.patient_name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-4 mb-4 flex-wrap">
                                        <StatusBadge
                                            statusResponse={response.status_response}
                                            statusRegistration={response.status_registration}
                                        />
                                        {emergency?.critical && !emergency?.is_expire && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-md">
                                                <AlertTriangle className="w-4 h-4" />
                                                Cấp cứu khẩn cấp
                                            </span>
                                        )}
                                    </div>
                                    {!checkingMedical && hasMedicalCheckup && isAccepted && (
                                        <button
                                            onClick={() => navigate(`/emergency-request/${emergency?.id}/responses/${id}/medical-checkup`)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium"
                                        >
                                            <Stethoscope className="w-4 h-4" />
                                            Xem kết quả khám sức khỏe
                                        </button>
                                    )}

                                    {checkingMedical && (
                                        <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-xl">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang kiểm tra...
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-6 overflow-x-auto">
                                    {[
                                        { id: 'info', label: 'Thông tin phản hồi', icon: FileText },
                                        { id: 'emergency', label: 'Thông tin yêu cầu', icon: AlertTriangle },
                                        { id: 'hospital', label: 'Bệnh viện', icon: Hospital }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-2 font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
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
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-red-500" />
                                                Thông tin phản hồi
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={Clock3}
                                                    label="Ngày phản hồi"
                                                    value={formatDateTime(response.created_at)}
                                                />
                                                <InfoCard
                                                    icon={UserCheck}
                                                    label="Trạng thái phản hồi"
                                                    value={response.status_response === 1 ? 'Đã chấp nhận' : 'Đã từ chối'}
                                                />
                                                <InfoCard
                                                    icon={ClipboardCheck}
                                                    label="Trạng thái đăng ký"
                                                    value={
                                                        response.status_registration === 4 ? 'Đã hoàn thành' :
                                                            response.status_registration === 3 ? 'Đã Check-in' :
                                                                response.status_registration === 1 ? 'Đã xác nhận' : 'Chưa xác nhận'
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <User className="w-5 h-5 text-red-500" />
                                                Thông tin bệnh nhân
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={User}
                                                    label="Họ và tên"
                                                    value={emergency?.patient_name}
                                                />
                                                <InfoCard
                                                    icon={Phone}
                                                    label="Số điện thoại"
                                                    value={emergency?.phone}
                                                />
                                                <InfoCard
                                                    icon={Syringe}
                                                    label="Nhóm máu"
                                                    value={`${getBloodTypeText(emergency?.blood_type)}${getRhFactorText(emergency?.rh_factor)}`}
                                                />
                                                <InfoCard
                                                    icon={Droplet}
                                                    label="Lượng máu cần"
                                                    value={`${emergency?.blood_volume}ml`}
                                                />
                                                <InfoCard
                                                    icon={Activity}
                                                    label="Loại hiến máu"
                                                    value={getDonationTypeText(emergency?.donation_type)}
                                                />
                                            </div>
                                        </div>

                                        {emergency?.emergency_note && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-red-500" />
                                                    Ghi chú cấp cứu
                                                </h3>
                                                <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                                    <p className="text-red-800 whitespace-pre-line">
                                                        {emergency.emergency_note}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'emergency' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-red-500" />
                                                Thông tin yêu cầu
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={Calendar}
                                                    label="Ngày tạo yêu cầu"
                                                    value={formatDateTime(emergency?.created_at)}
                                                />
                                                <InfoCard
                                                    icon={Clock12}
                                                    label="Cập nhật lần cuối"
                                                    value={formatDateTime(emergency?.updated_at)}
                                                />
                                                <InfoCard
                                                    icon={AlertTriangle}
                                                    label="Mức độ"
                                                    value={emergency?.critical ? 'Cấp cứu khẩn cấp' : 'Cần hỗ trợ'}
                                                />
                                                <InfoCard
                                                    icon={Hourglass}
                                                    label="Tình trạng"
                                                    value={emergency?.is_expire ? 'Đã hết hạn' : 'Đang hiệu lực'}
                                                />
                                            </div>
                                        </div>

                                        {emergency?.staff && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-red-500" />
                                                    Nhân viên y tế phụ trách
                                                </h3>
                                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center overflow-hidden">
                                                                {emergency?.staff?.account?.avatar ? (
                                                                    <img
                                                                        src={getImageUrl(emergency.staff.account.avatar)}
                                                                        alt={`${emergency.staff.account.last_name} ${emergency.staff.account.first_name}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-6 h-6 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {`${emergency?.staff?.account?.last_name || ''} ${emergency?.staff?.account?.first_name || ''}`}
                                                                    </span>
                                                                    {emergency?.staff?.is_verified && (
                                                                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    {emergency?.staff?.degree} - {emergency?.staff?.department}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsStaffDialogOpen(true)}
                                                            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
                                                        >
                                                            Xem chi tiết
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {emergency?.staff?.emergency_phone && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Phone className="w-5 h-5 text-red-500" />
                                                    Hotline hỗ trợ
                                                </h3>
                                                <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                                    <a
                                                        href={`tel:${emergency.staff.emergency_phone}`}
                                                        className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
                                                    >
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            <Phone className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-red-600/80">Gọi ngay</p>
                                                            <p className="text-lg font-bold">{emergency.staff.emergency_phone}</p>
                                                        </div>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'hospital' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Hospital className="w-5 h-5 text-red-500" />
                                                Bệnh viện điều trị
                                            </h3>
                                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                                                        {emergency?.hospital?.image_url ? (
                                                            <img
                                                                src={getImageUrl(emergency.hospital.image_url)}
                                                                alt={emergency.hospital.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Hospital className="w-8 h-8 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-1">
                                                            {emergency?.hospital?.name || 'Đang cập nhật'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {emergency?.hospital?.hospital_address}, {emergency?.hospital?.sub_district}, {emergency?.hospital?.province}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-red-500" />
                                                Vị trí bệnh viện
                                            </h3>
                                            <OpenStreetMap
                                                location={emergency?.hospital?.hospital_address}
                                                province={emergency?.hospital?.province}
                                                subDistrict={emergency?.hospital?.sub_district}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-red-500" />
                                Tóm tắt phản hồi
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Trạng thái</span>
                                    <StatusBadge
                                        statusResponse={response.status_response}
                                        statusRegistration={response.status_registration}
                                    />
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Bệnh nhân</span>
                                    <span className="font-semibold text-gray-900">{emergency?.patient_name}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Nhóm máu</span>
                                    <span className="font-bold text-red-600">
                                        {getBloodTypeText(emergency?.blood_type)}{getRhFactorText(emergency?.rh_factor)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Lượng máu cần</span>
                                    <span className="font-semibold text-gray-900">{emergency?.blood_volume}ml</span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày phản hồi</span>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{formatTime(response.created_at)}</p>
                                        <p className="font-semibold text-gray-900">{formatDate(response.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between">
                                    <span className="text-gray-600">Bệnh viện</span>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">{emergency?.hospital?.name}</p>
                                        <p className="text-xs text-gray-500">{emergency?.hospital?.sub_district}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => window.print()}
                                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-5 h-5" />
                                    In thông tin
                                </button>
                            </div>

                            {/* Note */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        {isAccepted && !isCompleted && "Vui lòng mang theo CMND/CCCD khi đến bệnh viện. Có mặt đúng giờ để được hỗ trợ kịp thời."}
                                        {isCompleted && "Cảm ơn bạn đã hỗ trợ cấp cứu. Bạn đã nhận được 200 điểm thưởng."}
                                        {!isAccepted && "Bạn đã từ chối hỗ trợ yêu cầu này."}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <StaffDetailDialog
                isOpen={isStaffDialogOpen}
                onClose={() => setIsStaffDialogOpen(false)}
                staff={emergency?.staff}
            />

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

export default EmergencyResponseDetail;