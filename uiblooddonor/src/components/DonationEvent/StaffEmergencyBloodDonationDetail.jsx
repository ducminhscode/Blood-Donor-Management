import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Droplet, Heart, Share2, ArrowLeft, Users, Award, CheckCircle, AlertCircle, XCircle, Phone, Mail, Globe, Navigation, Copy, ChevronRight, Sparkles, Target, Shield, ThumbsUp, Bookmark, Bell, CalendarDays, MapPinned, Building2, User, UserCheck, MessageCircle, Share, ExternalLink, ClipboardClock, AlarmClock, CalendarCog, BadgeCheck, X, FileText, UserCircle, IdCard, Briefcase, Home, CalendarClock, Clock3, Clock12, Ban, CheckCircle2, Timer, Hourglass, UserPlus, UserMinus, Edit, Printer, Download, Send, MessageSquare, HeartPulse, Activity, FileHeart, Award as AwardIcon, Medal, Trophy, Gift, ThumbsUp as ThumbsUpIcon, Syringe, FlaskConical, Loader2, Save, Ambulance, Hospital, AlertTriangle, Stethoscope, TrendingUp, Eye, Trash2 } from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { Helmet } from "react-helmet-async";

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

// Blood Type Badge Component
const BloodTypeBadge = ({ bloodType, rhFactor }) => {
    const getBloodTypeDisplay = () => {
        if (bloodType === undefined || rhFactor === undefined) return 'Chưa cập nhật';
        const bloodTypeMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        const rh = rhFactor ? '+' : '-';
        return `${bloodTypeMap[bloodType]}${rh}`;
    };

    const bloodTypeDisplay = getBloodTypeDisplay();

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-full border border-red-200 shadow-sm">
            <Droplet className="w-5 h-5 fill-current" />
            <span className="font-bold text-xl">{bloodTypeDisplay}</span>
        </div>
    );
};

