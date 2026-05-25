import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPulse, CheckCircle, XCircle, Clock as ClockIcon, UserCheck, UserX, Loader2, CalendarCheck, User, Mail, Phone, IdCard, Briefcase, Building, Calendar as CalendarIcon, UserPlus, Eye, ChevronLeft, RefreshCw, Info, FileText, NotepadText, InfoIcon, VenusAndMars, Edit, Trash2, Save, Upload, Image as ImageIcon, Ambulance, Hospital, Syringe, AlertOctagon, HeartHandshake, Timer, CheckCircle2, AlertTriangle, ExternalLink, Send, Grid, List, Filter as FilterIcon, TrendingUp, Stethoscope, BadgeCheck, Shield, HandHeart, ChevronDown } from 'lucide-react';
import { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import { Helmet } from "react-helmet-async";

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
                                {title}
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
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
                                className="cursor-pointer flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Xác nhận xóa</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="cursor-pointer flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
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

// Update Emergency Dialog
const UpdateEmergencyDialog = ({ isOpen, onClose, onSuccess, emergency }) => {
    const [formData, setFormData] = useState({
        blood_type: '',
        rh_factor: true,
        donation_type: '',
        patient_name: '',
        phone: '',
        blood_volume: '',
        critical: true,
        is_expire: false,
        emergency_note: '',
        hospital: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState('');
    const [staffHospitalId, setStaffHospitalId] = useState(null);
    const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
    const [showDonationTypeDropdown, setShowDonationTypeDropdown] = useState(false);
    const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);

    useEffect(() => {
        fetchHospitals();
    }, []);

    useEffect(() => {
        if (isOpen && emergency) {
            setFormData({
                blood_type: emergency.blood_type?.toString() || '',
                rh_factor: emergency.rh_factor ?? true,
                donation_type: emergency.donation_type?.toString() || '',
                patient_name: emergency.patient_name || '',
                phone: emergency.phone || '',
                blood_volume: emergency.blood_volume || '',
                critical: emergency.critical ?? true,
                is_expire: emergency.is_expire ?? false,
                emergency_note: emergency.emergency_note || '',
                hospital: emergency.hospital?.id || null
            });
            setSelectedHospital(emergency.hospital?.id?.toString() || '');
            setError('');
            setShowBloodTypeDropdown(false);
            setShowDonationTypeDropdown(false);
            setShowHospitalDropdown(false);
        }
    }, [isOpen, emergency]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showBloodTypeDropdown && !event.target.closest('.blood-type-dropdown')) {
                setShowBloodTypeDropdown(false);
            }
            if (showDonationTypeDropdown && !event.target.closest('.donation-type-dropdown')) {
                setShowDonationTypeDropdown(false);
            }
            if (showHospitalDropdown && !event.target.closest('.hospital-dropdown')) {
                setShowHospitalDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showBloodTypeDropdown, showDonationTypeDropdown, showHospitalDropdown]);

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const staffResponse = await authApis().get(endpoints["staff_me"]);
            const staffHospitalIdValue = staffResponse.data?.hospital?.id ?? null;
            setStaffHospitalId(staffHospitalIdValue);

            if (!staffHospitalIdValue) {
                setHospitals([]);
                setSelectedHospital('');
                setFormData(prev => ({ ...prev, hospital: null }));
                return;
            }

            const response = await authApis().get(endpoints.hospital);
            const allHospitals = response.data.results || response.data;
            const visibleHospitals = allHospitals.filter(hospital => hospital.id === staffHospitalIdValue);

            setHospitals(visibleHospitals);
            setSelectedHospital(staffHospitalIdValue.toString());
            setFormData(prev => ({ ...prev, hospital: staffHospitalIdValue }));
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        } finally {
            setLoadingHospitals(false);
        }
    };

    const handleHospitalSelect = (hospitalId) => {
        if (!staffHospitalId) return;

        if (!hospitalId) {
            setSelectedHospital(staffHospitalId.toString());
            setFormData(prev => ({ ...prev, hospital: staffHospitalId }));
            setShowHospitalDropdown(false);
            return;
        }

        setSelectedHospital(staffHospitalId.toString());
        setFormData(prev => ({ ...prev, hospital: staffHospitalId }));
        setShowHospitalDropdown(false);
    };

    const getHospitalLabel = () => {
        if (!selectedHospital) return 'Chọn bệnh viện';
        const hospital = hospitals.find(h => h.id === parseInt(selectedHospital));
        return hospital?.name || 'Chọn bệnh viện';
    };

    const handleBloodTypeSelect = (bloodType) => {
        setFormData(prev => ({ ...prev, blood_type: bloodType }));
        setShowBloodTypeDropdown(false);
    };

    const handleDonationTypeSelect = (donationType) => {
        setFormData(prev => ({ ...prev, donation_type: donationType }));
        setShowDonationTypeDropdown(false);
    };

    const getBloodTypeLabel = (bloodType) => {
        if (bloodType === '') return 'Chọn nhóm máu';
        const labels = { '0': 'O', '1': 'A', '2': 'B', '3': 'AB' };
        return labels[bloodType] || 'Chọn nhóm máu';
    };

    const getDonationTypeLabel = (donationType) => {
        if (donationType === '') return 'Chọn loại hiến máu';
        const labels = {
            '0': 'Máu toàn phần',
            '1': 'Tiểu cầu',
            '2': 'Huyết tương',
            '3': 'Bạch cầu'
        };
        return labels[donationType] || 'Chọn loại hiến máu';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patient_name.trim()) {
            setError('Vui lòng nhập tên bệnh nhân');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Vui lòng nhập số điện thoại');
            return;
        }
        if (formData.blood_type === '') {
            setError('Vui lòng chọn nhóm máu');
            return;
        }
        if (formData.donation_type === '') {
            setError('Vui lòng chọn loại hiến máu');
            return;
        }
        if (!formData.blood_volume || formData.blood_volume <= 0) {
            setError('Vui lòng nhập thể tích máu cần');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const submitData = {
                blood_type: parseInt(formData.blood_type),
                rh_factor: formData.rh_factor,
                donation_type: parseInt(formData.donation_type),
                patient_name: formData.patient_name,
                phone: formData.phone,
                blood_volume: parseInt(formData.blood_volume),
                critical: formData.critical,
                is_expire: formData.is_expire,
                emergency_note: formData.emergency_note || '',
                hospital_id: formData.hospital
            };

            const url = endpoints.emergency_request_detail.replace('${id}', emergency.id);
            const response = await authApis().put(url, submitData);

            if (response.status === 200) {
                onSuccess(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Error updating emergency request:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages[0] || 'Có lỗi xảy ra, vui lòng thử lại');
            } else {
                setError('Không thể cập nhật yêu cầu. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Chỉnh sửa yêu cầu hiến máu
                            </h3>
                            <button
                                onClick={onClose}
                                className="cursor-pointer p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tên bệnh nhân <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.patient_name}
                                        onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                                        placeholder="Nhập tên bệnh nhân"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        maxLength={10}
                                        placeholder="Nhập số điện thoại liên hệ"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="blood-type-dropdown relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nhóm máu <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowBloodTypeDropdown(!showBloodTypeDropdown)}
                                        className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300"
                                    >
                                        <span className={formData.blood_type !== '' ? "text-gray-900" : "text-gray-400"}>
                                            {getBloodTypeLabel(formData.blood_type)}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showBloodTypeDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showBloodTypeDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                            <button
                                                type="button"
                                                onClick={() => handleBloodTypeSelect('')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.blood_type === '' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Chọn nhóm máu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBloodTypeSelect('0')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.blood_type === '0' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                O
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBloodTypeSelect('1')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.blood_type === '1' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                A
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBloodTypeSelect('2')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.blood_type === '2' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                B
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBloodTypeSelect('3')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.blood_type === '3' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                AB
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Yếu tố Rh
                                    </label>
                                    <label className="flex items-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={formData.rh_factor}
                                            onChange={(e) => setFormData({ ...formData, rh_factor: e.target.checked })}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">Rh(+)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="donation-type-dropdown relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Loại hiến máu <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowDonationTypeDropdown(!showDonationTypeDropdown)}
                                        className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300"
                                    >
                                        <span className={formData.donation_type !== '' ? "text-gray-900" : "text-gray-400"}>
                                            {getDonationTypeLabel(formData.donation_type)}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDonationTypeDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDonationTypeDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                            <button
                                                type="button"
                                                onClick={() => handleDonationTypeSelect('')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.donation_type === '' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Chọn loại hiến máu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDonationTypeSelect('0')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.donation_type === '0' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Máu toàn phần
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDonationTypeSelect('1')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.donation_type === '1' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Tiểu cầu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDonationTypeSelect('2')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.donation_type === '2' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Huyết tương
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDonationTypeSelect('3')}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${formData.donation_type === '3' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Bạch cầu
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Thể tích máu cần (ml) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.blood_volume}
                                        onChange={(e) => setFormData({ ...formData, blood_volume: e.target.value })}
                                        placeholder="VD: 350"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bệnh viện tiếp nhận
                            </label>
                            <div className="hospital-dropdown relative">
                                <button
                                    type="button"
                                    onClick={() => !loadingHospitals && hospitals.length > 1 && setShowHospitalDropdown(!showHospitalDropdown)}
                                    disabled={loadingHospitals}
                                    className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <span className={selectedHospital ? "text-gray-900" : "text-gray-400"}>
                                        {getHospitalLabel()}
                                    </span>
                                    {loadingHospitals ? (
                                        <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                    ) : hospitals.length <= 1 ? (
                                        <Hospital className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showHospitalDropdown ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {showHospitalDropdown && hospitals.length > 1 && (
                                    <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                        <button
                                            type="button"
                                            onClick={() => handleHospitalSelect('')}
                                            className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedHospital ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Chọn bệnh viện
                                        </button>
                                        {loadingHospitals ? (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                            </div>
                                        ) : (
                                            hospitals.map(hospital => (
                                                <button
                                                    key={hospital.id}
                                                    type="button"
                                                    onClick={() => handleHospitalSelect(hospital.id.toString())}
                                                    className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedHospital === hospital.id.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    {hospital.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mức độ khẩn cấp
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.critical === true}
                                        onChange={() => setFormData({ ...formData, critical: true })}
                                        className="rounded-full border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Khẩn cấp</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.critical === false}
                                        onChange={() => setFormData({ ...formData, critical: false })}
                                        className="rounded-full border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">Bình thường</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                value={formData.emergency_note}
                                onChange={(e) => setFormData({ ...formData, emergency_note: e.target.value })}
                                placeholder="Nhập thông tin bổ sung (nếu có)..."
                                rows="3"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_expire}
                                    onChange={(e) => setFormData({ ...formData, is_expire: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">
                                    Đánh dấu yêu cầu đã hết hạn
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                Khi đánh dấu, yêu cầu sẽ không hiển thị cho người dùng tìm kiếm và phản hồi
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="cursor-pointer flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
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
                                className="cursor-pointer flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
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

const StaffEmergencyRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [emergency, setEmergency] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalResponses, setTotalResponses] = useState(0);

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const patientName = emergency?.patient_name || 'Đang tải tên bệnh nhân';

    const getBloodTypeDisplay = (bloodType, rhFactor) => {
        if (bloodType === undefined || rhFactor === undefined) return 'Chưa cập nhật';
        const bloodTypeMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        const rh = rhFactor ? '+' : '-';
        return `${bloodTypeMap[bloodType]}${rh}`;
    };

    const getDonationTypeText = (type) => {
        const types = ['Máu toàn phần', 'Tiểu cầu', 'Huyết tương', 'Bạch cầu'];
        return types[type] || 'Không xác định';
    };

    const getStatusColor = (emergency) => {
        if (emergency?.is_expire === true) return 'bg-gradient-to-r from-gray-500 to-gray-600';
        if (emergency?.critical) return 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse';
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    };

    const getStatusText = (emergency) => {
        if (emergency?.is_expire === true) return 'Đã hết hạn';
        if (emergency?.critical) return 'Khẩn cấp';
        return 'Đang chờ';
    };

    const loadEmergencyDetail = async () => {
        try {
            const url = endpoints.staff_emergency_request_detail.replace('${id}', id);
            const response = await authApis().get(url);
            setEmergency(response.data);
        } catch (err) {
            console.error("Error loading emergency detail:", err);
            setError("Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.");
        }
    };

    const loadResponses = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setResponses([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints.staff_responses_request.replace('${id}', id);
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (dateRange.from) {
                params.append('from_date', dateRange.from);
            }
            if (dateRange.to) {
                params.append('to_date', dateRange.to);
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);
            const results = response.data.results || response.data || [];

            if (isLoadMore) {
                setResponses(prev => [...prev, ...results]);
            } else {
                setResponses(results);
            }

            if (!searchTerm && !dateRange.from && !dateRange.to) {
                setTotalResponses(response.data.count || results.length);
            }
            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching responses:", err);
            setError("Không thể tải danh sách phản hồi. Vui lòng thử lại sau.");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const debouncedLoadResponses = useCallback(
        debounce(() => {
            setPage(1);
            loadResponses(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, dateRange]
    );

    useEffect(() => {
        if (id) {
            loadEmergencyDetail();
            loadResponses(false);
        }
    }, [id]);

    useEffect(() => {
        debouncedLoadResponses();
        return () => {
            debouncedLoadResponses.cancel();
        };
    }, [searchTerm, dateRange, debouncedLoadResponses]);

    useEffect(() => {
        if (page > 1) {
            loadResponses(true);
        }
    }, [page]);

    useEffect(() => {
        document.title = `${patientName} | Dòng Máu Lạc Hồng`;
    }, [patientName]);

    const handleEditEmergency = () => {
        setShowEditDialog(true);
    };

    const handleUpdateEmergencySuccess = (updatedEmergency) => {
        setEmergency(updatedEmergency);
        setPage(1);
        loadResponses(false);
    };

    const handleDeleteEmergency = async () => {
        setDeleting(true);
        try {
            const url = endpoints.emergency_request_detail.replace('${id}', id);
            await authApis().delete(url);

            navigate('/staff-emergency-request', {
                state: { message: 'Xóa yêu cầu thành công!' }
            });
        } catch (err) {
            console.error("Error deleting emergency:", err);
            setError(err.response?.data?.error || 'Không thể xóa yêu cầu. Vui lòng thử lại sau.');
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleViewResponseDetail = (response) => {
        navigate(`/staff-emergency-request/${id}/responses/${response.id}`);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setDateRange({ from: '', to: '' });
        setPage(1);
        setTimeout(() => loadResponses(false), 0);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadResponses(false);
        loadEmergencyDetail();
    };

    const formatResponseDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return formatDate(dateString);
    };

    const getDonorInfo = (response) => {
        const donor = response.donor;
        const account = donor?.account || {};
        return {
            id: donor?.id,
            fullName: `${account.last_name || ''} ${account.first_name || ''}`.trim() || 'Chưa có thông tin',
            phone: account.phone || '',
            email: account.email || '',
            bloodType: donor?.blood_type,
            rhFactor: donor?.rh_factor,
            donationCount: donor?.donation_count || 0,
            statusResponse: response.status_response,
            statusRegistration: response.status_registration,
            createdAt: response.created_at
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>{patientName} | Dòng Máu Lạc Hồng</title>
            </Helmet>
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

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 min-h-[22rem] flex flex-col justify-center">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/staff-emergency-request")}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            Hiến máu khẩn cấp
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">{patientName}</span>
                    </div>

                    <button
                        onClick={() => navigate("/staff-emergency-request")}
                        className="cursor-pointer inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại</span>
                    </button>

                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    Yêu cầu hiến máu khẩn cấp
                                </h1>
                                <span className={`${getStatusColor(emergency)} text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md`}>
                                    {getStatusText(emergency)}
                                </span>
                            </div>
                            {emergency && (
                                <div className="flex flex-wrap gap-4 text-red-100">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        {emergency.patient_name}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Droplet className="w-4 h-4" />
                                        {getBloodTypeDisplay(emergency.blood_type, emergency.rh_factor)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <HandHeart className="w-4 h-4" />
                                        {getDonationTypeText(emergency.donation_type)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Syringe className="w-4 h-4" />
                                        {emergency.blood_volume} ml
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Hospital className="w-4 h-4" />
                                        {emergency.hospital?.name || 'Chưa có'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-4 h-4" />
                                        {emergency.phone}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleEditEmergency}
                                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/20"
                            >
                                <Edit className="w-5 h-5" />
                                <span className="font-medium">Chỉnh sửa</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-red-600/80 backdrop-blur-sm rounded-xl hover:bg-red-700 transition-all duration-300"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">Xóa</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex flex-wrap gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <HeartHandshake className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{totalResponses || '0'}</div>
                                    <div className="text-sm text-white/80">Lượt phản hồi</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên người phản hồi..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadResponses(false);
                                        }}
                                        className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="cursor-pointer lg:hidden flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <FilterIcon className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* Date Filter */}
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="cursor-pointer hidden lg:flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <span className="font-medium">Ngày phản hồi</span>
                            </button>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`cursor-pointer p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng lưới"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`cursor-pointer p-2 rounded-lg transition-all duration-300 ${viewMode === 'list'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng danh sách"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Date Picker */}
                    {showDatePicker && (
                        <div className="hidden lg:block mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
                                <button onClick={() => setShowFilters(false)} className="cursor-pointer p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày phản hồi</label>
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                            placeholder="Từ ngày"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                            placeholder="Đến ngày"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Chế độ xem</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setViewMode('grid');
                                                setShowFilters(false);
                                            }}
                                            className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <Grid className="w-4 h-4" />
                                            <span>Dạng lưới</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('list');
                                                setShowFilters(false);
                                            }}
                                            className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'list'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <List className="w-4 h-4" />
                                            <span>Dạng danh sách</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(searchTerm || dateRange.from || dateRange.to) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {dateRange.from && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Từ: {formatDate(dateRange.from)}</span>
                                    <button onClick={() => setDateRange(prev => ({ ...prev, from: '' }))} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {dateRange.to && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Đến: {formatDate(dateRange.to)}</span>
                                    <button onClick={() => setDateRange(prev => ({ ...prev, to: '' }))} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button onClick={() => setSearchTerm("")} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {(searchTerm || dateRange.from || dateRange.to) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="cursor-pointer px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-xl hover:border-red-200"
                                >
                                    Xóa tất cả
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="h-32 bg-gray-200"></div>
                                <div className="p-5">
                                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                                    <div className="space-y-2 mb-4">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="max-w-2xl mx-auto mb-6">
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-shake">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-800 mb-1">Đã xảy ra lỗi</h3>
                                    <p className="text-red-600">{error}</p>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && responses.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <HeartHandshake className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || dateRange.from || dateRange.to
                                ? "Không tìm thấy phản hồi phù hợp"
                                : "Chưa có phản hồi nào cho yêu cầu này"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || dateRange.from || dateRange.to
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Hãy đợi người dùng phản hồi yêu cầu hiến máu khẩn cấp"}
                        </p>

                        {(searchTerm || dateRange.from || dateRange.to) && (
                            <button
                                onClick={handleClearFilters}
                                className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                )}

                {/* Results */}
                {!loading && !error && responses.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{totalResponses}</span>
                                </div>
                                <span className="text-gray-600">
                                    phản hồi {(searchTerm || dateRange.from || dateRange.to) && "phù hợp"}
                                </span>
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-300 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                <span>Làm mới</span>
                            </button>
                        </div>

                        {/* Grid View */}
                        {viewMode === 'grid' ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {responses.map((response) => {
                                    const donorInfo = getDonorInfo(response);

                                    return (
                                        <div
                                            key={response.id}
                                            onClick={() => handleViewResponseDetail(response)}
                                            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-red-200"
                                        >
                                            {/* Header */}
                                            <div className="relative h-32 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                    <User className="w-10 h-10 text-red-600" />
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md ${donorInfo.statusResponse === 1
                                                            ? 'bg-green-500 text-white'
                                                            : donorInfo.statusResponse === 2
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-gray-500 text-white'
                                                        }`}>
                                                        {donorInfo.statusResponse === 1 ? 'Đã chấp nhận' :
                                                            donorInfo.statusResponse === 2 ? 'Đã từ chối' : 'Đang xử lý'}
                                                    </span>
                                                </div>

                                                {/* Response Date */}
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                                                        {formatResponseDate(donorInfo.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                                                    {donorInfo.fullName}
                                                </h3>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span className="truncate">{donorInfo.phone || 'Chưa cập nhật'}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span className="truncate">{donorInfo.email || 'Chưa cập nhật'}</span>
                                                    </div>
                                                    {donorInfo.bloodType !== undefined && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Droplet className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                            <span>Nhóm máu: {getBloodTypeDisplay(donorInfo.bloodType, donorInfo.rhFactor)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Award className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span>Đã hiến: {donorInfo.donationCount} lần</span>
                                                    </div>
                                                </div>

                                                {donorInfo.statusRegistration !== undefined && donorInfo.statusRegistration !== -1 && (
                                                    <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            Trạng thái: {
                                                                donorInfo.statusRegistration === 4 ? 'Đã hoàn thành' :
                                                                    donorInfo.statusRegistration === 3 ? 'Đã Check-in' :
                                                                        donorInfo.statusRegistration === 1 ? 'Đã xác nhận' : 'Chưa xác nhận'
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewResponseDetail(response);
                                                    }}
                                                    className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg"
                                                >
                                                    <span className="font-medium">Xem chi tiết</span>
                                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // List View
                            <div className="space-y-3">
                                {responses.map((response) => {
                                    const donorInfo = getDonorInfo(response);

                                    return (
                                        <div
                                            key={response.id}
                                            onClick={() => handleViewResponseDetail(response)}
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            <div className="p-5">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {donorInfo.fullName}
                                                            </h3>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${donorInfo.statusResponse === 1
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : donorInfo.statusResponse === 2
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {donorInfo.statusResponse === 1 ? 'Đã chấp nhận' :
                                                                    donorInfo.statusResponse === 2 ? 'Đã từ chối' : 'Đang xử lý'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                            <div className="flex items-center text-gray-600">
                                                                <Phone className="w-4 h-4 text-red-500 mr-2" />
                                                                <span>{donorInfo.phone || 'Chưa cập nhật'}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <Mail className="w-4 h-4 text-red-500 mr-2" />
                                                                <span className="truncate">{donorInfo.email || 'Chưa cập nhật'}</span>
                                                            </div>
                                                            {donorInfo.bloodType !== undefined && (
                                                                <div className="flex items-center text-gray-600">
                                                                    <Droplet className="w-4 h-4 text-red-500 mr-2" />
                                                                    <span>{getBloodTypeDisplay(donorInfo.bloodType, donorInfo.rhFactor)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap">
                                                            {formatResponseDate(donorInfo.createdAt)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewResponseDetail(response);
                                                            }}
                                                            className="cursor-pointer px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md text-sm flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            <span>Chi tiết</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="cursor-pointer group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="animate-spin w-5 h-5" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Xem thêm phản hồi</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && responses.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalResponses} phản hồi</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialogs */}
            <UpdateEmergencyDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSuccess={handleUpdateEmergencySuccess}
                emergency={emergency}
            />

            <ConfirmDeleteDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteEmergency}
                title="Xóa yêu cầu"
                message={`Bạn có chắc chắn muốn xóa yêu cầu hiến máu cho bệnh nhân "${emergency?.patient_name}"? Tất cả phản hồi liên quan cũng sẽ bị xóa.`}
                loading={deleting}
            />

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default StaffEmergencyRequestDetail;
