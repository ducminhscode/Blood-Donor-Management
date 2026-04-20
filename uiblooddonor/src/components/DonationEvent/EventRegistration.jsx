import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPulse, CheckCircle, XCircle, Clock as ClockIcon, UserCheck, UserX, Loader2, CalendarCheck, Grid, List, Filter as FilterIcon, Send, Eye, TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../configs/UserContexts';

const EventRegistration = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const user = useContext(UserContexts);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRegistrations, setTotalRegistrations] = useState(0);
    const [originalTotalRegistrations, setOriginalTotalRegistrations] = useState(0);
    const [originalCompletedCount, setOriginalCompletedCount] = useState(0);

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
            let url = endpoints['event_registration'];
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

            if (isLoadMore) {
                setRegistrations(prev => [...prev, ...response.data.results]);
            } else {
                setRegistrations(response.data.results);
            }

            setTotalRegistrations(response.data.count);

            if (!searchTerm && selectedStatus === 'all' && !dateRange.from && !dateRange.to && originalTotalRegistrations === 0) {
                setOriginalTotalRegistrations(response.data.count);
                const completedCount = response.data.results.filter(r => r.status === 4).length;
                setOriginalCompletedCount(completedCount);
            }

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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setPage(1);
        setShowStatusDropdown(false);
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

    const getStatusLabel = () => {
        if (selectedStatus === 'all') return 'Tất cả';
        return statusConfig[selectedStatus]?.label || 'Tất cả';
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
                            <CalendarCheck className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Lịch sử đăng ký của bạn</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <CalendarCheck className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Sự kiện đã đăng ký</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Theo dõi trạng thái và lịch sử tham gia các sự kiện hiến máu của bạn
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalTotalRegistrations}</div>
                                        <div className="text-sm text-white/80">Lượt đăng ký</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalCompletedCount}</div>
                                        <div className="text-sm text-white/80">Đã hoàn thành</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Card */}
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Heart className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Cảm ơn bạn!</h3>
                                    <p className="text-white/80 text-sm">Mỗi giọt máu đều quý giá</p>
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
                                    placeholder="Tìm kiếm theo tên sự kiện..."
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

                            {/* Status Dropdown */}
                            <div className="relative status-dropdown">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[160px] justify-between"
                                >
                                    <span className="text-gray-700 font-medium">{getStatusLabel()}</span>
                                    <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-90' : ''}`} />
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleStatusChange(option.value)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedStatus === option.value ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Date Filter Button */}
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Ngày đăng ký</span>
                            </button>

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
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
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
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Trạng thái</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    handleStatusChange(option.value);
                                                    setShowFilters(false);
                                                }}
                                                className={`px-3 py-2 rounded-lg border transition-all ${selectedStatus === option.value
                                                        ? 'border-red-500 bg-red-50 text-red-600'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <span className="text-sm">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày đăng ký</label>
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
                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                        <div className="h-6 w-24 bg-gray-200 rounded-lg"></div>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
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
                {!loading && !error && registrations.length === 0 && (
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
                            {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                ? "Không tìm thấy đăng ký phù hợp"
                                : "Bạn chưa đăng ký sự kiện nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Hãy tham gia các sự kiện hiến máu để cứu giúp những mảnh đời cần bạn"}
                        </p>

                        {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) ? (
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
                                Xóa tất cả bộ lọc
                            </button>
                        ) : (
                            <Link
                                to="/list-event"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <Heart className="w-5 h-5" />
                                Khám phá sự kiện
                            </Link>
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
                                            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            {/* Image Container */}
                                            <div className="relative h-48 overflow-hidden">
                                                {registration.donation_event?.image_url ? (
                                                    <img
                                                        src={getImageUrl(registration.donation_event.image_url)}
                                                        alt={registration.donation_event.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                                        <Droplet className="h-16 w-16 text-white opacity-50" />
                                                    </div>
                                                )}

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
                                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {registration.donation_event?.title || "Sự kiện hiến máu"}
                                                </h3>

                                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                                    {registration.donation_event?.description || "Cùng tham gia hiến máu cứu người"}
                                                </p>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-start text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                                        <span className="truncate">
                                                            {registration.donation_event?.location}, {registration.donation_event?.sub_district}, {registration.donation_event?.province}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{registration.donation_event?.time_start ? formatDate(registration.donation_event.time_start) : 'Chưa cập nhật'}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{registration.donation_event?.time_start ? formatTime(registration.donation_event.time_start) : 'Chưa cập nhật'}</span>
                                                    </div>
                                                </div>

                                                {/* Registration Info */}
                                                <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                                                    <div className="flex items-center justify-between text-sm mb-2">
                                                        <span className="text-gray-500">Người đăng ký:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {registration.last_name} {registration.first_name}
                                                        </span>
                                                    </div>
                                                    {registration.is_proxy && (
                                                        <div className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                                            <Users className="w-3 h-3" />
                                                            <span>Đăng ký hộ</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <Link
                                                    to={`/event-registration/${registration.id}`}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg"
                                                >
                                                    <span className="font-medium">Xem chi tiết</span>
                                                    <Eye className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
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
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {/* Image */}
                                                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-red-400 to-red-600">
                                                    {registration.donation_event?.image_url ? (
                                                        <img
                                                            src={getImageUrl(registration.donation_event.image_url)}
                                                            alt={registration.donation_event.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Droplet className="h-12 w-12 text-white opacity-50" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-4 left-4">
                                                        <span className={`${statusInfo.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-5">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {registration.donation_event?.title || "Sự kiện hiến máu"}
                                                        </h3>
                                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {formatRegistrationDate(registration.created_at)}
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                                        {registration.donation_event?.description || "Cùng tham gia hiến máu cứu người"}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <MapPin className="w-4 h-4 text-red-500 mr-2" />
                                                            <span className="truncate">{registration.donation_event?.province}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                            <span>{registration.donation_event?.time_start ? formatDate(registration.donation_event.time_start) : 'Chưa cập nhật'}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Users className="w-4 h-4 text-red-500 mr-2" />
                                                            <span>{registration.last_name} {registration.first_name}</span>
                                                        </div>
                                                        {registration.is_proxy && (
                                                            <div className="flex items-center text-orange-600 text-sm">
                                                                <Users className="w-4 h-4 mr-2" />
                                                                <span>Đăng ký hộ</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Link
                                                        to={`/event-registration/${registration.id}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md text-sm font-medium"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Xem chi tiết
                                                    </Link>
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
                                                <Loader2 className="animate-spin w-5 h-5" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>Xem thêm đăng ký</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && registrations.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalRegistrations} đăng ký</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

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

export default EventRegistration;