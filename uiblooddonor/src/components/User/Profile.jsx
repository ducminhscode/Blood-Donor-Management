import { useState } from 'react';
import { User, Mail, Phone, Calendar, Droplet, Edit2, Save, X, Settings, Shield, VenusAndMars, Eye, EyeOff, Key, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContexts, UserDispatchContext } from '../../configs/UserContexts';
import cookie from 'react-cookies';
import { getImageUrl } from '../../utils/Image';
import { authApis, endpoints } from '../../configs/APIs';

const Profile = () => {
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [editForm, setEditForm] = useState({
        last_name: user?.last_name || '',
        first_name: user?.first_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        birth_date: user?.birth_date || '',
        gender: user?.gender?.toString() || '',
        avatar: null
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? getImageUrl(user.avatar) : '');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
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

            setMessage({ text: "Cập nhật thông tin thành công!", type: "success" });
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

            setMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
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

    const handleLogout = () => {
        cookie.remove("access_token", { path: "/" });
        cookie.remove("refresh_token", { path: "/" });
        dispatch({ type: "logout" });
        navigate("/");
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

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: User },
        { id: 'settings', label: 'Cài đặt', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="relative h-48 bg-gradient-to-r from-red-600 to-red-400">
                <div className="absolute inset-0 bg-black opacity-10"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-24 mb-8">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full bg-red-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={editForm.last_name + " " + editForm.first_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-14 h-14 text-red-600" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition cursor-pointer">
                                        <Edit2 className="w-4 h-4 text-gray-600" />
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
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            {editForm.last_name + " " + editForm.first_name || 'Người dùng'}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                Tên tài khoản: {user?.username || 'Người dùng'}
                                            </span>
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

                        <div className="flex overflow-x-auto mt-6 border-t pt-4 gap-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsEditing(false);
                                        setIsChangingPassword(false);
                                        handleCancelEdit();
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}>
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
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
                                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                                <User className="w-5 h-5 text-red-600" />
                                                Thông tin cơ bản
                                            </h3>

                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Họ và tên đệm
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
                                                            Tên
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
                                                            Giới tính
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
                                                            Ngày sinh
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
                                                    <div className="flex items-center gap-3">
                                                        <User className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-600">
                                                            {user?.last_name + " " + user?.first_name || 'Chưa cập nhật'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <VenusAndMars className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-600">
                                                            {user?.gender === 0 ? 'Nam' : user?.gender === 1 ? 'Nữ' : 'Chưa cập nhật'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-600">
                                                            {user?.birth_date
                                                                ? new Date(user.birth_date).toLocaleDateString("vi-VN")
                                                                : "Chưa cập nhật"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                                <Mail className="w-5 h-5 text-red-600" />
                                                Thông tin liên hệ
                                            </h3>

                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Email
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
                                                            Số điện thoại
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
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-600">{user?.email || 'Chưa cập nhật'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-600">{user?.phone || 'Chưa cập nhật'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Quyền riêng tư</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Hiển thị thông tin cá nhân</span>
                                            <input type="checkbox" className="rounded text-red-600" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Chia sẻ lịch sử hiến máu</span>
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