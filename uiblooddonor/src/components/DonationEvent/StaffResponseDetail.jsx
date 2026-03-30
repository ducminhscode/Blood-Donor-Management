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
const ResponseStatusBadge = ({ statusResponse, statusRegistration }) => {
    const getStatusConfig = () => {
        if (statusResponse === 1) {
            if (statusRegistration === 4) {
                return {
                    label: 'Đã hoàn thành',
                    color: 'bg-gradient-to-r from-emerald-500 to-green-500',
                    textColor: 'text-white',
                    icon: CheckCircle2,
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

const StaffResponseDetail = () => {
    const { id, response_id } = useParams();
    const navigate = useNavigate();

    const [response, setResponse] = useState(null);
    const [emergency, setEmergency] = useState(null);
    const [donor, setDonor] = useState(null);
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
        fetchResponseDetail();
    }, [id, response_id]);

    const fetchResponseDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints['staff_responses_request_detail']
                .replace('${id}', id)
                .replace('${response_id}', response_id);
            const responseData = await authApis().get(url);
            setResponse(responseData.data);
            setEmergency(responseData.data.emergency_request);
            setDonor(responseData.data.donor);

            // Try to fetch medical checkup
            try {
                const checkupUrl = endpoints.emergency_medical_checkup
                    .replace('${id}', id)
                    .replace('${response_id}', response_id);
                const checkupResponse = await authApis().get(checkupUrl);
                setMedicalCheckup(checkupResponse.data);
            } catch (err) {
                console.log("No medical checkup found");
            }
        } catch (err) {
            console.error("Error fetching response detail:", err);
            setError("Không thể tải thông tin phản hồi. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const url = endpoints['staff_responses_request_detail']
                .replace('${id}', id)
                .replace('${response_id}', response_id);

            let endpoint = url;
            if (newStatus === 3) {
                endpoint += 'checkin/';
            } else if (newStatus === 4) {
                endpoint += 'complete/';
            }

            await authApis().post(endpoint);
            await fetchResponseDetail();
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
            const url = endpoints.emergency_medical_checkup
                .replace('${id}', id)
                .replace('${response_id}', response_id);

            await authApis().post(url, formData);
            showMessage('Tạo phiếu khám sức khỏe thành công!', 'success');
            setShowCreateMedicalDialog(false);
            await fetchResponseDetail();
        } catch (err) {
            console.error("Error creating medical checkup:", err);
            showMessage('Tạo phiếu khám sức khỏe thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setCreatingMedicalCheckup(false);
        }
    };

    const openConfirmDialog = (newStatus) => {
        const statusConfig = {
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

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (bloodType === undefined || rhFactor === undefined) return 'Chưa cập nhật';
        const bloodTypeMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        return `${bloodTypeMap[bloodType]}${rhFactor === 0 ? '-' : '+'}`;
    };

    const getDonationTypeText = (type) => {
        const types = ['Máu toàn phần', 'Tiểu cầu', 'Huyết tương', 'Bạch cầu'];
        return types[type] || 'Không xác định';
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const canUpdateStatus = () => {
        if (!response) return false;
        const statusResponse = response.status_response;
        const statusRegistration = response.status_registration;
        return statusResponse === 1 && (statusRegistration === 1 || statusRegistration === 3);
    };

    const canCreateMedicalCheckup = () => {
        return response?.status_registration === 3 && !medicalCheckup;
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
                            {error || 'Thông tin phản hồi bạn đang tìm không tồn tại'}
                        </p>
                        <button
                            onClick={() => navigate(`/staff-emergency-request/${id}/responses`)}
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

    const donorAccount = donor?.account || {};
    const statusResponse = response.status_response;
    const statusRegistration = response.status_registration;

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
                            onClick={() => navigate("/staff-emergency-request")}
                            className="hover:text-white transition-colors"
                        >
                            Quản lý yêu cầu
                        </button>
                        <span>/</span>
                        <button
                            onClick={() => navigate(`/staff-emergency-request/${id}/responses`)}
                            className="hover:text-white transition-colors"
                        >
                            Danh sách phản hồi
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Chi tiết phản hồi</span>
                    </div>

                    <button
                        onClick={() => navigate(`/staff-emergency-request/${id}/responses`)}
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
                        <p className="text-red-100 text-lg">
                            {donorAccount.last_name} {donorAccount.first_name}
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
                        {/* Status Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <ResponseStatusBadge 
                                    statusResponse={statusResponse} 
                                    statusRegistration={statusRegistration}
                                />
                                {emergency?.critical && !emergency?.is_expire && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 animate-pulse">
                                        <AlertTriangle className="w-4 h-4" />
                                        Cấp cứu khẩn cấp
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {medicalCheckup && (
                                    <button
                                        onClick={() => navigate(`/staff-emergency-request/${id}/responses/${response_id}/medical-checkup`)}
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

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-6 overflow-x-auto">
                                    {[
                                        { id: 'info', label: 'Thông tin phản hồi', icon: FileText },
                                        { id: 'donor', label: 'Thông tin người hiến', icon: User },
                                        { id: 'emergency', label: 'Thông tin yêu cầu', icon: AlertTriangle }
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
                                                    value={statusResponse === 1 ? 'Đã chấp nhận' : 'Đã từ chối'}
                                                />
                                                <InfoCard
                                                    icon={ClipboardCheck}
                                                    label="Trạng thái đăng ký"
                                                    value={
                                                        statusRegistration === 4 ? 'Đã hoàn thành' :
                                                        statusRegistration === 3 ? 'Đã Check-in' :
                                                        statusRegistration === 1 ? 'Đã xác nhận' : 'Chưa xác nhận'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'donor' && donor && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <User className="w-5 h-5 text-red-500" />
                                                Thông tin cá nhân
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={User}
                                                    label="Họ và tên"
                                                    value={`${donorAccount.last_name || ''} ${donorAccount.first_name || ''}`}
                                                />
                                                <InfoCard
                                                    icon={Phone}
                                                    label="Số điện thoại"
                                                    value={donorAccount.phone || 'Chưa cập nhật'}
                                                />
                                                <InfoCard
                                                    icon={Mail}
                                                    label="Email"
                                                    value={donorAccount.email || 'Chưa cập nhật'}
                                                />
                                                <InfoCard
                                                    icon={Droplet}
                                                    label="Nhóm máu"
                                                    value={donor?.blood_type !== undefined ? getBloodTypeDisplay(donor.blood_type, donor.rh_factor) : 'Chưa cập nhật'}
                                                />
                                                <InfoCard
                                                    icon={AwardIcon}
                                                    label="Số lần hiến máu"
                                                    value={`${donor.donation_count || 0} lần`}
                                                />
                                                {donor.last_donation && (
                                                    <InfoCard
                                                        icon={Calendar}
                                                        label="Lần hiến gần nhất"
                                                        value={formatDate(donor.last_donation)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'emergency' && emergency && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Heart className="w-5 h-5 text-red-500" />
                                                Thông tin bệnh nhân
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <InfoCard
                                                    icon={User}
                                                    label="Họ và tên"
                                                    value={emergency.patient_name}
                                                />
                                                <InfoCard
                                                    icon={Phone}
                                                    label="Số điện thoại"
                                                    value={emergency.phone}
                                                />
                                                <InfoCard
                                                    icon={Syringe}
                                                    label="Nhóm máu cần"
                                                    value={getBloodTypeDisplay(emergency.blood_type, emergency.rh_factor)}
                                                />
                                                <InfoCard
                                                    icon={Droplet}
                                                    label="Lượng máu cần"
                                                    value={`${emergency.blood_volume}ml`}
                                                />
                                                <InfoCard
                                                    icon={FlaskConical}
                                                    label="Loại hiến máu"
                                                    value={getDonationTypeText(emergency.donation_type)}
                                                />
                                                <InfoCard
                                                    icon={Hospital}
                                                    label="Bệnh viện"
                                                    value={emergency.hospital?.name || 'Chưa cập nhật'}
                                                />
                                            </div>
                                        </div>

                                        {emergency.emergency_note && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-red-500" />
                                                    Ghi chú cấp cứu
                                                </h3>
                                                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                                    <p className="text-red-800 whitespace-pre-line">
                                                        {emergency.emergency_note}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {emergency.staff && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-red-500" />
                                                    Nhân viên y tế phụ trách
                                                </h3>
                                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center overflow-hidden">
                                                                {emergency.staff.account?.avatar ? (
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
                                                                        {`${emergency.staff.account?.last_name || ''} ${emergency.staff.account?.first_name || ''}`}
                                                                    </span>
                                                                    {emergency.staff.is_verified && (
                                                                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    {emergency.staff.degree} - {emergency.staff.department}
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
                                    <ResponseStatusBadge 
                                        statusResponse={statusResponse} 
                                        statusRegistration={statusRegistration}
                                    />
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Người hiến</span>
                                    <span className="font-semibold text-gray-900">
                                        {donorAccount.last_name} {donorAccount.first_name}
                                    </span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Số điện thoại</span>
                                    <span className="font-semibold text-gray-900">{donorAccount.phone || 'Chưa cập nhật'}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Nhóm máu người hiến</span>
                                    <span className="font-bold text-red-600">
                                        {donor?.blood_type !== undefined ? getBloodTypeDisplay(donor.blood_type, donor.rh_factor) : 'Chưa cập nhật'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Bệnh nhân</span>
                                    <span className="font-semibold text-gray-900">{emergency?.patient_name}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Nhóm máu cần</span>
                                    <span className="font-bold text-red-600">
                                        {emergency ? getBloodTypeDisplay(emergency.blood_type, emergency.rh_factor) : 'Chưa cập nhật'}
                                    </span>
                                </div>

                                <div className="flex items-start justify-between">
                                    <span className="text-gray-600">Ngày phản hồi</span>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{formatTime(response.created_at)}</p>
                                        <p className="font-semibold text-gray-900">{formatDate(response.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                {canUpdateStatus() && (
                                    <div className="space-y-2">
                                        <p className="text-gray-600 text-sm">Cập nhật trạng thái:</p>
                                        {statusRegistration === 1 && (
                                            <button
                                                onClick={() => openConfirmDialog(3)}
                                                disabled={updatingStatus}
                                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md disabled:opacity-50"
                                            >
                                                <UserCheck className="w-5 h-5" />
                                                Check-in
                                            </button>
                                        )}
                                        {statusRegistration === 3 && (
                                            <button
                                                onClick={() => openConfirmDialog(4)}
                                                disabled={updatingStatus}
                                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl hover:from-emerald-700 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Hoàn thành
                                            </button>
                                        )}
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
                                        Vui lòng kiểm tra kỹ thông tin trước khi cập nhật trạng thái.
                                        Hành động này không thể hoàn tác.
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
                staff={emergency?.staff}
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

export default StaffResponseDetail;