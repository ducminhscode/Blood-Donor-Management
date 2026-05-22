import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPlus, HeartPulse, Grid, List, Filter as FilterIcon, Send, TrendingUp, CheckCircle2, Loader2, Eye, RefreshCw } from 'lucide-react';
import APIs, { endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    const user = useContext(UserContexts);

    const [provinces, setProvinces] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalEvents, setTotalEvents] = useState(0);
    const [originalTotalEvents, setOriginalTotalEvents] = useState(0);
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
            let url = endpoints['donation_event'];
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
                }
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await APIs.get(url);

            if (isLoadMore) {
                setEvents(prev => [...prev, ...response.data.results]);
            } else {
                setEvents(response.data.results);
            }

            setTotalEvents(response.data.count);
            if (!searchTerm && !selectedProvince && filterType === 'all' && originalTotalEvents === 0) {
                setOriginalTotalEvents(response.data.count);
            }
            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching events:", err);
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
        [searchTerm, selectedProvince, filterType]
    );

    const getEventStatus = (timeStart) => {
        const now = new Date().getTime();
        const start = new Date(timeStart).getTime();

        if (start > now) return 'upcoming';
        if (start <= now) return 'ongoing';
        return 'ended';
    };

    const filteredAndSortedEvents = events
        .filter(event => {
            const matchesSearch = searchTerm === '' ||
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProvince = !selectedProvince ||
                event.province === provinces.find(p => p.code === parseInt(selectedProvince))?.name;

            const status = getEventStatus(event.time_start);
            const matchesStatus = filterType === 'all' ||
                (filterType === 'ongoing' && status === 'ongoing') ||
                (filterType === 'upcoming' && status === 'upcoming');

            return matchesSearch && matchesProvince && matchesStatus;
        })
        .sort((a, b) => {
            const priority = { 'ongoing': 1, 'upcoming': 2 };
            const statusA = getEventStatus(a.time_start);
            const statusB = getEventStatus(b.time_start);
            return (priority[statusA] || 3) - (priority[statusB] || 3);
        });

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

    const handleFeatureCard = () => {
        if (!user) {
            navigate('/login', {
                state: { from: '/login' }
            });
        } else if (user.role === 1) {
            navigate('/event-registration');
        } else if (user.role === 2) {
            navigate('/staff-donation-event');
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleProvinceChange = (e) => {
        setSelectedProvince(e.target.value);
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

    const getFilterLabel = () => {
        switch (filterType) {
            case 'ongoing': return 'Đang diễn ra';
            case 'upcoming': return 'Sắp diễn ra';
            default: return 'Tất cả';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilters && !event.target.closest('.filter-container')) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilters]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Hoạt động hiến máu | Dòng Máu Lạc Hồng</title>
            </Helmet>
            <Header />

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
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Cùng chung tay vì cộng đồng</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <HeartPulse className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Sự kiện hiến máu</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Mỗi giọt máu cho đi - Một cuộc đời ở lại. Tham gia ngay để cứu giúp những mảnh đời cần bạn.
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <HeartPulse className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalTotalEvents}</div>
                                        <div className="text-sm text-white/80">Sự kiện tổ chức</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Card */}
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Sự kiện sắp tới</h3>
                                    {!user || user.role === 1 ? (
                                        <p className="text-white/80 text-sm">Đăng ký ngay để nhận thông báo</p>
                                    ) : user.role === 2 && (
                                        <p className="text-white/80 text-sm">Xem những sự kiện hiến máu mà bạn đã tạo</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleFeatureCard}
                                    className="w-full bg-white text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300"
                                >
                                    {!user ? 'Đăng nhập để đăng ký' : (user.role === 2 ? 'Quản lý sự kiện' : 'Sự kiện đã đăng ký')}
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
                                    placeholder="Tìm kiếm sự kiện hiến máu..."
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

                            {/* Filter Tabs */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${filterType === 'all'
                                        ? 'bg-white text-red-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilterType('ongoing')}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${filterType === 'ongoing'
                                        ? 'bg-white text-red-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Đang diễn ra
                                </button>
                                <button
                                    onClick={() => setFilterType('upcoming')}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${filterType === 'upcoming'
                                        ? 'bg-white text-red-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Sắp diễn ra
                                </button>
                            </div>

                            {/* Province Select */}
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                className="hidden lg:block px-4 py-2 bg-gray-100 border-2 border-transparent rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300 cursor-pointer"
                                disabled={loadingProvinces}
                            >
                                <option value="">Tất cả tỉnh/thành</option>
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
                                        <button
                                            onClick={() => {
                                                setFilterType('all');
                                                setShowFilters(false);
                                                setPage(1);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${filterType === 'all'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterType('ongoing');
                                                setShowFilters(false);
                                                setPage(1);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${filterType === 'ongoing'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            Đang diễn ra
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterType('upcoming');
                                                setShowFilters(false);
                                                setPage(1);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${filterType === 'upcoming'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            Sắp diễn ra
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                                    <select
                                        value={selectedProvince}
                                        onChange={(e) => {
                                            handleProvinceChange(e);
                                            setShowFilters(false);
                                            setPage(1);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                        disabled={loadingProvinces}
                                    >
                                        <option value="">Tất cả tỉnh/thành</option>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ xem</label>
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
                    {(selectedProvince || searchTerm || filterType !== 'all') && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {filterType !== 'all' && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>Trạng thái: {getFilterLabel()}</span>
                                    <button onClick={() => setFilterType('all')} className="p-1 hover:bg-white/20 rounded-lg">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>{provinces.find(p => p.code === parseInt(selectedProvince))?.name}</span>
                                    <button onClick={() => { setSelectedProvince(""); setPage(1); loadEvents(false); }} className="p-1 hover:bg-white/20 rounded-lg">
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
                            {(selectedProvince || searchTerm || filterType !== 'all') && (
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
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredAndSortedEvents.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Droplet className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || selectedProvince || filterType !== 'all'
                                ? "Không tìm thấy sự kiện phù hợp"
                                : "Chưa có sự kiện nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedProvince || filterType !== 'all'
                                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                : "Sẽ sớm được cập nhật trong thời gian tới"}
                        </p>

                        {(searchTerm || selectedProvince || filterType !== 'all') && (
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
                {!loading && !error && filteredAndSortedEvents.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{totalEvents}</span>
                                </div>
                                <span className="text-gray-600">
                                    sự kiện hiến máu {(searchTerm || selectedProvince) && "phù hợp"}
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
                                {filteredAndSortedEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        {/* Image Container */}
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

                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4">
                                                <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                    {getStatusText(event)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                {event.title}
                                            </h3>

                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                                {event.description || "Cùng tham gia hiến máu cứu người - Một giọt máu cho đi, một cuộc đời ở lại"}
                                            </p>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-start text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                                    <span className="truncate">
                                                        {event.location}, {event.sub_district}, {event.province}
                                                    </span>
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
                                                to={`/event/${event.id}`}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${event.is_expire
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg'
                                                    }`}
                                                onClick={(e) => event.is_expire && e.preventDefault()}
                                            >
                                                <span className="font-medium">
                                                    {event.is_expire ? 'Đã kết thúc' : 'Xem chi tiết'}
                                                </span>
                                                {!event.is_expire && (
                                                    <Eye className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                )}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // List View
                            <div className="space-y-3">
                                {filteredAndSortedEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image */}
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

                                            {/* Content */}
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
                                                    to={`/event/${event.id}`}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${event.is_expire
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md'
                                                        }`}
                                                    onClick={(e) => event.is_expire && e.preventDefault()}
                                                >
                                                    <span className="font-medium">Xem chi tiết</span>
                                                    <Eye className="w-4 h-4" />
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
                                                <span>Xem thêm sự kiện</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && events.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalEvents} sự kiện</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />

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

export default EventList;