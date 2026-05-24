import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Droplet, Heart, Share2, ArrowLeft, Users, Award, CheckCircle, AlertCircle, XCircle, Phone, Mail, Globe, Navigation, Copy, ChevronRight, Sparkles, Target, Shield, ThumbsUp, Bookmark, Bell, CalendarDays, MapPinned, Building2, User, UserCheck, MessageCircle, Share, ExternalLink, ClipboardClock, AlarmClock, CalendarCog, BadgeCheck, X, FileText, UserCircle, IdCard, Briefcase, Home, CalendarClock, Clock3, Clock12, Ban, CheckCircle2, Timer, Hourglass, UserPlus, UserMinus, Edit, Printer, Download, Send, MessageSquare, Scale, Ruler, Activity, Thermometer, Droplets, AlertTriangle, Stethoscope, Syringe, Pill, Baby, HeartPulse, Brain, Bone, Wind, Shield as ShieldIcon, ThumbsDown, ThumbsUp as ThumbsUpIcon, HelpCircle, User as UserIcon, Calendar as CalendarIcon, Weight, Gauge, Heart as HeartIcon, Thermometer as ThermometerIcon, FileHeart, NotebookPen, Loader2, Hospital, Stethoscope as StethoscopeIcon, TrendingUp } from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

const VitalSignCard = ({ icon: Icon, label, value, unit, status = "normal", color = "blue", className = "" }) => {
    const getColorClasses = () => {
        const baseClasses = {
            normal: {
                blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
                red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
                purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
                orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            },
            warning: {
                blue: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
                red: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
                green: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
                purple: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
                orange: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
            },
            danger: {
                blue: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                green: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                purple: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                orange: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            }
        };
        return baseClasses[status][color];
    };

    const getTextColor = () => {
        if (status === 'danger') return 'text-red-700';
        if (status === 'warning') return 'text-yellow-700';
        return 'text-gray-700';
    };

    return (
        <div className={`medical-vital-card rounded-xl p-4 border ${getColorClasses()} hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="medical-vital-card__icon p-2 bg-white rounded-lg shadow-sm">
                    <Icon className={`medical-vital-card__icon-svg w-5 h-5 ${getTextColor()}`} />
                </div>
                <div>
                    <p className="medical-vital-card__label text-xs text-gray-500">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <p className={`medical-vital-card__value text-xl font-bold ${getTextColor()}`}>{value || '---'}</p>
                        {unit && <span className="medical-vital-card__unit text-xs text-gray-400">{unit}</span>}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200 shadow-sm">
                <span className="font-semibold">Đủ điều kiện hiến máu</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-red-100 text-red-700 rounded-full border border-red-200 shadow-sm">
            <span className="font-semibold">Không đủ điều kiện</span>
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
                                Thông tin nhân viên y tế
                            </h3>
                            <button
                                onClick={onClose}
                                className="cursor-pointer p-2 hover:bg-white/20 rounded-xl transition-colors"
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
                                <p className="text-xs text-gray-500 mb-1">
                                    Bệnh viện trực thuộc
                                </p>
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

// Boolean Status Component
const BooleanStatus = ({ label, value, trueLabel = "Có", falseLabel = "Không" }) => {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`text-sm font-semibold ${value ? 'text-red-600' : 'text-green-600'}`}>
                {value ? trueLabel : falseLabel}
            </span>
        </div>
    );
};

// Medical Note Component
const MedicalNote = ({ note, doctor }) => {
    if (!note && !doctor) return null;

    return (
        <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-2">Ghi chú khám sức khỏe</p>
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
const InfoSection = ({ title, icon: Icon, children, className = "" }) => {
    return (
        <div className={`medical-info-section bg-white rounded-2xl shadow-md p-6 border border-gray-100 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-red-500" />
                {title}
            </h3>
            {children}
        </div>
    );
};

const EventMedicalCheckUpDetail = () => {
    const { id, registration_id } = useParams();
    const navigate = useNavigate();

    const [eventInfo, setEventInfo] = useState(null);
    const [checkup, setCheckup] = useState(null);
    const [bloodDonation, setBloodDonation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const user = useContext(UserContexts);

    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);

    useEffect(() => {
        fetchEventDetail();
        fetchMedicalCheckup();
    }, [id, registration_id]);

    const fetchEventDetail = async () => {
        try {
            const url = endpoints.donation_event_detail.replace('${id}', id);
            const response = await authApis().get(url);
            setEventInfo(response.data);
        } catch (err) {
            console.error("Error fetching event detail:", err);
            setEventInfo(null);
        }
    };

    const fetchMedicalCheckup = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.donation_medical_checkup
                .replace('${id}', id)
                .replace('${registration_id}', registration_id);
            const response = await authApis().get(url);
            setCheckup(response.data);

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

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const eventTitle =
        eventInfo?.title ||
        eventInfo?.name ||
        eventInfo?.event_name ||
        'Chi tiết đăng ký';

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
                            onClick={() => navigate(`/event-registration`)}
                            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const staff = checkup.staff;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Kết quả khám sức khỏe | Dòng Máu Lạc Hồng</title>
            </Helmet>
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
                            <StethoscopeIcon className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 min-h-[22rem] flex flex-col justify-center">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/event-registration")}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            Hoạt động đã tham gia
                        </button>
                        <span>/</span>
                        <button
                            onClick={() => navigate(`/event-registration/${registration_id}`)}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            {eventTitle}
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Kết quả khám sức khỏe</span>
                    </div>

                    <button
                        onClick={() => navigate(`/event-registration/${registration_id}`)}
                        className="cursor-pointer inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            Kết quả khám sức khỏe
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
                                    <div className="flex items-center gap-3 mb-4">
                                        <EligibilityBadge isEligible={checkup.is_eligible} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-2">
                                {checkup.is_eligible && bloodDonation && (
                                    <button
                                        onClick={() => navigate(`/event/${id}/registrations/${registration_id}/medical-checkup/${checkup.id}/blood-donation`)}
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium"
                                    >
                                        <FileHeart className="w-4 h-4" />
                                        Xem kết quả hiến máu
                                    </button>
                                )}
                            </div>
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

                        <InfoSection title="Tiền sử bệnh lý" icon={StethoscopeIcon}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700 mb-3">Các yếu tố nguy cơ</h4>
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
                                    <h4 className="font-semibold text-gray-700 mb-3">Tình trạng hiện tại</h4>
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
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatDate(checkup.last_donation)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </InfoSection>

                        {/* Medical Note */}
                        {(checkup.medical_note || checkup.doctor) && (
                            <MedicalNote note={checkup.medical_note} doctor={checkup.doctor} />
                        )}
                    </div>

                    {/* Right Column - Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24 border border-gray-100">
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
                                    <span className="font-semibold text-gray-900">{checkup.doctor || 'Chưa cập nhật'}</span>
                                </div>

                                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày khám</span>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatDate(checkup.created_at)}</p>
                                        <p className="text-sm text-gray-500">{formatTime(checkup.created_at)}</p>
                                    </div>
                                </div>

                                {checkup.updated_at && checkup.updated_at !== checkup.created_at && (
                                    <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                                        <span className="text-gray-600">Cập nhật</span>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatDate(checkup.updated_at)}</p>
                                            <p className="text-sm text-gray-500">{formatTime(checkup.updated_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {bloodDonation && (
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <span className="text-gray-600">Trạng thái hiến máu</span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-semibold">
                                            Đã hiến máu
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Staff Info */}
                            {staff && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        Nhân viên y tế
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
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
                                                <span className="text-sm font-semibold text-gray-900">
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
                                            className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Health Tips */}
                            {checkup.is_eligible && (
                                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                    <div className="flex items-start gap-2">
                                        <HeartPulse className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-green-700">
                                            <p className="font-semibold mb-1">Lưu ý trước khi hiến máu:</p>
                                            <ul className="space-y-1 list-disc list-inside">
                                                <li>Ăn nhẹ trước khi hiến 2-3 giờ</li>
                                                <li>Uống nhiều nước</li>
                                                <li>Ngủ đủ giấc trước ngày hiến</li>
                                                <li>Không sử dụng chất kích thích</li>
                                            </ul>
                                        </div>
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

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div {
                    background: linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96)) !important;
                    border-color: rgba(71, 85, 105, 0.75) !important;
                    box-shadow: 0 12px 28px rgba(2, 6, 23, 0.25) !important;
                }

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div .bg-white {
                    background: rgba(15, 23, 42, 0.92) !important;
                    border: 1px solid rgba(100, 116, 139, 0.35);
                    box-shadow: none !important;
                }

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div p.text-xs {
                    color: #cbd5e1 !important;
                }

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div p.text-xl {
                    color: #f8fafc !important;
                }

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div span.text-xs {
                    color: #94a3b8 !important;
                }

                [data-theme="dark"] .grid.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 > div svg {
                    color: #f87171 !important;
                }
            `}</style>
        </div>
    );
};

export default EventMedicalCheckUpDetail;
