import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import {
    Calendar, MapPin, Clock, Droplet, Heart, Search, Filter,
    AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell,
    HeartPlus, HeartPulse, Ambulance, Phone, AlertTriangle, Hospital, Syringe
} from 'lucide-react';
import APIs, { endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import '../../styles/EventList.css';
import { UserContexts } from '../../configs/UserContexts';

const EmergencyRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('grid');

    const user = useContext(UserContexts);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRequests, setTotalRequests] = useState(0);
    const [originalTotalRequests, setOriginalTotalRequests] = useState(0);
    const navigate = useNavigate();

    const loadRequests = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setRequests([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints['emergency_request'];
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            params.append('page', currentPage);
            params.append('page_size', 12);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log("Fetching emergency requests with URL:", url);

            const response = await APIs.get(url);

            if (isLoadMore) {
                setRequests(prevRequests => [...prevRequests, ...response.data.results]);
            } else {
                setRequests(response.data.results);
            }

            if (!searchTerm && originalTotalRequests === 0) {
                setOriginalTotalRequests(response.data.count);
            }

            setTotalRequests(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching emergency requests:", err);
            setError("Không thể tải danh sách yêu cầu cấp cứu. Vui lòng thử lại sau.");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const debouncedLoadRequests = useCallback(
        debounce(() => {
            setPage(1);
            loadRequests(false);
        }, searchTerm ? 500 : 50),
        [searchTerm]
    );

    const getBloodTypeText = (bloodType) => {
        const bloodTypes = {
            1: 'A',
            2: 'B',
            3: 'AB',
            4: 'O'
        };
        return bloodTypes[bloodType] || 'Không xác định';
    };

    const getRhFactorText = (rhFactor) => {
        return rhFactor ? '+' : '-';
    };

    const getDonationTypeText = (donationType) => {
        return donationType === 0 ? 'Toàn phần' : 'Thành phần';
    };

    // Filter only by search term
    const filteredAndSortedRequests = requests
        .filter(request => {
            const matchesSearch = searchTerm === '' ||
                request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.emergency_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        })
        .sort((a, b) => {
            // Sắp xếp: critical > non-critical, and not expired > expired
            if (a.is_expire !== b.is_expire) {
                return a.is_expire ? 1 : -1;
            }
            if (a.critical !== b.critical) {
                return a.critical ? -1 : 1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

    useEffect(() => {
        debouncedLoadRequests();
        return () => {
            debouncedLoadRequests.cancel();
        };
    }, [searchTerm, debouncedLoadRequests]);

    useEffect(() => {
        if (page > 1) {
            loadRequests(true);
        }
    }, [page]);

    const handleFeatureCard = () => {
        if (!user) {
            navigate('/login', {
                state: { from: '/login' }
            });
        } else if (user.role === 1) {
            navigate('/emergency-response');
        } else if (user.role === 2) {
            navigate('/staff-emergency-request');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadRequests(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setPage(1);
        setTimeout(() => loadRequests(false), 0);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadRequests(false);
    };

    const getStatusColor = (request) => {
        if (request.is_expire) return 'bg-gray-500';
        if (request.critical) return 'bg-red-600';
        return 'bg-orange-500';
    };

    const getStatusText = (request) => {
        if (request.is_expire) return 'Đã hết hạn';
        if (request.critical) return 'CẤP CỨU KHẨN CẤP';
        return 'Đang cần hỗ trợ';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />

            {/* Hero Section với hiệu động */}
            <section className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                </div>

                {/* Animated Emergency Icons */}
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
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Cứu người - Cấp cứu kịp thời</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Yêu cầu máu cấp cứu
                            </h1>

                            <p className="text-xl text-red-100 max-w-2xl mx-auto md:mx-0 mb-8">
                                Mỗi giây phút đều quý giá. Cùng chung tay cứu giúp những bệnh nhân đang cần máu gấp.
                            </p>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <HeartPulse className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalTotalRequests}</div>
                                        <div className="text-sm text-white/80">Yêu cầu cấp cứu</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Card */}
                        <div className="hidden lg:block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Ambulance className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Đăng ký yêu cầu cấp cứu</h3>
                                    {!user || user.role === 1 ? (
                                        <p className="text-white/80 text-sm">Đăng ký ngay để được hỗ trợ</p>
                                    ) : user.role === 2 && (
                                        <p className="text-white/80 text-sm">Xem các yêu cầu cấp cứu đã tạo</p>
                                    )}
                                </div>
                                <button onClick={handleFeatureCard} className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                                    {!user ? 'Đăng nhập để đăng ký' : (user.role === 2 ? 'Quản lý yêu cầu cấp cứu' : 'Yêu cầu đã phản hồi')}
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

            {/* Search Section */}
            <section className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="w-full">
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
                                            loadRequests(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
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
                    </div>

                    {/* Active Filters */}
                    {searchTerm && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
                                <Search className="h-4 w-4" />
                                <span>Tìm kiếm: "{searchTerm}"</span>
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setPage(1);
                                        loadRequests(false);
                                    }}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
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

                    {!loading && !error && filteredAndSortedRequests.length === 0 && (
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
                                {searchTerm
                                    ? "Không tìm thấy yêu cầu cấp cứu phù hợp"
                                    : "Chưa có yêu cầu cấp cứu nào"}
                            </h3>

                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? "Thử tìm kiếm với tên bệnh nhân hoặc bệnh viện khác"
                                    : "Sẽ sớm được cập nhật trong thời gian tới"}
                            </p>

                            {searchTerm && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
                                >
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && filteredAndSortedRequests.length > 0 && (
                        <>
                            {/* Results Header */}
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                        <span className="font-bold">{filteredAndSortedRequests.length}</span>
                                    </div>
                                    <span className="text-gray-600">
                                        yêu cầu cấp cứu {searchTerm && "phù hợp"}
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
                                    {filteredAndSortedRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Image Container */}
                                            <div className="relative h-48 overflow-hidden">
                                                {request.hospital?.image_url ? (
                                                    <img
                                                        src={getImageUrl(request.hospital.image_url)}
                                                        alt={request.hospital.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                                                        <Hospital className="h-16 w-16 text-white opacity-50" />
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`${getStatusColor(request)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-lg ${request.critical && !request.is_expire ? 'animate-pulse' : ''}`}>
                                                        {request.critical && !request.is_expire && <AlertTriangle className="w-3 h-3" />}
                                                        {getStatusText(request)}
                                                    </span>
                                                </div>

                                                {/* Blood Type Badge */}
                                                <div className="absolute top-4 right-4">
                                                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {getBloodTypeText(request.blood_type)}{getRhFactorText(request.rh_factor)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Nhóm máu</div>
                                                    </div>
                                                </div>

                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                        {request.patient_name}
                                                    </h3>
                                                </div>

                                                <p className="text-gray-600 mb-4 line-clamp-2">
                                                    {request.emergency_note || "Cần hỗ trợ máu gấp"}
                                                </p>

                                                {/* Request Details */}
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-start text-gray-600">
                                                        <Hospital className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                                        <div className="text-sm">
                                                            <div>{request.hospital?.name}</div>
                                                            <div className="text-xs text-gray-500">{request.hospital?.hospital_address}, {request.hospital?.sub_district}, {request.hospital?.province}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center text-gray-600">
                                                        <Phone className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                        <span className="text-sm">{request.phone}</span>
                                                    </div>

                                                    <div className="flex items-center text-gray-600">
                                                        <Syringe className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                        <span className="text-sm">Cần {request.blood_volume}ml máu {getDonationTypeText(request.donation_type)}</span>
                                                    </div>

                                                    <div className="flex items-center text-gray-600">
                                                        <Calendar className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                        <span className="text-sm">Yêu cầu lúc: {formatDate(request.created_at)}</span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <Link
                                                    to={`/emergency-request/${request.id}`}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn ${request.is_expire
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25'
                                                        }`}
                                                    onClick={(e) => request.is_expire && e.preventDefault()}
                                                >
                                                    <span className="font-medium">
                                                        {request.is_expire ? 'Đã hết hạn' : 'Xem chi tiết - Hỗ trợ ngay'}
                                                    </span>
                                                    {!request.is_expire && (
                                                        <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                                    )}
                                                </Link>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredAndSortedRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {/* Image */}
                                                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                                                    {request.hospital?.image_url ? (
                                                        <img
                                                            src={getImageUrl(request.hospital.image_url)}
                                                            alt={request.hospital.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                                                            <Hospital className="h-16 w-16 text-white opacity-50" />
                                                        </div>
                                                    )}

                                                    <div className="absolute top-4 left-4">
                                                        <span className={`${getStatusColor(request)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${request.critical && !request.is_expire ? 'animate-pulse' : ''}`}>
                                                            {request.critical && !request.is_expire && <AlertTriangle className="w-3 h-3" />}
                                                            {getStatusText(request)}
                                                        </span>
                                                    </div>

                                                    <div className="absolute top-4 right-4">
                                                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                                                            <div className="text-lg font-bold text-red-600">
                                                                {getBloodTypeText(request.blood_type)}{getRhFactorText(request.rh_factor)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                                                {request.patient_name}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {request.emergency_note}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-center text-gray-600">
                                                            <Hospital className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{request.hospital?.name}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Phone className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{request.phone}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Syringe className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">Cần {request.blood_volume}ml</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{formatDate(request.created_at)}</span>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to={`/emergency-request/${request.id}`}
                                                        className={`items-center justify-between px-4 py-3 rounded-xl inline-flex transition-all group/btn ${request.is_expire
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25'
                                                            }`}
                                                        onClick={(e) => request.is_expire && e.preventDefault()}
                                                    >
                                                        <span>{request.is_expire ? 'Đã hết hạn' : 'Xem chi tiết - Hỗ trợ ngay'}</span>
                                                        <ChevronRight className="h-4 w-4 ml-2" />
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
                                                    <span>Xem thêm yêu cầu</span>
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

                            {!hasNextPage && requests.length > 0 && (
                                <div className="text-center mt-12">
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                        <Ambulance className="w-5 h-5" />
                                        <span>Đã hiển thị tất cả yêu cầu cấp cứu</span>
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

export default EmergencyRequestList;