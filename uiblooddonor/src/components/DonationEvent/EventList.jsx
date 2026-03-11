import { useState, useEffect, useCallback } from 'react';
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Droplet, Heart, Search, Filter, AlertCircle, ChevronRight, X } from 'lucide-react';
import APIs, { endpoints } from "../../configs/APIs";
import { formatDate, formatTime } from '../../utils/Format';
import { getImageUrl } from '../../utils/Image';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [provinces, setProvinces] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalEvents, setTotalEvents] = useState(0);

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
            let url = endpoints['list_donation_event'];
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

            setHasNextPage(response.data.next !== null);

        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau!");
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
        }, 50),
        [searchTerm, selectedProvince, provinces]
    );

    useEffect(() => {
        if (provinces.length > 0) {
            debouncedLoadEvents();
        }
        return () => {
            debouncedLoadEvents.cancel();
        };
    }, [searchTerm, selectedProvince, provinces, debouncedLoadEvents]);

    useEffect(() => {
        if (page > 1) {
            loadEvents(true);
        }
    }, [page]);

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
            <Header />

            <section className="bg-red-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Sự kiện hiến máu
                        </h1>
                        <p className="text-xl text-red-100 max-w-3xl mx-auto">
                            Cùng chung tay vì cộng đồng với những sự kiện hiến máu ý nghĩa
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-8 bg-white shadow-md sticky top-[64px] z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <form onSubmit={handleSearch} className="w-full md:w-96">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên sự kiện"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadEvents(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Xóa tìm kiếm"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
                        >
                            <Filter className="h-5 w-5" />
                            Bộ lọc
                        </button>

                        <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 w-full md:w-auto`}>
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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

                            {(selectedProvince || searchTerm) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>

                    {(selectedProvince || searchTerm) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    <span>Tỉnh/Thành: {
                                        provinces.find(p => p.code === parseInt(selectedProvince))?.name || selectedProvince
                                    }</span>
                                    <button
                                        onClick={() => {
                                            setSelectedProvince("");
                                            setPage(1);
                                            loadEvents(false);
                                        }}
                                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                        title="Xóa bộ lọc tỉnh/thành"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    <span>Tìm kiếm: "{searchTerm}"</span>
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadEvents(false);
                                        }}
                                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                        title="Xóa từ khóa tìm kiếm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg max-w-2xl mx-auto">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="ml-3 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Droplet className="h-12 w-12 text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy sự kiện
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm || selectedProvince
                                    ? "Không có sự kiện nào phù hợp với tìm kiếm của bạn."
                                    : "Hiện tại chưa có sự kiện hiến máu nào. Vui lòng quay lại sau!"}
                            </p>
                            {(searchTerm || selectedProvince) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-gray-600">
                                    Tìm thấy <span className="font-bold text-red-600">{totalEvents}</span> sự kiện
                                    {(searchTerm || selectedProvince) && " phù hợp với tìm kiếm của bạn"}
                                </div>

                                <button
                                    onClick={handleRefresh}
                                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors border border-red-200 rounded-lg hover:border-red-300"
                                    disabled={loading}
                                    title="Làm mới danh sách"
                                >
                                    <svg
                                        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Làm mới</span>
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-red-400 to-red-600 relative">
                                            {event.image_url ? (
                                                <img
                                                    src={getImageUrl(event.image_url)}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Droplet className="h-16 w-16 text-white opacity-50" />
                                                </div>
                                            )}

                                            <div className="absolute top-4 right-4">
                                                {event.is_expire ? (
                                                    <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                        Đã kết thúc
                                                    </span>
                                                ) : (
                                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                        Đang diễn ra
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                                {event.title}
                                            </h3>

                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {event.description || "Không có mô tả"}
                                            </p>

                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-start text-gray-600">
                                                    <MapPin className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                                    <span  className="text-sm break-words whitespace-normal">
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
                                            </div>

                                            <Link
                                                to={`/event/${event.id}`}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${event.is_expire
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-600 text-white hover:bg-red-700'
                                                    }`}
                                                onClick={(e) => event.is_expire && e.preventDefault()}
                                            >
                                                <span className="font-medium">
                                                    {event.is_expire ? 'Đã kết thúc' : 'Xem chi tiết'}
                                                </span>
                                                {!event.is_expire && (
                                                    <ChevronRight className="h-5 w-5" />
                                                )}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasNextPage && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Đang tải...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Xem thêm</span>
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {loadingMore && (
                                <div className="flex justify-center mt-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                </div>
                            )}

                            {!hasNextPage && events.length > 0 && (
                                <p className="text-center text-gray-500 mt-8">
                                    Đã hiển thị tất cả sự kiện
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>

            <section className="py-16 bg-red-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">
                        Bạn muốn tổ chức sự kiện hiến máu?
                    </h2>
                    <p className="text-xl text-red-100 mb-8">
                        Liên hệ với chúng tôi để được hỗ trợ tổ chức sự kiện tại địa phương của bạn
                    </p>
                    <Link
                        to="/contact"
                        className="bg-white text-red-600 px-8 py-3 rounded-full hover:bg-gray-100 transition transform hover:scale-105 font-semibold"
                    >
                        Liên hệ ngay
                    </Link>
                </div>
            </section>

            <Footer />

        </div>
    );
};

export default EventList;