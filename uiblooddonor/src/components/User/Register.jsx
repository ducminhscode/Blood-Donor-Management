import { Link, useNavigate } from "react-router-dom";
import { Droplet, Lock, Eye, EyeOff, User, Mail, Phone, Calendar, Briefcase, Stethoscope, Heart, Camera, ChevronLeft, ChevronDown, Loader2, IdCard, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import APIs, { endpoints } from "../../configs/APIs";
import { Helmet } from "react-helmet-async";

const Register = () => {
    const [userType, setUserType] = useState('donor');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);
    const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);

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
        gender: "0",
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
        gender: "0",
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

    useEffect(() => {
        const password = userType === 'donor' ? donorForm.password : staffForm.password;
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        setPasswordStrength(strength);
    }, [userType === 'donor' ? donorForm.password : staffForm.password]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProvinceDropdown && !event.target.closest('.province-dropdown')) {
                setShowProvinceDropdown(false);
            }
            if (showDistrictDropdown && !event.target.closest('.district-dropdown')) {
                setShowDistrictDropdown(false);
            }
            if (showGenderDropdown && !event.target.closest('.gender-dropdown')) {
                setShowGenderDropdown(false);
            }
            if (showDegreeDropdown && !event.target.closest('.degree-dropdown')) {
                setShowDegreeDropdown(false);
            }
            if (showHospitalDropdown && !event.target.closest('.hospital-dropdown')) {
                setShowHospitalDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProvinceDropdown, showDistrictDropdown, showGenderDropdown, showDegreeDropdown, showHospitalDropdown]);

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

    const handleDegreeSelect = (degree) => {
        setStaffForm(prev => ({ ...prev, degree: degree }));
        setShowDegreeDropdown(false);
    };

    const handleHospitalSelect = (hospitalId, hospitalName) => {
        setStaffForm(prev => ({ ...prev, hospital_id: hospitalId }));
        setShowHospitalDropdown(false);
    };

    const getHospitalName = (hospitalId) => {
        const hospital = hospitals.find(h => h.id === parseInt(hospitalId));
        return hospital ? hospital.name : "Chọn bệnh viện";
    };

    const handleProvinceSelect = (provinceCode, provinceName) => {
        setDonorForm(prev => ({ ...prev, province: provinceCode, sub_district: "" }));
        setShowProvinceDropdown(false);
    };

    const handleDistrictSelect = (districtCode, districtName) => {
        setDonorForm(prev => ({ ...prev, sub_district: districtCode }));
        setShowDistrictDropdown(false);
    };

    const handleGenderSelect = (genderValue) => {
        if (userType === 'donor') {
            setDonorForm(prev => ({ ...prev, gender: genderValue }));
        } else {
            setStaffForm(prev => ({ ...prev, gender: genderValue }));
        }
        setShowGenderDropdown(false);
    };

    const getProvinceName = (provinceCode) => {
        const province = provinces.find(p => p.code === parseInt(provinceCode));
        return province ? province.name : "Chọn tỉnh/thành phố";
    };

    const getDistrictName = (districtCode) => {
        const district = districts.find(d => d.code === parseInt(districtCode));
        return district ? district.name : "Chọn quận/huyện";
    };

    const getGenderLabel = (genderValue) => {
        if (genderValue === "0") return "Nam";
        if (genderValue === "1") return "Nữ";
        return "Giới tính";
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return "Rất yếu";
        if (passwordStrength === 1) return "Yếu";
        if (passwordStrength === 2) return "Trung bình";
        if (passwordStrength === 3) return "Mạnh";
        return "Rất mạnh";
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return "bg-red-500";
        if (passwordStrength === 1) return "bg-orange-500";
        if (passwordStrength === 2) return "bg-yellow-500";
        if (passwordStrength === 3) return "bg-green-500";
        return "bg-green-600";
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

        if (passwordStrength < 2) {
            setError("Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)");
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
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                if (donorForm.avatar) {
                    formData.append('account.avatar', donorForm.avatar);
                }

                if (donorForm.province) formData.append('province', donorForm.province);
                if (donorForm.sub_district) formData.append('sub_district', donorForm.sub_district);
                if (donorForm.permanent_address) formData.append('permanent_address', donorForm.permanent_address);
                if (donorForm.identification) formData.append('identification', donorForm.identification);
                if (donorForm.career) formData.append('career', donorForm.career);
                if (donorForm.organization) formData.append('organization', donorForm.organization);

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

                    setSuccess("Đăng ký thành công. Đang chuyển đến trang xác thực.");
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
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                if (staffForm.avatar) {
                    formData.append('account.avatar', staffForm.avatar);
                }

                if (staffForm.department) formData.append('department', staffForm.department);
                if (staffForm.degree) formData.append('degree', staffForm.degree);
                if (staffForm.license_number) formData.append('license_number', staffForm.license_number);
                if (staffForm.emergency_phone) formData.append('emergency_phone', staffForm.emergency_phone);
                if (staffForm.experience_years) formData.append('experience_years', Number(staffForm.experience_years));
                if (staffForm.hospital_id) formData.append('hospital_id', Number(staffForm.hospital_id));

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

                    setSuccess("Đăng ký thành công. Đang chuyển đến trang xác thực.");
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
        <div className="auth-page min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Helmet>
                <title>Đăng ký | Dòng Máu Lạc Hồng</title>
            </Helmet>
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-300 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute top-20 left-20 animate-float">
                    <Heart className="w-8 h-8 text-red-300 opacity-20" />
                </div>
                <div className="absolute bottom-20 right-20 animate-float-delay">
                    <Heart className="w-6 h-6 text-red-300 opacity-20" />
                </div>
                <div className="absolute top-40 right-20 animate-float-slow">
                    <Heart className="w-5 h-5 text-red-300 opacity-30" />
                </div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <Link
                    to="/"
                    className="register-home-link inline-flex items-center text-gray-600 hover:text-red-600 transition-all duration-300 group mb-4"
                >
                    <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Trang chủ</span>
                </Link>
                <div className="auth-card bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50 animate-pulse"></div>
                                    <Droplet className="relative h-12 w-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold">Đăng ký tài khoản</h2>
                            <p className="mt-2 text-red-100">Tham gia cùng chúng tôi trong hành trình hiến máu cứu người</p>
                        </div>
                    </div>

                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setUserType('donor')}
                                className={`cursor-pointer flex-1 max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${userType === 'donor'
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Droplet className={`w-5 h-5 ${userType === 'donor' ? 'text-white' : 'text-red-600'}`} />
                                <span className="font-semibold">Người hiến máu</span>
                            </button>
                            <button
                                onClick={() => setUserType('staff')}
                                className={`cursor-pointer flex-1 max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${userType === 'staff'
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Stethoscope className={`w-5 h-5 ${userType === 'staff' ? 'text-white' : 'text-red-600'}`} />
                                <span className="font-semibold">Nhân viên y tế</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 lg:p-8">
                        {error && (
                            <div className="mt-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-lg animate-shake">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mt-6 bg-green-50 border-l-4 border-green-600 p-4 rounded-lg animate-fadeIn">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex flex-col items-center mb-6 mt-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-r from-red-100 to-red-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-14 h-14 text-red-600" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group-hover:scale-110">
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

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tên đăng nhập <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={userType === 'donor' ? donorForm.username : staffForm.username}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Tên đăng nhập"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={userType === 'donor' ? donorForm.email : staffForm.email}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Email"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={userType === 'donor' ? donorForm.password : staffForm.password}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                                    {passwordStrength > 0 && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 h-1.5">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`flex-1 rounded-full transition-all ${level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs mt-1 ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                                                Độ mạnh: {getPasswordStrengthText()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Xác nhận mật khẩu <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={userType === 'donor' ? donorForm.confirmPassword : staffForm.confirmPassword}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tên <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={userType === 'donor' ? donorForm.first_name : staffForm.first_name}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                        placeholder="Tên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Họ và tên đệm <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={userType === 'donor' ? donorForm.last_name : staffForm.last_name}
                                        onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                        required
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                        placeholder="Họ và tên đệm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={userType === 'donor' ? donorForm.phone : staffForm.phone}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Số điện thoại"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ngày sinh
                                    </label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            type="date"
                                            name="birth_date"
                                            value={userType === 'donor' ? donorForm.birth_date : staffForm.birth_date}
                                            onChange={userType === 'donor' ? handleDonorChange : handleStaffChange}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="gender-dropdown relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Giới tính
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300"
                                    >
                                        <span className={userType === 'donor' ? (donorForm.gender ? "text-gray-900" : "text-gray-400") : (staffForm.gender ? "text-gray-900" : "text-gray-400")}>
                                            {userType === 'donor' ? getGenderLabel(donorForm.gender) : getGenderLabel(staffForm.gender)}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showGenderDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                            <button
                                                type="button"
                                                onClick={() => handleGenderSelect("0")}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${(userType === 'donor' ? donorForm.gender === "0" : staffForm.gender === "0") ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Nam
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleGenderSelect("1")}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${(userType === 'donor' ? donorForm.gender === "1" : staffForm.gender === "1") ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                            >
                                                Nữ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {userType === 'donor' && (
                                <div className="space-y-5 border-t border-gray-200 pt-6 mt-4">
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="province-dropdown relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tỉnh/Thành phố</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300"
                                                disabled={loadingProvinces}
                                            >
                                                <span className={donorForm.province ? "text-gray-900" : "text-gray-400"}>
                                                    {donorForm.province ? getProvinceName(donorForm.province) : "Chọn tỉnh/thành phố"}
                                                </span>
                                                {loadingProvinces ? (
                                                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                                ) : (
                                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>

                                            {showProvinceDropdown && (
                                                <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProvinceSelect("", "")}
                                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!donorForm.province ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                    >
                                                        Chọn tỉnh/thành phố
                                                    </button>
                                                    {loadingProvinces ? (
                                                        <div className="px-4 py-3 text-center text-gray-500">
                                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                        </div>
                                                    ) : (
                                                        provinces.map(province => (
                                                            <button
                                                                key={province.code}
                                                                type="button"
                                                                onClick={() => handleProvinceSelect(province.code.toString(), province.name)}
                                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${donorForm.province === province.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                            >
                                                                {province.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="district-dropdown relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Quận/Huyện</label>
                                            <button
                                                type="button"
                                                onClick={() => donorForm.province && !loadingDistricts && setShowDistrictDropdown(!showDistrictDropdown)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white hover:border-red-300 ${(!donorForm.province || loadingDistricts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={!donorForm.province || loadingDistricts}
                                            >
                                                <span className={donorForm.sub_district ? "text-gray-900" : "text-gray-400"}>
                                                    {donorForm.sub_district ? getDistrictName(donorForm.sub_district) : "Chọn quận/huyện"}
                                                </span>
                                                {loadingDistricts ? (
                                                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                                ) : (
                                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>

                                            {showDistrictDropdown && donorForm.province && (
                                                <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDistrictSelect("", "")}
                                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!donorForm.sub_district ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                    >
                                                        Chọn quận/huyện
                                                    </button>
                                                    {districts.map(district => (
                                                        <button
                                                            key={district.code}
                                                            type="button"
                                                            onClick={() => handleDistrictSelect(district.code.toString(), district.name)}
                                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${donorForm.sub_district === district.code.toString() ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                        >
                                                            {district.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ thường trú</label>
                                            <textarea
                                                name="permanent_address"
                                                value={donorForm.permanent_address}
                                                onChange={handleDonorChange}
                                                rows="2"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                placeholder="Số nhà, đường, phường/xã"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">CCCD/CMND</label>
                                            <div className="relative group">
                                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    name="identification"
                                                    value={donorForm.identification}
                                                    onChange={handleDonorChange}
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Số CCCD/CMND"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nghề nghiệp</label>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    name="career"
                                                    value={donorForm.career}
                                                    onChange={handleDonorChange}
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Nghề nghiệp"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Đơn vị công tác</label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    name="organization"
                                                    value={donorForm.organization}
                                                    onChange={handleDonorChange}
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Tên trường học, công ty, tổ chức"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userType === 'staff' && (
                                <div className="space-y-5 border-t border-gray-200 pt-6 mt-4">
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="hospital-dropdown relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Bệnh viện <span className="text-red-600">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300"
                                                disabled={loadingHospitals}
                                            >
                                                <span className={staffForm.hospital_id ? "text-gray-900" : "text-gray-400"}>
                                                    {staffForm.hospital_id ? getHospitalName(staffForm.hospital_id) : "Chọn bệnh viện"}
                                                </span>
                                                {loadingHospitals ? (
                                                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                                ) : (
                                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showHospitalDropdown ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>

                                            {showHospitalDropdown && (
                                                <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto z-30 animate-fadeIn">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleHospitalSelect("", "")}
                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                                                    >
                                                        Chọn bệnh viện
                                                    </button>
                                                    {loadingHospitals ? (
                                                        <div className="px-4 py-3 text-center">
                                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                        </div>
                                                    ) : (
                                                        hospitals.map(hospital => (
                                                            <button
                                                                key={hospital.id}
                                                                type="button"
                                                                onClick={() => handleHospitalSelect(hospital.id, hospital.name)}
                                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${staffForm.hospital_id === hospital.id ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                            >
                                                                {hospital.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Khoa <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={staffForm.department}
                                                onChange={handleStaffChange}
                                                required
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                placeholder="Tên khoa"
                                            />
                                        </div>

                                        <div className="degree-dropdown relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Học vị/Chứng chỉ <span className="text-red-600">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowDegreeDropdown(!showDegreeDropdown)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-red-300"
                                            >
                                                <span className={staffForm.degree ? "text-gray-900" : "text-gray-400"}>
                                                    {staffForm.degree || "Chọn học vị/chứng chỉ"}
                                                </span>
                                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDegreeDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showDegreeDropdown && (
                                                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-fadeIn">
                                                    {degrees.map(degree => (
                                                        <button
                                                            key={degree}
                                                            type="button"
                                                            onClick={() => handleDegreeSelect(degree)}
                                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${staffForm.degree === degree ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                                                        >
                                                            {degree}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Chứng chỉ hành nghề <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="license_number"
                                                value={staffForm.license_number}
                                                onChange={handleStaffChange}
                                                required
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                placeholder="Số chứng chỉ hành nghề"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Số điện thoại khẩn cấp <span className="text-red-600">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                                <input
                                                    type="tel"
                                                    name="emergency_phone"
                                                    value={staffForm.emergency_phone}
                                                    onChange={handleStaffChange}
                                                    required
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Số điện thoại liên hệ khẩn cấp"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                                    className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
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
                                    <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold hover:underline transition-all">
                                        Đăng nhập ngay
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes float-delay {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-float-delay {
                    animation: float-delay 8s ease-in-out infinite;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Register;
