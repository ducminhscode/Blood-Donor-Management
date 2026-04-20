import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X, Sparkles, Users, Activity, Award, MapPinned, Bell, HeartPlus, HeartPulse, Ambulance, Phone, AlertTriangle, Hospital, Syringe, Grid, List, Send, Eye, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import APIs, { endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
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

            const response = await APIs.get(url);

            if (isLoadMore) {
                setRequests(prev => [...prev, ...response.data.results]);
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
            0: 'O',
            1: 'A',
            2: 'B',
            3: 'AB'
        };
        return bloodTypes[bloodType] || 'Chưa cập nhật';
    };

    const getRhFactorText = (rhFactor) => {
        return rhFactor ? '+' : '-';
    };

    const getDonationTypeText = (donationType) => {
        const types = ['Toàn phần', 'Tiểu cầu', 'Huyết tương', 'Bạch cầu'];
        return types[donationType] || 'Không xác định';
    };

    const filteredAndSortedRequests = requests
        .filter(request => {
            const matchesSearch = searchTerm === '' ||
                request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.emergency_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        })
        .sort((a, b) => {
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
        if (request.is_expire) return 'bg-gradient-to-r from-gray-500 to-gray-600';
        if (request.critical) return 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse';
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
    };

    const getStatusText = (request) => {
        if (request.is_expire) return 'Đã hết hạn';
        if (request.critical) return 'CẤP CỨU KHẨN CẤP';
        return 'Đang cần hỗ trợ';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />

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
                            <Ambulance className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Cứu người - Cấp cứu kịp thời</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Ambulance className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Yêu cầu máu cấp cứu</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Mỗi giây phút đều quý giá. Cùng chung tay cứu giúp những bệnh nhân đang cần máu gấp.
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300">
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
                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Ambulance className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Đăng ký yêu cầu cấp cứu</h3>
                                    {!user || user.role === 1 ? (
                                        <p className="text-white/80 text-sm">Đăng ký ngay để được hỗ trợ</p>
                                    ) : user.role === 2 && (
                                        <p className="text-white/80 text-sm">Xem các yêu cầu cấp cứu đã tạo</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleFeatureCard}
                                    className="w-full bg-white text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300"
                                >
                                    {!user ? 'Đăng nhập để đăng ký' : (user.role === 2 ? 'Quản lý yêu cầu' : 'Yêu cầu đã phản hồi')}
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

            {/* Search Section */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên bệnh nhân"
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
                                            loadRequests(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            {/* View Mode Toggle */}
                            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
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

                    {/* Active Search Indicator */}
                    {searchTerm && (
                        <div className="mt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm shadow-lg shadow-red-500/25">
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
                            </div>
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
                {!loading && !error && filteredAndSortedRequests.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Ambulance className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm
                                ? "Không tìm thấy yêu cầu cấp cứu phù hợp"
                                : "Chưa có yêu cầu cấp cứu nào"}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm
                                ? "Thử tìm kiếm với tên bệnh nhân, bệnh viện hoặc ghi chú khác"
                                : "Sẽ sớm được cập nhật trong thời gian tới"}
                        </p>

                        {searchTerm && (
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                )}

                {/* Results */}
                {!loading && !error && filteredAndSortedRequests.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                    <span className="font-bold text-lg">{totalRequests}</span>
                                </div>
                                <span className="text-gray-600">
                                    yêu cầu cấp cứu {searchTerm && "phù hợp"}
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
                                {filteredAndSortedRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
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
                                                <span className={`${getStatusColor(request)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                    {getStatusText(request)}
                                                </span>
                                            </div>

                                            {/* Blood Type Badge */}
                                            <div className="absolute top-4 right-4">
                                                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {getBloodTypeText(request.blood_type)}{getRhFactorText(request.rh_factor)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Nhóm máu</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                                {request.patient_name}
                                            </h3>

                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                                {request.emergency_note || "Cần hỗ trợ máu gấp"}
                                            </p>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-start text-sm text-gray-600">
                                                    <Hospital className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <div className="font-medium">{request.hospital?.name}</div>
                                                        <div className="text-xs text-gray-500">{request.hospital?.hospital_address}, {request.hospital?.sub_district}, {request.hospital?.province}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 text-red-500 mr-2" />
                                                    <span>{request.phone}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Syringe className="w-4 h-4 text-red-500 mr-2" />
                                                    <span>Cần {request.blood_volume}ml máu</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                    <span>{formatDate(request.created_at)}</span>
                                                </div>
                                            </div>

                                            <Link
                                                to={`/emergency-request/${request.id}`}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${request.is_expire
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg'
                                                    }`}
                                                onClick={(e) => request.is_expire && e.preventDefault()}
                                            >
                                                <span className="font-medium">
                                                    {request.is_expire ? 'Đã hết hạn' : 'Xem chi tiết - Hỗ trợ ngay'}
                                                </span>
                                                {!request.is_expire && (
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
                                {filteredAndSortedRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image */}
                                            <div className="md:w-64 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-red-500 to-red-700">
                                                {request.hospital?.image_url ? (
                                                    <img
                                                        src={getImageUrl(request.hospital.image_url)}
                                                        alt={request.hospital.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Hospital className="h-12 w-12 text-white opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`${getStatusColor(request)} text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md`}>
                                                        {getStatusText(request)}
                                                    </span>
                                                </div>
                                                <div className="absolute top-4 right-4">
                                                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {getBloodTypeText(request.blood_type)}{getRhFactorText(request.rh_factor)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-5">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                                    {request.patient_name}
                                                </h3>

                                                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                                    {request.emergency_note || "Cần hỗ trợ máu gấp"}
                                                </p>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Hospital className="w-4 h-4 text-red-500 mr-2" />
                                                        <span className="truncate">{request.hospital?.name}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{request.phone}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Syringe className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>Cần {request.blood_volume}ml</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-red-500 mr-2" />
                                                        <span>{formatDate(request.created_at)}</span>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/emergency-request/${request.id}`}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${request.is_expire
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md'
                                                        }`}
                                                    onClick={(e) => request.is_expire && e.preventDefault()}
                                                >
                                                    <span className="font-medium">
                                                        {request.is_expire ? 'Đã hết hạn' : 'Xem chi tiết - Hỗ trợ ngay'}
                                                    </span>
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
                                                <span>Xem thêm yêu cầu</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}

                        {!hasNextPage && requests.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Đã hiển thị tất cả {totalRequests} yêu cầu cấp cứu</span>
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

export default EmergencyRequestList;