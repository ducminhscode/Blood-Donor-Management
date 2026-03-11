import { useState, useEffect, useCallback } from 'react';
import { Gift, Package, Search, Grid, List, ChevronRight, X, Filter, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../configs/APIs';
import debounce from 'lodash.debounce';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalCategories, setTotalCategories] = useState(0);

    const navigate = useNavigate();

    const loadCategories = async (isLoadMore = false) => {
        const currentPage = isLoadMore ? page : 1;

        if (!isLoadMore) {
            setLoading(true);
            setCategories([]);
        } else {
            if (!hasNextPage || loadingMore) return;
            setLoadingMore(true);
        }

        setError("");

        try {
            let url = endpoints.reward_category;
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            params.append('page', currentPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authApis().get(url);

            if (isLoadMore) {
                setCategories(prev => [...prev, ...response.data.results]);
            } else {
                setCategories(response.data.results);
            }

            setTotalCategories(response.data.count);
            setHasNextPage(response.data.next !== null);

        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Không thể tải danh mục. Vui lòng thử lại sau!");
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };
    const debouncedLoadCategories = useCallback(
        debounce(() => {
            setPage(1);
            loadCategories(false);
        }, 50),
        [searchTerm]
    );

    useEffect(() => {
        debouncedLoadCategories();
        return () => {
            debouncedLoadCategories.cancel();
        };
    }, [searchTerm, debouncedLoadCategories]);

    useEffect(() => {
        if (page > 1) {
            loadCategories(true);
        }
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadCategories(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setPage(1);
        loadCategories(false);
    };

    const handleCategoryClick = (categoryId, categoryName) => {
        navigate(`/reward-category/${categoryId}`, {
            state: { categoryName }
        });
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore && !loading) {
            setPage(prev => prev + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadCategories(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-10 h-10" />
                        <h1 className="text-3xl md:text-4xl font-bold">Đổi thưởng</h1>
                    </div>
                    <p className="text-lg text-red-50 max-w-2xl">
                        Đổi điểm thưởng của bạn lấy những phần quà hấp dẫn
                    </p>
                </div>
            </div>

            <section className="py-6 bg-white shadow-md sticky top-[64px] z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <form onSubmit={handleSearch} className="w-full md:w-96">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm danh mục..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
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
                            {viewMode === 'grid' ? 'Bộ lọc' : 'Danh sách'}
                        </button>

                        <div className={`${showFilters ? 'flex' : 'hidden'} md:flex gap-2`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition ${viewMode === 'grid'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title="Xem dạng lưới"
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition ${viewMode === 'list'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title="Xem dạng danh sách"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {searchTerm && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                <span>Tìm kiếm: "{searchTerm}"</span>
                                <button
                                    onClick={handleClearSearch}
                                    className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                    title="Xóa từ khóa tìm kiếm"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg max-w-2xl mx-auto mb-6">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <p className="ml-3 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && categories.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="h-12 w-12 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không tìm thấy danh mục
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? "Không có danh mục nào phù hợp với tìm kiếm của bạn."
                                : "Hiện tại chưa có danh mục quà tặng nào."}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && categories.length > 0 && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-gray-600">
                                Tìm thấy <span className="font-bold text-red-600">{totalCategories}</span> danh mục
                                {searchTerm && " phù hợp với tìm kiếm của bạn"}
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

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id, category.name)}
                                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                                    <Package className="w-6 h-6 text-red-600 group-hover:text-white transition-colors" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                                    {category.name}
                                                </h3>
                                            </div>

                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                                {category.description || 'Không có mô tả'}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">
                                                    Xem quà tặng
                                                </span>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id, category.name)}
                                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Package className="w-6 h-6 text-red-600" />
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {category.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    {category.description || 'Không có mô tả'}
                                                </p>
                                            </div>

                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

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

                        {!hasNextPage && categories.length > 0 && (
                            <p className="text-center text-gray-500 mt-8">
                                Đã hiển thị tất cả danh mục
                            </p>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Category;