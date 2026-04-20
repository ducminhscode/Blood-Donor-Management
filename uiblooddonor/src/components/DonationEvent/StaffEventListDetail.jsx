import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPulse, CheckCircle, XCircle, Clock as ClockIcon, UserCheck, UserX, Loader2, CalendarCheck, User, Mail, Phone, IdCard, Briefcase, Building, Calendar as CalendarIcon, UserPlus, Eye, ChevronLeft, RefreshCw, Info, FileText, NotepadText, InfoIcon, VenusAndMars, Edit, Trash2, Save, Upload, Image as ImageIcon, TrendingUp, Award as AwardIcon, Shield, CheckCircle2, Send, Grid, List, Filter as FilterIcon, XCircle as XCircleIcon, AlertTriangle } from 'lucide-react';
import { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime, formatDateTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';

// Edit Event Dialog Component
const EditEventDialog = ({ isOpen, onClose, onSuccess, event }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        province: '',
        sub_district: '',
        location: '',
        time_start: '',
        is_expire: '',
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
        if (isOpen && event) {
            const provinceObj = provinces.find(p => p.name === event.province);
            if (provinceObj) {
                setSelectedProvince(provinceObj.code.toString());
            }

            let localTimeStart = '';
            if (event.time_start) {
                const utcDate = new Date(event.time_start);
                const localDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
                localTimeStart = localDate.toISOString().slice(0, 16);
            }

            setFormData({
                title: event.title || '',
                description: event.description || '',
                province: event.province || '',
                sub_district: event.sub_district || '',
                location: event.location || '',
                time_start: localTimeStart,
                is_expire: event.is_expire || false,
            });
            setImagePreview(event.image_url ? getImageUrl(event.image_url) : '');
            setError('');
        }
    }, [isOpen, event, provinces]);

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

            if (event?.sub_district) {
                const districtObj = data.districts?.find(d => d.name === event.sub_district);
                if (districtObj) {
                    setSelectedDistrict(districtObj.code.toString());
                }
            }
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

        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description || '');
            submitData.append('province', formData.province);
            submitData.append('sub_district', formData.sub_district || '');
            submitData.append('location', formData.location);
            submitData.append('is_expire', formData.is_expire);
            const startTimeLocal = new Date(formData.time_start);
            const startTimeUTC = startTimeLocal.toISOString();
            submitData.append('time_start', startTimeUTC);

            if (imageFile) {
                submitData.append('image_url', imageFile);
            }

            const url = endpoints.donation_event_detail.replace('${id}', event.id);
            const response = await authApis().put(url, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200) {
                onSuccess(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Error updating event:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages[0] || 'Có lỗi xảy ra, vui lòng thử lại');
            } else {
                setError('Không thể cập nhật sự kiện. Vui lòng thử lại sau.');
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
                                <Edit className="w-5 h-5" />
                                Chỉnh sửa sự kiện
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên sự kiện <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nhập tên sự kiện"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mô tả sự kiện
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nhập mô tả chi tiết về sự kiện"
                                rows="4"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Hình ảnh sự kiện
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
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
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
                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Quận/Huyện
                                </label>
                                <select
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
                                <span className="text-sm font-medium text-gray-700">
                                    Đánh dấu sự kiện đã kết thúc
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                Khi đánh dấu, sự kiện sẽ không hiển thị cho người dùng đăng ký mới
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
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

const StaffEventListDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [registrations, setRegistrations] = useState([]);
    const [eventInfo, setEventInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRegistrations, setTotalRegistrations] = useState(0);
    const [originalTotalRegistrations, setOriginalTotalRegistrations] = useState(0);
    const [originalCompletedCount, setOriginalCompletedCount] = useState(0);

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const statusConfig = {
        0: { label: 'Đã đăng ký', color: 'bg-gradient-to-r from-blue-500 to-blue-600', textColor: 'text-white', bgColor: 'bg-blue-50' },
        1: { label: 'Đã xác nhận', color: 'bg-gradient-to-r from-green-500 to-emerald-500', textColor: 'text-white', bgColor: 'bg-green-50' },
        2: { label: 'Từ chối', color: 'bg-gradient-to-r from-red-500 to-red-600', textColor: 'text-white', bgColor: 'bg-red-50' },
        3: { label: 'Đã Check-in', color: 'bg-gradient-to-r from-purple-500 to-purple-600', textColor: 'text-white', bgColor: 'bg-purple-50' },
        4: { label: 'Đã hoàn thành', color: 'bg-gradient-to-r from-emerald-500 to-green-500', textColor: 'text-white', bgColor: 'bg-emerald-50' }
    };

    const statusOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: '0', label: 'Đã đăng ký' },
        { value: '1', label: 'Đã xác nhận' },
        { value: '2', label: 'Từ chối' },
        { value: '3', label: 'Đã Check-in' },
        { value: '4', label: 'Đã hoàn thành' }
    ];

    const loadRegistrations = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setRegistrations([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints['staff_registrations_event'].replace('${id}', id);
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
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
            const results = response.data.results || [];

            if (isLoadMore) {
                setRegistrations(prev => [...prev, ...results]);
            } else {
                setRegistrations(results);
                if (!searchTerm && selectedStatus === 'all' && !dateRange.from && !dateRange.to && originalTotalRegistrations === 0) {
                    setOriginalTotalRegistrations(response.data.count);
                    const completedCount = results.filter(r => r.status === 4).length;
                    setOriginalCompletedCount(completedCount);
                }
            }

            setTotalRegistrations(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching registrations:", err);
            setError("Không thể tải danh sách đăng ký. Vui lòng thử lại sau.");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const loadEventInfo = async () => {
        try {
            const response = await authApis().get(endpoints['staff_donation_event_detail'].replace('${id}', id));
            setEventInfo(response.data);
        } catch (err) {
            console.error("Error loading event info:", err);
        }
    };

    const handleEditEvent = () => {
        setShowEditDialog(true);
    };

    const handleUpdateEventSuccess = (updatedEvent) => {
        setEventInfo(updatedEvent);
        setPage(1);
        loadRegistrations(false);
    };

    const handleDeleteEvent = async () => {
        setDeleting(true);
        try {
            const url = endpoints.donation_event_detail.replace('${id}', id);
            await authApis().delete(url);

            navigate('/staff-donation-event', {
                state: { message: 'Xóa sự kiện thành công!' }
            });
        } catch (err) {
            console.error("Error deleting event:", err);
            setError(err.response?.data?.error || 'Không thể xóa sự kiện. Vui lòng thử lại sau.');
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    const debouncedLoadRegistrations = useCallback(
        debounce(() => {
            setPage(1);
            loadRegistrations(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, selectedStatus, dateRange]
    );

    useEffect(() => {
        debouncedLoadRegistrations();
        return () => {
            debouncedLoadRegistrations.cancel();
        };
    }, [searchTerm, selectedStatus, dateRange, debouncedLoadRegistrations]);

    useEffect(() => {
        if (page > 1) {
            loadRegistrations(true);
        }
    }, [page]);

    useEffect(() => {
        if (id) {
            loadEventInfo();
        }
    }, [id]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setDateRange({ from: '', to: '' });
        setPage(1);
        setTimeout(() => loadRegistrations(false), 0);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadRegistrations(false);
        loadEventInfo();
    };

    const handleViewDetail = (registrationId) => {
        navigate(`/staff-donation-event/${id}/registrations/${registrationId}`);
    };

    const getStatusInfo = (statusCode) => {
        return statusConfig[statusCode] || {
            label: 'Không xác định',
            color: 'bg-gradient-to-r from-gray-500 to-gray-600',
            textColor: 'text-white',
            bgColor: 'bg-gray-50'
        };
    };

    const formatRegistrationDate = (dateString) => {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
                            <Droplet className="w-6 h-6 text-white opacity-20" />
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
                        <span className="text-white font-medium">Danh sách đăng ký</span>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    {eventInfo?.title || 'Danh sách đăng ký'}
                                </h1>
                                {eventInfo?.is_expire && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-md">
                                        Đã kết thúc
                                    </span>
                                )}
                            </div>
                            {eventInfo && (
                                <div className="flex flex-wrap gap-4 text-red-100">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(eventInfo.time_start)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {formatTime(eventInfo.time_start)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {eventInfo.location}, {eventInfo.sub_district}, {eventInfo.province}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleEditEvent}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/20"
                            >
                                <Edit className="w-5 h-5" />
                                <span className="font-medium">Chỉnh sửa</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600/80 backdrop-blur-sm rounded-xl hover:bg-red-700 transition-all duration-300"
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
                                    <NotepadText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{originalTotalRegistrations}</div>
                                    <div className="text-sm text-white/80">Lượt đăng ký</div>
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
                                    placeholder="Tìm kiếm theo tên người đăng ký..."
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
                                            loadRegistrations(false);
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

                            {/* Status Filter */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                    <span>Trạng thái</span>
                                    <ChevronRight className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                                </button>

                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="p-2">
                                        {statusOptions.map((option) => {
                                            const isSelected = selectedStatus === option.value;
                                            const status = option.value !== 'all' ? statusConfig[option.value] : null;

                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleStatusChange(option.value)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isSelected
                                                        ? option.value === 'all'
                                                            ? 'bg-red-600 text-white'
                                                            : `${status.bgColor} ${status.textColor}`
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    <span className="flex-1 text-left font-medium">{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
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

                    {/* Date Filter */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                <span className="text-sm">Ngày đăng ký</span>
                                {(dateRange.from || dateRange.to) && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                        </div>

                        {showDatePicker && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 animate-fadeIn">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc & Sắp xếp</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Trạng thái</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {statusOptions.map((option) => {
                                            const isSelected = selectedStatus === option.value;
                                            const status = option.value !== 'all' ? statusConfig[option.value] : null;

                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleStatusChange(option.value);
                                                        setShowFilters(false);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg border transition-all ${isSelected
                                                        ? option.value === 'all'
                                                            ? 'border-red-500 bg-red-50 text-red-600'
                                                            : `${status.bgColor} ${status.textColor} border-${status.color.split('-')[1]}-200`
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    <span className="text-sm">{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày đăng ký</label>
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                            placeholder="Từ ngày"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
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
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
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
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'list'
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
                    {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedStatus !== 'all' && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Trạng thái: {statusConfig[selectedStatus]?.label}</span>
                                    <button onClick={() => setSelectedStatus('all')} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {dateRange.from && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Từ: {formatDate(dateRange.from)}</span>
                                    <button onClick={() => setDateRange(prev => ({ ...prev, from: '' }))} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {dateRange.to && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Đến: {formatDate(dateRange.to)}</span>
                                    <button onClick={() => setDateRange(prev => ({ ...prev, to: '' }))} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button onClick={() => setSearchTerm("")} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
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
                {/* Error State */}
                {error && !loading && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-shake">
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
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="h-32 bg-gray-200"></div>
                                <div className="p-6">
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

                {/* Empty State */}
                {!loading && !error && registrations.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Users className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                ? "Không tìm thấy đăng ký phù hợp"
                                : "Chưa có đăng ký nào cho sự kiện này"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Hãy đợi người dùng đăng ký tham gia sự kiện"}
                        </p>

                        {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                )}

                {/* Results */}
                {!loading && !error && registrations.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{totalRegistrations}</span>
                                </div>
                                <span className="text-gray-600">
                                    đăng ký {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) && "phù hợp"}
                                </span>
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
                                {registrations.map((registration) => {
                                    const statusInfo = getStatusInfo(registration.status);

                                    return (
                                        <div
                                            key={registration.id}
                                            onClick={() => handleViewDetail(registration.id)}
                                            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-red-200"
                                        >
                                            {/* Header */}
                                            <div className="relative h-32 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                    <User className="w-10 h-10 text-red-600" />
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`${statusInfo.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>

                                                {/* Registration Date */}
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                                                        {formatRegistrationDate(registration.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                                                    {registration.last_name} {registration.first_name}
                                                </h3>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span className="truncate">{registration.phone}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span className="truncate">{registration.email}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <ClockIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                        <span>Dự kiến: {formatDateTime(registration.expected_arrive)}</span>
                                                    </div>
                                                </div>

                                                {registration.is_proxy && (
                                                    <div className="mb-4 p-2 bg-orange-50 rounded-lg border border-orange-100">
                                                        <div className="flex items-center gap-1 text-xs text-orange-600">
                                                            <UserPlus className="w-3 h-3" />
                                                            <span>Đăng ký hộ</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetail(registration.id);
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg"
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
                                {registrations.map((registration) => {
                                    const statusInfo = getStatusInfo(registration.status);

                                    return (
                                        <div
                                            key={registration.id}
                                            onClick={() => handleViewDetail(registration.id)}
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            <div className="p-5">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {registration.last_name} {registration.first_name}
                                                            </h3>
                                                            {registration.is_proxy && (
                                                                <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                                                    <UserPlus className="w-3 h-3" />
                                                                    Đăng ký hộ
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                                            <div className="flex items-center text-gray-600">
                                                                <Phone className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                                <span className="truncate">{registration.phone}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <Mail className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                                <span className="truncate">{registration.email}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <CalendarIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                                <span>{formatDate(registration.birth_date)}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <ClockIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                                <span>{formatDateTime(registration.expected_arrive)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`${statusInfo.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewDetail(registration.id);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md text-sm flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>Chi tiết</span>
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
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="animate-spin h-5 w-5" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>Xem thêm đăng ký</span>
                                                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && registrations.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalRegistrations} đăng ký</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialogs */}
            <EditEventDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSuccess={handleUpdateEventSuccess}
                event={eventInfo}
            />

            <ConfirmDeleteDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteEvent}
                title="Xóa sự kiện"
                message={`Bạn có chắc chắn muốn xóa sự kiện "${eventInfo?.title}"? Tất cả đăng ký liên quan cũng sẽ bị xóa.`}
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

export default StaffEventListDetail;