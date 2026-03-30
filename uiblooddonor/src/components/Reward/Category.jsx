import { useState, useEffect, useCallback, useContext } from 'react';
import {
    Gift, Package, Search, Grid, List, ChevronRight, X, Filter, AlertCircle, Award, Loader2, Send, ChevronDown, HeartHandshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../../configs/APIs';
import debounce from 'lodash.debounce';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [nameOrder, setNameOrder] = useState('asc');
    const [rewardsOrder, setRewardsOrder] = useState('desc');

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalCategories, setTotalCategories] = useState(0);
    const user = useContext(UserContexts);

    const [rewardsCount, setRewardsCount] = useState({});
    const [totalRewards, setTotalRewards] = useState(0);

    const [originalTotalCategories, setOriginalTotalCategories] = useState(0);

    const [donorInfo, setDonorInfo] = useState(null);

    const [showNameDropdown, setShowNameDropdown] = useState(false);
    const [showRewardsDropdown, setShowRewardsDropdown] = useState(false);
    const [nameSortOption, setNameSortOption] = useState('name-asc');
    const [rewardsSortOption, setRewardsSortOption] = useState('rewards-desc');
    const [hoverTimeout, setHoverTimeout] = useState(null);

    const navigate = useNavigate();

    const nameSortOptions = [
        { value: 'name-asc', label: 'Tên a-z', sortBy: 'name', order: 'asc' },
        { value: 'name-desc', label: 'Tên z-a', sortBy: 'name', order: 'desc' }
    ];

    const rewardsSortOptions = [
        { value: 'rewards-desc', label: 'Giảm dần', sortBy: 'rewards', order: 'desc' },
        { value: 'rewards-asc', label: 'Tăng dần', sortBy: 'rewards', order: 'asc' }
    ];

    const getSortedCategories = () => {
        if (!categories.length) return [];

        const sorted = [...categories];

        if (sortBy === 'name') {
            sorted.sort((a, b) => {
                if (nameOrder === 'asc') {
                    return a.name.localeCompare(b.name);
                } else {
                    return b.name.localeCompare(a.name);
                }
            });
        } else if (sortBy === 'rewards') {
            sorted.sort((a, b) => {
                if (rewardsOrder === 'desc') {
                    return (rewardsCount[b.id] || 0) - (rewardsCount[a.id] || 0);
                } else {
                    return (rewardsCount[a.id] || 0) - (rewardsCount[b.id] || 0);
                }
            });
        }

        return sorted;
    };

    const handleNameSortSelect = (option) => {
        setNameSortOption(option.value);
        setSortBy(option.sortBy);
        setNameOrder(option.order);
        setShowNameDropdown(false);
        setPage(1);
    };

    const handleRewardsSortSelect = (option) => {
        setRewardsSortOption(option.value);
        setSortBy(option.sortBy);
        setRewardsOrder(option.order);
        setShowRewardsDropdown(false);
        setPage(1);
    };

    const getNameSortLabel = () => {
        const current = nameSortOptions.find(opt => opt.value === nameSortOption);
        return current ? current.label : 'A-Z';
    };

    const getRewardsSortLabel = () => {
        const current = rewardsSortOptions.find(opt => opt.value === rewardsSortOption);
        return current ? current.label : 'Nhiều nhất';
    };

    const sortedCategories = getSortedCategories();

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

            if (!searchTerm && originalTotalCategories === 0) {
                setOriginalTotalCategories(response.data.count);
            }

        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Không thể tải danh mục. Vui lòng thử lại sau");
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
        }, searchTerm ? 500 : 50),
        [searchTerm]
    );

    const fetchRewardsCount = async (categoryId) => {
        try {
            const response = await authApis().get(`${endpoints.reward_category}${categoryId}/reward/`);
            return response.data.length;
        } catch (error) {
            console.error(`Error fetching rewards for category ${categoryId}:`, error);
            return 0;
        }
    };

    useEffect(() => {
        const fetchTotalRewards = async () => {
            try {
                const response = await authApis().get(endpoints.reward);
                setTotalRewards(response.data.count);
            } catch (error) {
                console.error("Error fetching total rewards:", error);
            }
        };

        fetchTotalRewards();
    }, []);

    useEffect(() => {
        const fetchAllRewardsCount = async () => {
            const counts = {};
            const promises = categories.map(async (category) => {
                const count = await fetchRewardsCount(category.id);
                counts[category.id] = count;
            });

            await Promise.all(promises);
            setRewardsCount(counts);
        };

        if (categories.length > 0) {
            fetchAllRewardsCount();
        }
    }, [categories]);

    useEffect(() => {
        const fetchDonorInfo = async () => {
            try {
                const response = await authApis().get(endpoints.donor_me);
                setDonorInfo(response.data);
            } catch (error) {
                console.error("Error fetching donor info:", error);
            }
        };

        if (user) {
            fetchDonorInfo();
        }
    }, [user]);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Đổi thưởng | Dòng Máu Lạc Hồng</title>
            </Helmet>
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
                            <Package className="w-6 h-6 text-white opacity-20" />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <HeartHandshake className="w-4 h-4" />
                                <span className="text-sm font-medium">Tri ân người hiến máu</span>
                            </div>

                            <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Package className="w-10 h-10" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">Kho đổi thưởng</h1>
                            </div>

                            <p className="text-lg text-red-100 max-w-2xl">
                                Mỗi giọt máu bạn cho đi chúng tôi gửi lại những món quà ý nghĩa
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{originalTotalCategories}</div>
                                        <div className="text-xs text-white/80">Tổng danh mục</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/20 transition-all duration-300">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Gift className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{totalRewards}</div>
                                        <div className="text-xs text-white/80">Tổng quà tặng</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Award className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-white/80">Tổng điểm của bạn</div>
                                        <div className="text-3xl font-bold">{donorInfo?.points?.toLocaleString() || '0'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </div>

            <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <form onSubmit={handleSearch} className="w-full lg:w-[500px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm danh mục theo tên"
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
                                <Filter className="h-5 w-5" />
                                <span className="font-medium">Bộ lọc</span>
                            </button>

                            <div
                                className="relative name-dropdown"
                                onMouseEnter={() => {
                                    clearTimeout(hoverTimeout);
                                    setShowNameDropdown(true);
                                }}
                                onMouseLeave={() => {
                                    const timeout = setTimeout(() => setShowNameDropdown(false), 100);
                                    setHoverTimeout(timeout);
                                }}
                            >
                                <button
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[100px] justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-700 font-medium">{getNameSortLabel()}</span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showNameDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showNameDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn"
                                        onMouseEnter={() => {
                                            clearTimeout(hoverTimeout);
                                            setShowNameDropdown(true);
                                        }}
                                        onMouseLeave={() => {
                                            const timeout = setTimeout(() => setShowNameDropdown(false), 100);
                                            setHoverTimeout(timeout);
                                        }}
                                    >
                                        {nameSortOptions.map((option) => {
                                            const isSelected = nameSortOption === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleNameSortSelect(option)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div
                                className="relative rewards-dropdown"
                                onMouseEnter={() => {
                                    clearTimeout(hoverTimeout);
                                    setShowRewardsDropdown(true);
                                }}
                                onMouseLeave={() => {
                                    const timeout = setTimeout(() => setShowRewardsDropdown(false), 100);
                                    setHoverTimeout(timeout);
                                }}
                            >
                                <button
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 min-w-[120px] justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-700 font-medium">{getRewardsSortLabel()}</span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showRewardsDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showRewardsDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn"
                                        onMouseEnter={() => {
                                            clearTimeout(hoverTimeout);
                                            setShowRewardsDropdown(true);
                                        }}
                                        onMouseLeave={() => {
                                            const timeout = setTimeout(() => setShowRewardsDropdown(false), 100);
                                            setHoverTimeout(timeout);
                                        }}
                                    >
                                        {rewardsSortOptions.map((option) => {
                                            const isSelected = rewardsSortOption === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleRewardsSortSelect(option)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                >
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

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
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sắp xếp theo tên</label>
                                    <div className="space-y-2">
                                        {nameSortOptions.map((option) => {
                                            const isSelected = nameSortOption === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleNameSortSelect(option);
                                                        setShowFilters(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${isSelected
                                                        ? 'border-red-500 bg-red-50 text-red-600'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sắp xếp theo số lượng</label>
                                    <div className="space-y-2">
                                        {rewardsSortOptions.map((option) => {
                                            const isSelected = rewardsSortOption === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleRewardsSortSelect(option);
                                                        setShowFilters(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${isSelected
                                                        ? 'border-red-500 bg-red-50 text-red-600'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
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
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${viewMode === 'grid'
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
                        </div>
                    )}

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
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                {!loading && categories.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25">
                                <span className="font-bold text-lg">{totalCategories}</span>
                            </div>
                            <span className="text-gray-600">
                                danh mục {searchTerm && "phù hợp với tìm kiếm"}
                            </span>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-300 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 group"
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
                )}

                {loading && (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'grid-cols-1 gap-4'}`}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && !loading && (
                    <div className="max-w-2xl mx-auto">
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
                                    className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && categories.length === 0 && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Package className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                0
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy danh mục' : 'Chưa có danh mục quà tặng'}
                        </h3>

                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchTerm
                                ? 'Không có danh mục nào phù hợp với tìm kiếm của bạn. Thử tìm kiếm với từ khóa khác.'
                                : 'Hiện tại chưa có danh mục quà tặng nào. Hãy quay lại sau nhé!'}
                        </p>

                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <X className="w-5 h-5" />
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && categories.length > 0 && (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sortedCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id, category.name)}
                                        className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Package className="w-7 h-7 text-white" />
                                                </div>

                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                    <Gift className="w-3 h-3" />
                                                    {rewardsCount[category.id] || 0} quà tặng
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                                {category.name}
                                            </h3>

                                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                                {category.description || 'Khám phá bộ sưu tập quà tặng hấp dẫn từ danh mục này'}
                                            </p>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-1 text-red-600 font-medium text-sm">
                                                    <span>Xem quà tặng</span>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id, category.name)}
                                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-red-200"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                    <Package className="w-6 h-6 text-white" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                            {category.name}
                                                        </h3>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                            <Gift className="w-3 h-3" />
                                                            {rewardsCount[category.id] || 0} quà tặng
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm truncate">
                                                        {category.description || 'Khám phá bộ sưu tập quà tặng hấp dẫn từ danh mục này'}
                                                    </p>
                                                </div>

                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" />
                                            </div>
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
                                                <span>Xem thêm danh mục</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>

                                    {loadingMore && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                                            <div className="h-full bg-white animate-loading-bar"></div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasNextPage && categories.length > 0 && (
                            <div className="text-center mt-12">
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-gray-600">
                                    <span>Đã hiển thị tất cả danh mục</span>
                                </div>
                            </div>
                        )}
                    </>
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
                
                @keyframes loading-bar {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Category;