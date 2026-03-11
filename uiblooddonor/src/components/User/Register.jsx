import { Link, useNavigate } from "react-router-dom";
import { Droplet, Lock, Eye, EyeOff, ArrowLeft, User, Mail, Phone, Calendar, MapPin, Building, Briefcase, CreditCard, Stethoscope, GraduationCap, PhoneCall, AlertCircle, Heart, Users, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import APIs, { endpoints } from "../../configs/APIs";

const Register = () => {
    const [userType, setUserType] = useState('donor');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);

    const [donorForm, setDonorForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        avatar: null,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        gender: "",
        province: "",
        sub_district: "",
        permanent_address: "",
        identification: "",
        career: "",
        organization: ""
    });

    const [staffForm, setStaffForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        avatar: null,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        gender: "",
        department: "",
        degree: "",
        license_number: "",
        emergency_phone: "",
        experience_years: "",
        hospital_id: ""
    });

    useEffect(() => {
        fetchProvinces();
    }, []);

    useEffect(() => {
        fetchHospitals();
    }, []);

    useEffect(() => {
        if (userType === 'donor' && donorForm.province) {
            fetchDistricts(donorForm.province);
        } else {
            setDistricts([]);
        }
    }, [donorForm.province, userType]);

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (err) {
            console.error("Error fetching provinces:", err);
            setError("Không thể tải danh sách tỉnh thành");
        } finally {
            setLoadingProvinces(false);
        }
    };

    const fetchDistricts = async (provinceCode) => {
        setLoadingDistricts(true);
        try {
            // Fetch districts for selected province
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts || []);
        } catch (err) {
            console.error("Error fetching districts:", err);
            setError("Không thể tải danh sách quận huyện");
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const response = await APIs.get(endpoints['hospital']);
            setHospitals(response.data.results);
        } catch (err) {
            console.error("Error fetching hospitals:", err);
            setError("Không thể tải danh sách bệnh viện");
        } finally {
            setLoadingHospitals(false);
        }
    };

    const degrees = ["Bác sĩ Đa khoa", "Bác sĩ CKI", "Bác sĩ CKII", "Điều dưỡng", "Bác sĩ nội trú"];

    const handleDonorChange = (e) => {
        const { name, value } = e.target;
        setDonorForm(prev => ({ ...prev, [name]: value }));
    };

    const handleStaffChange = (e) => {
        const { name, value } = e.target;
        setStaffForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Vui lòng chọn file hình ảnh");
                setTimeout(() => setError(""), 3000);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("File ảnh quá lớn (tối đa 5MB)");
                setTimeout(() => setError(""), 3000);
                return;
            }

            if (userType === 'donor') {
                setDonorForm(prev => ({ ...prev, avatar: file }));
            } else {
                setStaffForm(prev => ({ ...prev, avatar: file }));
            }
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const password = userType === 'donor' ? donorForm.password : staffForm.password;
        const confirmPassword = userType === 'donor' ? donorForm.confirmPassword : staffForm.confirmPassword;

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            let registrationData = {};

            if (userType === 'donor') {
                const accountData = {
                    username: donorForm.username,
                    password: donorForm.password,
                    first_name: donorForm.first_name,
                    last_name: donorForm.last_name,
                    email: donorForm.email,
                    phone: donorForm.phone || null,
                    birth_date: donorForm.birth_date || null,
                    gender: donorForm.gender || null
                };

                registrationData = {
                    ...donorForm,
                    userType: 'donor',
                    accountData: accountData
                };

                Object.keys(accountData).forEach(key => {
                    if (accountData[key] !== null && accountData[key] !== '') {
                        if (key === 'avatar') {
                        } else {
                            formData.append(`account.${key}`, accountData[key]);
                        }
                    }
                });

                if (donorForm.avatar) {
                    formData.append('account.avatar', donorForm.avatar);
                }

                if (donorForm.province) {
                    formData.append('province', donorForm.province);
                }
                if (donorForm.sub_district) {
                    formData.append('sub_district', donorForm.sub_district);
                }
                if (donorForm.permanent_address) {
                    formData.append('permanent_address', donorForm.permanent_address);
                }
                if (donorForm.identification) {
                    formData.append('identification', donorForm.identification);
                }
                if (donorForm.career) {
                    formData.append('career', donorForm.career);
                }
                if (donorForm.organization) {
                    formData.append('organization', donorForm.organization);
                }

                console.log("=== Donor FormData Contents ===");
                for (let pair of formData.entries()) {
                    if (pair[0] === 'account.avatar') {
                        console.log(pair[0], pair[1].name, pair[1].type, pair[1].size);
                    } else {
                        console.log(pair[0], pair[1]);
                    }
                }

                const response = await APIs.post(endpoints['register_donor'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    const safeRegistrationData = {
                        ...registrationData,
                        password: undefined, 
                        confirmPassword: undefined,
                        avatar: registrationData.avatar ? 'uploaded' : null 
                    };
                    localStorage.setItem('tempRegistration', JSON.stringify(safeRegistrationData));

                    setSuccess("Đăng ký thành công. Đang chuyển đến trang xác thực...");
                    setTimeout(() => {
                        navigate('/verify-otp', {
                            state: {
                                email: donorForm.email,
                                userType: 'donor'
                            }
                        });
                    }, 2000);
                }

            } else {
                const accountData = {
                    username: staffForm.username,
                    password: staffForm.password,
                    first_name: staffForm.first_name,
                    last_name: staffForm.last_name,
                    email: staffForm.email,
                    phone: staffForm.phone || null,
                    birth_date: staffForm.birth_date || null,
                    gender: staffForm.gender || null
                };

                registrationData = {
                    ...staffForm,
                    userType: 'staff',
                    accountData: accountData
                };

                Object.keys(accountData).forEach(key => {
                    if (accountData[key] !== null && accountData[key] !== '') {
                        if (key === 'avatar') {
                        } else {
                            formData.append(`account.${key}`, accountData[key]);
                        }
                    }
                });

                if (staffForm.avatar) {
                    formData.append('account.avatar', staffForm.avatar);
                }

                if (staffForm.department) {
                    formData.append('department', staffForm.department);
                }
                if (staffForm.degree) {
                    formData.append('degree', staffForm.degree);
                }
                if (staffForm.license_number) {
                    formData.append('license_number', staffForm.license_number);
                }
                if (staffForm.emergency_phone) {
                    formData.append('emergency_phone', staffForm.emergency_phone);
                }
                if (staffForm.experience_years) {
                    formData.append('experience_years', Number(staffForm.experience_years));
                }
                if (staffForm.hospital_id) {
                    formData.append('hospital_id', Number(staffForm.hospital_id));
                }

                const response = await APIs.post(endpoints['register_staff'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    const safeRegistrationData = {
                        ...registrationData,
                        password: undefined, 
                        confirmPassword: undefined, 
                        avatar: staffForm.avatar ? 'uploaded' : null 
                    };
                    localStorage.setItem('tempRegistration', JSON.stringify(safeRegistrationData));

                    setSuccess("Đăng ký thành công. Đang chuyển đến trang xác thực...");
                    setTimeout(() => {
                        navigate('/verify-otp', {
                            state: {
                                email: staffForm.email,
                                userType: 'staff'
                            }
                        });
                    }, 2000);
                }
            }

        } catch (err) {
            console.error("Register error:", err);
            if (err.response?.status === 400) {
                const errorData = err.response.data;
                if (errorData.email) {
                    setError(`Email: ${errorData.email.join(', ')}`);
                } else if (errorData.username) {
                    setError(`Tên đăng nhập: ${errorData.username.join(', ')}`);
                } else if (errorData.phone) {
                    setError(`Số điện thoại: ${errorData.phone.join(', ')}`);
                } else {
                    setError(err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
                }
            } else {
                setError(err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <Link to="/" className="inline-flex items-center text-gray-600 hover:text-red-600 transition mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Trang chủ
                    </Link>

                    <div className="text-center mb-8">
                        <div className="flex justify-center">
                            <Droplet className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="mt-4 text-3xl font-bold text-gray-900">Đăng ký tài khoản</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Tham gia cùng chúng tôi trong hành trình hiến máu cứu người
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={() => setUserType('donor')}
                            className={`flex-1 max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition ${userType === 'donor'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Droplet className={`w-5 h-5 ${userType === 'donor' ? 'text-white' : 'text-red-600'}`} />
                            <span className="font-medium">Người hiến máu</span>
                        </button>
                        <button
                            onClick={() => setUserType('staff')}
                            className={`flex-1 max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition ${userType === 'staff'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Stethoscope className={`w-5 h-5 ${userType === 'staff' ? 'text-white' : 'text-red-600'}`} />
                            <span className="font-medium">Nhân viên y tế</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="ml-3 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-green-600" />
                                <p className="ml-3 text-sm text-green-700">{success}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-red-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-red-600" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Chọn ảnh đại diện (tối đa 5MB)</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên đăng nhập <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={userType === 'donor' ? donorForm.username : staffForm.username}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Tên đăng nhập"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={userType === 'donor' ? donorForm.email : staffForm.email}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={userType === 'donor' ? donorForm.password : staffForm.password}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Mật khẩu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Xác nhận mật khẩu <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={userType === 'donor' ? donorForm.confirmPassword : staffForm.confirmPassword}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Xác nhận mật khẩu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={userType === 'donor' ? donorForm.first_name : staffForm.first_name}
                                    onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Tên"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên đệm <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={userType === 'donor' ? donorForm.last_name : staffForm.last_name}
                                    onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Họ và tên đệm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={userType === 'donor' ? donorForm.phone : staffForm.phone}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Số điện thoại"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ngày sinh
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="date"
                                        name="birth_date"
                                        value={userType === 'donor' ? donorForm.birth_date : staffForm.birth_date}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giới tính
                                </label>
                                <select
                                    name="gender"
                                    value={userType === 'donor' ? donorForm.gender : staffForm.gender}
                                    onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="0">Nam</option>
                                    <option value="1">Nữ</option>
                                </select>
                            </div>
                        </div>

                        {userType === 'donor' && (
                            <div className="space-y-4 border-t pt-6 mt-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-600" />
                                    Thông tin địa chỉ
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                                        <select
                                            name="province"
                                            value={donorForm.province}
                                            onChange={handleDonorChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Chọn tỉnh/thành phố</option>
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
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                                        <select
                                            name="sub_district"
                                            value={donorForm.sub_district}
                                            onChange={handleDonorChange}
                                            disabled={!donorForm.province || loadingDistricts}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Chọn quận/huyện</option>
                                            {loadingDistricts ? (
                                                <option disabled>Đang tải...</option>
                                            ) : (
                                                districts.map(district => (
                                                    <option key={district.code} value={district.code}>
                                                        {district.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ thường trú</label>
                                        <textarea
                                            name="permanent_address"
                                            value={donorForm.permanent_address}
                                            onChange={handleDonorChange}
                                            rows="2"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Số nhà, đường, phường/xã"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/CMND</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="identification"
                                                value={donorForm.identification}
                                                onChange={handleDonorChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Số CCCD/CMND"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="career"
                                                value={donorForm.career}
                                                onChange={handleDonorChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Nghề nghiệp"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị công tác</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="organization"
                                                value={donorForm.organization}
                                                onChange={handleDonorChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Tên trường học, công ty, tổ chức"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userType === 'staff' && (
                            <div className="space-y-4 border-t pt-6 mt-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-red-600" />
                                    Thông tin chuyên môn
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bệnh viện <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            name="hospital_id"
                                            value={staffForm.hospital_id}
                                            onChange={handleStaffChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Chọn bệnh viện</option>
                                            {loadingHospitals ? (
                                                <option disabled>Đang tải danh sách bệnh viện...</option>
                                            ) : (
                                                hospitals.map(hospital => (
                                                    <option key={hospital.id} value={hospital.id}>
                                                        {hospital.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {!loadingHospitals && hospitals.length === 0 && (
                                            <p className="text-sm text-red-500 mt-1">Không có bệnh viện nào</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Khoa <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={staffForm.department}
                                            onChange={handleStaffChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Khoa"
                                        />

                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Học vị/Chứng chỉ <span className="text-red-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <select
                                                name="degree"
                                                value={staffForm.degree}
                                                onChange={handleStaffChange}
                                                required
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            >
                                                <option value="">Chọn học vị/chứng chỉ</option>
                                                {degrees.map(degree => (
                                                    <option key={degree} value={degree}>{degree}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số chứng chỉ hành nghề <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="license_number"
                                            value={staffForm.license_number}
                                            onChange={handleStaffChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Số chứng chỉ"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số điện thoại khẩn cấp <span className="text-red-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="emergency_phone"
                                                value={staffForm.emergency_phone}
                                                onChange={handleStaffChange}
                                                required
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Số điện thoại liên hệ khẩn cấp"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số năm kinh nghiệm
                                        </label>
                                        <input
                                            type="number"
                                            name="experience_years"
                                            value={staffForm.experience_years}
                                            onChange={(e) => {
                                                let value = Number(e.target.value);

                                                if (value > 50) value = 50;
                                                if (value < 0) value = 0;

                                                setStaffForm(prev => ({
                                                    ...prev,
                                                    experience_years: value
                                                }));
                                            }}
                                            min="0"
                                            max="50"
                                            step="0.5"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Số năm kinh nghiệm"
                                        />
                                    </div>

                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition transform hover:scale-105 disabled:bg-red-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Đang đăng ký...</span>
                                    </div>
                                ) : (
                                    "Đăng ký"
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Đã có tài khoản?{' '}
                                <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;