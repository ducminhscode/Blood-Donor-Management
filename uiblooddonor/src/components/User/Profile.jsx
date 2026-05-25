import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Droplet, Edit2, Save, X, Settings, Shield, VenusAndMars, Eye, EyeOff, Key, Stethoscope, MapPin, Briefcase, Award, Activity, Weight, Ruler, Building2, Hospital, GraduationCap, BadgeAlert, BadgeCheck, IdCard, Syringe, IdCardLanyard, ChevronDown, AlertCircle, CircleCheck, TableOfContents } from 'lucide-react';
import { useContext } from 'react';
import { UserContexts, UserDispatchContext } from '../../configs/UserContexts';
import { getImageUrl } from '../../utils/Image';
import { authApis, endpoints } from '../../configs/APIs';
import { Helmet } from 'react-helmet-async';

const Profile = () => {
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);

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

    const degrees = ["Bác sĩ Đa khoa", "Bác sĩ CKI", "Bác sĩ CKII", "Điều dưỡng", "Bác sĩ nội trú"];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProvinceDropdown && !event.target.closest('.province-dropdown')) setShowProvinceDropdown(false);
            if (showDistrictDropdown && !event.target.closest('.district-dropdown')) setShowDistrictDropdown(false);
            if (showGenderDropdown && !event.target.closest('.gender-dropdown')) setShowGenderDropdown(false);
            if (showDegreeDropdown && !event.target.closest('.degree-dropdown')) setShowDegreeDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProvinceDropdown, showDistrictDropdown, showGenderDropdown, showDegreeDropdown]);

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
        const { name, value } = e.target;
        if (name === 'experience_years') {
            let numValue = Number(value);
            if (numValue > 50) numValue = 50;
            if (numValue < 0) numValue = 0;
            setStaffEditForm(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setStaffEditForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
        } catch (error) {
            console.error("Error fetching donor info:", error);
        }
    };

    const fetchStaffInfo = async () => {
        try {
            const response = await authApis().get(endpoints["staff_me"]);
            setStaffInfo(response.data);
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
        if (bloodType === undefined) return "Chưa cập nhật";
        const bloodMap = { 0: 'O', 1: 'A', 2: 'B', 3: 'AB' };
        const isPositiveRh = rhFactor === true || rhFactor === 1 || rhFactor === '1' || rhFactor === 'true';
        return `${bloodMap[bloodType] || '?'}${isPositiveRh ? '+' : '-'}`;
    };

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: TableOfContents },
        { id: 'settings', label: 'Cài đặt', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Helmet>
                <title>Thông tin cá nhân | Dòng Máu Lạc Hồng</title>
            </Helmet>
            <div className="relative h-64 lg:h-80 bg-gradient-to-r from-red-700 via-red-600 to-red-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
                    <Droplet className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                    <p className="text-lg font-medium">Hành trình nhân ái</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-8">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={editForm.last_name + " " + editForm.first_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-16 h-16 text-red-600" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group-hover:scale-110">
                                        <Edit2 className="w-4 h-4 text-red-600" />
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
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                        {editForm.last_name} {editForm.first_name}
                                    </h1>
                                    {user?.role === 2 && staffInfo?.is_verified && (
                                        <BadgeCheck className="w-6 h-6 text-blue-500" title="Đã xác thực" />
                                    )}
                                    {user?.role === 2 && staffInfo?.is_verified === false && (
                                        <BadgeAlert className="w-6 h-6 text-yellow-500" title="Chưa xác thực" />
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {user?.username}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${user?.role === 1 ? "bg-red-100 text-red-700" :
                                        user?.role === 2 ? "bg-blue-100 text-blue-700" :
                                            "bg-purple-100 text-purple-700"
                                        }`}>
                                        {user?.role === 1 ? <Droplet className="w-3 h-3" /> :
                                            user?.role === 2 ? <Stethoscope className="w-3 h-3" /> :
                                                <Shield className="w-3 h-3" />}
                                        {user?.role === 1 ? 'Người hiến máu' :
                                            user?.role === 2 ? 'Nhân viên y tế' :
                                                'Quản trị viên'}
                                    </span>
                                    {user?.role === 1 && donorInfo && (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {donorInfo.points || 0} điểm
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex overflow-x-auto mt-8 gap-2 border-b border-gray-200">
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
                                    className={`cursor-pointer flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 relative ${activeTab === tab.id
                                        ? 'text-red-600'
                                        : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className="fixed top-24 right-4 z-[1000] animate-slideInRight">
                        <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${message.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {message.type === 'success'
                                ? <CircleCheck className="w-5 h-5" />
                                : <AlertCircle className="w-5 h-5" />
                            }
                            <span className="font-medium">{message.text}</span>
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        Thông tin cá nhân
                                    </h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                                        >
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={loading}
                                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50"
                                            >
                                                {loading && (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                )}
                                                Lưu
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={loading}
                                                className="cursor-pointer profile-cancel-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {isEditing ? (
                                            <>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên đệm</label>
                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={editForm.last_name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={editForm.first_name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="gender-dropdown relative">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                                                            className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                                        >
                                                            <span className={editForm.gender ? "text-gray-900" : "text-gray-400"}>
                                                                {editForm.gender === "0" ? "Nam" : editForm.gender === "1" ? "Nữ" : "Chọn giới tính"}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {showGenderDropdown && (
                                                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                                                <button onClick={() => { setEditForm(prev => ({ ...prev, gender: "0" })); setShowGenderDropdown(false); }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${editForm.gender === "0" ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}>
                                                                    Nam
                                                                </button>
                                                                <button onClick={() => { setEditForm(prev => ({ ...prev, gender: "1" })); setShowGenderDropdown(false); }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${editForm.gender === "1" ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}>
                                                                    Nữ
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                                        <input
                                                            type="date"
                                                            name="birth_date"
                                                            value={editForm.birth_date}
                                                            onChange={handleInputChange}
                                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={editForm.email}
                                                            disabled
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={editForm.phone}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <User className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Họ và tên</p>
                                                            <p className="font-medium text-gray-900">
                                                                {user?.last_name} {user?.first_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <VenusAndMars className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Giới tính</p>
                                                            <p className="font-medium text-gray-900">
                                                                {user?.gender === 0 ? 'Nam' : user?.gender === 1 ? 'Nữ' : 'Chưa cập nhật'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Ngày sinh</p>
                                                            <p className="font-medium text-gray-900">
                                                                {formatDate(user?.birth_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Mail className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Email</p>
                                                            <p className="font-medium text-gray-900">{user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Số điện thoại</p>
                                                            <p className="font-medium text-gray-900">{user?.phone || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {user?.role === 1 && donorInfo && (
                                <div className="bg-white rounded-2xl shadow-lg overflow-visible">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            Thông tin người hiến máu
                                        </h2>
                                        {!isEditingDonor ? (
                                            <button
                                                onClick={() => setIsEditingDonor(true)}
                                                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                                            >
                                                Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveDonorInfo}
                                                    disabled={loading}
                                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50"
                                                >
                                                    {loading && (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    )}
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={handleCancelDonorEdit}
                                                    disabled={loading}
                                                    className="cursor-pointer profile-cancel-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        {isEditingDonor ? (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">CMND/CCCD</label>
                                                    <input
                                                        type="text"
                                                        name="identification"
                                                        value={donorEditForm.identification}
                                                        onChange={handleDonorInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                                                    <input
                                                        type="text"
                                                        name="career"
                                                        value={donorEditForm.career}
                                                        onChange={handleDonorInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tổ chức/Công ty</label>
                                                    <input
                                                        type="text"
                                                        name="organization"
                                                        value={donorEditForm.organization}
                                                        onChange={handleDonorInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div className="province-dropdown relative">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300 transition-all"
                                                        disabled={loading}
                                                    >
                                                        <span className={donorEditForm.province ? "text-gray-900" : "text-gray-400"}>
                                                            {donorEditForm.province || "Chọn tỉnh/thành phố"}
                                                        </span>
                                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {showProvinceDropdown && (
                                                        <div className="absolute top-full left-0 mt-2 w-full max-h-[280px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-y-auto z-[100] animate-fadeIn">
                                                            <button type="button" onClick={() => { setDonorEditForm(prev => ({ ...prev, province: '', sub_district: '' })); setSelectedProvince(''); setShowProvinceDropdown(false); }}
                                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-500">
                                                                Chọn tỉnh/thành phố
                                                            </button>
                                                            {provinces.map(p => (
                                                                <button
                                                                    key={p.code}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDonorEditForm(prev => ({ ...prev, province: p.name, sub_district: '' }));
                                                                        setSelectedProvince(p.code);
                                                                        setShowProvinceDropdown(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${donorEditForm.province === p.name ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
                                                                >
                                                                    {p.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="district-dropdown relative">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => donorEditForm.province && setShowDistrictDropdown(!showDistrictDropdown)}
                                                        className={`w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300 transition-all ${!donorEditForm.province ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={!donorEditForm.province}
                                                    >
                                                        <span className={donorEditForm.sub_district ? "text-gray-900" : "text-gray-400"}>
                                                            {donorEditForm.sub_district || "Chọn quận/huyện"}
                                                        </span>
                                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {showDistrictDropdown && donorEditForm.province && (
                                                        <div className="absolute top-full left-0 mt-2 w-full max-h-[280px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-y-auto z-[100] animate-fadeIn">
                                                            <button type="button" onClick={() => { setDonorEditForm(prev => ({ ...prev, sub_district: '' })); setShowDistrictDropdown(false); }}
                                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-500">
                                                                Chọn quận/huyện
                                                            </button>
                                                            {districts.map(d => (
                                                                <button
                                                                    key={d.code}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDonorEditForm(prev => ({ ...prev, sub_district: d.name }));
                                                                        setShowDistrictDropdown(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${donorEditForm.sub_district === d.name ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
                                                                >
                                                                    {d.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="md:col-span-2 lg:col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ thường trú</label>
                                                    <input
                                                        type="text"
                                                        name="permanent_address"
                                                        value={donorEditForm.permanent_address}
                                                        onChange={handleDonorInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Droplet className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Nhóm máu</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.blood_type !== null && donorInfo.rh_factor !== null ? formatBloodType(donorInfo.blood_type, donorInfo.rh_factor) : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Weight className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Cân nặng</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.weight ? `${donorInfo.weight} kg` : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Ruler className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Chiều cao</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.height ? `${donorInfo.height} cm` : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Activity className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">BMI</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.bmi ? donorInfo.bmi.toFixed(2) : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <IdCard className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">CMND/CCCD</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.identification || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Briefcase className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Nghề nghiệp</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.career || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Building2 className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Tổ chức</p>
                                                            <p className="font-medium text-gray-900">{donorInfo.organization || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Địa chỉ</p>
                                                            <p className="font-medium text-gray-900">
                                                                {donorInfo.permanent_address || 'Chưa cập nhật'}
                                                                {donorInfo.sub_district && donorInfo.province &&
                                                                    `, ${donorInfo.sub_district}, ${donorInfo.province}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Syringe className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Lần hiến cuối</p>
                                                            <p className="font-medium text-gray-900">{formatDate(donorInfo.last_donation)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                                                        <p className="text-2xl font-bold text-red-600">{donorInfo.donation_count || 0}</p>
                                                        <p className="profile-stat-label text-sm text-gray-600">Lần hiến máu</p>
                                                    </div>
                                                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                                                        <p className="text-2xl font-bold text-yellow-600">{donorInfo.points || 0}</p>
                                                        <p className="profile-stat-label text-sm text-gray-600">Điểm tích lũy</p>
                                                    </div>
                                                    <div className={`text-center p-4 rounded-xl ${donorInfo.can_donation ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                                                        <p className={`text-sm font-semibold ${donorInfo.can_donation ? 'text-green-600' : 'text-gray-600'}`}>
                                                            {donorInfo.can_donation ? 'Sẵn sàng hiến máu' : 'Chưa sẵn sàng'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user?.role === 2 && staffInfo && (
                                <div className="bg-white rounded-2xl shadow-lg overflow-visible">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            Thông tin nhân viên y tế
                                        </h2>
                                        {!isEditingStaff ? (
                                            <button
                                                onClick={() => setIsEditingStaff(true)}
                                                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                                            >
                                                Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveStaffInfo}
                                                    disabled={loading}
                                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50"
                                                >
                                                    {loading && (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    )}
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={handleCancelStaffEdit}
                                                    disabled={loading}
                                                    className="cursor-pointer profile-cancel-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        {isEditingStaff ? (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa/Phòng</label>
                                                    <input
                                                        type="text"
                                                        name="department"
                                                        value={staffEditForm.department}
                                                        onChange={handleStaffInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div className="degree-dropdown relative">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Học vị/Chứng chỉ</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowDegreeDropdown(!showDegreeDropdown)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300 transition-all"
                                                    >
                                                        <span className={staffEditForm.degree ? "text-gray-900" : "text-gray-400"}>
                                                            {staffEditForm.degree || "Chọn học vị/chứng chỉ"}
                                                        </span>
                                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDegreeDropdown ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {showDegreeDropdown && (
                                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                                            {degrees.map((degree) => (
                                                                <button
                                                                    key={degree}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setStaffEditForm(prev => ({ ...prev, degree }));
                                                                        setShowDegreeDropdown(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${staffEditForm.degree === degree ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                                >
                                                                    {degree}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số năm kinh nghiệm</label>
                                                    <input
                                                        type="number"
                                                        name="experience_years"
                                                        value={staffEditForm.experience_years}
                                                        onChange={handleStaffInputChange}
                                                        min="0"
                                                        max="50"
                                                        step="0.5"
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại khẩn cấp</label>
                                                    <input
                                                        type="tel"
                                                        name="emergency_phone"
                                                        value={staffEditForm.emergency_phone}
                                                        onChange={handleStaffInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Hospital className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Bệnh viện</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.hospital?.name || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Building2 className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Khoa/Phòng</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.department || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <GraduationCap className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Học vị/Chứng chỉ</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.degree || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <IdCardLanyard className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Số giấy phép</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.license_number || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Briefcase className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Số năm kinh nghiệm</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.experience_years ? `${staffInfo.experience_years} năm` : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                        <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Số điện thoại khẩn cấp</p>
                                                            <p className="font-medium text-gray-900">{staffInfo.emergency_phone || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div className={`text-center p-4 rounded-xl ${staffInfo.is_verified ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-yellow-50 to-yellow-100'}`}>
                                                        <p className={`text-sm font-semibold ${staffInfo.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                            {staffInfo.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                                                        </p>
                                                    </div>
                                                    <div className={`text-center p-4 rounded-xl ${staffInfo.current_status ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                                                        <p className={`text-sm font-semibold ${staffInfo.current_status ? 'text-green-600' : 'text-gray-600'}`}>
                                                            {staffInfo.current_status ? 'Đang làm việc' : 'Nghỉ ngơi'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isChangingPassword ? (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="p-6 border-b border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            Bảo mật
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-all duration-300"
                                        >
                                            <Key className="w-4 h-4" />
                                            Đổi mật khẩu
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            Đổi mật khẩu
                                        </h2>
                                        <button
                                            onClick={handleCancelPasswordChange}
                                            className="cursor-pointer profile-cancel-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword.current ? "text" : "password"}
                                                        name="current_password"
                                                        value={passwordForm.current_password}
                                                        onChange={handlePasswordChange}
                                                        required
                                                        placeholder="Mật khẩu hiện tại"
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword.new ? "text" : "password"}
                                                        name="new_password"
                                                        value={passwordForm.new_password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Mật khẩu mới"
                                                        required
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword.confirm ? "text" : "password"}
                                                        name="confirm_password"
                                                        value={passwordForm.confirm_password}
                                                        onChange={handlePasswordChange}
                                                        required
                                                        placeholder="Xác nhận mật khẩu mới"
                                                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 ${passwordForm.confirm_password &&
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
                                                        <p className="mt-1 text-sm text-red-600">Mật khẩu không khớp</p>
                                                    )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading || passwordForm.new_password !== passwordForm.confirm_password}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Đang đổi mật khẩu...</span>
                                                    </div>
                                                ) : (
                                                    <span>Đổi mật khẩu</span>
                                                )}

                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        Cài đặt tài khoản
                                    </h2>
                                </div>

                                <div className="p-6 space-y-4">
                                    {user?.role === 1 && donorInfo && (
                                        <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                            <h3 className="font-semibold text-gray-900 mb-3">Quyền riêng tư</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <span className="text-sm text-gray-700">Hiển thị thông tin cá nhân</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 text-red-600 rounded-lg focus:ring-red-500"
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
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <span className="text-sm text-gray-700">Sẵn sàng hiến máu</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 text-red-600 rounded-lg focus:ring-red-500"
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
                                        <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                            <h3 className="font-semibold text-gray-900 mb-3">Trạng thái công việc</h3>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">
                                                    {staffInfo.current_status ? 'Đang làm việc' : 'Nghỉ việc'}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-red-600 rounded-lg focus:ring-red-500"
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
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Profile;
