import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import {
    Calendar, MapPin, Clock, Droplet, Heart, Search, Filter,
    AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell,
    HeartPlus,
    HeartPulse
} from 'lucide-react';
import APIs, { endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import '../../styles/EventList.css';
import { UserContexts } from '../../configs/UserContexts';

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
                params.append('status', filterType);
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log("Fetching events with URL:", url);

            const response = await APIs.get(url);

            if (isLoadMore) {
                setEvents(prevEvents => [...prevEvents, ...response.data.results]);
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
        [searchTerm, selectedProvince, filterType, provinces]
    );

    const getEventStatus = (timeStart) => {
        const now = new Date().getTime();
        const start = new Date(timeStart).getTime();

        if (start > now) return 'upcoming';
        if (start <= now) return 'ongoing';
    };

    // Tạo biến filteredAndSortedEvents
    const filteredAndSortedEvents = events
        .filter(event => {
            // Filter theo search term
            const matchesSearch = searchTerm === '' ||
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase());

            // Filter theo province
            const matchesProvince = !selectedProvince ||
                event.province === provinces.find(p => p.code === parseInt(selectedProvince))?.name;

            // Filter theo status
            const status = getEventStatus(event.time_start);
            const matchesStatus = filterType === 'all' ||
                (filterType === 'ongoing' && status === 'ongoing') ||
                (filterType === 'upcoming' && status === 'upcoming');

            return matchesSearch && matchesProvince && matchesStatus;
        })
        .sort((a, b) => {
            // Sắp xếp: ongoing > upcoming > ended
            const priority = { 'ongoing': 1, 'upcoming': 2, 'ended': 3 };
            const statusA = getEventStatus(a.time_start);
            const statusB = getEventStatus(b.time_start);
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

    const handleFeatureCard = () => {
        if (!user) {
            navigate('/login', {
                state: { from: '/login' }
            });
        } else if (user.role === 1) {
            navigate('/event-registration');
        } else if (user.role === 2) {
            navigate('/staff-donation-event')
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadEvents(false);
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

        if (status === 'ended') return 'bg-gray-500';
        if (status === 'ongoing') return 'bg-green-500';
        return 'bg-blue-500';
    };

    const getStatusText = (event) => {
        const status = getEventStatus(event.time_start);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />

            {/* Hero Section với hiệu động */}
            <section className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                {/* Animated Blood Drops */}
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
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Cùng chung tay vì cộng đồng</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Sự kiện hiến máu
                            </h1>

                            <p className="text-xl text-red-100 max-w-2xl mx-auto md:mx-0 mb-8">
                                Mỗi giọt máu cho đi - Một cuộc đời ở lại. Tham gia ngay để cứu giúp những mảnh đời cần bạn.
                            </p>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
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
                        <div className="hidden lg:block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Sự kiện sắp tới</h3>
                                    {!user || user.role === 1 ? (
                                        <p className="text-white/80 text-sm">Đăng ký ngay để nhận thông báo</p>
                                    ) : user.role === 2 && (
                                        <p className="text-white/80 text-sm">Xem những sự kiện hiến máu mà bạn đã tạo</p>
                                    )}
                                </div>
                                <button onClick={handleFeatureCard} className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                                    {!user ? 'Đăng nhập để đăng ký' : (user.role === 2 ? 'Quản lý sự kiện hiến máu' : 'Sự kiện đã đăng ký')}
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
                                    placeholder="Tìm kiếm sự kiện hiến máu"
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
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 justify-center"
                            >
                                <Filter className="h-5 w-5" />
                                <span>Bộ lọc</span>
                            </button>

                            {/* Filter Tabs - Desktop */}
                            <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-4 py-2 rounded-lg transition-all ${filterType === 'all'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilterType('ongoing')}
                                    className={`px-4 py-2 rounded-lg transition-all ${filterType === 'ongoing'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="flex items-center gap-1">
                                        Đang diễn ra
                                    </span>
                                </button>
                                <button
                                    onClick={() => setFilterType('upcoming')}
                                    className={`px-4 py-2 rounded-lg transition-all ${filterType === 'upcoming'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="flex items-center gap-1">
                                        Sắp diễn ra
                                    </span>
                                </button>
                            </div>

                            {/* Province Select */}
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                className="hidden lg:block px-4 py-2 bg-gray-100 border-2 border-transparent rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
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
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Bộ lọc nâng cao</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFilterType('all')}
                                            className={`px-4 py-2 rounded-lg border ${filterType === 'all'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => setFilterType('ongoing')}
                                            className={`px-4 py-2 rounded-lg border ${filterType === 'ongoing'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            Đang diễn ra
                                        </button>
                                        <button
                                            onClick={() => setFilterType('upcoming')}
                                            className={`px-4 py-2 rounded-lg border ${filterType === 'upcoming'
                                                ? 'border-red-f500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            Sắp diễn ra
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tỉnh/Thành phố
                                    </label>
                                    <select
                                        value={selectedProvince}
                                        onChange={handleProvinceChange}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chế độ xem
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
                                                ? 'border-red-500 bg-red-50 text-red-600'
                                                : 'border-gray-200 hover:border-gray-300'
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
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
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
                                    <span>Trạng thái: {
                                        filterType === 'ongoing' ? 'Đang diễn ra' :
                                            filterType === 'upcoming' ? 'Sắp diễn ra' :
                                                filterType === 'ended' ? 'Đã kết thúc' : ''
                                    }</span>
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                    <span>{
                                        provinces.find(p => p.code === parseInt(selectedProvince))?.name || selectedProvince
                                    }</span>
                                    <button
                                        onClick={() => {
                                            setSelectedProvince("");
                                            setPage(1);
                                            loadEvents(false);
                                        }}
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
                                            loadEvents(false);
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

                    {!loading && !error && filteredAndSortedEvents.length === 0 && (
                        <div className="text-center py-20">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform">
                                    <Droplet className="h-16 w-16 text-red-600" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    0
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {searchTerm || selectedProvince || filterType !== 'all'
                                    ? "Không tìm thấy sự kiện phù hợp"
                                    : "Chưa có sự kiện nào"}
                            </h3>

                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedProvince || filterType !== 'all'
                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác"
                                    : "Sẽ sớm được cập nhật trong thời gian tới"}
                            </p>

                            {(searchTerm || selectedProvince || filterType !== 'all') && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && filteredAndSortedEvents.length > 0 && (
                        <>
                            {/* Results Header */}
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                        <span className="font-bold">{filteredAndSortedEvents.length}</span>
                                    </div>
                                    <span className="text-gray-600">
                                        sự kiện hiến máu {(searchTerm || selectedProvince) && "phù hợp"}
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
                                    {filteredAndSortedEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                                                    <span className={`${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-lg`}>
                                                        {getStatusText(event)}
                                                    </span>
                                                </div>

                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {event.title}
                                                </h3>

                                                <p className="text-gray-600 mb-4 line-clamp-2">
                                                    {event.description || "Cùng tham gia hiến máu cứu người - Một giọt máu cho đi, một cuộc đời ở lại"}
                                                </p>

                                                {/* Event Details */}
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-start text-gray-600">
                                                        <MapPin className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                                        <span className="text-sm break-words whitespace-normal">
                                                            {event.location}, {event.sub_district}, {event.province}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center text-gray-600">
                                                        <Calendar className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                        <span className="text-sm">
                                                            {formatDate(event.time_start)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center text-gray-600">
                                                        <Clock className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                        <span className="text-sm">
                                                            {formatTime(event.time_start)}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {event.registered_count && (
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-600">Đã đăng ký</span>
                                                                <span className="font-medium text-red-600">{event.registered_count} người</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-red-600 h-2 rounded-full"
                                                                    style={{ width: `${Math.min((event.registered_count / 100) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <Link
                                                    to={`/event/${event.id}`}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn ${event.is_expire
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25'
                                                        }`}
                                                    onClick={(e) => event.is_expire && e.preventDefault()}
                                                >
                                                    <span className="font-medium">
                                                        {event.is_expire ? 'Đã kết thúc' : 'Xem chi tiết'}
                                                    </span>
                                                    {!event.is_expire && (
                                                        <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                                    )}
                                                </Link>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredAndSortedEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {/* Image */}
                                                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
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

                                                    <span className={`absolute top-4 left-4 ${getStatusColor(event)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold`}>
                                                        {getStatusText(event)}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {event.title}
                                                        </h3>
                                                    </div>

                                                    <p className="text-gray-600 mb-4">
                                                        {event.description || "Cùng tham gia hiến máu cứu người"}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-center text-gray-600">
                                                            <MapPin className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{event.province}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{formatDate(event.time_start)}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Clock className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{formatTime(event.time_start)}</span>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to={`/event/${event.id}`}
                                                        className={`items-center justify-between px-4 py-3 rounded-xl inline-flex transition-all group/btn ${event.is_expire
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25'
                                                            }`}
                                                        onClick={(e) => event.is_expire && e.preventDefault()}
                                                    >
                                                        <span>Xem chi tiết</span>
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
                                        className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl disabled:from-red-400 disabled:to-red-400 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loadingMore ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Đang tải thêm...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Xem thêm sự kiện</span>
                                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </button>
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

                            {!hasNextPage && events.length > 0 && (
                                <div className="text-center mt-12">
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                        <Droplet className="w-5 h-5" />
                                        <span>Đã hiển thị tất cả sự kiện</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default EventList;