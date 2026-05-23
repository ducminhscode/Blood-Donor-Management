import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Gift, Package, ArrowLeft, Star, Search, ShoppingBag, Clock,
    Sparkles, Filter, X, Heart, TrendingUp, Award, Zap,
    ChevronRight, Tag, AlertCircle, ArrowUpAZ, ArrowDownZA,
    TrendingDown, Loader2, Send, BadgeCheck, Shield, Droplet,
    MapPin, Calendar, Users, Eye, HeartHandshake
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { Helmet } from "react-helmet-async";

const Reward = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [categoryName, setCategoryName] = useState(location.state?.categoryName || 'Danh mục quà tặng');

    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc'); 
    const [filterStock, setFilterStock] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredReward, setHoveredReward] = useState(null);
    const [pointsOrder, setPointsOrder] = useState('asc');

    useEffect(() => {
        fetchRewards();
    }, [id]);

    useEffect(() => {
        setCategoryName(location.state?.categoryName || 'Danh mục quà tặng');
    }, [location.state]);

    useEffect(() => {
        const fetchCategoryName = async () => {
            if (location.state?.categoryName || !id) return;

            try {
                const response = await authApis().get(`${endpoints.reward_category}${id}/`);
                if (response.data?.name) {
                    setCategoryName(response.data.name);
                }
            } catch (error) {
                console.error("Error fetching category name:", error);
            }
        };

        fetchCategoryName();
    }, [id, location.state]);

    useEffect(() => {
        document.title = `${categoryName} | Dòng Máu Lạc Hồng`;
    }, [categoryName]);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const url = endpoints.reward_by_category.replace('${id}', id);
            const response = await authApis().get(url);
            setRewards(response.data);

            const firstReward = response.data?.[0];
            const resolvedCategoryName =
                firstReward?.reward_category?.name ||
                firstReward?.category?.name ||
                firstReward?.reward_category_name;

            if (resolvedCategoryName) {
                setCategoryName(resolvedCategoryName);
            }
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRewardClick = (rewardId) => {
        navigate(`/reward-category/${id}/reward/${rewardId}`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const totalRewards = rewards.length;
    const inStockRewards = rewards.filter(r => r.remaining_stock > 0).length;
    const totalPoints = rewards
        .filter(r => r.remaining_stock > 0)
        .reduce((sum, reward) => sum + reward.points_required * reward.remaining_stock, 0);

    const filteredRewards = rewards
        .filter(reward => {
            const matchesSearch = searchTerm === '' ||
                reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStock = filterStock === 'all' ||
                (filterStock === 'inStock' && reward.remaining_stock > 0) ||
                (filterStock === 'outOfStock' && reward.remaining_stock === 0);

            return matchesSearch && matchesStock;
        })
        .sort((a, b) => {
            if (sortBy === 'points') {
                return pointsOrder === 'asc'
                    ? a.points_required - b.points_required
                    : b.points_required - a.points_required;
            }
            if (sortBy === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            return 0;
        });

    const toggleNameSort = () => {
        setSortBy('name');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const togglePointsSort = () => {
        setSortBy('points');
        setPointsOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>{categoryName} | Dòng Máu Lạc Hồng</title>
            </Helmet>
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
                            <Gift className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                        <button
                            onClick={() => navigate("/reward-category")}
                            className="hover:text-white transition-colors"
                        >
                            Danh mục
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">{categoryName}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Gift className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold">{categoryName}</h1>
                            </div>
                            <p className="text-red-100 text-lg">
                                Chọn quà tặng và đổi điểm ngay hôm nay
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex flex-wrap gap-3">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{totalRewards}</div>
                                    <div className="text-sm text-white/80">Quà tặng</div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-300">{inStockRewards}</div>
                                    <div className="text-sm text-white/80">Còn hàng</div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center gap-1 justify-center">
                                        <Award className="w-5 h-5" />
                                        <span>{(totalPoints / 1000).toFixed(1)}K</span>
                                    </div>
                                    <div className="text-sm text-white/80">Tổng điểm</div>
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
                        <div className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm quà tặng theo tên hoặc mô tả..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
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
                                <Filter className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            {/* Sort Buttons */}
                            <div className="hidden lg:flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={toggleNameSort}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                        sortBy === 'name'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Tag className="w-4 h-4" />
                                    <span>
                                        {sortBy === 'name'
                                            ? (sortOrder === 'asc' ? 'A-Z' : 'Z-A')
                                            : 'Tên'
                                        }
                                    </span>
                                </button>

                                <button
                                    onClick={togglePointsSort}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                        sortBy === 'points'
                                            ? 'bg-white text-red-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {sortBy === 'points' && pointsOrder === 'asc' ? (
                                        <>
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Điểm tăng</span>
                                        </>
                                    ) : sortBy === 'points' && pointsOrder === 'desc' ? (
                                        <>
                                            <TrendingDown className="w-4 h-4" />
                                            <span>Điểm giảm</span>
                                        </>
                                    ) : (
                                        <>
                                            <Award className="w-4 h-4" />
                                            <span>Điểm</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Stock Filter */}
                            <select
                                value={filterStock}
                                onChange={(e) => setFilterStock(e.target.value)}
                                className="hidden lg:block px-4 py-2 bg-gray-100 border-2 border-transparent rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all duration-300 cursor-pointer"
                            >
                                <option value="all">Tất cả</option>
                                <option value="inStock">Còn hàng</option>
                                <option value="outOfStock">Hết hàng</option>
                            </select>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sắp xếp theo
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={toggleNameSort}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                                sortBy === 'name'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Tag className="w-4 h-4" />
                                            <span>
                                                {sortBy === 'name'
                                                    ? (sortOrder === 'asc' ? 'A-Z' : 'Z-A')
                                                    : 'Tên'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={togglePointsSort}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                                sortBy === 'points'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {sortBy === 'points' && pointsOrder === 'asc' ? (
                                                <>
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span>Điểm tăng</span>
                                                </>
                                            ) : sortBy === 'points' && pointsOrder === 'desc' ? (
                                                <>
                                                    <TrendingDown className="w-4 h-4" />
                                                    <span>Điểm giảm</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Award className="w-4 h-4" />
                                                    <span>Điểm</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => {
                                                setFilterStock('all');
                                                setShowFilters(false);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${
                                                filterStock === 'all'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStock('inStock');
                                                setShowFilters(false);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${
                                                filterStock === 'inStock'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            Còn hàng
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStock('outOfStock');
                                                setShowFilters(false);
                                            }}
                                            className={`px-4 py-2 rounded-lg border transition-all ${
                                                filterStock === 'outOfStock'
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            Hết hàng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Search Indicator */}
                    {searchTerm && (
                        <div className="mt-4">
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
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm ml-2">
                                Tìm thấy {filteredRewards.length} kết quả
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                {!loading && filteredRewards.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                <span className="font-bold text-lg">{filteredRewards.length}</span>
                            </div>
                            <span className="text-gray-600">
                                quà tặng {searchTerm && "phù hợp với tìm kiếm"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="h-5 bg-gray-200 rounded-lg mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                                    <div className="h-8 bg-gray-200 rounded-xl w-24"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rewards Grid */}
                {!loading && filteredRewards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRewards.map((reward) => (
                            <div
                                key={reward.id}
                                onClick={() => handleRewardClick(reward.id)}
                                onMouseEnter={() => setHoveredReward(reward.id)}
                                onMouseLeave={() => setHoveredReward(null)}
                                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                    {reward.image_url ? (
                                        <img
                                            src={getImageUrl(reward.image_url)}
                                            alt={reward.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Gift className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Points Badge */}
                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-lg">
                                        <Award className="w-3 h-3" />
                                        {reward.points_required.toLocaleString()}
                                    </div>

                                    {/* Stock Badge */}
                                    {reward.remaining_stock === 0 && (
                                        <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Hết hàng
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-6 transition-opacity duration-300 ${
                                        hoveredReward === reward.id ? 'opacity-100' : 'opacity-0'
                                    }`}>
                                        <button className="bg-white text-red-600 px-6 py-2.5 rounded-xl font-semibold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Eye className="w-4 h-4 inline mr-2" />
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors min-h-[56px]">
                                        {reward.name}
                                    </h3>

                                    <p className="text-gray-500 text-sm line-clamp-2 mb-3 min-h-[40px]">
                                        {reward.description || 'Quà tặng hấp dẫn từ chương trình đổi thưởng'}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        {reward.remaining_stock > 0 ? (
                                            <span className="text-green-600 flex items-center gap-1.5 text-sm bg-green-50 px-3 py-1.5 rounded-lg">
                                                <Gift className="w-4 h-4" />
                                                Còn {reward.remaining_stock}
                                            </span>
                                        ) : (
                                            <span className="text-red-500 flex items-center gap-1.5 text-sm bg-red-50 px-3 py-1.5 rounded-lg">
                                                <Clock className="w-4 h-4" />
                                                Hết hàng
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1 text-red-600 font-medium text-sm">
                                            <span>Đổi ngay</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !loading && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Gift className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm || filterStock !== 'all'
                                ? 'Không tìm thấy quà tặng phù hợp'
                                : 'Danh mục chưa có quà tặng'}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm || filterStock !== 'all'
                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác để tìm quà tặng phù hợp'
                                : 'Sẽ sớm được cập nhật trong thời gian tới. Hãy quay lại sau nhé!'}
                        </p>

                        {(searchTerm || filterStock !== 'all') && (
                            <div className="flex gap-3 justify-center flex-wrap">
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        <X className="w-5 h-5" />
                                        Xóa tìm kiếm
                                    </button>
                                )}
                                {filterStock !== 'all' && (
                                    <button
                                        onClick={() => setFilterStock('all')}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                                    >
                                        <Package className="w-5 h-5" />
                                        Xem tất cả
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
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
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Reward;