// Donation Type Badge
const DonationTypeBadge = ({ type }) => {
    const typeConfig = {
        0: { label: 'Hiến máu toàn phần', color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700', icon: Droplet },
        1: { label: 'Hiến tiểu cầu', color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700', icon: FlaskConical },
        2: { label: 'Hiến huyết tương', color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700', icon: Activity },
        3: { label: 'Hiến bạch cầu', color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-700', icon: Syringe }
    };

    const config = typeConfig[type] || typeConfig[0];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.color} shadow-sm`}>
            <Icon className="w-4 h-4" />
            {config.label}
        </span>
    );
};

// Edit Donation Dialog
const EditDonationDialog = ({ isOpen, onClose, onSubmit, donation, loading }) => {
    const [formData, setFormData] = useState({
        blood_type: '',
        rh_factor: true,
        blood_volume: '',
        donation_type: '',
        blood_taker: '',
        donation_note: ''
    });

    useEffect(() => {
        if (donation) {
            setFormData({
                blood_type: donation.blood_type?.toString() || '',
                rh_factor: donation.rh_factor ?? true,
                blood_volume: donation.blood_volume || '',
                donation_type: donation.donation_type?.toString() || '',
                blood_taker: donation.blood_taker || '',
                donation_note: donation.donation_note || ''
            });
        }
    }, [donation]);

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
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Edit className="w-5 h-5" />
                                Chỉnh sửa kết quả hiến máu
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
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nhóm máu <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    name="blood_type"
                                    value={formData.blood_type}
                                    onChange={handleChange}
                                    required
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                >
                                    <option value="">Chọn nhóm máu</option>
                                    <option value="0">O</option>
                                    <option value="1">A</option>
                                    <option value="2">B</option>
                                    <option value="3">AB</option>
                                </select>
                                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
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

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thể tích máu hiến (ml) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="blood_volume"
                                value={formData.blood_volume}
                                onChange={handleChange}
                                required
                                min="0"
                                placeholder="VD: 350"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Loại hiến máu <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="donation_type"
                                value={formData.donation_type}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            >
                                <option value="">Chọn loại hiến máu</option>
                                <option value="0">Máu toàn phần</option>
                                <option value="1">Tiểu cầu</option>
                                <option value="2">Huyết tương</option>
                                <option value="3">Bạch cầu</option>
                            </select>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Người lấy máu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="blood_taker"
                                value={formData.blood_taker}
                                onChange={handleChange}
                                required
                                placeholder="Nhập tên người lấy máu"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                name="donation_note"
                                value={formData.donation_note}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Nhập ghi chú (nếu có)..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Lưu thay đổi</span>
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

// Confirm Delete Dialog
const ConfirmDeleteDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
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
                                    <p className="text-sm text-yellow-800 font-semibold mb-1">{message}</p>
                                    <p className="text-xs text-yellow-700">Hành động này không thể hoàn tác.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        <span>Xác nhận xóa</span>
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

const StaffEmergencyBloodDonationDetail = () => {
    const { id, response_id, medical_check_up_id } = useParams();
    const navigate = useNavigate();

    const [donation, setDonation] = useState(null);
    const [responseStatus, setResponseStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
        isOpen: false,
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchBloodDonation();
        fetchResponseStatus();
    }, [id, response_id, medical_check_up_id]);

    const fetchBloodDonation = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.emergency_blood_donation
                .replace('${id}', id)
                .replace('${response_id}', response_id)
                .replace('${medical_check_up_id}', medical_check_up_id);
            const response = await authApis().get(url);
            setDonation(response.data);
        } catch (err) {
            console.error("Error fetching blood donation:", err);
            if (err.response?.status === 404) {
                setError("Không tìm thấy thông tin hiến máu.");
            } else {
                setError("Không thể tải thông tin hiến máu. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchResponseStatus = async () => {
        try {
            const url = endpoints['staff_responses_request_detail']
                .replace('${id}', id)
                .replace('${response_id}', response_id);
            const response = await authApis().get(url);
            setResponseStatus(response.data.status_registration);
        } catch (err) {
            console.error("Error fetching response status:", err);
        }
    };

    const handleUpdateDonation = async (formData) => {
        setUpdating(true);
        try {
            const url = endpoints.emergency_blood_donation
                .replace('${id}', id)
                .replace('${response_id}', response_id)
                .replace('${medical_check_up_id}', medical_check_up_id);

            await authApis().patch(url, formData);
            showMessage('Cập nhật kết quả hiến máu thành công!', 'success');
            setShowEditDialog(false);
            await fetchBloodDonation();
        } catch (err) {
            console.error("Error updating blood donation:", err);
            showMessage(err.response?.data?.error || 'Cập nhật thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteDonation = async () => {
        setDeleting(true);
        try {
            const url = endpoints.emergency_blood_donation
                .replace('${id}', id)
                .replace('${response_id}', response_id)
                .replace('${medical_check_up_id}', medical_check_up_id);

            await authApis().delete(url);
            showMessage('Xóa kết quả hiến máu thành công!', 'success');
            setConfirmDeleteDialog({ isOpen: false, title: '', message: '' });

            setTimeout(() => {
                navigate(`/staff-emergency-request/${id}/responses/${response_id}/medical-checkup`);
            }, 1500);
        } catch (err) {
            console.error("Error deleting blood donation:", err);
            showMessage(err.response?.data?.error || 'Xóa thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const getBloodTypeDisplay = () => {
        if (!donation) return 'Chưa cập nhật';
        const bloodTypeMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        const rh = donation.rh_factor ? '+' : '-';
        return `${bloodTypeMap[donation.blood_type]}${rh}`;
    };

    const getDonationTypeText = () => {
        const types = ['Hiến máu toàn phần', 'Hiến tiểu cầu', 'Hiến huyết tương', 'Hiến bạch cầu'];
        return types[donation?.donation_type] || 'Không xác định';
    };

    const canEditOrDelete = () => {
        return responseStatus !== undefined && responseStatus !== 4;
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
                                    <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                                        ))}
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

    if (error || !donation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy thông tin hiến máu'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Thông tin hiến máu bạn đang tìm không tồn tại'}
                        </p>
                        <button
                            onClick={() => navigate(`/staff-emergency-request/${id}/responses/${response_id}/medical-checkup`)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại kết quả khám
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const staff = donation.staff;
    const isCompleted = responseStatus === 4;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Kết quả hiến máu | Dòng Máu Lạc Hồng</title>
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
                            <HeartPulse className="w-6 h-6 text-white opacity-20" />
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
                        <button
                            onClick={() => navigate(`/staff-emergency-request/${id}/responses/${response_id}`)}
                            className="hover:text-white transition-colors"
                        >
                            Chi tiết phản hồi
                        </button>
                        <span>/</span>
                        <button
                            onClick={() => navigate(`/staff-emergency-request/${id}/responses/${response_id}/medical-checkup`)}
                            className="hover:text-white transition-colors"
                        >
                            Kết quả khám
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">Kết quả hiến máu</span>
                    </div>

                    <button
                        onClick={() => navigate(`/staff-emergency-request/${id}/responses/${response_id}/medical-checkup`)}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại kết quả khám</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            <HeartPulse className="w-8 h-8" />
                            Kết quả hiến máu
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <BloodTypeBadge
                                            bloodType={donation.blood_type}
                                            rhFactor={donation.rh_factor}
                                        />
                                        <DonationTypeBadge type={donation.donation_type} />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {canEditOrDelete() && !isCompleted && (
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setShowEditDialog(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Chỉnh sửa
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteDialog({
                                            isOpen: true,
                                            title: 'Xóa kết quả hiến máu',
                                            message: 'Bạn có chắc chắn muốn xóa kết quả hiến máu này?'
                                        })}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Donation Info */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-red-500" />
                                Thông tin hiến máu
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <InfoCard
                                    icon={Droplet}
                                    label="Nhóm máu"
                                    value={getBloodTypeDisplay()}
                                />
                                <InfoCard
                                    icon={Activity}
                                    label="Loại hiến"
                                    value={getDonationTypeText()}
                                />
                                <InfoCard
                                    icon={Droplet}
                                    label="Thể tích máu"
                                    value={`${donation.blood_volume} ml`}
                                />
                                <InfoCard
                                    icon={User}
                                    label="Người lấy máu"
                                    value={donation.blood_taker || 'Chưa cập nhật'}
                                />
                                <InfoCard
                                    icon={CalendarClock}
                                    label="Thời gian hiến"
                                    value={formatDateTime(donation.created_at) || 'Chưa cập nhật'}
                                />
                                {donation.updated_at && donation.updated_at !== donation.created_at && (
                                    <InfoCard
                                        icon={Edit}
                                        label="Cập nhật lần cuối"
                                        value={formatDateTime(donation.updated_at)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Donation Note */}
                        {donation.donation_note && (
                            <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <MessageSquare className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-900 mb-2">Ghi chú</p>
                                        <p className="text-sm text-red-800 italic">"{donation.donation_note}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thank You Message */}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 text-center border border-red-100 shadow-sm">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4 shadow-md">
                                <HeartPulse className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-red-700 mb-2">
                                Cảm ơn bạn đã hiến máu!
                            </h3>
                            <p className="text-red-600">
                                Mỗi giọt máu cho đi là một cuộc đời ở lại. Hành động của bạn thật đáng trân trọng!
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileHeart className="w-5 h-5 text-red-500" />
                                Thông tin hiến
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Nhóm máu</span>
                                    <span className="font-bold text-red-600">{getBloodTypeDisplay()}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Thể tích</span>
                                    <span className="font-semibold text-gray-900">{donation.blood_volume} ml</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Loại hiến</span>
                                    <DonationTypeBadge type={donation.donation_type} />
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Người lấy máu</span>
                                    <span className="font-semibold text-gray-900">{donation.blood_taker || 'Chưa cập nhật'}</span>
                                </div>

                                <div className="flex items-start justify-between">
                                    <span className="text-gray-600">Thời gian</span>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatDate(donation.created_at)}</p>
                                        <p className="text-sm text-gray-500">{formatTime(donation.created_at)}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-gray-600">Trạng thái phản hồi</span>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${isCompleted
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                                        : 'bg-gradient-to-r from-blue-100 to-blue-100 text-blue-700'
                                        }`}>
                                        {isCompleted ? 'Đã hoàn thành' : 'Đang tiến hành'}
                                    </span>
                                </div>
                            </div>

                            {/* Staff Info */}
                            {staff && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-red-500" />
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
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Health Tips */}
                            <div className="mt-6 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                <div className="flex items-start gap-2">
                                    <HeartPulse className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-green-700">
                                        <p className="font-semibold mb-1">Lưu ý sau hiến máu:</p>
                                        <ul className="space-y-1 list-disc list-inside">
                                            <li>Uống nhiều nước trong 24 giờ sau hiến</li>
                                            <li>Tránh vận động mạnh trong 24 giờ</li>
                                            <li>Ăn uống đủ chất, bổ sung sắt</li>
                                            <li>Nghỉ ngơi 15-20 phút trước khi ra về</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
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

            <EditDonationDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSubmit={handleUpdateDonation}
                donation={donation}
                loading={updating}
            />

            <ConfirmDeleteDialog
                isOpen={confirmDeleteDialog.isOpen}
                onClose={() => setConfirmDeleteDialog({ isOpen: false, title: '', message: '' })}
                onConfirm={handleDeleteDonation}
                title={confirmDeleteDialog.title}
                message={confirmDeleteDialog.message}
                loading={deleting}
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

export default StaffEmergencyBloodDonationDetail;