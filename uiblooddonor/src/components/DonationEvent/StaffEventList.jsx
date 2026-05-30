import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPlus, HeartPulse, Plus, Save, Loader2, Upload, Image as ImageIcon, UserCog, Settings, Edit, Trash2, ChevronDown, Send, Grid, List, TrendingUp, Award as AwardIcon, Shield, CheckCircle2, Eye, EyeOff, HandHeart } from 'lucide-react';
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

// Create Event Dialog Component
const CreateEventDialog = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        province: '',
        sub_district: '',
        location: '',
        time_start: '',
        staff: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

    const user = useContext(UserContexts);

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
        const handleClickOutside = (event) => {
            if (showProvinceDropdown && !event.target.closest('.province-dropdown')) {
                setShowProvinceDropdown(false);
            }
            if (showDistrictDropdown && !event.target.closest('.district-dropdown')) {
                setShowDistrictDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProvinceDropdown, showDistrictDropdown]);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                staff: user?.id || null
            }));
            setError('');
            setSelectedProvince('');
            setSelectedDistrict('');
            setShowProvinceDropdown(false);
            setShowDistrictDropdown(false);
            setImageFile(null);
            setImagePreview('');
        }
    }, [isOpen, user]);

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/v1/');
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

    const handleProvinceSelect = (provinceCode) => {
        setSelectedProvince(provinceCode);
        setSelectedDistrict('');
        setShowProvinceDropdown(false);
        setShowDistrictDropdown(false);

        if (!provinceCode) {
            setFormData(prev => ({ ...prev, province: '', sub_district: '' }));
            setDistricts([]);
            return;
        }

        const provinceObj = provinces.find(p => p.code === parseInt(provinceCode));
        if (provinceObj) {
            setFormData(prev => ({ ...prev, province: provinceObj.name, sub_district: '' }));
        }
    };

    const handleDistrictSelect = (districtCode) => {
        setSelectedDistrict(districtCode);
        setShowDistrictDropdown(false);

        if (!districtCode) {
            setFormData(prev => ({ ...prev, sub_district: '' }));
            return;
        }

        const districtObj = districts.find(d => d.code === parseInt(districtCode));
        if (districtObj) {
            setFormData(prev => ({ ...prev, sub_district: districtObj.name }));
        }
    };

    const getProvinceName = (provinceCode) => {
        const province = provinces.find(p => p.code === parseInt(provinceCode));
        return province ? province.name : 'Chọn tỉnh/thành phố';
    };

    const getDistrictName = (districtCode) => {
        const district = districts.find(d => d.code === parseInt(districtCode));
        return district ? district.name : 'Chọn quận/huyện';
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            if (!file.type.match('image.*')) {
                setError('Vui lòng chọn file ảnh (PNG, JPG, JPEG)');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên hoạt động');
            return;
        }
        if (!formData.location.trim()) {
            setError('Vui lòng nhập địa chỉ cụ thể');
            return;
        }
        if (!formData.time_start) {
            setError('Vui lòng chọn thời gian bắt đầu');
            return;
        }
        if (!formData.province) {
            setError('Vui lòng chọn tỉnh/thành phố');
            return;
        }

        const startTime = new Date(formData.time_start);
        const now = new Date();
        if (startTime <= now) {
            setError('Thời gian bắt đầu phải lớn hơn thời gian hiện tại');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description || '');
            submitData.append('province', formData.province);
            submitData.append('sub_district', formData.sub_district || '');
            submitData.append('location', formData.location);
            const startTimeLocal = new Date(formData.time_start);
            const startTimeUTC = startTimeLocal.toISOString();
            submitData.append('time_start', startTimeUTC);
            submitData.append('staff', formData.staff);

            if (imageFile) {
                submitData.append('image_url', imageFile);
            }

            const response = await authApis().post(endpoints.donation_event, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200 || response.status === 201) {
                onSuccess(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Error creating event:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages[0] || 'Có lỗi xảy ra, vui lòng thử lại');
            } else {
                setError('Không thể tạo hoạt động. Vui lòng thử lại sau.');
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
                                Tạo hoạt động hiến máu mới
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên hoạt động <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nhập tên hoạt động"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mô tả hoạt động
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nhập mô tả chi tiết về hoạt động"
                                rows="4"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Hình ảnh hoạt động
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-red-500 transition-colors">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-40 mx-auto rounded-lg object-cover shadow-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }}
                                                className="cursor-pointer absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500">
                                                    <span>Tải ảnh lên</span>
                                                    <input
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                                <p className="pl-1">hoặc kéo thả</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, JPEG lên đến 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="province-dropdown relative bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                    className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300"
                                >
                                    <span className={selectedProvince ? "text-gray-900" : "text-gray-400"}>
                                        {selectedProvince ? getProvinceName(selectedProvince) : "Chọn tỉnh/thành phố"}
                                    </span>
                                    {loadingProvinces ? (
                                        <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                    ) : (
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {showProvinceDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                        <button
                                            type="button"
                                            onClick={() => handleProvinceSelect("")}
                                            className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedProvince ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Chọn tỉnh/thành phố
                                        </button>
                                        {loadingProvinces ? (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                            </div>
                                        ) : (
                                            provinces.map(province => (
                                                <button
                                                    key={province.code}
                                                    type="button"
                                                    onClick={() => handleProvinceSelect(province.code.toString())}
                                                    className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedProvince === province.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    {province.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="district-dropdown relative bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Quận/Huyện
                                </label>
                                <button
                                    type="button"
                                    onClick={() => selectedProvince && !loadingDistricts && setShowDistrictDropdown(!showDistrictDropdown)}
                                    className={`cursor-pointer w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300 ${(!selectedProvince || loadingDistricts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!selectedProvince || loadingDistricts}
                                >
                                    <span className={selectedDistrict ? "text-gray-900" : "text-gray-400"}>
                                        {selectedDistrict ? getDistrictName(selectedDistrict) : "Chọn quận/huyện"}
                                    </span>
                                    {loadingDistricts ? (
                                        <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                    ) : (
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {showDistrictDropdown && selectedProvince && (
                                    <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                        <button
                                            type="button"
                                            onClick={() => handleDistrictSelect("")}
                                            className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedDistrict ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Chọn quận/huyện
                                        </button>
                                        {loadingDistricts ? (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                            </div>
                                        ) : (
                                            districts.map(district => (
                                                <button
                                                    key={district.code}
                                                    type="button"
                                                    onClick={() => handleDistrictSelect(district.code.toString())}
                                                    className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedDistrict === district.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    {district.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Địa chỉ cụ thể <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Số nhà, tên đường, phường/xã"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thời gian bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.time_start}
                                onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Thời gian bắt đầu phải lớn hơn thời gian hiện tại
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
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Tạo hoạt động</span>
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

const StaffEventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);

    const user = useContext(UserContexts);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const [provinces, setProvinces] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalEvents, setTotalEvents] = useState(0);
    const [createdEventsCount, setCreatedEventsCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProvinces();
        loadCreatedEventsCount();
    }, []);

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (err) {
            console.error("Error fetching provinces:", err);
            setProvinces([]);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadCreatedEventsCount = async () => {
        try {
            const response = await authApis().get(`${endpoints.staff_donation_event}?page=1&page_size=1`);
            setCreatedEventsCount(response.data.count || 0);
        } catch (err) {
            console.error("Error fetching total created events:", err);
        }
    };

    const loadEvents = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setEvents([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints.staff_donation_event;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (selectedProvince) {
                const selectedProvinceObj = provinces.find(p => p.code === parseInt(selectedProvince));
                if (selectedProvinceObj) {
                    params.append('province', selectedProvinceObj.name);
                }
            }

            if (filterType !== 'all') {
                if (filterType === 'ongoing') {
                    params.append('status', 'ongoing');
                } else if (filterType === 'upcoming') {
                    params.append('status', 'upcoming');
                } else if (filterType === 'ended') {
                    params.append('status', 'ended');
                }
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            if (isLoadMore) {
                setEvents(prev => [...prev, ...response.data.results]);
            } else {
                setEvents(response.data.results);
            }

            setHasNextPage(response.data.next !== null);
            setTotalEvents(response.data.count);

        } catch (err) {
            console.error("Error fetching staff events:", err);
            setError("Không thể tải danh sách hoạt động. Vui lòng thử lại sau.");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const debouncedLoadEvents = useCallback(
        debounce(() => {
            setPage(1);
            loadEvents(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, selectedProvince, filterType]
    );

    const getEventStatus = (event) => {
        if (!event) return 'ended';

        if (event.is_expire === true) {
            return 'ended';
        }

        if (typeof event.status === 'string') {
            const normalizedStatus = event.status.toLowerCase();
            if (['ongoing', 'upcoming', 'ended'].includes(normalizedStatus)) {
                return normalizedStatus;
            }
        }

        const now = new Date().getTime();
        const start = new Date(event.time_start).getTime();

        if (Number.isNaN(start)) {
            return 'ended';
        }

        if (start > now) return 'upcoming';
        return 'ongoing';
    };

    const getStatusColor = (event) => {
        const status = getEventStatus(event);
        if (status === 'ended') return 'bg-gradient-to-r from-gray-500 to-gray-600';
        if (status === 'ongoing') return 'bg-gradient-to-r from-green-500 to-emerald-500';
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    };

    const getStatusText = (event) => {
        if (event.is_expire === true) {
            return 'Đã kết thúc';
        }
        const status = getEventStatus(event);
        if (status === 'ended') return 'Đã kết thúc';
        if (status === 'ongoing') return 'Đang diễn ra';

        const now = new Date();
        const eventDate = new Date(event.time_start);
        const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Ngày mai';
        if (diffDays <= 3) return `Còn ${diffDays} ngày`;
        return 'Sắp diễn ra';
    };

    const getStatusLabel = () => {
        switch (filterType) {
            case 'ongoing': return 'Đang diễn ra';
            case 'upcoming': return 'Sắp diễn ra';
            case 'ended': return 'Đã kết thúc';
            default: return 'Tất cả';
        }
    };

    const getProvinceLabel = () => {
        if (!selectedProvince) return 'Tất cả tỉnh/thành';
        const province = provinces.find(p => p.code === parseInt(selectedProvince));
        return province ? province.name : 'Tất cả tỉnh/thành';
    };

    useEffect(() => {
        debouncedLoadEvents();
        return () => {
            debouncedLoadEvents.cancel();
        };
    }, [searchTerm, selectedProvince, filterType, debouncedLoadEvents]);

    useEffect(() => {
        if (page > 1) {
            loadEvents(true);
        }
    }, [page]);

    const handleCreateEvent = () => {
        setShowCreateDialog(true);
    };

    const handleCreateEventSuccess = () => {
        setPage(1);
        loadEvents(false);
        loadCreatedEventsCount();
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleProvinceChange = (provinceCode) => {
        setSelectedProvince(provinceCode);
        setShowProvinceDropdown(false);
        setPage(1);
    };

    const handleFilterTypeChange = (type) => {
        setFilterType(type);
        setShowStatusDropdown(false);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSelectedProvince("");
        setSearchTerm("");
        setFilterType('all');
        setPage(1);
        setTimeout(() => loadEvents(false), 0);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadEvents(false);
    };

    const selectedProvinceName = selectedProvince
        ? provinces.find(p => p.code === parseInt(selectedProvince))?.name
        : '';

    const filteredEvents = events.filter(event => {
        const matchesSearch = searchTerm === '' ||
            event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const eventProvince = (event.province || '').toString().trim().toLowerCase();
        const matchesProvince = !selectedProvinceName ||
            eventProvince === selectedProvinceName.toLowerCase() ||
            eventProvince === selectedProvince.toLowerCase();

        const status = getEventStatus(event);
        const matchesStatus = filterType === 'all' ||
            (filterType === 'ongoing' && status === 'ongoing') ||
            (filterType === 'upcoming' && status === 'upcoming') ||
            (filterType === 'ended' && status === 'ended');

        return matchesSearch && matchesProvince && matchesStatus;
    });

    const visibleEventsCount = (searchTerm || selectedProvince || filterType !== 'all')
        ? filteredEvents.length
        : totalEvents;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusDropdown && !event.target.closest('.status-dropdown')) {
                setShowStatusDropdown(false);
            }
            if (showProvinceDropdown && !event.target.closest('.province-dropdown')) {
                setShowProvinceDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusDropdown, showProvinceDropdown]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Quản lý hoạt động | Dòng Máu Lạc Hồng</title>
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
                            <Droplet className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 min-h-[22rem] flex flex-col justify-center">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <HandHeart className="w-4 h-4" />
                                <span className="text-sm font-medium">Quản lý hoạt động</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <h1 className="text-4xl md:text-5xl font-bold">Hoạt động hiến máu đã tổ chức</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Quản lý các hoạt động hiến máu bạn đã tạo. Theo dõi số lượng người đăng ký và kết quả.
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{createdEventsCount}</div>
                                        <div className="text-sm text-white/80">Hoạt động đã tạo</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Create Event Card */}
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="text-center mb-5">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Tạo hoạt động mới</h3>
                                    <p className="text-white/80 text-sm">Tạo hoạt động hiến máu để kêu gọi cộng đồng</p>
                                </div>
                                <button
                                    onClick={handleCreateEvent}
                                    className="cursor-pointer w-full bg-white text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300"
                                >
                                    Tạo hoạt động hiến máu
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
                                    placeholder="Tìm kiếm hoạt động của bạn..."
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
                                            loadEvents(false);
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
                                <Filter className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* Status Dropdown */}
                            <div className="relative status-dropdown">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[160px] justify-between"
                                >
                                    <span className="text-gray-700 font-medium">{getStatusLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                        {[
                                            { value: 'all', label: 'Tất cả' },
                                            { value: 'ongoing', label: 'Đang diễn ra' },
                                            { value: 'upcoming', label: 'Sắp diễn ra' },
                                            { value: 'ended', label: 'Đã kết thúc' }
                                        ].map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterTypeChange(option.value)}
                                                className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === option.value ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Province Dropdown */}
                            <div className="relative province-dropdown">
                                <button
                                    onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                    className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[180px] justify-between"
                                    disabled={loadingProvinces}
                                >
                                    <span className="text-gray-700 font-medium truncate">{getProvinceLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showProvinceDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-[280px] max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                        <button
                                            onClick={() => handleProvinceChange('')}
                                            className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedProvince ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Tất cả tỉnh/thành
                                        </button>
                                        {loadingProvinces ? (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                            </div>
                                        ) : (
                                            provinces.map(province => (
                                                <button
                                                    key={province.code}
                                                    onClick={() => handleProvinceChange(province.code.toString())}
                                                    className={`cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedProvince === province.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    {province.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

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

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                                <button onClick={() => setShowFilters(false)} className="cursor-pointer p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'all', label: 'Tất cả' },
                                            { value: 'ongoing', label: 'Đang diễn ra' },
                                            { value: 'upcoming', label: 'Sắp diễn ra' },
                                            { value: 'ended', label: 'Đã kết thúc' }
                                        ].map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    handleFilterTypeChange(option.value);
                                                    setShowFilters(false);
                                                }}
                                                className={`cursor-pointer px-4 py-2 rounded-lg border transition-all ${filterType === option.value
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                                    <select
                                        value={selectedProvince}
                                        onChange={(e) => {
                                            handleProvinceChange(e.target.value);
                                            setShowFilters(false);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        disabled={loadingProvinces}
                                    >
                                        <option value="">Tất cả tỉnh/thành</option>
                                        {provinces.map(province => (
                                            <option key={province.code} value={province.code}>{province.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(selectedProvince || searchTerm || filterType !== 'all') && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {filterType !== 'all' && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Trạng thái: {getStatusLabel()}</span>
                                    <button onClick={() => handleFilterTypeChange('all')} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>{provinces.find(p => p.code === parseInt(selectedProvince))?.name}</span>
                                    <button onClick={() => { setSelectedProvince(""); setPage(1); loadEvents(false); }} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>"{searchTerm}"</span>
                                    <button onClick={() => { setSearchTerm(""); setPage(1); loadEvents(false); }} className="cursor-pointer p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {(selectedProvince || searchTerm || filterType !== 'all') && (
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
                {/* Mobile Create Button */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={handleCreateEvent}
                        className="cursor-pointer w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo hoạt động mới
                    </button>
                </div>

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-5">
                                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                    <div className="space-y-2 mb-4">
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
                {!loading && !error && filteredEvents.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Calendar className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || selectedProvince || filterType !== 'all' ? "Không tìm thấy hoạt động" : "Chưa có hoạt động nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedProvince || filterType !== 'all'
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Hãy tạo hoạt động hiến máu đầu tiên của bạn để kêu gọi cộng đồng"}
                        </p>

                        {!searchTerm && !selectedProvince && filterType === 'all' && (
                            <button
                                onClick={handleCreateEvent}
                                className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo hoạt động ngay
                            </button>
                        )}
                    </div>
                )}

                {/* Events List */}
                {!loading && !error && filteredEvents.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{visibleEventsCount}</span>
                                </div>
                                <span className="text-gray-600">hoạt động {filterType !== 'all' && "phù hợp"}</span>
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-300 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
                            >
                                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Làm mới</span>
                            </button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((event) => (
                                    <div key={event.id} className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200">
                                        <div className="relative h-48 overflow-hidden">
                                            {event.image_url ? (
                                                <img
                                                    src={getImageUrl(event.image_url)}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                                    <Droplet className="h-16 w-16 text-white opacity-50" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                    {getStatusText(event)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                {event.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                                {event.description || "Cùng tham gia hiến máu cứu người"}
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-start text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                                    <span className="truncate">{event.location}, {event.sub_district}, {event.province}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                    <span>{formatDate(event.time_start)}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-red-500 mr-2" />
                                                    <span>{formatTime(event.time_start)}</span>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/staff-donation-event/${event.id}/registrations`}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                <span>Quản lý hoạt động</span>
                                                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredEvents.map((event) => (
                                    <div key={event.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="md:w-64 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-red-400 to-red-600">
                                                {event.image_url ? (
                                                    <img
                                                        src={getImageUrl(event.image_url)}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Droplet className="h-12 w-12 text-white opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                        {getStatusText(event)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-5">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                                    {event.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                                    {event.description || "Cùng tham gia hiến máu cứu người"}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-red-500 mr-2" />
                                                        <span className="truncate">{event.province}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{formatDate(event.time_start)}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{formatTime(event.time_start)}</span>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/staff-donation-event/${event.id}/registrations`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md"
                                                >
                                                    <span>Quản lý hoạt động</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
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
                                    className="cursor-pointer group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Xem thêm hoạt động</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && filteredEvents.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {visibleEventsCount} hoạt động</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Event Dialog */}
            <CreateEventDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSuccess={handleCreateEventSuccess}
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

export default StaffEventList;
