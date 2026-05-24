import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Droplet, Heart, Share2, ArrowLeft, Users, Award, CheckCircle, AlertCircle, XCircle, Phone, Mail, Globe, Navigation, Copy, ChevronRight, Sparkles, Target, Shield, ThumbsUp, Bookmark, Bell, CalendarDays, MapPinned, Building2, User, UserCheck, MessageCircle, Share, ExternalLink, ClipboardClock, AlarmClock, CalendarCog, BadgeCheck, X, FileText, Stethoscope, Hospital, TrendingUp, Loader2, Eye, Send, CheckCircle2, RefreshCw, Home, UserPlus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// OpenStreetMap Component
const OpenStreetMap = ({ location, province, subDistrict, address }) => {
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

    const fullAddress = `${address || ''} ${districtName || ''} ${provinceName || ''}`.trim();
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
                                    <p className="font-semibold">{address}</p>
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
                    <p>{address}, {districtName}, {provinceName}</p>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = "red" }) => {
    const colors = {
        red: 'bg-gradient-to-r from-red-50 to-red-100 text-red-600',
        blue: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600',
        green: 'bg-gradient-to-r from-green-50 to-green-100 text-green-600',
        purple: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600',
        orange: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600'
    };

    return (
        <div className={`${colors[color]} rounded-xl p-4 border border-${color}-100 hover:shadow-md transition-all duration-300`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm opacity-80">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
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
                                        Bệnh viện {staff?.hospital?.name || 'Đang cập nhật'}
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

// Registration Dialog Component
const RegistrationDialog = ({ isOpen, onClose, onSubmit, user, event, donorInfo }) => {
    const [formData, setFormData] = useState({
        expected_arrive: '',
        permanent_address: '',
        career: '',
        organization: '',
        province: '',
        sub_district: '',
        is_proxy: false,
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        identification: '',
        birth_date: '',
        gender: '0'
    });
    const [loading, setLoading] = useState(false);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [provinceName, setProvinceName] = useState('');
    const [districtName, setDistrictName] = useState('');

    useEffect(() => {
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            fetchDistricts(selectedProvince);
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedProvince && formData.is_proxy) {
            fetchProvinceName(selectedProvince);
        }
    }, [selectedProvince, formData.is_proxy]);

    useEffect(() => {
        if (selectedDistrict && formData.is_proxy) {
            fetchDistrictName(selectedDistrict);
        }
    }, [selectedDistrict, formData.is_proxy]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                expected_arrive: '',
                permanent_address: '',
                career: '',
                organization: '',
                province: '',
                sub_district: '',
                is_proxy: false,
                first_name: '',
                last_name: '',
                phone: '',
                email: '',
                identification: '',
                birth_date: '',
                gender: '0'
            });
            setSelectedProvince('');
            setSelectedDistrict('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (donorInfo && !formData.is_proxy && isOpen) {
            setFormData(prev => ({
                ...prev,
                permanent_address: donorInfo.permanent_address || '',
                career: donorInfo.career || '',
                organization: donorInfo.organization || '',
                province: donorInfo.province || '',
                sub_district: donorInfo.sub_district || ''
            }));

            if (donorInfo.province && !isNaN(donorInfo.province)) {
                setSelectedProvince(donorInfo.province);
                fetchProvinceName(donorInfo.province);
            }

            if (donorInfo.sub_district && !isNaN(donorInfo.sub_district)) {
                setSelectedDistrict(donorInfo.sub_district);
                fetchDistrictName(donorInfo.sub_district);
            }
        }
    }, [donorInfo, formData.is_proxy, isOpen]);

    useEffect(() => {
        if (formData.is_proxy) {
            setFormData(prev => ({
                ...prev,
                permanent_address: '',
                career: '',
                organization: '',
                province: '',
                sub_district: '',
                first_name: '',
                last_name: '',
                phone: '',
                email: '',
                identification: '',
                birth_date: '',
                gender: '0'
            }));
            setSelectedProvince('');
            setSelectedDistrict('');
        } else if (donorInfo) {
            setFormData(prev => ({
                ...prev,
                permanent_address: donorInfo.permanent_address || '',
                career: donorInfo.career || '',
                organization: donorInfo.organization || '',
                province: donorInfo.province || '',
                sub_district: donorInfo.sub_district || ''
            }));

            if (donorInfo.province && !isNaN(donorInfo.province)) {
                setSelectedProvince(donorInfo.province);
                fetchProvinceName(donorInfo.province);
            }

            if (donorInfo.sub_district && !isNaN(donorInfo.sub_district)) {
                setSelectedDistrict(donorInfo.sub_district);
                fetchDistrictName(donorInfo.sub_district);
            }
        }
    }, [formData.is_proxy, donorInfo]);

    const toUTCISOString = (localDateTime) => {
        if (!localDateTime) return null;
        const date = new Date(localDateTime);
        return date.toISOString();
    };

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (error) {
            console.error("Error fetching provinces:", error);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const fetchDistricts = async (provinceCode) => {
        setLoadingDistricts(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts || []);
        } catch (error) {
            console.error("Error fetching districts:", error);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchProvinceName = async (provinceCode) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}`);
            const data = await response.json();
            setProvinceName(data.name);
        } catch (error) {
            console.error("Error fetching province name:", error);
        }
    };

    const fetchDistrictName = async (districtCode) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}`);
            const data = await response.json();
            setDistrictName(data.name);
        } catch (error) {
            console.error("Error fetching district name:", error);
        }
    };

    const handleProvinceChange = (e) => {
        const code = e.target.value;
        setSelectedProvince(code);
        setFormData(prev => ({ ...prev, province: code, sub_district: '' }));
        setSelectedDistrict('');
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value;
        setSelectedDistrict(code);
        setFormData(prev => ({ ...prev, sub_district: code }));
    };

    const handleProxyChange = (e) => {
        const isChecked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            is_proxy: isChecked
        }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let submitData;

            if (formData.is_proxy) {
                submitData = {
                    expected_arrive: toUTCISOString(formData.expected_arrive),
                    permanent_address: formData.permanent_address,
                    career: formData.career,
                    organization: formData.organization,
                    province: selectedProvince || formData.province,
                    sub_district: selectedDistrict || formData.sub_district,
                    is_proxy: true,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    email: formData.email,
                    identification: formData.identification,
                    birth_date: formData.birth_date,
                    gender: formData.gender
                };
            } else {
                submitData = {
                    expected_arrive: toUTCISOString(formData.expected_arrive),
                    permanent_address: donorInfo?.permanent_address || formData.permanent_address,
                    career: donorInfo?.career || formData.career,
                    organization: donorInfo?.organization || formData.organization,
                    province: donorInfo?.province || formData.province,
                    sub_district: donorInfo?.sub_district || formData.sub_district,
                    is_proxy: false,
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    phone: user?.phone || '',
                    email: user?.email || '',
                    identification: donorInfo?.identification || '',
                    birth_date: user?.birth_date || '',
                    gender: user?.gender?.toString() || '0'
                };
            }

            await onSubmit(submitData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Đăng ký tham gia hoạt động</h3>
                            <button
                                onClick={onClose}
                                className="cursor-pointer p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="event-proxy-notice bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_proxy}
                                    onChange={handleProxyChange}
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                />
                                <div>
                                    <span className="event-proxy-notice__title text-base font-semibold text-gray-900">
                                        Đăng ký thay cho người khác
                                    </span>
                                    <p className="event-proxy-notice__description text-sm text-gray-600 mt-1">
                                        Chọn nếu bạn đang đăng ký tham gia cho người thân, bạn bè
                                    </p>
                                </div>
                            </label>
                        </div>

                        {!formData.is_proxy ? (
                            <>
                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4 text-red-500" />
                                        Thông tin cá nhân của bạn
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Họ và tên đệm
                                            </label>
                                            <input
                                                type="text"
                                                value={user?.last_name || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên
                                            </label>
                                            <input
                                                type="text"
                                                value={user?.first_name || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="text"
                                                value={user?.phone || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                CMND/CCCD
                                            </label>
                                            <input
                                                type="text"
                                                value={donorInfo?.identification || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày sinh
                                            </label>
                                            <input
                                                type="text"
                                                value={formatDate(user?.birth_date) || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Giới tính
                                            </label>
                                            <input
                                                type="text"
                                                value={user?.gender === 0 ? 'Nam' : user?.gender === 1 ? 'Nữ' : ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2">
                                        * Thông tin được lấy từ hồ sơ của bạn. Vào trang cá nhân để cập nhật.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-red-500" />
                                        Thông tin từ hồ sơ của bạn
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tỉnh/Thành phố
                                            </label>
                                            <input
                                                type="text"
                                                value={provinceName || donorInfo?.province || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quận/Huyện
                                            </label>
                                            <input
                                                type="text"
                                                value={districtName || donorInfo?.sub_district || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Địa chỉ thường trú
                                            </label>
                                            <input
                                                type="text"
                                                value={donorInfo?.permanent_address || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nghề nghiệp
                                            </label>
                                            <input
                                                type="text"
                                                value={donorInfo?.career || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đơn vị công tác
                                            </label>
                                            <input
                                                type="text"
                                                value={donorInfo?.organization || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2">
                                        * Thông tin được lấy từ hồ sơ của bạn. Vào trang cá nhân để cập nhật.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="event-proxy-form bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl p-4 border border-blue-100">
                                <h4 className="event-proxy-form__title font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Thông tin người được đăng ký thay
                                </h4>
                                <p className="event-proxy-form__description text-sm text-blue-600 mb-4">
                                    Vui lòng nhập đầy đủ thông tin của người mà bạn đang đăng ký thay
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Họ và tên đệm <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="Họ và tên đệm"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="Tên"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số điện thoại <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            maxLength={10}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Số điện thoại"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            CMND/CCCD <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.identification}
                                            onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                                            placeholder="Số CMND/CCCD"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày sinh <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.birth_date}
                                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giới tính <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        >
                                            <option value="0">Nam</option>
                                            <option value="1">Nữ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nghề nghiệp <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.career}
                                            required
                                            onChange={(e) => setFormData({ ...formData, career: e.target.value })}
                                            placeholder="Nghề nghiệp"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Đơn vị công tác <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.organization}
                                            required
                                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                            placeholder="Đơn vị công tác"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tỉnh/Thành phố <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={selectedProvince}
                                            onChange={handleProvinceChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        >
                                            <option value="">Chọn tỉnh/thành phố</option>
                                            {loadingProvinces ? (
                                                <option disabled>Đang tải...</option>
                                            ) : (
                                                provinces.map(province => (
                                                    <option key={province.code} value={province.code}>
                                                        {province.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quận/Huyện <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={selectedDistrict}
                                            onChange={handleDistrictChange}
                                            disabled={!selectedProvince || loadingDistricts}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Chọn quận/huyện</option>
                                            {loadingDistricts ? (
                                                <option disabled>Đang tải...</option>
                                            ) : (
                                                districts.map(district => (
                                                    <option key={district.code} value={district.code}>
                                                        {district.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Địa chỉ thường trú <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            value={formData.permanent_address}
                                            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                            placeholder="Số nhà, đường, phường/xã"
                                            rows="2"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thời gian dự kiến đến <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.expected_arrive}
                                        onChange={(e) => setFormData({ ...formData, expected_arrive: e.target.value })}
                                        min={new Date(event.time_start).toISOString().slice(0, 16)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="cursor-pointer flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Xác nhận đăng ký</span>
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

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [eventTitle, setEventTitle] = useState('Chi tiết hoạt động');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [message, setMessage] = useState({ text: '', type: '' });
    const user = useContext(UserContexts);

    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    const [donorInfo, setDonorInfo] = useState(null);

    const [relatedEvents, setRelatedEvents] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    const [provinceName, setProvinceName] = useState('');
    const [districtName, setDistrictName] = useState('');

    useEffect(() => {
        const fetchDonorInfo = async () => {
            if (user?.role === 1) {
                try {
                    const response = await authApis().get(endpoints["donor_me"]);
                    setDonorInfo(response.data);
                } catch (error) {
                    console.error("Error fetching donor info:", error);
                }
            }
        };

        if (user) {
            fetchDonorInfo();
        }
    }, [user]);

    useEffect(() => {
        fetchEventDetail();
    }, [id]);

    useEffect(() => {
        const nextTitle =
            event?.title ||
            event?.name ||
            event?.event_name ||
            event?.eventTitle ||
            'Chi tiết hoạt động';

        setEventTitle(nextTitle);
        document.title = `${nextTitle} | Dòng Máu Lạc Hồng`;
    }, [event]);

    useEffect(() => {
        if (event?.province && !isNaN(event.province)) {
            fetchProvinceName(event.province);
        }
        if (event?.sub_district && !isNaN(event.sub_district)) {
            fetchDistrictName(event.sub_district);
        }
    }, [event]);

    useEffect(() => {
        if (event?.province) {
            fetchRelatedEvents(event.province);
        }
    }, [event]);

    const fetchProvinceName = async (provinceCode) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}`);
            const data = await response.json();
            setProvinceName(data.name);
        } catch (error) {
            console.error("Error fetching province name:", error);
            setProvinceName(event?.province || '');
        }
    };

    const fetchDistrictName = async (districtCode) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}`);
            const data = await response.json();
            setDistrictName(data.name);
        } catch (error) {
            console.error("Error fetching district name:", error);
            setDistrictName(event?.sub_district || '');
        }
    };

    const fetchEventDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const url = endpoints.donation_event_detail.replace('${id}', id);
            const response = await authApis().get(url);
            setEvent(response.data);
            const responseTitle =
                response.data?.title ||
                response.data?.name ||
                response.data?.event_name ||
                response.data?.eventTitle;
            if (responseTitle) {
                setEventTitle(responseTitle);
                document.title = `${responseTitle} | Dòng Máu Lạc Hồng`;
            }
        } catch (err) {
            console.error("Error fetching event detail:", err);
            setError("Không thể tải thông tin hoạt động. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedEvents = async (province) => {
        setLoadingRelated(true);
        try {
            const response = await authApis().get(endpoints.donation_event, {
                params: {
                    province: province,
                    limit: 4,
                }
            });

            let events = [];
            if (response.data && response.data.results) {
                events = response.data.results;
            } else if (Array.isArray(response.data)) {
                events = response.data;
            }

            const filteredEvents = events
                .filter(e => e.id !== parseInt(id))
                .slice(0, 3);

            setRelatedEvents(filteredEvents);
        } catch (error) {
            console.error("Error fetching related events:", error);
            setRelatedEvents([]);
        } finally {
            setLoadingRelated(false);
        }
    };

    const getEventStatus = (timeStart) => {
        const now = new Date().getTime();
        const start = new Date(timeStart).getTime();

        if (start > now) return 'upcoming';
        if (start <= now) return 'ongoing';
        return 'ended';
    };

    const getStatusColor = (event) => {
        const status = getEventStatus(event.time_start);
        if (status === 'ongoing') return 'bg-gradient-to-r from-green-500 to-emerald-500';
        if (status === 'upcoming') return 'bg-gradient-to-r from-blue-500 to-blue-600';
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    };

    const getStatusText = (event) => {
        const status = getEventStatus(event.time_start);
        if (status === 'ongoing') return 'Đang diễn ra';

        const now = new Date();
        const eventDate = new Date(event.time_start);
        const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Ngày mai';
        if (diffDays <= 3) return `Còn ${diffDays} ngày`;
        return 'Sắp diễn ra';
    };

    const handleRegisterClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowRegistrationForm(true);
    };

    const handleSubmitRegistration = async (formData) => {
        setRegisterLoading(true);
        try {
            const url = endpoints.donation_register.replace('${id}', id);
            const response = await authApis().post(url, formData);

            if (response.status === 200 || response.status === 201) {
                showMessage('Đăng ký tham gia thành công', 'success');
                setShowRegistrationForm(false);
                await fetchEventDetail();
            }
        } catch (error) {
            console.error("Error registering for event:", error);

            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        showMessage('Vui lòng kiểm tra lại thông tin.', 'error');
                        break;
                    case 401:
                        showMessage('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
                        navigate('/login');
                        break;
                    case 403:
                        showMessage('Bạn không có quyền đăng ký hoạt động này.', 'error');
                        break;
                    case 404:
                        showMessage('Không tìm thấy hoạt động.', 'error');
                        break;
                    case 409:
                        showMessage('Người này đã đăng ký hoạt động này rồi.', 'error');
                        break;
                    default:
                        showMessage('Đăng ký thất bại. Vui lòng thử lại sau.', 'error');
                }
            } else {
                showMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
            }
        } finally {
            setRegisterLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {error ? 'Có lỗi xảy ra' : 'Không tìm thấy hoạt động'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Hoạt động bạn đang tìm không tồn tại hoặc đã bị xóa'}
                        </p>
                        <button
                            onClick={() => navigate('/list-event')}
                            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />
            <Helmet>
                <title>{eventTitle} | Dòng Máu Lạc Hồng</title>
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
                            <Droplet className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 min-h-[22rem] flex flex-col justify-center">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/list-event")}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            Hoạt động hiến máu
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">{eventTitle || 'Chi tiết'}</span>
                    </div>

                    <button
                        onClick={() => navigate("/list-event")}
                        className="cursor-pointer inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại</span>
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            {eventTitle}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-md`}>
                                {getStatusText(event)}
                            </span>
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-gray-600 leading-relaxed">
                                        {event.description || 'Chưa có mô tả chi tiết cho hoạt động này.'}
                                    </p>
                                </div>
                            </div>

                            {/* Register Button */}
                            <div className="mt-6">
                                {!user ? (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="cursor-pointer w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                                    >
                                        <span>Đăng nhập để tham gia</span>
                                    </button>
                                ) : user.role === 1 && (
                                    <button
                                        onClick={handleRegisterClick}
                                        disabled={getEventStatus(event.time_start) !== 'upcoming' && getEventStatus(event.time_start) !== 'ongoing'}
                                        className="cursor-pointer w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>Tham gia ngay</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 relative">
                                {event.image_url ? (
                                    <img
                                        src={getImageUrl(event.image_url)}
                                        alt={eventTitle}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Droplet className="w-24 h-24 text-red-400 opacity-50" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-6">
                                    {[
                                        { id: 'info', label: 'Thông tin chi tiết', icon: FileText },
                                        { id: 'location', label: 'Địa điểm', icon: MapPin },
                                        { id: 'organizer', label: 'Ban tổ chức', icon: Users }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`cursor-pointer py-4 px-2 font-medium transition-all relative flex items-center gap-2 ${activeTab === tab.id
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
                                                icon={CalendarDays}
                                                label="Ngày bắt đầu"
                                                value={formatDate(event.time_start)}
                                            />
                                            <InfoRow
                                                icon={Clock}
                                                label="Giờ bắt đầu"
                                                value={formatTime(event.time_start)}
                                            />
                                            <InfoRow
                                                icon={CalendarCog}
                                                label="Ngày tạo"
                                                value={formatDate(event.created_at)}
                                            />
                                            <InfoRow
                                                icon={ClipboardClock}
                                                label="Cập nhật lần cuối"
                                                value={formatDate(event.updated_at)}
                                            />
                                        </div>

                                        <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl p-4 border border-red-100">
                                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Những lưu ý khi tham gia
                                            </h4>
                                            <ul className="space-y-2 text-sm text-red-700">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Mang theo CMND/CCCD khi tham gia</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Ăn nhẹ trước khi hiến máu</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Không sử dụng rượu bia trước khi hiến 24h</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>Ngủ đủ giấc trước ngày hiến máu</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'location' && (
                                    <div className="space-y-4">
                                        <OpenStreetMap
                                            address={event.location}
                                            province={event.province}
                                            subDistrict={event.sub_district}
                                        />
                                    </div>
                                )}

                                {activeTab === 'organizer' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoRow
                                                icon={User}
                                                label="Nhân viên y tế"
                                                value={
                                                    <button
                                                        onClick={() => setIsStaffDialogOpen(true)}
                                                        className="cursor-pointer flex items-center gap-1 hover:text-red-600 transition-colors group"
                                                    >
                                                        <span>{`${event.staff?.account?.last_name || ''} ${event.staff?.account?.first_name || ''}`}</span>
                                                        {event.staff?.is_verified && (
                                                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                        )}
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                }
                                            />
                                            <InfoRow
                                                icon={Phone}
                                                label="Hotline"
                                                value={`${event.staff?.emergency_phone || 'Chưa cập nhật'}`}
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
                                <FileText className="w-5 h-5 text-red-500" />
                                Tổng quan
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Trạng thái</span>
                                    <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm`}>
                                        {getStatusText(event)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Địa điểm</span>
                                    <span className="font-semibold text-gray-900 text-right">{event.province}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày diễn ra</span>
                                    <span className="font-semibold text-gray-900">{formatDate(event.time_start)}</span>
                                </div>

                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-gray-600">Giờ bắt đầu</span>
                                    <span className="font-semibold text-gray-900">{formatTime(event.time_start)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Ngày tạo</span>
                                    <span className="font-semibold text-gray-900 text-right">{formatDate(event.created_at)}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {event.registered_count && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Đã đăng ký</span>
                                        <span className="font-semibold text-red-600">{event.registered_count} người</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-red-600 to-red-500 h-2 rounded-full"
                                            style={{ width: `${Math.min((event.registered_count / (event.target || 200)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Events */}
                {relatedEvents.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-red-500" />
                            Hoạt động cùng khu vực {provinceName && `- ${provinceName}`}
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
                                {relatedEvents.map((relatedEvent) => (
                                    <div
                                        key={relatedEvent.id}
                                        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden border border-gray-100 hover:border-red-200"
                                        onClick={() => navigate(`/event/${relatedEvent.id}`)}
                                    >
                                        <div className="h-32 bg-gradient-to-br from-red-400 to-red-600 relative overflow-hidden">
                                            {relatedEvent.image_url ? (
                                                <img
                                                    src={getImageUrl(relatedEvent.image_url)}
                                                    alt={relatedEvent.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Droplet className="w-12 h-12 text-white opacity-50" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className={`${getStatusColor(relatedEvent)} text-white text-xs px-2 py-1 rounded-full shadow-md`}>
                                                    {getStatusText(relatedEvent)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                {relatedEvent.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(relatedEvent.time_start)}
                                            </p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {relatedEvent.location}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {relatedEvents.length > 0 && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => navigate('/list-event', { state: { province: event.province } })}
                                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 shadow-sm border border-gray-200"
                                >
                                    Xem thêm hoạt động
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
                staff={event?.staff}
            />

            <RegistrationDialog
                isOpen={showRegistrationForm}
                onClose={() => setShowRegistrationForm(false)}
                onSubmit={handleSubmitRegistration}
                user={user}
                event={event}
                donorInfo={donorInfo}
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

export default EventDetail;
