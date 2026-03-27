import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from "react-router-dom";
import {
    Calendar, MapPin, Clock, Droplet, Heart, Search, Filter,
    AlertCircle, ChevronRight, X, Sparkles, Users, Activity,
    Award, MapPinned, Bell, HeartPulse, CheckCircle, XCircle,
    Clock as ClockIcon, UserCheck, UserX, Loader2,
    CalendarCheck, Ambulance, Phone, Syringe, AlertTriangle, Hospital
} from 'lucide-react';
import { authApis, endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import '../../styles/EventList.css';
import { UserContexts } from '../../configs/UserContexts';

const EmergencyResponse = () => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const user = useContext(UserContexts);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalResponses, setTotalResponses] = useState(0);
    const [originalTotalResponses, setOriginalTotalResponses] = useState(0);
    const [originalCompletedCount, setOriginalCompletedCount] = useState(0);

    // Status config cho response
    const statusConfig = {
        1: { label: 'Đã chấp nhận', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
        2: { label: 'Đã từ chối', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' }
    };

    // Registration status config
    const registrationStatusConfig = {
        1: { label: 'Đã xác nhận', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
        3: { label: 'Đã Check-in', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
        4: { label: 'Đã hoàn thành', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
        '-1': { label: 'Chưa xác nhận', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
    };

    const getBloodTypeText = (bloodType) => {
        const bloodTypes = {
            0: 'O',
            1: 'A',
            2: 'B',
            3: 'AB'
        };
        return bloodTypes[bloodType] || 'Không xác định';
    };

    const getRhFactorText = (rhFactor) => {
        return rhFactor ? '+' : '-';
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
            let url = endpoints['emergency_responses'];
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (selectedStatus !== 'all') {
                params.append('status_response', selectedStatus);
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
                setResponses(prev => [...prev, ...response.data.results]);
            } else {
                setResponses(response.data.results);
            }

            setTotalResponses(response.data.count);

            if (!searchTerm && selectedStatus === 'all' && !dateRange.from && !dateRange.to && originalTotalResponses === 0) {
                setOriginalTotalResponses(response.data.count);
                const completedCount = response.data.results.filter(r => r.status_registration === 4).length;
                setOriginalCompletedCount(completedCount);
            }

            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching emergency responses:", err);
            setError("Không thể tải danh sách phản hồi cấp cứu. Vui lòng thử lại sau.");
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
        [searchTerm, selectedStatus, dateRange]
    );

    useEffect(() => {
        debouncedLoadResponses();
        return () => {
            debouncedLoadResponses.cancel();
        };
    }, [searchTerm, selectedStatus, dateRange, debouncedLoadResponses]);

    useEffect(() => {
        if (page > 1) {
            loadResponses(true);
        }
    }, [page]);

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
    };

    const getStatusInfo = (response) => {
        if (response.status_response === 1) {
            const regStatus = registrationStatusConfig[response.status_registration];
            return {
                label: regStatus?.label || 'Đã chấp nhận',
                color: regStatus?.color || 'bg-green-500',
                textColor: regStatus?.textColor || 'text-green-700',
                bgColor: regStatus?.bgColor || 'bg-green-50'
            };
        }
        if (response.status_response === 2) {
            return {
                label: 'Đã từ chối',
                color: 'bg-red-500',
                textColor: 'text-red-700',
                bgColor: 'bg-red-50'
            };
        }
        return {
            label: 'Đang xử lý',
            color: 'bg-gray-500',
            textColor: 'text-gray-700',
            bgColor: 'bg-gray-50'
        };
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                {/* Animated Elements */}
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
                            <Ambulance className="w-8 h-8 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Lịch sử hỗ trợ cấp cứu</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Yêu cầu cấp cứu đã phản hồi
                            </h1>

                            <p className="text-xl text-red-100 max-w-2xl mx-auto md:mx-0 mb-8">
                                Theo dõi các yêu cầu cấp cứu bạn đã hỗ trợ và trạng thái của chúng
                            </p>

                            {/* Stats - Cố định */}
                            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Ambulance className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalTotalResponses}</div>
                                        <div className="text-sm text-white/80">Lượt hỗ trợ</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {originalCompletedCount}
                                        </div>
                                        <div className="text-sm text-white/80">Đã hoàn thành</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Card */}
                        <div className="hidden lg:block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <HeartPulse className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Cảm ơn bạn!</h3>
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
            </section>

            {/* Search & Filter Section */}
            <section className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-[450px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên bệnh nhân"
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
                                            loadResponses(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Buttons - Desktop */}
                        <div className="hidden lg:flex items-center gap-3">
                            {/* Date Filter Button */}
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <span>Ngày phản hồi</span>
                            </button>

                            {/* View Mode Toggle */}
                            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng lưới"
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
                                    title="Xem dạng danh sách"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors w-full justify-center"
                        >
                            <Filter className="h-5 w-5" />
                            <span>Bộ lọc</span>
                            {(selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {/* Date Picker */}
                    {showDatePicker && (
                        <div className="hidden lg:block mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Bộ lọc</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">

                                {/* Date Filter - Mobile */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày phản hồi
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                            placeholder="Từ ngày"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                            placeholder="Đến ngày"
                                        />
                                    </div>
                                </div>

                                {/* View Mode - Mobile */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chế độ xem
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            <span>Dạng lưới</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'list'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                            <span>Dạng danh sách</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Apply Button - Mobile */}
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                                >
                                    Áp dụng bộ lọc
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(searchTerm || dateRange.from || dateRange.to) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {dateRange.from && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Từ: {formatDate(dateRange.from)}</span>
                                    <button
                                        onClick={() => setDateRange(prev => ({ ...prev, from: '' }))}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {dateRange.to && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Đến: {formatDate(dateRange.to)}</span>
                                    <button
                                        onClick={() => setDateRange(prev => ({ ...prev, to: '' }))}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadResponses(false);
                                        }}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
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
            </section>

            {/* Main Content */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Loading Skeleton */}
                    {loading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                            <div className="h-6 w-24 bg-gray-200 rounded-lg"></div>
                                        </div>
                                        <div className="h-6 bg-gray-200 rounded-lg mb-2"></div>
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

                    {error && !loading && (
                        <div className="max-w-2xl mx-auto mb-6">
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-800 mb-1">Đã xảy ra lỗi</h3>
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                    <button
                                        onClick={handleRefresh}
                                        className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && responses.length === 0 && (
                        <div className="text-center py-20">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform">
                                    <Ambulance className="h-16 w-16 text-red-600" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    0
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                    ? "Không tìm thấy phản hồi phù hợp"
                                    : "Bạn chưa hỗ trợ yêu cầu cấp cứu nào"}
                            </h3>

                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to
                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                    : "Hãy hỗ trợ các yêu cầu cấp cứu để cứu giúp những người cần máu gấp"}
                            </p>

                            {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) ? (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            ) : (
                                <Link
                                    to="/emergency-request-list"
                                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 inline-flex items-center gap-2"
                                >
                                    <HeartPulse className="w-5 h-5" />
                                    <span>Khám phá yêu cầu cấp cứu</span>
                                </Link>
                            )}
                        </div>
                    )}

                    {!loading && !error && responses.length > 0 && (
                        <>
                            {/* Results Header */}
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                        <span className="font-bold">{responses.length}</span>
                                    </div>
                                    <span className="text-gray-600">
                                        phản hồi {(searchTerm || selectedStatus !== 'all' || dateRange.from || dateRange.to) && "phù hợp"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleRefresh}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
                                        disabled={loading}
                                    >
                                        <svg
                                            className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Làm mới</span>
                                    </button>
                                </div>
                            </div>

                            {/* Grid View */}
                            {viewMode === 'grid' ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {responses.map((response) => {
                                        const statusInfo = getStatusInfo(response);
                                        const emergency = response.emergency_request;

                                        return (
                                            <div
                                                key={response.id}
                                                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                            >
                                                {/* Image Container */}
                                                <div className="relative h-48 overflow-hidden">
                                                    {emergency?.hospital?.image_url ? (
                                                        <img
                                                            src={getImageUrl(emergency.hospital.image_url)}
                                                            alt={emergency.hospital.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                                                            <Hospital className="h-16 w-16 text-white opacity-50" />
                                                        </div>
                                                    )}

                                                    {/* Status Badge */}
                                                    <div className="absolute top-4 left-4">
                                                        <span className={`${statusInfo.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-lg`}>
                                                            {response.status_response === 1 && response.status_registration === 4 && (
                                                                <CheckCircle className="w-3 h-3" />
                                                            )}
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>

                                                    {/* Blood Type Badge */}
                                                    <div className="absolute top-4 right-4">
                                                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                                                            <div className="text-lg font-bold text-red-600">
                                                                {getBloodTypeText(emergency?.blood_type)}{getRhFactorText(emergency?.rh_factor)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Nhóm máu</div>
                                                        </div>
                                                    </div>

                                                    {/* Response Date */}
                                                    <div className="absolute bottom-4 left-4">
                                                        <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                                                            {formatResponseDate(response.created_at)}
                                                        </span>
                                                    </div>

                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                        {emergency?.patient_name || "Bệnh nhân"}
                                                    </h3>

                                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                                        {emergency?.emergency_note || "Cần hỗ trợ máu cấp cứu"}
                                                    </p>

                                                    {/* Request Details */}
                                                    <div className="space-y-3 mb-4">
                                                        <div className="flex items-start text-gray-600">
                                                            <Hospital className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                                            <div className="text-sm">
                                                                <div>{emergency?.hospital?.name}</div>
                                                                <div className="text-xs text-gray-500">{emergency?.hospital?.hospital_address}, {emergency?.hospital?.sub_district}, {emergency?.hospital?.province}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center text-gray-600">
                                                            <Phone className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{emergency?.phone}</span>
                                                        </div>

                                                        <div className="flex items-center text-gray-600">
                                                            <Syringe className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">Cần {emergency?.blood_volume}ml máu</span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <Link
                                                        to={`/emergency-response/${response?.id}`}
                                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25"
                                                    >
                                                        <span className="font-medium">Xem chi tiết</span>
                                                        <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // List View
                                <div className="space-y-4">
                                    {responses.map((response) => {
                                        const statusInfo = getStatusInfo(response);
                                        const emergency = response.emergency_request;

                                        return (
                                            <div
                                                key={response.id}
                                                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Image */}
                                                    <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                                                        {emergency?.hospital?.image_url ? (
                                                            <img
                                                                src={getImageUrl(emergency.hospital.image_url)}
                                                                alt={emergency.hospital.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                                                                <Hospital className="h-16 w-16 text-white opacity-50" />
                                                            </div>
                                                        )}

                                                        <div className="absolute top-4 left-4">
                                                            <span className={`${statusInfo.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1`}>
                                                                {response.status_response === 1 && response.status_registration === 4 && (
                                                                    <CheckCircle className="w-3 h-3" />
                                                                )}
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>

                                                        <div className="absolute top-4 right-4">
                                                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                                                                <div className="text-lg font-bold text-red-600">
                                                                    {getBloodTypeText(emergency?.blood_type)}{getRhFactorText(emergency?.rh_factor)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-6">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {emergency?.patient_name || "Bệnh nhân"}
                                                            </h3>
                                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {formatResponseDate(response.created_at)}
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                                            {emergency?.emergency_note || "Cần hỗ trợ máu cấp cứu"}
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="flex items-center text-gray-600">
                                                                <Hospital className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                                <span className="text-sm">{emergency?.hospital?.name}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <Phone className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                                <span className="text-sm">{emergency?.phone}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <Syringe className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                                <span className="text-sm">Cần {emergency?.blood_volume}ml</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                                <span className="text-sm">
                                                                    {emergency?.critical ? 'Cấp cứu' : 'Cần hỗ trợ'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <Link
                                                            to={`/emergency-request/${emergency?.id}`}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                                                        >
                                                            <span>Xem chi tiết</span>
                                                            <ChevronRight className="h-4 w-4" />
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
                                        className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl disabled:from-red-400 disabled:to-red-400 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="animate-spin h-5 w-5" />
                                                    <span>Đang tải thêm...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Xem thêm phản hồi</span>
                                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            )}

                            {!hasNextPage && responses.length > 0 && (
                                <div className="text-center mt-12">
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                        <HeartPulse className="w-5 h-5" />
                                        <span>Đã hiển thị tất cả phản hồi</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

        </div>
    );
};

export default EmergencyResponse;