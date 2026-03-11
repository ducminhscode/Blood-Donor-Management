import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Gift, Package, ArrowLeft, Star, Search, ShoppingBag, Clock } from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import Header from '../Home/layouts/Header';
import Footer from '../Home/layouts/Footer';
import { getImageUrl } from '../../utils/Image';

const Reward = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const categoryName = location.state?.categoryName || 'Danh mục';

    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRewards();
    }, [id]);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const url = endpoints.reward_by_category.replace('${id}', id);
            const response = await authApis().get(url);
            setRewards(response.data);
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRewardClick = (rewardId) => {
        navigate(`/reward-category/${id}/reward/${rewardId}`);
    };

    const filteredRewards = rewards.filter(reward => 
        reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header/>
            <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        <h1 className="text-2xl md:text-3xl font-bold">{categoryName}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm quà tặng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600">
                        Có <span className="font-semibold text-red-600">{filteredRewards.length}</span> quà tặng trong danh mục này
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredRewards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRewards.map((reward) => (
                            <div
                                key={reward.id}
                                onClick={() => handleRewardClick(reward.id)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="relative">
                                    <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                                        {reward.image_url ? (
                                            <img
                                                src={getImageUrl(reward.image_url)}
                                                alt={reward.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Gift className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        {reward.points_required}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                        {reward.name}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm">
                                        {reward.remaining_stock > 0 ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <ShoppingBag className="w-4 h-4" />
                                                Còn {reward.remaining_stock} sản phẩm
                                            </span>
                                        ) : (
                                            <span className="text-red-500 flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                Hết hàng
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Không tìm thấy quà tặng
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Danh mục này chưa có quà tặng'}
                        </p>
                    </div>
                )}
            </div>
            <Footer/>
        </div>
    );
};

export default Reward;