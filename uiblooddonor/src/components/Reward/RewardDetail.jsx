import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Gift, ArrowLeft, Star, ShoppingBag, Calendar, Package, Heart,
    Share2, Award, Plus, Minus, User, Mail, Phone, MapPin,
    MapPinned, Home, FileText, AlertCircle, CheckCircle, X,
    Sparkles, Shield, Truck, Clock, CreditCard, Copy, ThumbsUp,
    BadgeCheck, Gift as GiftIcon, Box,
    ChevronLeft,
    Droplet,
    ChevronRight,
    Bookmark, ArrowRight, Loader2, Send, TrendingUp, Award as AwardIcon,
    HeartHandshake, Gem, Zap, ShoppingCart, TruckIcon, RotateCcw
} from 'lucide-react';
import { authApis, endpoints } from '../../configs/APIs';
import { getImageUrl } from '../../utils/Image';
import { UserContexts } from '../../configs/UserContexts';
import { Helmet } from "react-helmet-async";

const RewardDetail = () => {
    const { id, reward_id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [reward, setReward] = useState(null);
    const [rewardTitle, setRewardTitle] = useState('Chi tiết phần thưởng');
    const [loading, setLoading] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [redeemSuccess, setRedeemSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const user_current = useContext(UserContexts);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [formStep, setFormStep] = useState(1);
    const [formErrors, setFormErrors] = useState({});

    const [redeemForm, setRedeemForm] = useState({
        quantity: 1,
        last_name: user_current?.last_name || '',
        first_name: user_current?.first_name || '',
        phone: user_current?.phone || '',
        email: user_current?.email || '',
        province: '',
        sub_district: '',
        recipient_address: '',
        recipient_note: '',
        recipient_name: '',
        delivery_time: 'anytime',
        id_number: '',
        agree_terms: false
    });

    useEffect(() => {
        fetchRewardDetail();
        fetchProvinces();
    }, [id, reward_id]);

    useEffect(() => {
        const nextTitle =
            location.state?.rewardName ||
            reward?.name ||
            reward?.reward_name ||
            reward?.title ||
            'Chi tiết phần thưởng';

        setRewardTitle(nextTitle);
        document.title = `${nextTitle} | Dòng Máu Lạc Hồng`;
    }, [location.state, reward]);

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
            const responseName = response.data?.name || response.data?.reward_name || response.data?.title;
            if (responseName) {
                setRewardTitle(responseName);
            }
        } catch (error) {
            console.error("Error fetching reward detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRedeemForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
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

    const validateStep1 = () => {
        const errors = {};
        if (!redeemForm.first_name.trim()) errors.first_name = 'Vui lòng nhập tên';
        if (!redeemForm.last_name.trim()) errors.last_name = 'Vui lòng nhập họ';
        if (!redeemForm.phone.trim()) {
            errors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(redeemForm.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ';
        }
        if (!redeemForm.email.trim()) {
            errors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(redeemForm.email)) {
            errors.email = 'Email không hợp lệ';
        }
        return errors;
    };

    const validateStep2 = () => {
        const errors = {};
        if (!redeemForm.province) errors.province = 'Vui lòng chọn tỉnh/thành phố';
        if (!redeemForm.sub_district) errors.sub_district = 'Vui lòng chọn quận/huyện';
        if (!redeemForm.recipient_address.trim()) errors.recipient_address = 'Vui lòng nhập địa chỉ';
        return errors;
    };

    const handleNextStep = () => {
        if (formStep === 1) {
            const errors = validateStep1();
            if (Object.keys(errors).length === 0) {
                setFormStep(2);
                setFormErrors({});
            } else {
                setFormErrors(errors);
            }
        }
    };

    const handlePrevStep = () => {
        setFormStep(1);
    };

    const handleRedeem = async (e) => {
        e.preventDefault();

        const errors = validateStep2();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!redeemForm.agree_terms) {
            setError('Vui lòng đồng ý với điều khoản đổi quà');
            return;
        }

        setError('');
        setRedeeming(true);

        try {
            const url = endpoints.redeem_reward.replace('${id}', reward_id);

            await authApis().post(url, {
                quantity: redeemForm.quantity,
                last_name: redeemForm.last_name,
                first_name: redeemForm.first_name,
                phone: redeemForm.phone,
                email: redeemForm.email,
                province: redeemForm.province,
                sub_district: redeemForm.sub_district,
                recipient_address: redeemForm.recipient_address,
                recipient_note: redeemForm.recipient_note,
                recipient_name: `${redeemForm.last_name} ${redeemForm.first_name}`.trim(),
                delivery_time: redeemForm.delivery_time
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

    const formatPoints = (points) => {
        return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                                <div className="space-y-4">
                                    <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
                                    <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
                                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reward) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Gift className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy quà tặng</h2>
                        <p className="text-gray-600 mb-6">Quà tặng bạn đang tìm không tồn tại hoặc đã bị xóa</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (redeemSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Đổi quà thành công!</h2>
                        <p className="text-gray-600 mb-4">Cảm ơn bạn đã tham gia chương trình</p>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <BadgeCheck className="w-5 h-5" />
                                <span className="font-medium">Đã đổi {redeemForm.quantity} {reward.name}</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-500 mb-6">
                            <p>Quà tặng sẽ được gửi đến bạn trong vòng 5-7 ngày làm việc</p>
                            <p className="flex items-center justify-center gap-1">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang chuyển hướng...
                            </p>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-progress"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>{rewardTitle} | Dòng Máu Lạc Hồng</title>
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
                        <button
                            onClick={() => navigate(`/reward-category/${reward?.reward_category?.id}`)}
                            className="hover:text-white transition-colors"
                        >
                            {reward?.reward_category?.name || 'Quà tặng'}
                        </button>
                        <span>/</span>
                        <span className="text-white font-medium">{rewardTitle}</span>
                    </div>

                    <button
                        onClick={() => navigate(`/reward-category/${reward?.reward_category?.id}`)}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại {reward?.reward_category?.name}</span>
                    </button>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!showForm ? (
                    // Product Detail View
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="grid lg:grid-cols-2">
                            {/* Image Section */}
                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
                                <div className="sticky top-24">
                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                        {reward.remaining_stock > 0 && reward.remaining_stock <= 10 && (
                                            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-lg animate-pulse">
                                                <Clock className="w-3 h-3" />
                                                Sắp hết quà
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Image */}
                                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl">
                                        {reward.image_url ? (
                                            <img
                                                src={getImageUrl(reward.image_url)}
                                                alt={reward.name}
                                                className="w-full h-full object-contain p-8 hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Gift className="w-32 h-32 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-8 lg:p-12">
                                {/* Category Tag */}
                                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                                    <Package className="w-4 h-4" />
                                    <span>{reward?.reward_category?.name || 'Quà tặng'}</span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {reward.name}
                                </h1>

                                {/* Points Display */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl px-4 py-2">
                                        <span className="text-2xl font-bold text-red-600">{formatPoints(reward.points_required)}</span>
                                        <span className="text-sm text-red-500 ml-1">điểm</span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="border-b border-gray-200 mb-6">
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => setActiveTab('info')}
                                            className={`pb-4 px-2 font-medium transition-all relative ${
                                                activeTab === 'info'
                                                    ? 'text-red-600'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Thông tin quà tặng
                                            {activeTab === 'info' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('details')}
                                            className={`pb-4 px-2 font-medium transition-all relative ${
                                                activeTab === 'details'
                                                    ? 'text-red-600'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Chi tiết
                                            {activeTab === 'details' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'info' ? (
                                    <div className="prose max-w-none mb-6">
                                        <p className="text-gray-700 leading-relaxed">
                                            {reward.description || 'Mô tả chi tiết về quà tặng sẽ được cập nhật trong thời gian sớm nhất. Vui lòng quay lại sau để xem thông tin chi tiết về quà tặng này.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                            <Box className="w-5 h-5 text-red-500" />
                                            <span className="text-gray-700">Thương hiệu: <span className="font-medium">{reward.brand || 'Đang cập nhật'}</span></span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                            <Package className="w-5 h-5 text-red-500" />
                                            <span className="text-gray-700">Xuất xứ: <span className="font-medium">{reward.origin || 'Đang cập nhật'}</span></span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                            <Shield className="w-5 h-5 text-red-500" />
                                            <span className="text-gray-700">Bảo hành: <span className="font-medium">{reward.warranty || 'Đang cập nhật'}</span></span>
                                        </div>
                                    </div>
                                )}

                                {/* Stock Status */}
                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    {reward.remaining_stock > 0 ? (
                                        <>
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                                                <Gift className="w-5 h-5" />
                                                <span className="font-medium">Còn {reward.remaining_stock} quà tặng</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                                                <Truck className="w-5 h-5" />
                                                <span>Miễn phí vận chuyển</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-medium">Hết hàng</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quantity Selector */}
                                {reward.remaining_stock > 0 && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số lượng
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-16 h-12 flex items-center justify-center text-gray-900 font-medium border-x-2 border-gray-200">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(reward.remaining_stock, quantity + 1))}
                                                    disabled={quantity >= reward.remaining_stock}
                                                    className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3">
                                                <span className="text-sm text-gray-600">Tổng điểm:</span>
                                                <span className="ml-2 text-lg font-bold text-red-600">
                                                    {formatPoints(reward.points_required * quantity)} điểm
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleContinue}
                                        disabled={!reward.remaining_stock || reward.remaining_stock < quantity}
                                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 ${
                                            reward.remaining_stock >= quantity
                                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25'
                                                : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {user_current ? (
                                            <>
                                                <Gift className="w-5 h-5" />
                                                Đổi quà ngay
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-5 h-5" />
                                                Đăng nhập để đổi quà
                                            </>
                                        )}
                                    </button>
                                </div>

                                {(!reward.remaining_stock || reward.remaining_stock < quantity) && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Số lượng trong kho không đủ
                                    </p>
                                )}

                                {/* Shipping Info */}
                                <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-red-500" />
                                        Thông tin vận chuyển
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Giao hàng miễn phí toàn quốc</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Thời gian giao hàng: 5-7 ngày làm việc</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Kiểm tra hàng trước khi nhận</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Redeem Form View
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-8">
                                <h2 className="text-2xl font-bold mb-2">Thông tin nhận quà</h2>
                                <p className="text-red-50">Vui lòng điền đầy đủ thông tin để hoàn tất đổi quà</p>

                                {/* Progress Steps */}
                                <div className="flex items-center gap-2 mt-6">
                                    <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${formStep >= 1 ? 'bg-white' : 'bg-white/30'}`}></div>
                                    <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${formStep >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className={formStep >= 1 ? 'font-medium' : 'text-white/70'}>Thông tin cá nhân</span>
                                    <span className={formStep >= 2 ? 'font-medium' : 'text-white/70'}>Địa chỉ nhận hàng</span>
                                </div>
                            </div>

                            <form onSubmit={handleRedeem} className="p-8">
                                {error && (
                                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Personal Information */}
                                {formStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Họ và tên đệm <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        name="last_name"
                                                        value={redeemForm.last_name}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                                                            formErrors.last_name
                                                                ? 'border-red-500 focus:ring-red-500/20'
                                                                : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                        }`}
                                                        placeholder="Họ và tên đệm"
                                                    />
                                                </div>
                                                {formErrors.last_name && (
                                                    <p className="mt-1 text-xs text-red-600">{formErrors.last_name}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Tên <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        value={redeemForm.first_name}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                                                            formErrors.first_name
                                                                ? 'border-red-500 focus:ring-red-500/20'
                                                                : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                        }`}
                                                        placeholder="Tên"
                                                    />
                                                </div>
                                                {formErrors.first_name && (
                                                    <p className="mt-1 text-xs text-red-600">{formErrors.first_name}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={redeemForm.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                                                        formErrors.phone
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                    }`}
                                                    placeholder="Số điện thoại"
                                                />
                                            </div>
                                            {formErrors.phone && (
                                                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={redeemForm.email}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                                                        formErrors.email
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                    }`}
                                                    placeholder="Email"
                                                />
                                            </div>
                                            {formErrors.email && (
                                                <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Số CMND/CCCD
                                            </label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="id_number"
                                                    value={redeemForm.id_number}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                                                    placeholder="Số CMND/CCCD"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                onClick={handleNextStep}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg"
                                            >
                                                Tiếp tục
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Address Information */}
                                {formStep === 2 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Tỉnh/Thành phố <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                <select
                                                    name="province"
                                                    value={redeemForm.province}
                                                    onChange={handleProvinceChange}
                                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all appearance-none ${
                                                        formErrors.province
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                    }`}
                                                >
                                                    <option value="">Chọn tỉnh/thành phố</option>
                                                    {provinces.map(p => (
                                                        <option key={p.code} value={p.name}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {formErrors.province && (
                                                <p className="mt-1 text-xs text-red-600">{formErrors.province}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Quận/Huyện <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                <select
                                                    name="sub_district"
                                                    value={redeemForm.sub_district}
                                                    onChange={handleInputChange}
                                                    disabled={!selectedProvince}
                                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all appearance-none ${
                                                        formErrors.sub_district
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20 disabled:bg-gray-100'
                                                    }`}
                                                >
                                                    <option value="">Chọn quận/huyện</option>
                                                    {districts.map(d => (
                                                        <option key={d.code} value={d.name}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {formErrors.sub_district && (
                                                <p className="mt-1 text-xs text-red-600">{formErrors.sub_district}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Địa chỉ nhận hàng <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="recipient_address"
                                                    value={redeemForm.recipient_address}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                                                        formErrors.recipient_address
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                                                    }`}
                                                    placeholder="Số nhà, tên đường, phường/xã"
                                                />
                                            </div>
                                            {formErrors.recipient_address && (
                                                <p className="mt-1 text-xs text-red-600">{formErrors.recipient_address}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Ghi chú
                                            </label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <textarea
                                                    name="recipient_note"
                                                    value={redeemForm.recipient_note}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                                                    placeholder="Ghi chú thêm về thời gian nhận hàng, địa chỉ cụ thể..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 mt-4">
                                            <input
                                                type="checkbox"
                                                name="agree_terms"
                                                checked={redeemForm.agree_terms}
                                                onChange={handleInputChange}
                                                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                                            />
                                            <label className="text-sm text-gray-600 cursor-pointer">
                                                Tôi đồng ý với các điều khoản và điều kiện đổi quà của chương trình
                                            </label>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mt-4">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4 text-red-500" />
                                                Tóm tắt đơn hàng
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Tên quà tặng:</span>
                                                    <span className="font-medium text-gray-900">{reward.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số lượng:</span>
                                                    <span className="font-medium text-gray-900">{quantity}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Điểm cần:</span>
                                                    <span className="font-medium text-gray-900">{formatPoints(reward.points_required)} điểm</span>
                                                </div>
                                                <div className="border-t border-gray-200 my-2"></div>
                                                <div className="flex justify-between text-base">
                                                    <span className="font-semibold text-gray-900">Tổng điểm:</span>
                                                    <span className="text-xl font-bold text-red-600">{formatPoints(reward.points_required * quantity)} điểm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={handlePrevStep}
                                                className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
                                            >
                                                Quay lại
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={redeeming || !redeemForm.agree_terms}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
                                            >
                                                {redeeming ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Đang xử lý...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Xác nhận đổi quà
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Product Summary Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 mt-4 flex items-center gap-4 border border-gray-100">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                                {reward.image_url ? (
                                    <img src={getImageUrl(reward.image_url)} alt={reward.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Gift className="w-8 h-8 text-gray-400 m-4" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{reward.name}</h4>
                                <p className="text-sm text-gray-500">Số lượng: {quantity}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-red-600">{formatPoints(reward.points_required * quantity)}</span>
                                <span className="text-xs text-gray-500 ml-1">điểm</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-progress {
                    animation: progress 3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default RewardDetail;
