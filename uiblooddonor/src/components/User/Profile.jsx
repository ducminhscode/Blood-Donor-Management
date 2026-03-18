import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Droplet, Edit2, Save, X, Settings, Shield, VenusAndMars, Eye, EyeOff, Key, Stethoscope, MapPin, Briefcase, Award, Heart, Activity, Weight, Ruler, CreditCard, Building2, Hospital, GraduationCap, BadgeAlert, Home, Map, MapPinned, FileText, Building, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContexts, UserDispatchContext } from '../../configs/UserContexts';
import cookie from 'react-cookies';
import { getImageUrl } from '../../utils/Image';
import { authApis, endpoints } from '../../configs/APIs';

const Profile = () => {
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);

    const [isEditing, setIsEditing] = useState(false);
    const [isEditingDonor, setIsEditingDonor] = useState(false);
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');

    const [donorInfo, setDonorInfo] = useState(null);
    const [staffInfo, setStaffInfo] = useState(null);

    const [editForm, setEditForm] = useState({
        last_name: user?.last_name || '',
        first_name: user?.first_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        birth_date: user?.birth_date || '',
        gender: user?.gender?.toString() || '',
        avatar: null
    });

    const [donorEditForm, setDonorEditForm] = useState({
        province: '',
        sub_district: '',
        permanent_address: '',
        identification: '',
        career: '',
        organization: '',
    });

    const [staffEditForm, setStaffEditForm] = useState({
        department: '',
        degree: '',
        experience_years: '',
        emergency_phone: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? getImageUrl(user.avatar) : '');

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await fetch('https://provinces.open-api.vn/api/p/');
                const data = await response.json();
                setProvinces(data);
            } catch (error) {
                console.error("Error fetching provinces:", error);
            }
        };
        fetchProvinces();
    }, []);

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

    useEffect(() => {
        const fetchAdditionalInfo = async () => {
            try {
                if (user?.role === 1) {
                    const response = await authApis().get(endpoints["donor_me"]);
                    setDonorInfo(response.data);
                    setDonorEditForm({
                        province: response.data.province || '',
                        sub_district: response.data.sub_district || '',
                        permanent_address: response.data.permanent_address || '',
                        identification: response.data.identification || '',
                        career: response.data.career || '',
                        organization: response.data.organization || ''
                    });
                } else if (user?.role === 2) {
                    const response = await authApis().get(endpoints["staff_me"]);
                    setStaffInfo(response.data);
                    setStaffEditForm({
                        department: response.data.department || '',
                        degree: response.data.degree || '',
                        experience_years: response.data.experience_years || '',
                        emergency_phone: response.data.emergency_phone || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching additional info:", error);
            }
        };

        if (user) {
            fetchAdditionalInfo();
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDonorInputChange = (e) => {
        const { name, value } = e.target;
        setDonorEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStaffInputChange = (e) => {
        let value = Number(e.target.value);

        if (value > 50) value = 50;
        if (value < 0) value = 0;

        setStaffEditForm(prev => ({
            ...prev,
            experience_years: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage({ text: "Vui lòng chọn file hình ảnh", type: "error" });
                setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ text: "File ảnh quá lớn (tối đa 5MB)", type: "error" });
                setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                return;
            }
            setEditForm(prev => ({ ...prev, avatar: file }));
            setAvatarPreview(URL.createObjectURL(file));
        }
    };


    const handleSaveProfile = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const formData = new FormData();
            formData.append("last_name", editForm.last_name);
            formData.append("first_name", editForm.first_name);
            formData.append("email", editForm.email);
            formData.append("phone", editForm.phone);
            formData.append("birth_date", editForm.birth_date);
            formData.append("gender", editForm.gender);

            if (editForm.avatar) {
                formData.append("avatar", editForm.avatar);
            }

            const res = await authApis().patch(endpoints["profile"], formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            dispatch({
                type: "login",
                payload: res.data,
            });

            setMessage({ text: "Cập nhật thông tin thành công.", type: "success" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            setIsEditing(false);
        } catch (error) {
            console.error("Update profile error:", error);
            setMessage({
                text: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin",
                type: "error"
            });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDonorInfo = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        try {

            const response = await authApis().patch(endpoints["donor_update"], donorEditForm);

            setDonorInfo(response.data);
            setMessage({ text: "Cập nhật thông tin người hiến máu thành công.", type: "success" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            setIsEditingDonor(false);
        } catch (error) {
            console.error("Update donor info error:", error);
            setMessage({
                text: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin",
                type: "error"
            });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStaffInfo = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const response = await authApis().patch(endpoints["staff_update"], staffEditForm);
            setStaffInfo(response.data);
            setMessage({ text: "Cập nhật thông tin nhân viên thành công.", type: "success" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            setIsEditingStaff(false);
        } catch (error) {
            console.error("Update staff info error:", error);
            setMessage({
                text: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin",
                type: "error"
            });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e?.preventDefault();

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setMessage({ text: "Mật khẩu mới không khớp", type: "error" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            return;
        }

        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            await authApis().patch(endpoints["change_password"], {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                confirm_password: passwordForm.confirm_password
            });

            setMessage({ text: "Đổi mật khẩu thành công.", type: "success" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);

            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setIsChangingPassword(false);
        } catch (error) {
            console.error("Change password error:", error);
            setMessage({
                text: error.response?.data?.message || "Mật khẩu hiện tại không đúng",
                type: "error"
            });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } finally {
            setLoading(false);
        }
    };

    const fetchDonorInfo = async () => {
        try {
            const response = await authApis().get(endpoints["donor_me"]);
            setDonorInfo(response.data);
            setDonorEditForm({
                province: response.data.province || '',
                sub_district: response.data.sub_district || '',
                permanent_address: response.data.permanent_address || '',
                identification: response.data.identification || '',
                career: response.data.career || '',
                organization: response.data.organization || ''
            });
        } catch (error) {
            console.error("Error fetching donor info:", error);
        }
    };

    const fetchStaffInfo = async () => {
        try {
            const response = await authApis().get(endpoints["staff_me"]);
            setStaffInfo(response.data);
            setStaffEditForm({
                department: response.data.department || '',
                degree: response.data.degree || '',
                experience_years: response.data.experience_years || '',
                emergency_phone: response.data.emergency_phone || ''
            });
        } catch (error) {
            console.error("Error fetching staff info:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditForm({
            last_name: user?.last_name || '',
            first_name: user?.first_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            birth_date: user?.birth_date || '',
            gender: user?.gender?.toString() || '',
            avatar: null
        });
        setAvatarPreview(user?.avatar ? getImageUrl(user.avatar) : '');
        setIsEditing(false);
        setMessage({ text: "", type: "" });
    };

    const handleCancelDonorEdit = () => {
        if (donorInfo) {
            setDonorEditForm({
                province: donorInfo.province || '',
                sub_district: donorInfo.sub_district || '',
                permanent_address: donorInfo.permanent_address || '',
                identification: donorInfo.identification || '',
                career: donorInfo.career || '',
                organization: donorInfo.organization || ''
            });
        }
        setIsEditingDonor(false);
        setMessage({ text: "", type: "" });
    };

    const handleCancelStaffEdit = () => {
        if (staffInfo) {
            setStaffEditForm({
                department: staffInfo.department || '',
                degree: staffInfo.degree || '',
                experience_years: staffInfo.experience_years || '',
                emergency_phone: staffInfo.emergency_phone || ''
            });
        }
        setIsEditingStaff(false);
        setMessage({ text: "", type: "" });
    };

    const handleCancelPasswordChange = () => {
        setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
        setIsChangingPassword(false);
        setMessage({ text: "", type: "" });
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa cập nhật";
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    const formatBloodType = (bloodType, rhFactor) => {
        if (!bloodType) return "Chưa cập nhật";
        return `${bloodType}${rhFactor === 'positive' ? '+' : rhFactor === 'negative' ? '-' : ''}`;
    };

    const bloodTypes = ['A', 'B', 'AB', 'O'];
    const rhFactors = [
        { value: 'positive', label: 'Rh+' },
        { value: 'negative', label: 'Rh-' }
    ];

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: User },
        { id: 'settings', label: 'Cài đặt', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <div className="relative h-52 bg-gradient-to-r from-rose-500 via-red-500 to-orange-400">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-24 mb-8">
                    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-red-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition transform hover:-translate-y-1">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={editForm.last_name + " " + editForm.first_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-14 h-14 text-rose-600" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 border border-slate-200 shadow-sm hover:bg-slate-50 transition cursor-pointer">
                                        <Edit2 className="w-4 h-4 text-rose-600" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                                {editForm.last_name + " " + editForm.first_name || 'Người dùng'}
                                            </h1>
                                            {user?.role === 2 && staffInfo?.is_verified && (
                                                <BadgeCheck className="w-6 h-6 text-blue-500" title="Đã xác thực" />
                                            )}
                                            {user?.role === 2 && staffInfo?.is_verified === false && (
                                                <BadgeAlert className="w-6 h-6 text-yellow-500" title="Chưa xác thực" />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                Tên tài khoản: {user?.username || 'Người dùng'}
                                            </span>
                                            {user?.role === 1 && donorInfo && (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                    Điểm: {donorInfo.points || 0}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${user?.role === 1 ? "bg-red-100 text-red-700" :
                                                user?.role === 2 ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-blue-100 text-blue-700"
                                                }`}>
                                                {user?.role === 1 ? <Droplet className="w-4 h-4" /> :
                                                    user?.role === 2 ? <Stethoscope className="w-4 h-4" /> :
                                                        <Shield className="w-4 h-4" />}
                                                {user?.role === 1 ? 'Người hiến máu' :
                                                    user?.role === 2 ? 'Nhân viên y tế' :
                                                        'Quản trị viên'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex overflow-x-auto mt-6 border-t border-slate-200 pt-4 gap-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsEditing(false);
                                        setIsEditingDonor(false);
                                        setIsChangingPassword(false);
                                        handleCancelEdit();
                                        handleCancelDonorEdit();
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md'
                                        : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                                        }`}>
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-4 p-4 rounded-xl border text-sm shadow-sm ${message.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {!isChangingPassword ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                >
                                                    {loading ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold mb-6 text-gray-700 flex items-center gap-2">
                                                Thông tin cơ bản
                                            </h3>

                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-4 h-4 text-red-500" />
                                                                Họ và tên đệm
                                                            </div>
                                                        </label>

                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={editForm.last_name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-4 h-4 text-red-500" />
                                                                Tên
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={editForm.first_name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <VenusAndMars className="w-4 h-4 text-red-500" />
                                                                Giới tính
                                                            </div>
                                                        </label>
                                                        <select
                                                            name="gender"
                                                            value={editForm.gender}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        >
                                                            <option value="0">Nam</option>
                                                            <option value="1">Nữ</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4 text-red-500" />
                                                                Ngày sinh
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="birth_date"
                                                            value={editForm.birth_date}
                                                            onChange={handleInputChange}
                                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">

                                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <User className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Họ và tên</p>
                                                            <p className="font-medium">{user?.last_name + " " + user?.first_name || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <VenusAndMars className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Giới tính</p>
                                                            <p className="font-medium">
                                                                {user?.gender === 0 ? 'Nam' : user?.gender === 1 ? 'Nữ' : 'Chưa cập nhật'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Ngày sinh</p>
                                                            <p className="font-medium">
                                                                {formatDate(user?.birth_date) || 'Chưa cập nhật'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold mb-6 text-gray-700 flex items-center gap-2">
                                                Thông tin liên hệ
                                            </h3>

                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="w-4 h-4 text-red-500" />
                                                            Email
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={editForm.email}
                                                            onChange={handleInputChange}
                                                            disabled
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-4 h-4 text-red-500" />
                                                            Số điện thoại
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={editForm.phone}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <Mail className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Email</p>
                                                            <p className="font-medium">{user?.email || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Số điện thoại</p>
                                                            <p className="font-medium">{user?.phone || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {user?.role === 1 && donorInfo && (
                                        <div className="mt-6 border-t pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                                    Thông tin người hiến máu
                                                </h3>
                                                {!isEditingDonor ? (
                                                    <button
                                                        onClick={() => setIsEditingDonor(true)}
                                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Chỉnh sửa
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveDonorInfo}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                        >
                                                            {loading ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                            Lưu
                                                        </button>
                                                        <button
                                                            onClick={handleCancelDonorEdit}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Hủy
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditingDonor ? (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <CreditCard className="w-4 h-4 text-red-500" />
                                                                CMND/CCCD
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="identification"
                                                            value={donorEditForm.identification}
                                                            onChange={handleDonorInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Briefcase className="w-4 h-4 text-red-500" />
                                                                Nghề nghiệp
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="career"
                                                            value={donorEditForm.career}
                                                            onChange={handleDonorInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Building className="w-4 h-4 text-red-500" />
                                                                Tổ chức/Công ty
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="organization"
                                                            value={donorEditForm.organization}
                                                            onChange={handleDonorInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <MapPinned className="w-4 h-4 text-red-500" />
                                                                Tỉnh/Thành phố
                                                            </div>
                                                        </label>
                                                        <select
                                                            name="province"
                                                            value={donorEditForm.province}
                                                            onChange={(e) => {
                                                                handleDonorInputChange(e);
                                                                const selected = provinces.find(p => p.name === e.target.value);
                                                                setSelectedProvince(selected?.code || '');
                                                                setDonorEditForm(prev => ({ ...prev, sub_district: '' }));
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        >
                                                            <option value="">Chọn Tỉnh/Thành phố</option>
                                                            {provinces.map(p => (
                                                                <option key={p.code} value={p.name}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Map className="w-4 h-4 text-red-500" />
                                                                Quận/Huyện
                                                            </div>
                                                        </label>
                                                        <select
                                                            name="sub_district"
                                                            value={donorEditForm.sub_district}
                                                            onChange={handleDonorInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:cursor-not-allowed disabled:bg-gray-100"
                                                            disabled={!selectedProvince}
                                                        >
                                                            <option value="">Chọn Quận/Huyện</option>
                                                            {districts.map(d => (
                                                                <option key={d.code} value={d.name}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Home className="w-4 h-4 text-red-500" />
                                                                Địa chỉ thường trú
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="permanent_address"
                                                            value={donorEditForm.permanent_address}
                                                            onChange={handleDonorInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Droplet className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Nhóm máu</p>
                                                                <p className="font-medium">{formatBloodType(donorInfo.blood_type, donorInfo.rh_factor)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Weight className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Cân nặng</p>
                                                                <p className="font-medium">{donorInfo.weight ? `${donorInfo.weight} kg` : 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Ruler className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Chiều cao</p>
                                                                <p className="font-medium">{donorInfo.height ? `${donorInfo.height} cm` : 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Activity className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">BMI</p>
                                                                <p className="font-medium">{donorInfo.bmi ? donorInfo.bmi.toFixed(2) : 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <CreditCard className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">CMND/CCCD</p>
                                                                <p className="font-medium">{donorInfo.identification || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Briefcase className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Nghề nghiệp</p>
                                                                <p className="font-medium">{donorInfo.career || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Building2 className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Tổ chức</p>
                                                                <p className="font-medium">{donorInfo.organization || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Địa chỉ</p>
                                                                <p className="font-medium">
                                                                    {donorInfo.permanent_address || 'Chưa cập nhật'}
                                                                    {donorInfo.sub_district && donorInfo.province &&
                                                                        `, ${donorInfo.sub_district}, ${donorInfo.province}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Award className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Lần hiến cuối</p>
                                                                <p className="font-medium">{formatDate(donorInfo.last_donation)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                                            <p className="text-2xl font-bold text-red-600">{donorInfo.donation_count || 0}</p>
                                                            <p className="text-sm text-gray-600">Lần hiến máu</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                                            <p className="text-2xl font-bold text-red-600">{donorInfo.points || 0}</p>
                                                            <p className="text-sm text-gray-600">Điểm tích lũy</p>
                                                        </div>
                                                        <div className={`text-center p-5 ${donorInfo.can_donation ? 'bg-green-50' : 'bg-red-50'} rounded-lg`}>
                                                            <p className={`text-sm font-medium ${donorInfo.can_donation ? 'text-green-600' : 'text-red-600'}`}>
                                                                {donorInfo.can_donation ? 'Sẵn sàng' : 'Không sẵn sàng'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">Trạng thái hiến máu</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {user?.role === 2 && staffInfo && (
                                        <div className="mt-6 border-t pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-red-600" />
                                                    Thông tin nhân viên y tế
                                                </h3>
                                                {!isEditingStaff ? (
                                                    <button
                                                        onClick={() => setIsEditingStaff(true)}
                                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Chỉnh sửa
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveStaffInfo}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                        >
                                                            {loading ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                            Lưu
                                                        </button>
                                                        <button
                                                            onClick={handleCancelStaffEdit}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Hủy
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditingStaff ? (
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="w-4 h-4 text-green-500" />
                                                                Khoa/Phòng
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="department"
                                                            value={staffEditForm.department}
                                                            onChange={handleStaffInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <GraduationCap className="w-4 h-4 text-purple-500" />
                                                                Học vị/Chứng chỉ
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="degree"
                                                            value={staffEditForm.degree}
                                                            onChange={handleStaffInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                                                Số năm kinh nghiệm
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="experience_years"
                                                            value={staffEditForm.experience_years}
                                                            onChange={handleStaffInputChange}
                                                            min="0"
                                                            max="50"
                                                            step="0.5"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-4 h-4 text-red-500" />
                                                                Hotline
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="emergency_phone"
                                                            value={staffEditForm.emergency_phone}
                                                            onChange={handleStaffInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Hospital className="w-5 h-5 text-blue-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Bệnh viện</p>
                                                                <p className="font-medium">{staffInfo.hospital?.name || 'Chưa cập nhật'}</p>
                                                                {staffInfo.hospital && (
                                                                    <p className="text-xs text-gray-400">
                                                                        {staffInfo.hospital.hospital_address}, {staffInfo.hospital.sub_district}, {staffInfo.hospital.province}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Building2 className="w-5 h-5 text-green-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Khoa/Phòng</p>
                                                                <p className="font-medium">{staffInfo.department || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Học vị/Chứng chỉ</p>
                                                                <p className="font-medium">{staffInfo.degree || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <BadgeAlert className="w-5 h-5 text-orange-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Số giấy phép</p>
                                                                <p className="font-medium">{staffInfo.license_number || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Briefcase className="w-5 h-5 text-indigo-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Số năm kinh nghiệm</p>
                                                                <p className="font-medium">{staffInfo.experience_years ? `${staffInfo.experience_years} năm` : 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Hotline</p>
                                                                <p className="font-medium">{staffInfo.emergency_phone || 'Chưa cập nhật'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                            <p className={`text-sm font-medium ${staffInfo.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
                                                                {staffInfo.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">Trạng thái xác thực</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                                            <p className={`text-sm font-medium ${staffInfo.current_status ? 'text-green-600' : 'text-red-600'}`}>
                                                                {staffInfo.current_status ? 'Đang làm việc' : 'Nghỉ việc'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">Trạng thái công việc</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h2>
                                        <button
                                            onClick={handleCancelPasswordChange}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            <X className="w-4 h-4" />
                                            Hủy
                                        </button>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mật khẩu hiện tại
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.current ? "text" : "password"}
                                                    name="current_password"
                                                    value={passwordForm.current_password}
                                                    onChange={handlePasswordChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('current')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mật khẩu mới
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.new ? "text" : "password"}
                                                    name="new_password"
                                                    value={passwordForm.new_password}
                                                    onChange={handlePasswordChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('new')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Xác nhận mật khẩu mới
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.confirm ? "text" : "password"}
                                                    name="confirm_password"
                                                    value={passwordForm.confirm_password}
                                                    onChange={handlePasswordChange}
                                                    required
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 ${passwordForm.confirm_password &&
                                                        passwordForm.new_password !== passwordForm.confirm_password
                                                        ? 'border-red-500'
                                                        : 'border-gray-300'
                                                        }`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {passwordForm.confirm_password &&
                                                passwordForm.new_password !== passwordForm.confirm_password && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        Mật khẩu không khớp
                                                    </p>
                                                )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || passwordForm.new_password !== passwordForm.confirm_password}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Key className="w-4 h-4" />
                                            )}
                                            Đổi mật khẩu
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Cài đặt tài khoản</h2>

                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-4">Bảo mật</h3>
                                    {!isChangingPassword ? (
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                        >
                                            <Key className="w-4 h-4" />
                                            Đổi mật khẩu
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <form onSubmit={handleChangePassword} className="space-y-3">
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Mật khẩu hiện tại</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword.current ? "text" : "password"}
                                                            name="current_password"
                                                            value={passwordForm.current_password}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePasswordVisibility('current')}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Mật khẩu mới</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword.new ? "text" : "password"}
                                                            name="new_password"
                                                            value={passwordForm.new_password}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePasswordVisibility('new')}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Xác nhận mật khẩu</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword.confirm ? "text" : "password"}
                                                            name="confirm_password"
                                                            value={passwordForm.confirm_password}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 ${passwordForm.confirm_password &&
                                                                passwordForm.new_password !== passwordForm.confirm_password
                                                                ? 'border-red-500'
                                                                : 'border-gray-300'
                                                                }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePasswordVisibility('confirm')}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={loading || passwordForm.new_password !== passwordForm.confirm_password}
                                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                                    >
                                                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelPasswordChange}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>

                                {user?.role === 1 && donorInfo && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2">Quyền riêng tư</h3>
                                        <div className="space-y-2">
                                            <label className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700">Hiển thị thông tin cá nhân</span>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-red-600"
                                                    checked={!donorInfo.is_private}
                                                    onChange={async (e) => {
                                                        try {
                                                            await authApis().patch(endpoints["donor_update"], {
                                                                is_private: !e.target.checked
                                                            });
                                                            await fetchDonorInfo();
                                                            setMessage({ text: "Cập nhật quyền riêng tư thành công.", type: "success" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        } catch (error) {
                                                            setMessage({ text: "Có lỗi xảy ra", type: "error" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            <label className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700">
                                                    Sẵn sàng hiến máu
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-red-600"
                                                    checked={donorInfo.can_donation}
                                                    onChange={async (e) => {
                                                        try {
                                                            await authApis().patch(endpoints["donor_update"], {
                                                                can_donation: e.target.checked
                                                            });
                                                            await fetchDonorInfo();
                                                            setMessage({ text: "Cập nhật trạng thái sẵn sàng hiến máu thành công.", type: "success" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        } catch (error) {
                                                            setMessage({ text: "Có lỗi xảy ra", type: "error" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {user?.role === 2 && staffInfo && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2">Trạng thái công việc</h3>
                                        <div className="space-y-2">
                                            <label className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700">
                                                    {staffInfo.current_status ? 'Đang làm việc' : 'Không làm việc'}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-red-600"
                                                    checked={staffInfo.current_status}
                                                    onChange={async (e) => {
                                                        try {
                                                            await authApis().patch(endpoints["staff_update"], {
                                                                current_status: e.target.checked
                                                            });
                                                            await fetchStaffInfo();
                                                            setMessage({ text: "Cập nhật trạng thái công việc thành công.", type: "success" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        } catch (error) {
                                                            setMessage({ text: "Có lỗi xảy ra", type: "error" });
                                                            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Thông báo</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Nhận thông báo về sự kiện hiến máu</span>
                                            <input type="checkbox" className="rounded text-red-600" defaultChecked />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Nhận thông báo qua email</span>
                                            <input type="checkbox" className="rounded text-red-600" defaultChecked />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Nhận thông báo qua SMS</span>
                                            <input type="checkbox" className="rounded text-red-600" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;