import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPlus, HeartPulse, Plus, Save, Loader2, Upload, Image as ImageIcon, UserCog, Settings, Edit, Trash2, ChevronDown, Phone, AlertTriangle, Hospital, Syringe, Stethoscope, Ambulance, AlertOctagon, Send, Grid, List, Filter as FilterIcon, TrendingUp, CheckCircle2, Eye, Clock as ClockIcon, User, Mail, RefreshCw } from 'lucide-react';
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

// Create Emergency Request Dialog Component
const CreateEmergencyDialog = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        blood_type: '',
        rh_factor: true,
        donation_type: '',
        patient_name: '',
        phone: '',
        blood_volume: '',
        critical: true,
        emergency_note: '',
        hospital: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState('');

    const user = useContext(UserContexts);

    useEffect(() => {
        fetchHospitals();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                blood_type: '',
                rh_factor: true,
                donation_type: '',
                patient_name: '',
                phone: '',
                blood_volume: '',
                critical: true,
                emergency_note: '',
                hospital: null
            });
            setSelectedHospital('');
            setError('');
        }
    }, [isOpen]);

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const response = await authApis().get(endpoints.hospital);
            setHospitals(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        } finally {
            setLoadingHospitals(false);
        }
    };

    const handleHospitalChange = (e) => {
        const hospitalId = e.target.value;
        setSelectedHospital(hospitalId);
        const hospitalObj = hospitals.find(h => h.id === parseInt(hospitalId));
        if (hospitalObj) {
            setFormData(prev => ({ ...prev, hospital: hospitalObj.id }));
        }
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
                emergency_note: formData.emergency_note || '',
                hospital_id: formData.hospital
            };

            const response = await authApis().post(endpoints.emergency_request, submitData);

            if (response.status === 200 || response.status === 201) {
                onSuccess(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Error creating emergency request:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages[0] || 'Có lỗi xảy ra, vui lòng thử lại');
            } else {
                setError('Không thể tạo yêu cầu. Vui lòng thử lại sau.');
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
                                <Ambulance className="w-5 h-5" />
                                Tạo yêu cầu hiến máu khẩn cấp
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
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
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nhóm máu <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.blood_type}
                                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    >
                                        <option value="">Chọn nhóm máu</option>
                                        <option value="0">O</option>
                                        <option value="1">A</option>
                                        <option value="2">B</option>
                                        <option value="3">AB</option>
                                    </select>
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
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Loại hiến máu <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.donation_type}
                                        onChange={(e) => setFormData({ ...formData, donation_type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    >
                                        <option value="">Chọn loại hiến máu</option>
                                        <option value="0">Máu toàn phần</option>
                                        <option value="1">Tiểu cầu</option>
                                        <option value="2">Huyết tương</option>
                                        <option value="3">Bạch cầu</option>
                                    </select>
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
                            <select
                                value={selectedHospital}
                                onChange={handleHospitalChange}
                                disabled={loadingHospitals}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Chọn bệnh viện</option>
                                {loadingHospitals ? (
                                    <option disabled>Đang tải...</option>
                                ) : (
                                    hospitals.map(hospital => (
                                        <option key={hospital.id} value={hospital.id}>
                                            {hospital.name}
                                        </option>
                                    ))
                                )}
                            </select>
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

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Ambulance className="w-5 h-5" />
                                        <span>Tạo yêu cầu</span>
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

const StaffEmergencyRequest = () => {
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const user = useContext(UserContexts);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalEmergencies, setTotalEmergencies] = useState(0);
    const navigate = useNavigate();

    const loadEmergencies = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setEmergencies([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints.staff_emergency_request;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (filterType !== 'all') {
                if (filterType === 'active') {
                    params.append('status', 'active');
                } else if (filterType === 'expired') {
                    params.append('status', 'expired');
                }
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            if (isLoadMore) {
                setEmergencies(prev => [...prev, ...response.data.results]);
            } else {
                setEmergencies(response.data.results);
            }

            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching emergencies:", err);
            setError("Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const debouncedLoadEmergencies = useCallback(
        debounce(() => {
            setPage(1);
            loadEmergencies(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, filterType]
    );

    const fetchTotalEmergencies = async () => {
        try {
            const res = await authApis().get(endpoints.staff_emergency_request);
            setTotalEmergencies(res.data.count);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTotalEmergencies();
    }, []);

    const filteredAndSortedEmergencies = emergencies
        .filter(emergency => {
            const matchesSearch = searchTerm === '' ||
                emergency.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterType === 'all' ||
                (filterType === 'active' && !emergency.is_expire) ||
                (filterType === 'expired' && emergency.is_expire === true);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (a.is_expire !== b.is_expire) {
                return a.is_expire ? 1 : -1;
            }
            if (a.critical !== b.critical) {
                return a.critical ? -1 : 1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

    useEffect(() => {
        debouncedLoadEmergencies();
        return () => {
            debouncedLoadEmergencies.cancel();
        };
    }, [searchTerm, filterType, debouncedLoadEmergencies]);

    useEffect(() => {
        if (page > 1) {
            loadEmergencies(true);
        }
    }, [page]);

    const handleCreateEmergency = () => {
        setShowCreateDialog(true);
    };

    const handleCreateEmergencySuccess = () => {
        setPage(1);
        loadEmergencies(false);
        fetchTotalEmergencies();
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterTypeChange = (type) => {
        setFilterType(type);
        setShowStatusDropdown(false);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterType('all');
        setPage(1);
        setTimeout(() => loadEmergencies(false), 0);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadEmergencies(false);
        fetchTotalEmergencies();
    };

    const handleViewDetail = (emergencyId) => {
        navigate(`/staff-emergency-request/${emergencyId}/responses`);
    };

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
        if (emergency.is_expire === true) return 'bg-gradient-to-r from-gray-500 to-gray-600';
        if (emergency.critical) return 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse';
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    };

    const getStatusText = (emergency) => {
        if (emergency.is_expire === true) return 'Đã hết hạn';
        if (emergency.critical) return 'Khẩn cấp';
        return 'Đang chờ';
    };

    const getFilterLabel = () => {
        switch (filterType) {
            case 'active': return 'Đang hoạt động';
            case 'expired': return 'Đã hết hạn';
            default: return 'Tất cả';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusDropdown && !event.target.closest('.status-dropdown')) {
                setShowStatusDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusDropdown]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Hiến máu khẩn cấp | Dòng Máu Lạc Hồng</title>
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
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Ambulance className="w-4 h-4" />
                                <span className="text-sm font-medium">Yêu cầu hiến máu khẩn cấp</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Ambulance className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Yêu cầu hiến máu khẩn cấp</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Quản lý các yêu cầu hiến máu khẩn cấp. Theo dõi và phản hồi các yêu cầu từ bệnh viện.
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <AlertOctagon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{totalEmergencies}</div>
                                        <div className="text-sm text-white/80">Tổng số yêu cầu</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Create Card */}
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="text-center mb-5">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Tạo yêu cầu mới</h3>
                                    <p className="text-white/80 text-sm">Tạo yêu cầu hiến máu khẩn cấp để kêu gọi cộng đồng</p>
                                </div>
                                <button
                                    onClick={handleCreateEmergency}
                                    className="w-full bg-white text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300"
                                >
                                    Tạo yêu cầu khẩn cấp
                                </button>
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
                                    placeholder="Tìm kiếm theo tên bệnh nhân..."
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
                                            loadEmergencies(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <FilterIcon className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* Status Dropdown */}
                            <div className="relative status-dropdown">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[160px] justify-between"
                                >
                                    <span className="text-gray-700 font-medium">{getFilterLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                        {[
                                            { value: 'all', label: 'Tất cả' },
                                            { value: 'active', label: 'Đang hoạt động' },
                                            { value: 'expired', label: 'Đã hết hạn' }
                                        ].map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterTypeChange(option.value)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === option.value ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid'
                                        ? 'bg-white text-red-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng lưới"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'list'
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

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'all', label: 'Tất cả' },
                                            { value: 'active', label: 'Đang hoạt động' },
                                            { value: 'expired', label: 'Đã hết hạn' }
                                        ].map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    handleFilterTypeChange(option.value);
                                                    setShowFilters(false);
                                                }}
                                                className={`px-4 py-2 rounded-lg border transition-all ${filterType === option.value
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(searchTerm || filterType !== 'all') && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {filterType !== 'all' && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Trạng thái: {getFilterLabel()}</span>
                                    <button onClick={() => handleFilterTypeChange('all')} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>"{searchTerm}"</span>
                                    <button onClick={() => { setSearchTerm(""); setPage(1); loadEmergencies(false); }} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {(searchTerm || filterType !== 'all') && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-xl hover:border-red-200"
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
                {/* Mobile Create Button */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={handleCreateEmergency}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo yêu cầu khẩn cấp
                    </button>
                </div>

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
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredAndSortedEmergencies.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Ambulance className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || filterType !== 'all' ? "Không tìm thấy yêu cầu" : "Chưa có yêu cầu nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || filterType !== 'all'
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Hãy tạo yêu cầu hiến máu khẩn cấp đầu tiên để kêu gọi cộng đồng"}
                        </p>

                        {!searchTerm && filterType === 'all' && (
                            <button
                                onClick={handleCreateEmergency}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo yêu cầu ngay
                            </button>
                        )}
                    </div>
                )}

                {/* Results */}
                {!loading && !error && filteredAndSortedEmergencies.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{filteredAndSortedEmergencies.length}</span>
                                </div>
                                <span className="text-gray-600">kết quả tìm kiếm</span>
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-300 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                <span>Làm mới</span>
                            </button>
                        </div>

                        {/* Grid View */}
                        {viewMode === 'grid' ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedEmergencies.map((emergency) => (
                                    <div
                                        key={emergency.id}
                                        onClick={() => handleViewDetail(emergency.id)}
                                        className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-red-200"
                                    >
                                        {/* Header */}
                                        <div className={`relative h-32 ${emergency.critical && !emergency.is_expire ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} flex items-center justify-center`}>
                                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <HeartPulse className="w-10 h-10 text-white" />
                                            </div>
                                            <div className="absolute top-4 left-4">
                                                <span className={`${getStatusColor(emergency)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                    {getStatusText(emergency)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                                                {emergency.patient_name}
                                            </h3>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Droplet className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                    <span>Nhóm máu: {getBloodTypeDisplay(emergency.blood_type, emergency.rh_factor)}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                    <span>{emergency.phone}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Syringe className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                    <span>{getDonationTypeText(emergency.donation_type)} - {emergency.blood_volume} ml</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Hospital className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                    <span className="truncate">{emergency.hospital?.name || 'Chưa có'}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetail(emergency.id);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg"
                                            >
                                                <span className="font-medium">Xem chi tiết</span>
                                                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // List View
                            <div className="space-y-3">
                                {filteredAndSortedEmergencies.map((emergency) => (
                                    <div
                                        key={emergency.id}
                                        onClick={() => handleViewDetail(emergency.id)}
                                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {emergency.patient_name}
                                                        </h3>
                                                        <span className={`${getStatusColor(emergency)} text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm`}>
                                                            {getStatusText(emergency)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                                        <div className="flex items-center text-gray-600">
                                                            <Droplet className="w-4 h-4 text-red-500 mr-2" />
                                                            <span>Nhóm máu: {getBloodTypeDisplay(emergency.blood_type, emergency.rh_factor)}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Phone className="w-4 h-4 text-red-500 mr-2" />
                                                            <span>{emergency.phone}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Syringe className="w-4 h-4 text-red-500 mr-2" />
                                                            <span>{emergency.blood_volume} ml</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Hospital className="w-4 h-4 text-red-500 mr-2" />
                                                            <span className="truncate">{emergency.hospital?.name || 'Chưa có'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetail(emergency.id);
                                                    }}
                                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md text-sm flex items-center gap-2 whitespace-nowrap"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Chi tiết</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="animate-spin w-5 h-5" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>Xem thêm yêu cầu</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && filteredAndSortedEmergencies.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả yêu cầu</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Emergency Dialog */}
            <CreateEmergencyDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSuccess={handleCreateEmergencySuccess}
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

export default StaffEmergencyRequest;
