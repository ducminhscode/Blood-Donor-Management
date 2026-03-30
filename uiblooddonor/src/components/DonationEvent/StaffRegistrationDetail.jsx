import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Clock, Droplet, Heart, ArrowLeft,
    Users, Award, CheckCircle, AlertCircle, XCircle,
    Phone, Mail, User, UserCheck, FileText, UserCircle,
    IdCard, Briefcase, Home, CalendarClock, UserPlus,
    BadgeCheck, X, ChevronRight, Sparkles, Info,
    Activity, Calendar as CalendarIcon, MapPinned, Building,
    Clock as ClockIcon, Eye, Edit, Printer, Download,
    Send, MessageSquare, Stethoscope, HeartPulse, FileHeart,
    CalendarCheck, ClipboardCheck, Mars, Venus, Building2,
    AlarmClock, Clock3, Clock12, Ban, CheckCircle2,
    Timer, Hourglass, UserMinus, Edit as EditIcon,
    Globe, Navigation, Copy, Share2, Target, Shield,
    ThumbsUp, Bookmark, Bell, CalendarDays, MessageCircle,
    Share, ExternalLink, ClipboardClock, CalendarCog,
    RefreshCw, Loader2, PlusCircle,
    NotebookPen, Ambulance, Hospital, Syringe,
    AlertTriangle, HeartHandshake, FlaskConical,
    TrendingUp, Award as AwardIcon, Shield as ShieldIcon,
    Users as UsersIcon, Map as MapIcon, Loader
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Map Component
const OpenStreetMap = ({ location, province, subDistrict }) => {
    const [position, setPosition] = useState([10.8231, 106.6297]);
    const [mapError, setMapError] = useState(false);
    const [loading, setLoading] = useState(false);

    const fullAddress = `${location || ''} ${subDistrict || ''} ${province || ''}`.trim();
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

    if (typeof L === 'undefined') {
        return (
            <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <p className="text-gray-500 text-sm ml-2">Đang tải bản đồ...</p>
            </div>
        );
    }

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
                                    <p className="text-gray-600">{subDistrict}, {province}</p>
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
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900">Địa chỉ:</p>
                    <p>{location}, {subDistrict}, {province}</p>
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
const StatusBadge = ({ status }) => {
    const statusConfig = {
        0: {
            label: 'Đã đăng ký',
            color: 'bg-gradient-to-r from-blue-500 to-blue-600',
            textColor: 'text-white',
            icon: CalendarCheck,
            glow: 'shadow-lg shadow-blue-500/30'
        },
        1: {
            label: 'Đã xác nhận',
            color: 'bg-gradient-to-r from-green-500 to-emerald-500',
            textColor: 'text-white',
            icon: CheckCircle2,
            glow: 'shadow-lg shadow-green-500/30'
        },
        2: {
            label: 'Đã từ chối',
            color: 'bg-gradient-to-r from-red-500 to-red-600',
            textColor: 'text-white',
            icon: XCircle,
            glow: 'shadow-lg shadow-red-500/30'
        },
        3: {
            label: 'Đã Check-in',
            color: 'bg-gradient-to-r from-purple-500 to-purple-600',
            textColor: 'text-white',
            icon: UserCheck,
            glow: 'shadow-lg shadow-purple-500/30'
        },
        4: {
            label: 'Đã hoàn thành',
            color: 'bg-gradient-to-r from-emerald-500 to-green-500',
            textColor: 'text-white',
            icon: ClipboardCheck,
            glow: 'shadow-lg shadow-emerald-500/30'
        }
    };

    const config = statusConfig[status] || statusConfig[0];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.color} ${config.textColor} ${config.glow}`}>
            <Icon className="w-4 h-4" />
            {config.label}
        </span>
    );
};

// BloodDonation Card Component
const BloodDonationCard = ({ donation, onView }) => {
    if (!donation) return null;

    const getResultColor = (result) => {
        if (result === 'PASS') return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200';
        if (result === 'FAIL') return 'bg-gradient-to-r from-red-100 to-red-100 text-red-700 border-red-200';
        return 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={onView}>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-5 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-600" />
                    Kết quả hiến máu
                </h3>
            </div>
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border ${getResultColor(donation.result)}`}>
                            {donation.result === 'PASS' ? 'Đạt' : donation.result === 'FAIL' ? 'Không đạt' : 'Đang xử lý'}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Ngày hiến</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(donation.created_at)}</p>
                    </div>
                </div>

                {donation.blood_volume && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-red-50 to-red-50/30 rounded-xl">
                        <Droplet className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-700">Lượng máu hiến: </span>
                        <span className="font-bold text-red-600">{donation.blood_volume} ml</span>
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200"
                >
                    <span className="text-sm font-medium">Xem chi tiết</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
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

// Create MedicalCheckup Dialog
const CreateMedicalCheckupDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        blood_pressure: '',
        heart_rate: '',
        body_temperature: '',
        hemoglobin_level: '',
        has_infectious: false,
        has_chronic: false,
        recent_surgery: false,
        recent_tattoo: false,
        is_drug: false,
        is_pregnant: false,
        is_breast_feeding: false,
        last_donation: '',
        is_eligible: true,
        doctor: '',
        medical_note: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <NotebookPen className="w-5 h-5" />
                                Tạo phiếu khám sức khỏe
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Thông tin bác sĩ */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-red-600" />
                                Thông tin bác sĩ
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên bác sĩ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="doctor"
                                    value={formData.doctor}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập tên bác sĩ khám"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Chỉ số cơ bản */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-red-600" />
                                Chỉ số sức khỏe
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cân nặng (kg) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        placeholder="Ví dụ: 65"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chiều cao (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        placeholder="Ví dụ: 170"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Huyết áp (mmHg) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="blood_pressure"
                                        value={formData.blood_pressure}
                                        onChange={handleChange}
                                        placeholder="120/80"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nhịp tim (bpm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="heart_rate"
                                        value={formData.heart_rate}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        placeholder="Ví dụ: 72"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nhiệt độ (°C) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="body_temperature"
                                        value={formData.body_temperature}
                                        onChange={handleChange}
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        placeholder="Ví dụ: 36.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hemoglobin (g/L) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="hemoglobin_level"
                                        value={formData.hemoglobin_level}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        placeholder="Ví dụ: 135"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lần hiến gần nhất */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-red-600" />
                                Lịch sử hiến máu
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lần hiến máu gần nhất
                                </label>
                                <input
                                    type="date"
                                    name="last_donation"
                                    value={formData.last_donation}
                                    max={today}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    * Nếu chưa từng hiến máu, để trống
                                </p>
                            </div>
                        </div>

                        {/* Tiền sử bệnh lý */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-600" />
                                Tiền sử bệnh lý
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="has_infectious"
                                        checked={formData.has_infectious}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Bệnh truyền nhiễm</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="has_chronic"
                                        checked={formData.has_chronic}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Bệnh mãn tính</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="recent_surgery"
                                        checked={formData.recent_surgery}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Phẫu thuật gần đây</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="recent_tattoo"
                                        checked={formData.recent_tattoo}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Xăm hình gần đây</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_drug"
                                        checked={formData.is_drug}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Sử dụng chất kích thích</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_pregnant"
                                        checked={formData.is_pregnant}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Đang mang thai</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_breast_feeding"
                                        checked={formData.is_breast_feeding}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Đang cho con bú</span>
                                </label>
                            </div>
                        </div>

                        {/* Kết luận */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-red-600" />
                                Kết luận
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kết quả khám <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="is_eligible"
                                    value={formData.is_eligible}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                >
                                    <option value={true}>Đủ điều kiện</option>
                                    <option value={false}>Không đủ điều kiện</option>
                                </select>
                            </div>
                        </div>

                        {/* Ghi chú y tế */}
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-red-600" />
                                Ghi chú y tế
                            </h4>
                            <textarea
                                name="medical_note"
                                value={formData.medical_note}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Nhập ghi chú y tế (nếu có)..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="w-5 h-5" />
                                        <span>Tạo phiếu khám</span>
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
                    </form>
                </div>
            </div>
        </div>
    );
};

// Confirm Status Dialog
const ConfirmStatusDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Xác nhận thay đổi trạng thái
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-800 font-semibold mb-1">{title}</p>
                                    <p className="text-xs text-yellow-700">{message}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Xác nhận</span>
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

const StaffRegistrationDetail = () => {
    const { id, registration_id } = useParams();
    const navigate = useNavigate();

    const [registration, setRegistration] = useState(null);
    const [eventInfo, setEventInfo] = useState(null);
    const [medicalCheckup, setMedicalCheckup] = useState(null);
    const [bloodDonation, setBloodDonation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('info');
    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [creatingMedicalCheckup, setCreatingMedicalCheckup] = useState(false);
    const [showCreateMedicalDialog, setShowCreateMedicalDialog] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        newStatus: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchRegistrationDetail();
    }, [id, registration_id]);

    const fetchRegistrationDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints['staff_registrations_event_detail']
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            const response = await authApis().get(url);
            setRegistration(response.data);

            if (response.data.donation_event) {
                setEventInfo(response.data.donation_event);
            }

            // Try to fetch medical checkup
            try {
                const checkupUrl = endpoints.donation_medical_checkup
                    .replace('${id}', id)
                    .replace('${registration_id}', registration_id);
                const checkupResponse = await authApis().get(checkupUrl);
                setMedicalCheckup(checkupResponse.data);
            } catch (err) {
                console.log("No medical checkup found");
            }

        } catch (err) {
            console.error("Error fetching registration detail:", err);
            setError("Không thể tải thông tin đăng ký. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const url = endpoints['staff_registrations_event_detail']
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);

            let endpoint = url;
            if (newStatus === 1) {
                endpoint += 'approve/';
            } else if (newStatus === 2) {
                endpoint += 'reject/';
            } else if (newStatus === 3) {
                endpoint += 'checkin/';
            } else if (newStatus === 4) {
                endpoint += 'complete/';
            }

            await authApis().post(endpoint);
            await fetchRegistrationDetail();
            showMessage('Cập nhật trạng thái thành công!', 'success');
        } catch (err) {
            console.error("Error updating status:", err);
            showMessage('Cập nhật trạng thái thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setUpdatingStatus(false);
            setConfirmDialog({ isOpen: false, newStatus: null, title: '', message: '' });
        }
    };

    const handleCreateMedicalCheckup = async (formData) => {
        setCreatingMedicalCheckup(true);
        try {
            const url = endpoints.donation_medical_checkup
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);

            await authApis().post(url, formData);
            showMessage('Tạo phiếu khám sức khỏe thành công!', 'success');
            setShowCreateMedicalDialog(false);
            await fetchRegistrationDetail();
        } catch (err) {
            console.error("Error creating medical checkup:", err);
            showMessage('Tạo phiếu khám sức khỏe thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setCreatingMedicalCheckup(false);
        }
    };

    const openConfirmDialog = (newStatus) => {
        const statusConfig = {
            1: { title: 'Xác nhận đăng ký', message: 'Bạn có chắc chắn muốn xác nhận đăng ký này? Hành động này sẽ cho phép người dùng tham gia sự kiện.' },
            2: { title: 'Từ chối đăng ký', message: 'Bạn có chắc chắn muốn từ chối đăng ký này? Người dùng sẽ không thể tham gia sự kiện.' },
            3: { title: 'Xác nhận Check-in', message: 'Bạn có chắc chắn muốn check-in cho người dùng này? Hành động này xác nhận người dùng đã đến tham gia.' },
            4: { title: 'Xác nhận Hoàn thành', message: 'Bạn có chắc chắn muốn đánh dấu hoàn thành? Người dùng đã hoàn tất quá trình hiến máu.' }
        };

        setConfirmDialog({
            isOpen: true,
            newStatus,
            title: statusConfig[newStatus]?.title || 'Xác nhận cập nhật',
            message: statusConfig[newStatus]?.message || 'Bạn có chắc chắn muốn cập nhật trạng thái này?'
        });
    };

    const getGenderLabel = (gender) => {
        if (gender === 0) return 'Nam';
        if (gender === 1) return 'Nữ';
        return 'Khác';
    };

    const getFullAddress = () => {
        if (!registration) return 'Chưa cập nhật';
        const parts = [
            registration.permanent_address,
            registration.sub_district,
            registration.province
        ].filter(Boolean);
        return parts.join(', ') || 'Chưa cập nhật';
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const canUpdateStatus = () => {
        if (!registration) return false;
        const currentStatus = registration.status;
        return currentStatus === 0 || currentStatus === 1 || currentStatus === 3;
    };

    const canCreateMedicalCheckup = () => {
        return registration?.status === 3 && !medicalCheckup;
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

    if (error || !registration) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy thông tin đăng ký'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Thông tin đăng ký bạn đang tìm không tồn tại'}
                        </p>
                        <button
                            onClick={() => navigate(`/staff-donation-event/${id}/registrations`)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại danh sách đăng ký
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const event = eventInfo;
    const isProxy = registration.is_proxy;
    const currentStatus = registration.status;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Message Toast */}
            {message.text && (
                <div className="fixed top-24 right-4 z-[1000] animate-slideInRight">
                    <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${
                        message.type === 'success'
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
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
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
                            <CalendarCheck className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/staff-donation-event")}
                            className="hover:text-white transition-colors"
                        >
                            Quản lý sự kiện
                        </button>
                        <span>/</span>
                        <button
                            onClick={() => navigate(`/staff-donation-event/${id}/registrations`)}
                            className="hover:text-white transition-colors"
                        >
                            Danh sách đăng ký
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Chi tiết đăng ký</span>
                    </div>

                    <button
                        onClick={() => navigate(`/staff-donation-event/${id}/registrations`)}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại danh sách đăng ký</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            <CalendarCheck className="w-8 h-8" />
                            Chi tiết đăng ký
                        </h1>
                        <p className="text-red-100 text-lg">
                            {event?.title || 'Sự kiện hiến máu'}
                        </p>
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
                                        {event?.title || 'Sự kiện hiến máu'}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-4 mb-4 flex-wrap">
                                        <StatusBadge status={registration.status} />
                                        {isProxy && (
                                            <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                                                <UserPlus className="w-4 h-4" />
                                                Đăng ký hộ
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        {medicalCheckup && (
                                            <button
                                                onClick={() => navigate(`/staff-donation-event/${id}/registrations/${registration_id}/medical-checkup`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium"
                                            >
                                                <Stethoscope className="w-4 h-4" />
                                                Xem kết quả khám
                                            </button>
                                        )}
                                        {!medicalCheckup && canCreateMedicalCheckup() && (
                                            <button
                                                onClick={() => setShowCreateMedicalDialog(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium"
                                            >
                                                <NotebookPen className="w-4 h-4" />
                                                Tạo phiếu khám
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-6 overflow-x-auto">
                                    {[
                                        { id: 'info', label: 'Thông tin đăng ký', icon: FileText },
                                        { id: 'event', label: 'Thông tin sự kiện', icon: Calendar },
                                        { id: 'organizer', label: 'Ban tổ chức', icon: Users }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-2 font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${
                                                activeTab === tab.id
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
                                                <User className="w-5 h-5 text-red-500" />
                                                Thông tin người tham gia
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={User}
                                                    label="Họ và tên"
                                                    value={`${registration.last_name || ''} ${registration.first_name || ''}`}
                                                />
                                                <InfoCard
                                                    icon={Calendar}
                                                    label="Ngày sinh"
                                                    value={formatDate(registration.birth_date)}
                                                />
                                                <InfoCard
                                                    icon={registration.gender === 0 ? Mars : Venus}
                                                    label="Giới tính"
                                                    value={getGenderLabel(registration.gender)}
                                                />
                                                <InfoCard
                                                    icon={IdCard}
                                                    label="CMND/CCCD"
                                                    value={registration.identification}
                                                />
                                                <InfoCard
                                                    icon={Phone}
                                                    label="Số điện thoại"
                                                    value={registration.phone}
                                                />
                                                <InfoCard
                                                    icon={Mail}
                                                    label="Email"
                                                    value={registration.email}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Home className="w-5 h-5 text-red-500" />
                                                Địa chỉ thường trú
                                            </h3>
                                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                <p className="text-gray-900 font-medium mb-1">
                                                    {registration.permanent_address}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {registration.sub_district}, {registration.province}
                                                </p>
                                            </div>
                                        </div>

                                        {(registration.career || registration.organization) && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Briefcase className="w-5 h-5 text-red-500" />
                                                    Công việc
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {registration.career && (
                                                        <InfoCard
                                                            icon={Briefcase}
                                                            label="Nghề nghiệp"
                                                            value={registration.career}
                                                        />
                                                    )}
                                                    {registration.organization && (
                                                        <InfoCard
                                                            icon={Building2}
                                                            label="Đơn vị công tác"
                                                            value={registration.organization}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <CalendarClock className="w-5 h-5 text-red-500" />
                                                Thông tin đăng ký
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={Clock}
                                                    label="Thời gian dự kiến đến"
                                                    value={formatDateTime(registration.expected_arrive)}
                                                />
                                                <InfoCard
                                                    icon={Calendar}
                                                    label="Ngày đăng ký"
                                                    value={formatDateTime(registration.created_at)}
                                                />
                                                <InfoCard
                                                    icon={UserPlus}
                                                    label="Hình thức đăng ký"
                                                    value={isProxy ? 'Đăng ký hộ' : 'Tự đăng ký'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'event' && event && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-red-500" />
                                                Thời gian
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={Calendar}
                                                    label="Ngày bắt đầu"
                                                    value={formatDate(event.time_start)}
                                                />
                                                <InfoCard
                                                    icon={AlarmClock}
                                                    label="Giờ bắt đầu"
                                                    value={formatTime(event.time_start)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-red-500" />
                                                Địa điểm tổ chức
                                            </h3>
                                            <OpenStreetMap
                                                location={event.location}
                                                province={event.province}
                                                subDistrict={event.sub_district}
                                            />
                                        </div>

                                        {event.description && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-red-500" />
                                                    Mô tả sự kiện
                                                </h3>
                                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                    <p className="text-gray-700 whitespace-pre-line">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'organizer' && event && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Hospital className="w-5 h-5 text-red-500" />
                                                Bệnh viện tổ chức
                                            </h3>
                                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                                                        {event.staff?.hospital?.image_url ? (
                                                            <img
                                                                src={getImageUrl(event.staff.hospital.image_url)}
                                                                alt={event.staff.hospital.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="w-8 h-8 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-1">
                                                            {event.staff?.hospital?.name || 'Đang cập nhật'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {[
                                                                event.staff?.hospital?.hospital_address,
                                                                event.staff?.hospital?.sub_district,
                                                                event.staff?.hospital?.province
                                                            ].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {event.staff && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-red-500" />
                                                    Nhân viên y tế phụ trách
                                                </h3>
                                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center overflow-hidden">
                                                                {event.staff.account?.avatar ? (
                                                                    <img
                                                                        src={getImageUrl(event.staff.account.avatar)}
                                                                        alt={`${event.staff.account.last_name} ${event.staff.account.first_name}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-6 h-6 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {`${event.staff.account?.last_name || ''} ${event.staff.account?.first_name || ''}`}
                                                                    </span>
                                                                    {event.staff.is_verified && (
                                                                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    {event.staff.degree} - {event.staff.department}
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

                                        {event.staff?.emergency_phone && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Phone className="w-5 h-5 text-red-500" />
                                                    Hotline hỗ trợ
                                                </h3>
                                                <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                                    <a
                                                        href={`tel:${event.staff.emergency_phone}`}
                                                        className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
                                                    >
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            <Phone className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-red-600/80">Gọi ngay</p>
                                                            <p className="text-lg font-bold">{event.staff.emergency_phone}</p>
                                                        </div>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-red-500" />
                                Tổng quan
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Trạng thái</span>
                                    <StatusBadge status={registration.status} />
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Loại đăng ký</span>
                                    <span className="font-semibold text-gray-900">
                                        {isProxy ? 'Đăng ký hộ' : 'Tự đăng ký'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Người tham gia</span>
                                    <span className="font-semibold text-gray-900">
                                        {`${registration.last_name || ''} ${registration.first_name || ''}`}
                                    </span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Số điện thoại</span>
                                    <span className="font-semibold text-gray-900">{registration.phone}</span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Thời gian dự kiến</span>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{formatTime(registration.expected_arrive)}</p>
                                        <p className="font-semibold text-gray-900">{formatDate(registration.expected_arrive)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between">
                                    <span className="text-gray-600">Ngày đăng ký</span>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{formatTime(registration.created_at)}</p>
                                        <p className="font-semibold text-gray-900">{formatDate(registration.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                {canUpdateStatus() && (
                                    <div className="space-y-2">
                                        <p className="text-gray-600 text-sm">Cập nhật trạng thái:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {currentStatus === 0 && (
                                                <>
                                                    <button
                                                        onClick={() => openConfirmDialog(1)}
                                                        disabled={updatingStatus}
                                                        className="py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Xác nhận
                                                    </button>
                                                    <button
                                                        onClick={() => openConfirmDialog(2)}
                                                        disabled={updatingStatus}
                                                        className="py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                            {currentStatus === 1 && (
                                                <button
                                                    onClick={() => openConfirmDialog(3)}
                                                    disabled={updatingStatus}
                                                    className="col-span-2 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:opacity-50"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                    Check-in
                                                </button>
                                            )}
                                            {currentStatus === 3 && (
                                                <button
                                                    onClick={() => openConfirmDialog(4)}
                                                    disabled={updatingStatus}
                                                    className="col-span-2 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl hover:from-emerald-700 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:opacity-50"
                                                >
                                                    <ClipboardCheck className="w-4 h-4" />
                                                    Hoàn thành
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                        Vui lòng mang theo CMND/CCCD khi tham gia sự kiện.
                                        Có mặt trước giờ dự kiến 15 phút.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Detail Dialog */}
            <StaffDetailDialog
                isOpen={isStaffDialogOpen}
                onClose={() => setIsStaffDialogOpen(false)}
                staff={event?.staff}
            />

            {/* Create Medical Checkup Dialog */}
            <CreateMedicalCheckupDialog
                isOpen={showCreateMedicalDialog}
                onClose={() => setShowCreateMedicalDialog(false)}
                onSubmit={handleCreateMedicalCheckup}
                loading={creatingMedicalCheckup}
            />

            {/* Confirm Status Dialog */}
            <ConfirmStatusDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, newStatus: null, title: '', message: '' })}
                onConfirm={() => handleUpdateStatus(confirmDialog.newStatus)}
                title={confirmDialog.title}
                message={confirmDialog.message}
                loading={updatingStatus}
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

export default StaffRegistrationDetail;