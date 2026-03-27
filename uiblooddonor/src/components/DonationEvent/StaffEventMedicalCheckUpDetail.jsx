import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Clock, NotebookPen, Droplet, Heart, Share2,
    ArrowLeft, Users, Award, CheckCircle, AlertCircle,
    XCircle, Phone, Mail, Globe, Navigation, Copy,
    ChevronRight, Sparkles, Target, Shield, ThumbsUp,
    Bookmark, Bell, CalendarDays, MapPinned, Building2,
    User, UserCheck, MessageCircle, Share, ExternalLink,
    ClipboardClock, AlarmClock, CalendarCog, BadgeCheck,
    X, FileText, UserCircle, IdCard, Briefcase, Home,
    CalendarClock, Clock3, Clock12, Ban, CheckCircle2,
    Timer, Hourglass, UserPlus, UserMinus, Edit,
    Printer, Download, Send, MessageSquare, Scale,
    Ruler, Activity, Thermometer, Droplets, AlertTriangle,
    Stethoscope, Syringe, Pill, Baby, HeartPulse,
    Brain, Bone, Wind, Shield as ShieldIcon,
    ThumbsDown, ThumbsUp as ThumbsUpIcon, HelpCircle,
    User as UserIcon, Calendar as CalendarIcon,
    Weight, Gauge, Heart as HeartIcon, Thermometer as ThermometerIcon,
    FileHeart, Loader2, PlusCircle, Save,
    ClipboardCheck
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import "../../styles/EventDetail.css";
import { UserContexts } from '../../configs/UserContexts';

