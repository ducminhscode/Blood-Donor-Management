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
    Grid, List, SlidersHorizontal, ArrowUpDown, Tag, Layers,
    Loader2, Send, Eye as EyeIcon, CalendarDays, TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { UserContexts } from '../../configs/UserContexts';
import debounce from 'lodash.debounce';
import { formatDateTime } from '../../utils/Format';
import { Helmet } from "react-helmet-async";

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
    const [selectedDate, setSelectedDate] = useState('');
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

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            params.append('page', currentPage);

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
                if (!searchTerm && !selectedDate) {
                    setOriginalTotalItems(response.data.count);
                }
            }

            setTotalItems(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (error) {
            console.error("Error fetching reward history:", error);
            setError("Không thể tải lịch sử đổi thưởng. Vui lòng thử lại sau");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const debouncedFetchHistories = useCallback(
        debounce(() => {
            setPage(1);
            fetchHistories(false);
        }, searchTerm ? 500 : 50),
        [searchTerm, sortBy, sortOrder]
    );

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

    const filteredHistories = useMemo(() => {
        if (!selectedDate) return sortedHistories;

        return sortedHistories.filter(history => {
            if (!history.created_at) return false;
            const historyDate = new Date(history.created_at).toISOString().split('T')[0];
            return historyDate === selectedDate;
        });
    }, [sortedHistories, selectedDate]);

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
            total: originalTotalItems,
            totalPoints: histories.reduce((sum, item) => sum + (item.points_used || 0), 0)
        };
        setStats(newStats);
    }, [histories, originalTotalItems]);

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
            <Helmet>
                <title>Lịch sử đổi thưởng | Dòng Máu Lạc Hồng</title>
            </Helmet>
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
                            <History className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Lịch sử lượt đổi thưởng của bạn</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <History className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Lịch sử đổi thưởng</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Theo dõi chi tiết các lượt đổi thưởng của bạn
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <MonitorCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                        <div className="text-sm text-white/80">Lượt đổi thưởng</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Award className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-white/80">Điểm đã dùng</div>
                                        <div className="text-2xl font-bold">{formatPoints(stats.totalPoints)}</div>
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
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <form onSubmit={handleSearchSubmit} className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên quà tặng..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300"
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

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <FilterIcon className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* Sort Buttons */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => {
                                        setSortBy('date');
                                        setSortOrder('desc');
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                        sortBy === 'date' && sortOrder === 'desc'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <TrendingUpIcon className="w-4 h-4" />
                                    <span>Mới nhất</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('date');
                                        setSortOrder('asc');
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                        sortBy === 'date' && sortOrder === 'asc'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <TrendingDownIcon className="w-4 h-4" />
                                    <span>Cũ nhất</span>
                                </button>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="Xem dạng lưới"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewMode === 'list'
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
                                <h3 className="font-semibold text-gray-900">Bộ lọc & Sắp xếp</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sắp xếp theo</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setSortBy('date');
                                                setSortOrder('desc');
                                                setPage(1);
                                                setShowFilters(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                                sortBy === 'date' && sortOrder === 'desc'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <TrendingUpIcon className="w-4 h-4" />
                                            <span>Mới nhất</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('date');
                                                setSortOrder('asc');
                                                setPage(1);
                                                setShowFilters(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                                sortBy === 'date' && sortOrder === 'asc'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <TrendingDownIcon className="w-4 h-4" />
                                            <span>Cũ nhất</span>
                                        </button>
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
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                                                viewMode === 'grid'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
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
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                                                viewMode === 'list'
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
                        </div>
                    )}

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
                                            setPage(1);
                                        }}
                                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
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

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setSelectedDate(today);
                                    setPage(1);
                                }}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                    selectedDate === new Date().toISOString().split('T')[0]
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
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                    selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
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
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button
                                        onClick={handleClearSearch}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}

                            {selectedDate && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error State */}
                {error && (
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
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Inbox className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {selectedDate
                                ? `Không có lượt đổi thưởng ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`
                                : searchTerm
                                    ? "Không tìm thấy lượt đổi thưởng phù hợp"
                                    : "Chưa có lượt đổi thưởng nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {selectedDate
                                ? "Hãy chọn ngày khác để xem lịch sử đổi thưởng"
                                : searchTerm
                                    ? "Thử tìm kiếm với từ khóa khác"
                                    : "Bạn chưa thực hiện lượt đổi thưởng nào. Hãy khám phá các quà tặng hấp dẫn!"}
                        </p>

                        {(selectedDate || searchTerm) && (
                            <button
                                onClick={() => {
                                    setSelectedDate('');
                                    setSearchTerm('');
                                    setPage(1);
                                }}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
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
                                    <span className="font-bold text-lg">{filteredHistories.length}</span>
                                </div>
                                <span className="text-gray-600">
                                    lượt đổi thưởng
                                    {selectedDate && ` ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`}
                                    {searchTerm && " phù hợp với tìm kiếm"}
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

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredHistories.map((history) => (
                                    <div
                                        key={history.id}
                                        onClick={() => handleGridItemClick(history)}
                                        className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                        <div className="p-5">
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

                                            <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2 min-h-[48px]">
                                                {history.reward?.name || 'Quà tặng'}
                                            </h3>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Điểm:</span>
                                                    <span className="font-semibold text-red-600">{formatPoints(history.points_used)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Số lượng:</span>
                                                    <span className="font-medium">{history.quantity || 1}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Ngày:</span>
                                                    <span className="font-medium text-xs">{formatDate(history.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-1 text-red-600 font-medium text-sm">
                                                    <EyeIcon className="w-4 h-4" />
                                                    <span>Chi tiết</span>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedHistories).map(([date, items]) => (
                                    <div key={date}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <CalendarDays className="w-5 h-5 text-red-500" />
                                                Ngày {date}
                                            </h3>
                                            <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent"></div>
                                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{items.length} lượt đổi</span>
                                        </div>

                                        <div className="space-y-3">
                                            {items.map((history) => (
                                                <div
                                                    key={history.id}
                                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                                >
                                                    <div
                                                        onClick={() => handleViewDetail(history.id)}
                                                        className="p-5 cursor-pointer"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-xl overflow-hidden flex-shrink-0">
                                                                {history.reward?.image_url ? (
                                                                    <img
                                                                        src={getImageUrl(history.reward.image_url)}
                                                                        alt={history.reward?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Gift className="w-6 h-6 text-red-400" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                                                                    {history.reward?.name || 'Quà tặng'}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                                    <span className="text-gray-500 flex items-center gap-1">
                                                                        <Award className="w-4 h-4 text-red-400" />
                                                                        {formatPoints(history.points_used)} điểm
                                                                    </span>
                                                                    <span className="text-gray-500 flex items-center gap-1">
                                                                        <Package className="w-4 h-4 text-gray-400" />
                                                                        Số lượng: {history.quantity || 1}
                                                                    </span>
                                                                    <span className="text-gray-500 flex items-center gap-1">
                                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                                        {formatDate(history.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
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
                                                        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5">
                                                            {loadingDetail ? (
                                                                <div className="flex justify-center py-8">
                                                                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                                                </div>
                                                            ) : selectedHistory && (
                                                                <div className="grid md:grid-cols-2 gap-5">
                                                                    {/* Recipient Information */}
                                                                    {selectedHistory.recipient_information && (
                                                                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                                <User className="w-4 h-4 text-red-500" />
                                                                                Thông tin người nhận
                                                                            </h5>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-500">Người nhận:</span>
                                                                                    <span className="font-medium text-gray-900">
                                                                                        {selectedHistory.recipient_information.last_name} {selectedHistory.recipient_information.first_name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-500">Số điện thoại:</span>
                                                                                    <span className="font-medium text-gray-900">{selectedHistory.recipient_information.phone}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-500">Email:</span>
                                                                                    <span className="font-medium text-gray-900 truncate">{selectedHistory.recipient_information.email}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-500">Địa chỉ:</span>
                                                                                    <span className="font-medium text-gray-900 text-right">
                                                                                        {selectedHistory.recipient_information.recipient_address}, {selectedHistory.recipient_information.sub_district}, {selectedHistory.recipient_information.province}
                                                                                    </span>
                                                                                </div>
                                                                                {selectedHistory.recipient_information.recipient_note && (
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-gray-500">Ghi chú:</span>
                                                                                        <span className="font-medium text-gray-900">{selectedHistory.recipient_information.recipient_note}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Order Summary */}
                                                                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                            <ShoppingBag className="w-4 h-4 text-red-500" />
                                                                            Chi tiết đổi thưởng
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Quà tặng:</span>
                                                                                <span className="font-medium text-gray-900">{selectedHistory.reward?.name}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Số lượng:</span>
                                                                                <span className="font-medium text-gray-900">{selectedHistory.quantity || 1}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Điểm sử dụng:</span>
                                                                                <span className="font-semibold text-red-600">{formatPoints(selectedHistory.points_used)} điểm</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Thời gian:</span>
                                                                                <span className="font-medium text-gray-900">{formatDateTime(selectedHistory.created_at)}</span>
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

                        {/* Load More */}
                        {!selectedDate && hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>Tải thêm lượt đổi</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* End Message */}
                        {!selectedDate && !hasNextPage && histories.length > 0 && (
                            <div className="text-center mt-8">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalItems} lượt đổi thưởng</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialog for Grid View */}
            {showDialog && selectedGridHistory && selectedHistory && (
                <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" onClick={() => setShowDialog(false)}>
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-5 rounded-t-2xl">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <Gift className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Chi tiết đổi thưởng</h3>
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingDetail ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl overflow-hidden shadow-md">
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
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900">{selectedGridHistory.reward?.name}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTime(selectedGridHistory.created_at)}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                selectedGridHistory.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : selectedGridHistory.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {selectedGridHistory.status === 'completed' ? 'Đã giao' : 
                                                 selectedGridHistory.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
                                            </span>
                                        </div>

                                        {/* Recipient Information */}
                                        {selectedHistory.recipient_information && (
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-red-500" />
                                                    Thông tin người nhận
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Người nhận:</span>
                                                        <span className="font-medium text-gray-900">
                                                            {selectedHistory.recipient_information.last_name} {selectedHistory.recipient_information.first_name}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Số điện thoại:</span>
                                                        <span className="font-medium text-gray-900">{selectedHistory.recipient_information.phone}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Email:</span>
                                                        <span className="font-medium text-gray-900 break-all">{selectedHistory.recipient_information.email}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Địa chỉ:</span>
                                                        <span className="font-medium text-gray-900 text-right">
                                                            {selectedHistory.recipient_information.recipient_address}, {selectedHistory.recipient_information.sub_district}, {selectedHistory.recipient_information.province}
                                                        </span>
                                                    </div>
                                                    {selectedHistory.recipient_information.recipient_note && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Ghi chú:</span>
                                                            <span className="font-medium text-gray-900">{selectedHistory.recipient_information.recipient_note}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Order Summary */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-red-500" />
                                                Chi tiết đổi thưởng
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Quà tặng:</span>
                                                    <span className="font-medium text-gray-900">{selectedHistory.reward?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Số lượng:</span>
                                                    <span className="font-medium text-gray-900">{selectedHistory.quantity || 1}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Điểm sử dụng:</span>
                                                    <span className="font-semibold text-red-600">{formatPoints(selectedHistory.points_used)} điểm</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Thời gian đổi:</span>
                                                    <span className="font-medium text-gray-900">{formatDateTime(selectedHistory.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
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
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default RewardHistory;