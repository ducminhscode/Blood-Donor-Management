import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Gift, ArrowLeft, Star, ShoppingBag, Calendar, Package, Heart,
    Share2, Award, Plus, Minus, User, Mail, Phone, MapPin,
    MapPinned, Home, FileText, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import Footer from '../Home/layouts/Footer';
import Header from '../Home/layouts/Header';
import { getImageUrl } from '../../utils/Image';
import { UserContexts } from '../../configs/UserContexts';

const RewardDetail = () => {
    const { id, reward_id } = useParams();
    const navigate = useNavigate();

    const [reward, setReward] = useState(null);
    const [loading, setLoading] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [redeemSuccess, setRedeemSuccess] = useState(false);
    const [error, setError] = useState('');
    const user_current = useContext(UserContexts);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');

    const [redeemForm, setRedeemForm] = useState({
        quantity: 1,
        last_name: user_current?.last_name || '',
        first_name: user_current?.first_name || '',
        phone: user_current?.phone || '',
        email: user_current?.email || '',
        province: '',
        sub_district: '',
        recipient_address: '',
        recipient_note: ''
    });

    useEffect(() => {
        fetchRewardDetail();
        fetchProvinces();
    }, [id, reward_id]);

    useEffect(() => {
        setRedeemForm(prev => ({ ...prev, quantity }));
    }, [quantity]);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedProvince) return;
            try {
                const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
                const data = await response.json();
                setDistricts(data.districts || []);
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };
        fetchDistricts();
    }, [selectedProvince]);

    const fetchProvinces = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (error) {
            console.error("Error fetching provinces:", error);
        }
    };

    const fetchRewardDetail = async () => {
        setLoading(true);
        try {
            const url = endpoints.reward_detail
                .replace('${id}', id)
                .replace('${reward_id}', reward_id);
            const response = await authApis().get(url);
            setReward(response.data);
        } catch (error) {
            console.error("Error fetching reward detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRedeemForm(prev => ({ ...prev, [name]: value }));
    };

    const handleProvinceChange = (e) => {
        const provinceName = e.target.value;
        const selected = provinces.find(p => p.name === provinceName);
        setSelectedProvince(selected?.code || '');
        setRedeemForm(prev => ({
            ...prev,
            province: provinceName,
            sub_district: ''
        }));
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        setError('');
        setRedeeming(true);

        try {
            const url = endpoints.redeem_reward.replace('${id}', reward_id);

            const response = await authApis().post(url, {
                quantity: redeemForm.quantity,
                last_name: redeemForm.last_name,
                first_name: redeemForm.first_name,
                phone: redeemForm.phone,
                email: redeemForm.email,
                province: redeemForm.province,
                sub_district: redeemForm.sub_district,
                recipient_address: redeemForm.recipient_address,
                recipient_note: redeemForm.recipient_note
            });

            setRedeemSuccess(true);
            setTimeout(() => {
                navigate(-1);
            }, 3000);
        } catch (error) {
            console.error("Error redeeming reward:", error);
            setError(error.response?.data?.message || "Có lỗi xảy ra khi đổi quà. Vui lòng thử lại!");
        } finally {
            setRedeeming(false);
        }
    };

    const handleContinue = () => {
        if (!user_current) {
            navigate('/login', {
                state: { from: location.pathname }
            });
        } else {
            setShowForm(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!reward) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy quà tặng</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (redeemSuccess) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đổi quà thành công!</h2>
                        <p className="text-gray-600 mb-4">
                            Bạn đã đổi thành công {redeemForm.quantity} {reward.name}
                        </p>
                        <p className="text-sm text-gray-500">
                            Đang chuyển hướng...
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 bg-gray-50 flex items-center justify-center">
                            {reward.image_url ? (
                                <img
                                    src={getImageUrl(reward.image_url)}
                                    alt={reward.name}
                                    className="w-full max-w-md h-auto object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-full max-w-md aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Gift className="w-24 h-24 text-gray-400" />
                                </div>
                            )}
                        </div>

                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {reward.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="text-xl">{reward.points_required} điểm</span>
                                </div>

                                {reward.remaining_stock > 0 && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <ShoppingBag className="w-5 h-5" />
                                        <span>Còn {reward.remaining_stock} sản phẩm</span>
                                    </div>
                                )}
                            </div>

                            {reward.description && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-700">{reward.description}</p>
                                </div>
                            )}

                            {!showForm ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border-2 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <span className="w-12 h-10 flex items-center justify-center text-gray-900 font-medium">
                                                {quantity}
                                            </span>

                                            <button
                                                onClick={() => setQuantity(Math.min(reward.remaining_stock, quantity + 1))}
                                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleContinue}
                                            disabled={!reward.remaining_stock || reward.remaining_stock < quantity}
                                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition ${reward.remaining_stock >= quantity
                                                    ? 'bg-red-600 hover:bg-red-700'
                                                    : 'bg-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Heart className="w-5 h-5" />
                                            {user_current ? 'Tiếp tục' : 'Đăng nhập để đổi quà'}
                                        </button>
                                    </div>

                                    {(!reward.remaining_stock || reward.remaining_stock < quantity) && (
                                        <p className="mt-2 text-sm text-red-600">
                                            Số lượng trong kho không đủ
                                        </p>
                                    )}
                                </>
                            ) : (
                                <form onSubmit={handleRedeem} className="space-y-4">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-4">
                                        Thông tin nhận quà
                                    </h3>

                                    {error && (
                                        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                                            <div className="flex">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                <p className="ml-3 text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Họ
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={redeemForm.last_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    placeholder="Nguyễn"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={redeemForm.first_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    placeholder="Văn A"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={redeemForm.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="0987654321"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={redeemForm.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tỉnh/Thành phố
                                        </label>
                                        <div className="relative">
                                            <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <select
                                                name="province"
                                                value={redeemForm.province}
                                                onChange={handleProvinceChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            >
                                                <option value="">Chọn tỉnh/thành phố</option>
                                                {provinces.map(p => (
                                                    <option key={p.code} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quận/Huyện
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <select
                                                name="sub_district"
                                                value={redeemForm.sub_district}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!selectedProvince}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                                            >
                                                <option value="">Chọn quận/huyện</option>
                                                {districts.map(d => (
                                                    <option key={d.code} value={d.name}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Địa chỉ nhận hàng
                                        </label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="recipient_address"
                                                value={redeemForm.recipient_address}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Số nhà, tên đường, phường/xã"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ghi chú (không bắt buộc)
                                        </label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <textarea
                                                name="recipient_note"
                                                value={redeemForm.recipient_note}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Ghi chú thêm về thời gian nhận hàng, địa chỉ cụ thể..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={redeeming}
                                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400`}
                                        >
                                            {redeeming ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Đang xử lý...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Heart className="w-5 h-5" />
                                                    <span>Xác nhận đổi quà</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2">
                                        * Bạn sẽ đổi {redeemForm.quantity} sản phẩm với tổng {reward.points_required * redeemForm.quantity} điểm
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RewardDetail;