// Vital Sign Card Component
const VitalSignCard = ({ icon: Icon, label, value, unit, status = "normal", color = "blue" }) => {
    const colors = {
        normal: {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            red: 'bg-red-50 text-red-600 border-red-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200'
        },
        warning: {
            blue: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            green: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            red: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            purple: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            orange: 'bg-yellow-50 text-yellow-600 border-yellow-200'
        },
        danger: {
            blue: 'bg-red-50 text-red-600 border-red-200',
            green: 'bg-red-50 text-red-600 border-red-200',
            red: 'bg-red-50 text-red-600 border-red-200',
            purple: 'bg-red-50 text-red-600 border-red-200',
            orange: 'bg-red-50 text-red-600 border-red-200'
        }
    };

    const bgColor = colors[status][color];

    return (
        <div className={`rounded-xl p-4 border ${bgColor}`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs opacity-80">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold">{value}</p>
                        {unit && <span className="text-xs opacity-60">{unit}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Eligibility Badge Component
const EligibilityBadge = ({ isEligible }) => {
    if (isEligible) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full border border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Đủ điều kiện</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full border border-red-200">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Không đủ điều kiện</span>
        </div>
    );
};

// Staff Detail Dialog
const StaffDetailDialog = ({ isOpen, onClose, staff }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
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
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    Bệnh viện trực thuộc
                                </h5>
                                <div className="space-y-2">
                                    <p className="font-medium text-gray-900">
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
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1 truncate">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {staff?.account?.email || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1 truncate">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {staff?.account?.phone || 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Khoa</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {staff?.department || 'Khoa'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Chuyên môn</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {staff?.degree || 'Đa khoa'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Kinh nghiệm</span>
                                    <span className="text-sm font-medium text-gray-900">
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

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, className = "" }) => {
    return (
        <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value || 'Chưa cập nhật'}</p>
                </div>
            </div>
        </div>
    );
};

// Boolean Status Component
const BooleanStatus = ({ label, value, trueLabel = "Có", falseLabel = "Không" }) => {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`text-sm font-medium ${value ? 'text-red-600' : 'text-green-600'}`}>
                {value ? trueLabel : falseLabel}
            </span>
        </div>
    );
};

// Medical Note Component
const MedicalNote = ({ note, doctor }) => {
    if (!note && !doctor) return null;

    return (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-2">Ghi chú khám sức khỏe</p>
                    <p className="text-sm text-red-800 mb-2 italic">"{note || 'Không có ghi chú'}"</p>
                    {doctor && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            Bác sĩ: {doctor}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Info Section Component
const InfoSection = ({ title, icon: Icon, children }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-red-500" />
                {title}
            </h3>
            {children}
        </div>
    );
};

// Edit Medical Checkup Dialog
const EditMedicalCheckupDialog = ({ isOpen, onClose, onSubmit, checkup, loading }) => {
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
        is_eligible: false,
        doctor: '',
        medical_note: ''
    });

    useEffect(() => {
        if (checkup) {
            setFormData({
                weight: checkup.weight || '',
                height: checkup.height || '',
                blood_pressure: checkup.blood_pressure || '',
                heart_rate: checkup.heart_rate || '',
                body_temperature: checkup.body_temperature || '',
                hemoglobin_level: checkup.hemoglobin_level || '',
                has_infectious: checkup.has_infectious || false,
                has_chronic: checkup.has_chronic || false,
                recent_surgery: checkup.recent_surgery || false,
                recent_tattoo: checkup.recent_tattoo || false,
                is_drug: checkup.is_drug || false,
                is_pregnant: checkup.is_pregnant || false,
                is_breast_feeding: checkup.is_breast_feeding || false,
                last_donation: checkup.last_donation ? checkup.last_donation.split('T')[0] : '',
                is_eligible: checkup.is_eligible || false,
                doctor: checkup.doctor || '',
                medical_note: checkup.medical_note || ''
            });
        }
    }, [checkup]);

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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Chỉnh sửa phiếu khám sức khỏe
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
                        <div>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Chỉ số cơ bản */}
                        <div>
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lần hiến gần nhất */}
                        <div>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    * Nếu chưa từng hiến máu, để trống
                                </p>
                            </div>
                        </div>

                        {/* Tiền sử bệnh lý */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-600" />
                                Tiền sử bệnh lý
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="has_infectious"
                                        checked={formData.has_infectious}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Bệnh truyền nhiễm</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="has_chronic"
                                        checked={formData.has_chronic}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Bệnh mãn tính</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="recent_surgery"
                                        checked={formData.recent_surgery}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Phẫu thuật gần đây</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="recent_tattoo"
                                        checked={formData.recent_tattoo}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Xăm hình gần đây</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_drug"
                                        checked={formData.is_drug}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Sử dụng chất kích thích</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_pregnant"
                                        checked={formData.is_pregnant}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Đang mang thai</span>
                                </label>
                                <label className="flex items-center gap-2">
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
                        <div>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value={true}>Đủ điều kiện hiến máu</option>
                                    <option value={false}>Không đủ điều kiện hiến máu</option>
                                </select>
                            </div>
                        </div>

                        {/* Ghi chú y tế */}
                        <div>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Lưu thay đổi</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50"
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

// Create Blood Donation Dialog
const CreateBloodDonationDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        blood_type: '',
        rh_factor: true,
        blood_volume: '',
        donation_type: '',
        blood_taker: '',
        donation_note: ''
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

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Tạo kết quả hiến máu
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
                        {/* Nhóm máu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nhóm máu <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    name="blood_type"
                                    value={formData.blood_type}
                                    onChange={handleChange}
                                    required
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">Chọn nhóm máu</option>
                                    <option value="0">O</option>
                                    <option value="1">A</option>
                                    <option value="2">B</option>
                                    <option value="3">AB</option>
                                </select>
                                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                                    <input
                                        type="checkbox"
                                        name="rh_factor"
                                        checked={formData.rh_factor}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Rh(+)</span>
                                </label>
                            </div>
                        </div>

                        {/* Thể tích máu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thể tích máu hiến (ml) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="blood_volume"
                                value={formData.blood_volume}
                                onChange={handleChange}
                                required
                                min="0"
                                step="50"
                                placeholder="VD: 350"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        {/* Loại hiến máu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại hiến máu <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="donation_type"
                                value={formData.donation_type}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="">Chọn loại hiến máu</option>
                                <option value="0">Máu toàn phần</option>
                                <option value="1">Tiểu cầu</option>
                                <option value="2">Huyết tương</option>
                                <option value="3">Bạch cầu</option>
                            </select>
                        </div>

                        {/* Người lấy máu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Người lấy máu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="blood_taker"
                                value={formData.blood_taker}
                                onChange={handleChange}
                                required
                                placeholder="Nhập tên người lấy máu"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                name="donation_note"
                                value={formData.donation_note}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Nhập ghi chú (nếu có)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Tạo kết quả hiến máu</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50"
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

// Confirm Delete Dialog
const ConfirmDeleteDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {title}
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
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-700 font-medium mb-1">{message}</p>
                                    <p className="text-xs text-yellow-600">Hành động này không thể hoàn tác.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <span>Xác nhận xóa</span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50"
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

const StaffEventMedicalCheckUpDetail = () => {
    const { id, registration_id } = useParams();
    const navigate = useNavigate();

    const [checkup, setCheckup] = useState(null);
    const [bloodDonation, setBloodDonation] = useState(null);
    const [registrationStatus, setRegistrationStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [creatingBloodDonation, setCreatingBloodDonation] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showCreateBloodDonationDialog, setShowCreateBloodDonationDialog] = useState(false);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
        isOpen: false,
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchMedicalCheckup();
        fetchRegistrationStatus();
    }, [id, registration_id]);

    const fetchMedicalCheckup = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.donation_medical_checkup
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            const response = await authApis().get(url);
            setCheckup(response.data);

            // Kiểm tra xem đã có blood donation chưa
            await fetchBloodDonation(response.data.id);
        } catch (err) {
            console.error("Error fetching medical checkup:", err);
            if (err.response?.status === 404) {
                setError("Không tìm thấy thông tin khám sức khỏe.");
            } else {
                setError("Không thể tải thông tin khám sức khỏe. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrationStatus = async () => {
        try {
            const url = endpoints['staff_registrations_event_detail']
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            const response = await authApis().get(url);
            setRegistrationStatus(response.data.status);
        } catch (err) {
            console.error("Error fetching registration status:", err);
        }
    };

    const fetchBloodDonation = async (medicalCheckUpId) => {
        try {
            const url = endpoints.donation_blood_donation
                .replace('${id}', id)
                .replace('${registration_id}', registration_id)
                .replace('${medical_check_up_id}', medicalCheckUpId);
            const response = await authApis().get(url);
            setBloodDonation(response.data);
        } catch (err) {
            console.log("No blood donation found");
            setBloodDonation(null);
        }
    };

    const handleUpdateMedicalCheckup = async (formData) => {
        setUpdating(true);
        try {
            const url = endpoints.donation_medical_checkup
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            
            await authApis().patch(url, formData);
            showMessage('Cập nhật phiếu khám sức khỏe thành công!', 'success');
            setShowEditDialog(false);
            await fetchMedicalCheckup();
        } catch (err) {
            console.error("Error updating medical checkup:", err);
            showMessage(err.response?.data?.error || 'Cập nhật thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteMedicalCheckup = async () => {
        setDeleting(true);
        try {
            const url = endpoints.donation_medical_checkup
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            
            await authApis().delete(url);
            showMessage('Xóa phiếu khám sức khỏe thành công!', 'success');
            setConfirmDeleteDialog({ isOpen: false, title: '', message: '' });
            
            // Quay lại trang chi tiết đăng ký
            setTimeout(() => {
                navigate(`/staff-donation-event/${id}/registrations/${registration_id}`);
            }, 1500);
        } catch (err) {
            console.error("Error deleting medical checkup:", err);
            showMessage(err.response?.data?.error || 'Xóa thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateBloodDonation = async (formData) => {
        setCreatingBloodDonation(true);
        try {
            const url = endpoints.donation_blood_donation
                .replace('${id}', id)
                .replace('${registration_id}', registration_id)
                .replace('${medical_check_up_id}', checkup.id);

            await authApis().post(url, formData);
            showMessage('Tạo kết quả hiến máu thành công!', 'success');
            setShowCreateBloodDonationDialog(false);
            await fetchBloodDonation(checkup.id);
        } catch (err) {
            console.error("Error creating blood donation:", err);
            showMessage(err.response?.data?.error || 'Tạo kết quả hiến máu thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setCreatingBloodDonation(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const canEditOrDelete = () => {
        // Chỉ cho phép chỉnh sửa/xóa nếu chưa hoàn thành (status !== 4)
        return registrationStatus !== undefined && registrationStatus !== 4;
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
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                                        ))}
                                    </div>
                                    <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                                    <div className="h-32 bg-gray-200 rounded-xl"></div>
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

    if (error || !checkup) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy thông tin khám sức khỏe'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Thông tin khám sức khỏe bạn đang tìm không tồn tại'}
                        </p>
                        <button
                            onClick={() => navigate(`/staff-donation-event/${id}/registrations/${registration_id}`)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/25"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại danh sách đăng ký
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const staff = checkup.staff;
    const isCompleted = registrationStatus === 4;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Message Toast */}
            {message.text && (
                <div className="fixed top-24 right-4 z-[1000] animate-slideIn">
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

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
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
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <span>Quản lý sự kiện</span>
                        <span>/</span>
                        <span>Danh sách đăng ký</span>
                        <span>/</span>
                        <span>Chi tiết đăng ký</span>
                        <span>/</span>
                        <span className="text-white">Kết quả khám sức khỏe</span>
                    </nav>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(`/staff-donation-event/${id}/registrations/${registration_id}`)}
                            className="flex p-1 relative z-20 items-center mb-6 hover:bg-white/20 hover:text-white rounded-xl transition-all backdrop-blur-sm group"
                        >
                            <div className="rotate-180 p-2 group-hover:-translate-x-1 transition-transform">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                            <span className='mr-1'>Chi tiết đăng ký</span>
                        </button>
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
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                        Kết quả khám sức khỏe
                                    </h1>
                                    <div className="flex items-center gap-3 mb-2">
                                        <EligibilityBadge isEligible={checkup.is_eligible} />
                                        {isCompleted && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Sự kiện đã hoàn thành
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isCompleted && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Sự kiện đã hoàn thành, không thể chỉnh sửa hoặc xóa phiếu khám sức khỏe.
                                    </p>
                                </div>
                            )}

                            {/* Blood Donation Action Buttons */}
                            <div className="flex flex-wrap gap-3 mt-2">
                                {checkup.is_eligible && (
                                    <>
                                        {bloodDonation ? (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/staff-donation-event/${id}/registrations/${registration_id}/medical-checkup/${checkup.id}/blood-donation`)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    <FileHeart className="w-4 h-4" />
                                                    <span>Xem kết quả hiến máu</span>
                                                </button>
                                            </>
                                        ) : (
                                            canEditOrDelete() && !isCompleted && (
                                                <button
                                                    onClick={() => setShowCreateBloodDonationDialog(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    <NotebookPen className="w-4 h-4" />
                                                    <span>Tạo kết quả hiến máu</span>
                                                </button>
                                            )
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {canEditOrDelete() && !isCompleted && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <button
                                        onClick={() => setShowEditDialog(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Chỉnh sửa</span>
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteDialog({
                                            isOpen: true,
                                            title: 'Xóa phiếu khám sức khỏe',
                                            message: 'Bạn có chắc chắn muốn xóa phiếu khám sức khỏe này?'
                                        })}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Vital Signs */}
                        <InfoSection title="Chỉ số sức khỏe" icon={Activity}>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <VitalSignCard
                                    icon={Weight}
                                    label="Cân nặng"
                                    value={checkup.weight}
                                    unit="kg"
                                    color="red"
                                />
                                <VitalSignCard
                                    icon={Ruler}
                                    label="Chiều cao"
                                    value={checkup.height}
                                    unit="cm"
                                    color="red"
                                />
                                <VitalSignCard
                                    icon={Gauge}
                                    label="Huyết áp"
                                    value={checkup.blood_pressure}
                                    unit="mmHg"
                                    color="red"
                                />
                                <VitalSignCard
                                    icon={HeartIcon}
                                    label="Nhịp tim"
                                    value={checkup.heart_rate}
                                    unit="bpm"
                                    color="red"
                                />
                                <VitalSignCard
                                    icon={ThermometerIcon}
                                    label="Nhiệt độ"
                                    value={checkup.body_temperature}
                                    unit="°C"
                                    color="red"
                                />
                                <VitalSignCard
                                    icon={Droplets}
                                    label="Hemoglobin"
                                    value={checkup.hemoglobin_level}
                                    unit="g/L"
                                    color="red"
                                />
                            </div>
                        </InfoSection>

                        <InfoSection title="Tiền sử bệnh lý" icon={Stethoscope}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-gray-700 mb-3">Các yếu tố nguy cơ</h4>
                                    <BooleanStatus
                                        label="Bệnh truyền nhiễm"
                                        value={checkup.has_infectious}
                                    />
                                    <BooleanStatus
                                        label="Bệnh mãn tính"
                                        value={checkup.has_chronic}
                                    />
                                    <BooleanStatus
                                        label="Phẫu thuật gần đây"
                                        value={checkup.recent_surgery}
                                    />
                                    <BooleanStatus
                                        label="Xăm hình gần đây"
                                        value={checkup.recent_tattoo}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-gray-700 mb-3">Tình trạng hiện tại</h4>
                                    <BooleanStatus
                                        label="Sử dụng chất kích thích"
                                        value={checkup.is_drug}
                                    />
                                    <BooleanStatus
                                        label="Đang mang thai"
                                        value={checkup.is_pregnant}
                                    />
                                    <BooleanStatus
                                        label="Đang cho con bú"
                                        value={checkup.is_breast_feeding}
                                    />
                                    {checkup.last_donation && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-600">Lần hiến gần nhất</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatDate(checkup.last_donation)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </InfoSection>

                        {/* Medical Note */}
                        {checkup.medical_note && (
                            <MedicalNote note={checkup.medical_note} doctor={checkup.doctor} />
                        )}
                    </div>

                    {/* Right Column - Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-red-500" />
                                Thông tin khám
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Kết luận</span>
                                    <EligibilityBadge isEligible={checkup.is_eligible} />
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Bác sĩ khám</span>
                                    <span className="font-medium text-gray-900">{checkup.doctor || 'Chưa cập nhật'}</span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày khám</span>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{formatDate(checkup.created_at)}</p>
                                        <p className="text-sm text-gray-500">{formatTime(checkup.created_at)}</p>
                                    </div>
                                </div>

                                {checkup.updated_at && checkup.updated_at !== checkup.created_at && (
                                    <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                        <span className="text-gray-600">Cập nhật</span>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{formatDate(checkup.updated_at)}</p>
                                            <p className="text-sm text-gray-500">{formatTime(checkup.updated_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {bloodDonation && (
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <span className="text-gray-600">Trạng thái hiến máu</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Đã hiến máu
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-gray-600">Trạng thái đăng ký</span>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {isCompleted ? 'Đã hoàn thành' : 'Đang tiến hành'}
                                    </span>
                                </div>
                            </div>

                            {/* Staff Info */}
                            {staff && (
                                <div className="mt-6 pt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        Nhân viên y tế
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {staff?.account?.avatar ? (
                                                <img
                                                    src={getImageUrl(staff.account.avatar)}
                                                    alt={`${staff.account.last_name} ${staff.account.first_name}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-5 h-5 text-red-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {`${staff?.account?.last_name || ''} ${staff?.account?.first_name || ''}`}
                                                </span>
                                                {staff?.is_verified && (
                                                    <BadgeCheck className="w-3 h-3 text-blue-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {staff?.degree} - {staff?.department}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsStaffDialogOpen(true)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <StaffDetailDialog
                isOpen={isStaffDialogOpen}
                onClose={() => setIsStaffDialogOpen(false)}
                staff={staff}
            />

            <EditMedicalCheckupDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSubmit={handleUpdateMedicalCheckup}
                checkup={checkup}
                loading={updating}
            />

            <CreateBloodDonationDialog
                isOpen={showCreateBloodDonationDialog}
                onClose={() => setShowCreateBloodDonationDialog(false)}
                onSubmit={handleCreateBloodDonation}
                loading={creatingBloodDonation}
            />

            <ConfirmDeleteDialog
                isOpen={confirmDeleteDialog.isOpen}
                onClose={() => setConfirmDeleteDialog({ isOpen: false, title: '', message: '' })}
                onConfirm={handleDeleteMedicalCheckup}
                title={confirmDeleteDialog.title}
                message={confirmDeleteDialog.message}
                loading={deleting}
            />
        </div>
    );
};

export default StaffEventMedicalCheckUpDetail;