import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import {
    Calendar, MapPin, Clock, Droplet, Heart, Search, Filter,
    AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell,
    HeartPlus, HeartPulse, Plus, Save, Loader, Upload, Image as ImageIcon,
    UserCog, Settings, Edit, Trash2, ChevronDown
} from 'lucide-react';
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import '../../styles/EventList.css';
import { UserContexts } from '../../configs/UserContexts';

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

    // Province states
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const user = useContext(UserContexts);

    // Fetch provinces on mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    // Fetch districts when province changes
    useEffect(() => {
        if (selectedProvince) {
            fetchDistricts(selectedProvince);
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedProvince]);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                staff: user?.id || null
            }));
            setError('');
            setSelectedProvince('');
            setSelectedDistrict('');
            setImageFile(null);
            setImagePreview('');
        }
    }, [isOpen, user]);

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

    const handleProvinceChange = (e) => {
        const code = e.target.value;
        setSelectedProvince(code);
        const provinceObj = provinces.find(p => p.code === parseInt(code));
        if (provinceObj) {
            setFormData(prev => ({ ...prev, province: provinceObj.name, sub_district: '' }));
        }
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value;
        setSelectedDistrict(code);
        const districtObj = districts.find(d => d.code === parseInt(code));
        if (districtObj) {
            setFormData(prev => ({ ...prev, sub_district: districtObj.name }));
        }
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

        // Validation
        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên sự kiện');
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

        // Check if start time is in the future
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
                setFormData({
                    title: '',
                    description: '',
                    province: '',
                    sub_district: '',
                    location: '',
                    time_start: '',
                    staff: user?.id || null
                });
                setSelectedProvince('');
                setSelectedDistrict('');
                setImageFile(null);
                setImagePreview('');
            }
        } catch (error) {
            console.error("Error creating event:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages[0] || 'Có lỗi xảy ra, vui lòng thử lại');
            } else {
                setError('Không thể tạo sự kiện. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all max-h-[90vh] overflow-y-auto">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Tạo sự kiện hiến máu mới
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
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Tên sự kiện */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên sự kiện <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nhập tên sự kiện"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả sự kiện
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nhập mô tả chi tiết về sự kiện"
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Hình ảnh */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh sự kiện
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-red-500 transition-colors">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-40 mx-auto rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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

                        {/* Địa điểm */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={selectedProvince}
                                    onChange={handleProvinceChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quận/Huyện
                                </label>
                                <select
                                    value={selectedDistrict}
                                    onChange={handleDistrictChange}
                                    disabled={!selectedProvince || loadingDistricts}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Địa chỉ cụ thể <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Số nhà, tên đường, phường/xã"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Thời gian */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.time_start}
                                onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Thời gian bắt đầu phải lớn hơn thời gian hiện tại
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Tạo sự kiện</span>
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

    const [filteredCount, setFilteredCount] = useState(0);    // sau filter

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalEvents, setTotalEvents] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProvinces();
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
                params.append('status', filterType);
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            if (isLoadMore) {
                setEvents(prevEvents => [...prevEvents, ...response.data.results]);
            } else {
                setEvents(response.data.results);
            }

            setFilteredCount(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching staff events:", err);
            setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
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
        [searchTerm, selectedProvince, filterType, provinces]
    );

    const getEventStatus = (event) => {
        // If the event has is_expire flag set to true, mark as ended
        if (event.is_expire === true) {
            return 'ended';
        }

        const now = new Date().getTime();
        const start = new Date(event.time_start).getTime();

        if (start > now) return 'upcoming';
        if (start <= now) return 'ongoing';
        return 'ended';
    };

    const fetchTotalEvents = async () => {
        try {
            const res = await authApis().get(endpoints.staff_donation_event);
            setTotalEvents(res.data.count);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTotalEvents();
    }, []);

    const filteredAndSortedEvents = events
        .filter(event => {
            const matchesSearch = searchTerm === '' ||
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProvince = !selectedProvince ||
                event.province === provinces.find(p => p.code === parseInt(selectedProvince))?.name;

            // Get status based on is_expire and time_start
            let status;
            if (event.is_expire === true) {
                status = 'ended';
            } else {
                const now = new Date().getTime();
                const start = new Date(event.time_start).getTime();
                if (start > now) status = 'upcoming';
                else if (start <= now) status = 'ongoing';
                else status = 'ended';
            }

            const matchesStatus = filterType === 'all' ||
                (filterType === 'ongoing' && status === 'ongoing') ||
                (filterType === 'upcoming' && status === 'upcoming') ||
                (filterType === 'ended' && status === 'ended');

            return matchesSearch && matchesProvince && matchesStatus;
        })
        .sort((a, b) => {
            const priority = { 'ongoing': 1, 'upcoming': 2, 'ended': 3 };

            // Get status for event a
            let statusA;
            if (a.is_expire === true) {
                statusA = 'ended';
            } else {
                const now = new Date().getTime();
                const startA = new Date(a.time_start).getTime();
                if (startA > now) statusA = 'upcoming';
                else if (startA <= now) statusA = 'ongoing';
                else statusA = 'ended';
            }

            // Get status for event b
            let statusB;
            if (b.is_expire === true) {
                statusB = 'ended';
            } else {
                const now = new Date().getTime();
                const startB = new Date(b.time_start).getTime();
                if (startB > now) statusB = 'upcoming';
                else if (startB <= now) statusB = 'ongoing';
                else statusB = 'ended';
            }

            return priority[statusA] - priority[statusB];
        });

    useEffect(() => {
        if (provinces.length > 0) {
            debouncedLoadEvents();
        }
        return () => {
            debouncedLoadEvents.cancel();
        };
    }, [searchTerm, selectedProvince, filterType, provinces, debouncedLoadEvents]);

    useEffect(() => {
        if (page > 1) {
            loadEvents(true);
        }
    }, [page]);

    const handleCreateEvent = () => {
        setShowCreateDialog(true);
    };

    const handleCreateEventSuccess = (newEvent) => {
        setPage(1);
        loadEvents(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadEvents(false);
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
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadEvents(false);
    };

    const getStatusColor = (event) => {
        const status = getEventStatus(event);
        if (status === 'ended') return 'bg-gray-500';
        if (status === 'ongoing') return 'bg-green-500';
        return 'bg-blue-500';
    };

    const getStatusText = (event) => {
        // Check if event is expired
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

    // Close dropdowns when clicking outside
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
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
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

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <UserCog className="w-4 h-4" />
                                <span className="text-sm font-medium">Quản lý sự kiện</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Sự kiện hiến máu của tôi
                            </h1>

                            <p className="text-xl text-red-100 max-w-2xl mx-auto md:mx-0 mb-8">
                                Quản lý các sự kiện hiến máu bạn đã tạo. Theo dõi số lượng người đăng ký và kết quả.
                            </p>

                            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{totalEvents}</div>
                                        <div className="text-sm text-white/80">Sự kiện đã tạo</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Tạo sự kiện mới</h3>
                                    <p className="text-white/80 text-sm">Tạo sự kiện hiến máu để kêu gọi cộng đồng</p>
                                </div>
                                <button onClick={handleCreateEvent} className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                                    Tạo sự kiện hiến máu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </section>

            {/* Search & Filter Section */}
            <section className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="w-full lg:w-[450px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sự kiện của bạn"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadEvents(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <Filter className="h-5 w-5" />
                                <span>Bộ lọc</span>
                            </button>

                            {/* Status Dropdown */}
                            <div className="relative status-dropdown">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors min-w-[180px] justify-between"
                                >
                                    <span className="text-gray-700">{getStatusLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-30">
                                        <button
                                            onClick={() => handleFilterTypeChange('all')}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === 'all' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => handleFilterTypeChange('ongoing')}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === 'ongoing' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                Đang diễn ra
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleFilterTypeChange('upcoming')}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === 'upcoming' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                Sắp diễn ra
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleFilterTypeChange('ended')}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filterType === 'ended' ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                Đã kết thúc
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Province Dropdown */}
                            <div className="relative province-dropdown">
                                <button
                                    onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors min-w-[200px] justify-between"
                                    disabled={loadingProvinces}
                                >
                                    <span className="text-gray-700 truncate">{getProvinceLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {showProvinceDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-[280px] max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-y-auto z-30">
                                        <button
                                            onClick={() => handleProvinceChange('')}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedProvince ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                        >
                                            Tất cả tỉnh/thành
                                        </button>
                                        {loadingProvinces ? (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                <Loader className="w-5 h-5 animate-spin mx-auto" />
                                            </div>
                                        ) : (
                                            provinces.map(province => (
                                                <button
                                                    key={province.code}
                                                    onClick={() => handleProvinceChange(province.code.toString())}
                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedProvince === province.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    {province.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* View Mode Buttons */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Bộ lọc nâng cao</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => { setFilterType('all'); setShowFilters(false); setPage(1); loadEvents(false); }} className={`px-4 py-2 rounded-lg border ${filterType === 'all' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200'}`}>Tất cả</button>
                                        <button onClick={() => { setFilterType('ongoing'); setShowFilters(false); setPage(1); loadEvents(false); }} className={`px-4 py-2 rounded-lg border ${filterType === 'ongoing' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200'}`}>Đang diễn ra</button>
                                        <button onClick={() => { setFilterType('upcoming'); setShowFilters(false); setPage(1); loadEvents(false); }} className={`px-4 py-2 rounded-lg border ${filterType === 'upcoming' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200'}`}>Sắp diễn ra</button>
                                        <button onClick={() => { setFilterType('ended'); setShowFilters(false); setPage(1); loadEvents(false); }} className={`px-4 py-2 rounded-lg border ${filterType === 'ended' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200'}`}>Đã kết thúc</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                                    <select value={selectedProvince} onChange={(e) => { handleProvinceChange(e.target.value); setShowFilters(false); }} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl" disabled={loadingProvinces}>
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
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm">
                                    <span>Trạng thái: {
                                        filterType === 'ongoing' ? 'Đang diễn ra' : 
                                        filterType === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'
                                    }</span>
                                    <button onClick={() => handleFilterTypeChange('all')} className="p-1 hover:bg-white/20 rounded-lg"><X className="h-3 w-3" /></button>
                                </span>
                            )}
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm">
                                    <span>{provinces.find(p => p.code === parseInt(selectedProvince))?.name}</span>
                                    <button onClick={() => { setSelectedProvince(""); setPage(1); loadEvents(false); }} className="p-1 hover:bg-white/20 rounded-lg"><X className="h-3 w-3" /></button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm">
                                    <Search className="h-4 w-4" />
                                    <span>"{searchTerm}"</span>
                                    <button onClick={() => { setSearchTerm(""); setPage(1); loadEvents(false); }} className="p-1 hover:bg-white/20 rounded-lg"><X className="h-3 w-3" /></button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Mobile Create Button */}
                    <div className="lg:hidden mb-6">
                        <button onClick={handleCreateEvent} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" />
                            Tạo sự kiện mới
                        </button>
                    </div>

                    {/* Loading Skeleton */}
                    {loading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="h-6 bg-gray-200 rounded-lg mb-2"></div>
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

                    {error && !loading && (
                        <div className="max-w-2xl mx-auto mb-6">
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-800 mb-1">Đã xảy ra lỗi</h3>
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                    <button onClick={handleRefresh} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Thử lại</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && filteredAndSortedEvents.length === 0 && (
                        <div className="text-center py-20">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="h-16 w-16 text-red-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {searchTerm || selectedProvince || filterType !== 'all' ? "Không tìm thấy sự kiện" : "Chưa có sự kiện nào"}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedProvince || filterType !== 'all' ? "Thử thay đổi bộ lọc" : "Hãy tạo sự kiện hiến máu đầu tiên của bạn"}
                            </p>
                            {!searchTerm && !selectedProvince && filterType === 'all' && (
                                <button onClick={handleCreateEvent} className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold">
                                    Tạo sự kiện ngay
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && filteredAndSortedEvents.length > 0 && (
                        <>
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl">
                                        <span className="font-bold">{filteredAndSortedEvents.length}</span>
                                    </div>
                                    <span className="text-gray-600">sự kiện</span>
                                </div>
                                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-xl">
                                    <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Làm mới</span>
                                </button>
                            </div>

                            {viewMode === 'grid' ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredAndSortedEvents.map((event) => (
                                        <div key={event.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                                            <div className="relative h-48 overflow-hidden">
                                                {event.image_url ? (
                                                    <img src={getImageUrl(event.image_url)} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                                        <Droplet className="h-16 w-16 text-white opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold`}>
                                                        {getStatusText(event)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                                                <p className="text-gray-600 mb-4 line-clamp-2">{event.description || "Cùng tham gia hiến máu cứu người"}</p>
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-start text-gray-600">
                                                        <MapPin className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                                        <span className="text-sm">{event.location}, {event.sub_district}, {event.province}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <Calendar className="h-4 w-4 text-red-600 mr-2" />
                                                        <span className="text-sm">{formatDate(event.time_start)}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <Clock className="h-4 w-4 text-red-600 mr-2" />
                                                        <span className="text-sm">{formatTime(event.time_start)}</span>
                                                    </div>
                                                </div>
                                                <Link to={`/staff-donation-event/${event.id}/registrations`} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all">
                                                    <span>Quản lý sự kiện</span>
                                                    <ChevronRight className="h-5 w-5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredAndSortedEvents.map((event) => (
                                        <div key={event.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden">
                                            <div className="flex flex-col md:flex-row">
                                                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                                                    {event.image_url ? (
                                                        <img src={getImageUrl(event.image_url)} alt={event.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                                            <Droplet className="h-16 w-16 text-white opacity-50" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-4 left-4">
                                                        <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold`}>
                                                            {getStatusText(event)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-6">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                                    <p className="text-gray-600 mb-4">{event.description || "Cùng tham gia hiến máu cứu người"}</p>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-center text-gray-600">
                                                            <MapPin className="h-4 w-4 text-red-600 mr-2" />
                                                            <span className="text-sm">{event.province}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="h-4 w-4 text-red-600 mr-2" />
                                                            <span className="text-sm">{formatDate(event.time_start)}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Clock className="h-4 w-4 text-red-600 mr-2" />
                                                            <span className="text-sm">{formatTime(event.time_start)}</span>
                                                        </div>
                                                    </div>
                                                    <Link to={`/staff-donation-event/${event.id}/registrations`} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600">
                                                        <span>Quản lý sự kiện</span>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasNextPage && (
                                <div className="flex justify-center mt-12">
                                    <button onClick={handleLoadMore} disabled={loadingMore} className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:opacity-50">
                                        {loadingMore ? (
                                            <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div><span className="ml-2">Đang tải...</span></>
                                        ) : (
                                            <>Xem thêm sự kiện <ChevronRight className="inline h-5 w-5 ml-1" /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Create Event Dialog */}
            <CreateEventDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSuccess={handleCreateEventSuccess}
            />
        </div>
    );
};

export default StaffEventList;