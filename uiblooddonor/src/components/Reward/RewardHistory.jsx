import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gift, Package, Search, X, Filter, AlertCircle, Sparkles,
    ChevronRight, Clock, CheckCircle, XCircle, Truck, Home,
    MapPin, Calendar, Award, Copy, Eye, Download, RefreshCw,
    TrendingUp, TrendingDown, BadgeCheck, Ban, Hourglass,
    PackageCheck, PackageX, PackageOpen, CreditCard, User,
    Phone, Mail, FileText, ChevronDown, ChevronUp, Printer,
    Share2, MoreVertical, Edit3, Trash2, Archive, Inbox,
    History, ShoppingBag, Star, Zap, Shield, Heart, ThumbsUp,
    MonitorCheck, Hash, MapPinned, Filter as FilterIcon,
    Grid, List, SlidersHorizontal, ArrowUpDown, Tag, Layers
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { UserContexts } from '../../configs/UserContexts';
import debounce from 'lodash.debounce';
import { formatDateTime } from '../../utils/Format';

const RewardHistory = () => {
    const [histories, setHistories] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showDialog, setShowDialog] = useState(false);
    const [selectedGridHistory, setSelectedGridHistory] = useState(null);

    // Thêm state cho lọc theo ngày
    const [selectedDate, setSelectedDate] = useState('');

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [originalTotalItems, setOriginalTotalItems] = useState(0);

    const [stats, setStats] = useState({
        total: 0,
        totalPoints: 0
    });

    const user = useContext(UserContexts);
    const navigate = useNavigate();

    // Fetch reward history list with pagination
    const fetchHistories = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setHistories([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError('');

        try {
            let url = endpoints.reward_history;
            const params = new URLSearchParams();

            // Add search parameter
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Add pagination
            params.append('page', currentPage);

            // Add sorting
            if (sortBy === 'date') {
                params.append('ordering', sortOrder === 'desc' ? '-created_at' : 'created_at');
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            if (isLoadMore) {
                setHistories(prev => [...prev, ...response.data.results]);
            } else {
                setHistories(response.data.results);
                // Save original total for stats when no filters
                if (!searchTerm) {
                    setOriginalTotalItems(response.data.count);
                }
            }

            setTotalItems(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (error) {
            console.error("Error fetching reward history:", error);
            setError("Không thể tải lịch sử đổi quà. Vui lòng thử lại sau");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    // Debounced search
    const debouncedFetchHistories = useCallback(
        debounce(() => {
            setPage(1);
            fetchHistories(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, sortBy, sortOrder]
    );

    // Fetch single history detail
    const fetchHistoryDetail = async (id) => {
        setLoadingDetail(true);
        try {
            const url = endpoints.reward_history_detail.replace('${id}', id);
            const response = await authApis().get(url);
            setSelectedHistory(response.data);
        } catch (error) {
            console.error("Error fetching history detail:", error);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Sử dụng useMemo để tránh tính toán lại không cần thiết
    const sortedHistories = useMemo(() => {
        if (!histories.length) return [];

        const sorted = [...histories];

        if (sortBy === 'date') {
            sorted.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
        }

        return sorted;
    }, [histories, sortBy, sortOrder]);

    // Sử dụng useMemo cho filteredHistories
    const filteredHistories = useMemo(() => {
        if (!selectedDate) return sortedHistories;

        return sortedHistories.filter(history => {
            if (!history.created_at) return false;
            const historyDate = new Date(history.created_at).toISOString().split('T')[0];
            return historyDate === selectedDate;
        });
    }, [sortedHistories, selectedDate]);

    // Sử dụng useMemo cho groupedHistories
    const groupedHistories = useMemo(() => {
        const grouped = {};
        filteredHistories.forEach(history => {
            if (!history.created_at) return;
            const date = new Date(history.created_at).toLocaleDateString('vi-VN');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(history);
        });
        return grouped;
    }, [filteredHistories]);

    useEffect(() => {
        const newStats = {
            total: originalTotalItems, // tổng lượt đổi thật từ API
            totalPoints: histories.reduce((sum, item) => sum + (item.points_used || 0), 0)
        };

        setStats(newStats);
    }, [histories, originalTotalItems]);

    // Effects
    useEffect(() => {
        debouncedFetchHistories();
        return () => {
            debouncedFetchHistories.cancel();
        };
    }, [searchTerm, sortBy, sortOrder, debouncedFetchHistories]);

    useEffect(() => {
        if (page > 1) {
            fetchHistories(true);
        }
    }, [page]);

    const handleGridItemClick = async (history) => {
        setSelectedGridHistory(history);
        setShowDialog(true);
        await fetchHistoryDetail(history.id);
    };

    const handleViewDetail = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            setSelectedHistory(null);
        } else {
            setExpandedId(id);
            await fetchHistoryDetail(id);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        fetchHistories(false);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchHistories(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPoints = (points) => {
        if (!points) return '0';
        return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: '20s'
                            }}
                        >
                            <History className="w-12 h-12 text-white opacity-10" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Lịch sử lượt đổi quà của bạn</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <History className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    Lịch sử đổi quà
                                </h1>
                            </div>

                            <p className="text-lg text-white/90 max-w-2xl mx-auto md:mx-0">
                                Theo dõi chi tiết các lượt đổi quà của bạn
                            </p>

                            {/* Stats */}
                            <div className="gap-6 mt-8 flex flex-wrap justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <MonitorCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                        <div className="text-sm text-white/80">Lượt đổi quà</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="hidden md:block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <Award className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-80">Điểm đã dùng</div>
                                        <div className="text-3xl font-bold">{formatPoints(stats.totalPoints)}</div>
                                    </div>
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
            <div className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Form */}
                        <form onSubmit={handleSearchSubmit} className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên quà tặng"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Filter and Sort Controls */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <FilterIcon className="h-5 w-5" />
                                <span>Bộ lọc</span>
                            </button>

                            {/* Sort Dropdown */}
                            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                {/* Mới nhất */}
                                <button
                                    onClick={() => {
                                        setSortBy('date');
                                        setSortOrder('desc');
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${sortBy === 'date' && sortOrder === 'desc'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span>Mới nhất</span>
                                </button>

                                {/* Cũ nhất */}
                                <button
                                    onClick={() => {
                                        setSortBy('date');
                                        setSortOrder('asc');
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${sortBy === 'date' && sortOrder === 'asc'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span>Cũ nhất</span>
                                </button>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="hidden md:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    title="Xem dạng lưới"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-white text-red-600 shadow-sm'
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
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Mới nhất */}
                                    <button
                                        onClick={() => {
                                            setSortBy('date');
                                            setSortOrder('desc');
                                            setPage(1);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${sortBy === 'date' && sortOrder === 'desc'
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span>Mới nhất</span>
                                    </button>

                                    {/* Cũ nhất */}
                                    <button
                                        onClick={() => {
                                            setSortBy('date');
                                            setSortOrder('asc');
                                            setPage(1);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${sortBy === 'date' && sortOrder === 'asc'
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span>Cũ nhất</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Grid className="w-4 h-4" />
                                        <span>Dạng lưới</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'list'
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <List className="w-4 h-4" />
                                        <span>Dạng danh sách</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== THÊM BỘ LỌC NGÀY VÀO ĐÂY ===== */}
                    {/* Date Filter */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setPage(1); // Reset về trang 1 khi lọc
                                        }}
                                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                                    />
                                </div>

                                {selectedDate && (
                                    <button
                                        onClick={() => {
                                            setSelectedDate('');
                                            setPage(1);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Xóa bộ lọc ngày"
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Date Options */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setSelectedDate(today);
                                    setPage(1);
                                }}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${selectedDate === new Date().toISOString().split('T')[0]
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    setSelectedDate(yesterday.toISOString().split('T')[0]);
                                    setPage(1);
                                }}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Hôm qua
                            </button>
                        </div>
                    </div>

                    {/* Search Result Info */}
                    {(searchTerm || selectedDate) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button
                                        onClick={handleClearSearch}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {selectedDate && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ngày: {new Date(selectedDate).toLocaleDateString('vi-VN')}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedDate('');
                                            setPage(1);
                                        }}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error State */}
                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
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
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded-lg w-1/4"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredHistories.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform">
                                <Inbox className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                0
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {selectedDate
                                ? `Không có lượt đổi quà ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`
                                : searchTerm
                                    ? "Không tìm thấy lượt đổi quà phù hợp với tìm kiếm"
                                    : "Chưa có lượt đổi quà nào"
                            }
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {selectedDate
                                ? "Hãy chọn ngày khác để xem lịch sử đổi quà"
                                : searchTerm
                                    ? "Thử tìm kiếm với từ khóa khác"
                                    : "Bạn chưa thực hiện lượt đổi quà nào."}
                        </p>
                        {(selectedDate || searchTerm) && (
                            <button
                                onClick={() => {
                                    setSelectedDate('');
                                    setSearchTerm('');
                                    setPage(1);
                                }}
                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                )}

                {/* History List */}
                {!loading && !error && filteredHistories.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold">{filteredHistories.length}</span>
                                </div>
                                <span className="text-gray-600">
                                    lượt đổi quà
                                    {selectedDate && ` ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`}
                                    {searchTerm && " phù hợp với tìm kiếm"}
                                </span>
                            </div>

                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
                                disabled={loading}
                                title="Làm mới danh sách"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                <span>Làm mới</span>
                            </button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredHistories.map((history) => (
                                    <div
                                        key={history.id}
                                        onClick={() => handleGridItemClick(history)}
                                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                        <div className="relative p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    {history.reward?.image_url ? (
                                                        <img
                                                            src={getImageUrl(history.reward.image_url)}
                                                            alt={history.reward?.name}
                                                            className="w-full h-full object-cover rounded-xl"
                                                        />
                                                    ) : (
                                                        <Gift className="w-7 h-7 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                {history.reward?.name || 'Quà tặng'}
                                            </h3>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Điểm đã sử dụng:</span>
                                                    <span className="font-medium text-red-600">{formatPoints(history.points_used)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Số lượng:</span>
                                                    <span className="font-medium">{history.quantity || 1}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Ngày:</span>
                                                    <span className="font-medium">{formatDate(history.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end">
                                                <div className="flex items-center gap-1 text-red-600 font-medium text-sm">
                                                    <span>Chi tiết</span>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Grouped by date */}
                                {Object.entries(groupedHistories).map(([date, items]) => (
                                    <div key={date}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Ngày {date}</h3>
                                            <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent"></div>
                                            <span className="text-sm text-gray-500">{items.length} lượt đổi</span>
                                        </div>

                                        <div className="space-y-4">
                                            {items.map((history) => (
                                                <div
                                                    key={history.id}
                                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-red-100"
                                                >
                                                    {/* Main History Item */}
                                                    <div
                                                        onClick={() => handleViewDetail(history.id)}
                                                        className="p-6 cursor-pointer"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                            {/* Reward Image */}
                                                            <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl overflow-hidden flex-shrink-0">
                                                                {history.reward?.image_url ? (
                                                                    <img
                                                                        src={getImageUrl(history.reward.image_url)}
                                                                        alt={history.reward?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Gift className="w-8 h-8 text-red-300" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1">
                                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">
                                                                        {history.reward?.name || 'Quà tặng'}
                                                                    </h4>
                                                                </div>

                                                                <div className="items-center text-sm">
                                                                    <span className="text-gray-500 flex gap-1">
                                                                        Điểm đã sử dụng: {formatPoints(history.points_used)} điểm
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Expand Icon */}
                                                            <div className="flex items-center gap-2">
                                                                <button className="text-gray-400 hover:text-red-600 transition-colors">
                                                                    {expandedId === history.id ? (
                                                                        <ChevronUp className="w-5 h-5" />
                                                                    ) : (
                                                                        <ChevronDown className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Detail */}
                                                    {expandedId === history.id && (
                                                        <div className="border-t border-gray-100 bg-gray-50 p-6">
                                                            {loadingDetail ? (
                                                                <div className="flex justify-center py-8">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
                                                                </div>
                                                            ) : selectedHistory && (
                                                                <div className="space-y-6">
                                                                    {/* Recipient Information */}
                                                                    {selectedHistory.recipient_information && (
                                                                        <div className="bg-white rounded-xl p-4">
                                                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                                Thông tin người nhận
                                                                            </h5>
                                                                            <div className="space-y-2 text-sm">
                                                                                <p className="flex items-start justify-between gap-2">
                                                                                    <span className='text-gray-600'>Người nhận:</span>
                                                                                    <span className='font-medium'>{selectedHistory.recipient_information.last_name + " " + selectedHistory.recipient_information.first_name}</span>
                                                                                </p>
                                                                                <p className="flex items-start justify-between gap-2">
                                                                                    <span className='text-gray-600'>Số điện thoại:</span>
                                                                                    <span className='font-medium'>{selectedHistory.recipient_information.phone}</span>
                                                                                </p>
                                                                                <p className="flex items-start justify-between gap-2">
                                                                                    <span className='text-gray-600'>Email:</span>
                                                                                    <span className='font-medium'>{selectedHistory.recipient_information.email}</span>
                                                                                </p>
                                                                                <p className="flex items-start justify-between gap-2">
                                                                                    <span className='text-gray-600'>Địa chỉ:</span>
                                                                                    <span className='font-medium'>{selectedHistory.recipient_information.recipient_address}, {selectedHistory.recipient_information.sub_district}, {selectedHistory.recipient_information.province}</span>
                                                                                </p>
                                                                                <p className="flex items-start justify-between gap-2">
                                                                                    <span className='text-gray-600'>Ghi chú:</span>
                                                                                    <span className={selectedHistory.recipient_information.recipient_note ? 'font-medium' : 'text-gray-600'}>
                                                                                        {selectedHistory.recipient_information.recipient_note || 'Trống'}
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Order Summary */}
                                                                    <div className="bg-white rounded-xl p-4">
                                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                            Chi tiết đổi quà
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Tên quà tặng:</span>
                                                                                <span className="font-medium">{selectedHistory.reward?.name}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Số lượng:</span>
                                                                                <span className="font-medium">{selectedHistory.quantity || 1}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Vào lúc:</span>
                                                                                <span className="font-medium">{formatDateTime(selectedHistory.created_at)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Điểm sử dụng:</span>
                                                                                <span className="font-medium text-red-600">{formatPoints(selectedHistory.points_used)} điểm</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Info - Chỉ hiển thị khi không có bộ lọc ngày hoặc đang load more từ API */}
                        {!selectedDate && (
                            <div className="flex items-center justify-between mt-8">
                                <div className="text-sm text-gray-600">
                                    Hiển thị {histories.length} trên tổng số {totalItems} lượt đổi
                                </div>

                                {/* Load More Button */}
                                {hasNextPage && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl disabled:from-red-400 disabled:to-red-400 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loadingMore ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Đang tải...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Tải thêm</span>
                                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                        {loadingMore && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                                                <div className="h-full bg-white animate-loading-bar"></div>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center mt-4">
                                <div className="flex items-center gap-2 text-red-600">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                                    <span>Đang tải thêm dữ liệu...</span>
                                </div>
                            </div>
                        )}

                        {/* End Message */}
                        {!hasNextPage && histories.length > 0 && !selectedDate && (
                            <div className="text-center mt-8">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <History className="w-5 h-5" />
                                    <span>Đã hiển thị tất cả lượt đổi quà</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialog cho Grid View */}
            {showDialog && selectedGridHistory && selectedHistory && (
                <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowDialog(false)}>
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-50"></div>
                        <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowDialog(false)}
                                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {loadingDetail ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl overflow-hidden">
                                            {selectedGridHistory.reward?.image_url ? (
                                                <img
                                                    src={getImageUrl(selectedGridHistory.reward.image_url)}
                                                    alt={selectedGridHistory.reward?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Gift className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{selectedGridHistory.reward?.name}</h3>
                                            <p className="text-sm text-gray-500">{formatDateTime(selectedGridHistory.created_at)}</p>
                                        </div>
                                    </div>

                                    {/* Recipient Information */}
                                    {selectedHistory.recipient_information && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="font-semibold mb-3">Thông tin người nhận</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="flex justify-between">
                                                    <span className="text-gray-600">Người nhận:</span>
                                                    <span className="font-medium">
                                                        {selectedHistory.recipient_information.last_name} {selectedHistory.recipient_information.first_name}
                                                    </span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-gray-600">SĐT:</span>
                                                    <span className="font-medium">{selectedHistory.recipient_information.phone}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="font-medium">{selectedHistory.recipient_information.email}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-gray-600">Địa chỉ:</span>
                                                    <span className="font-medium text-right">
                                                        {selectedHistory.recipient_information.recipient_address}, {selectedHistory.recipient_information.sub_district}, {selectedHistory.recipient_information.province}
                                                    </span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-gray-600">Ghi chú:</span>
                                                    <span className={selectedHistory.recipient_information.recipient_note ? 'font-medium' : 'text-gray-600'}>
                                                        {selectedHistory.recipient_information.recipient_note || 'Trống'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Summary */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold mb-3">Chi tiết đổi quà</h4>
                                        <div className="space-y-2">
                                            <p className="flex justify-between">
                                                <span className="text-gray-600">Số lượng:</span>
                                                <span className="font-medium">{selectedHistory.quantity || 1}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-600">Điểm sử dụng:</span>
                                                <span className="font-medium text-red-600">{formatPoints(selectedHistory.points_used)} điểm</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardHistory;