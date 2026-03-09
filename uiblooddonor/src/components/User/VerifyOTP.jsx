import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Shield, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import APIs, { endpoints } from "../../configs/APIs";

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [otpExpiryTime, setOtpExpiryTime] = useState(300);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";
    const userType = location.state?.userType || "";

    useEffect(() => {
        if (otpExpiryTime <= 0) {
            setError("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới!");
            return;
        }

        const timer = setInterval(() => {
            setOtpExpiryTime(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [otpExpiryTime]);

    useEffect(() => {
        if (resendCooldown <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setResendCooldown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(0, 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1].focus();
        }

        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const pastedOtp = pastedData.slice(0, 6).split('').filter(char => /^\d$/.test(char));

        if (pastedOtp.length > 0) {
            const newOtp = [...otp];
            pastedOtp.forEach((value, index) => {
                if (index < 6) newOtp[index] = value;
            });
            setOtp(newOtp);

            const nextIndex = Math.min(pastedOtp.length, 5);
            if (nextIndex < 6) {
                inputRefs.current[nextIndex].focus();
            } else {
                inputRefs.current[5].focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpExpiryTime <= 0) {
            setError("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới!");
            return;
        }

        if (otpCode.length !== 6) {
            setError("Vui lòng nhập đầy đủ mã OTP 6 số");
            setTimeout(() => setError(""), 3000);
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const endpoint = userType === 'donor' ? endpoints['verify_donor_otp'] : endpoints['verify_staff_otp'];

            await APIs.post(endpoint, {
                email: email,
                otp: otpCode
            });

            setSuccess("Xác thực thành công! Đang chuyển hướng...");

            setTimeout(() => {
                navigate('/login', {
                    state: {
                        success: "Xác thực tài khoản thành công! Vui lòng đăng nhập."
                    }
                });
            }, 2000);

        } catch (err) {
            console.error("OTP verification error:", err);
            setError(err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn");

            setOtp(['', '', '', '', '', '']);
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Lấy thông tin từ localStorage
            const tempData = localStorage.getItem('tempRegistration');
            if (!tempData) {
                setError("Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại!");
                setLoading(false);
                return;
            }

            const registrationData = JSON.parse(tempData);

            // Kiểm tra email có khớp không
            if (registrationData.email !== email) {
                setError("Thông tin không hợp lệ. Vui lòng đăng ký lại!");
                setLoading(false);
                return;
            }

            const formData = new FormData();

            if (userType === 'donor') {
                // Tạo object account từ dữ liệu đã lưu
                const accountData = {
                    username: registrationData.username || '',
                    password: registrationData.accountData?.password || '', // Cần lấy password từ đâu đó? 
                    first_name: registrationData.first_name || '',
                    last_name: registrationData.last_name || '',
                    email: registrationData.email || '',
                    phone: registrationData.phone || '',
                    birth_date: registrationData.birth_date || '',
                    gender: registrationData.gender || ''
                };

                // Append account fields
                Object.keys(accountData).forEach(key => {
                    if (accountData[key] && accountData[key] !== '') {
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                // Append các trường donor
                if (registrationData.province) {
                    formData.append('province', registrationData.province);
                }
                if (registrationData.sub_district) {
                    formData.append('sub_district', registrationData.sub_district);
                }
                if (registrationData.permanent_address) {
                    formData.append('permanent_address', registrationData.permanent_address);
                }
                if (registrationData.identification) {
                    formData.append('identification', registrationData.identification);
                }
                if (registrationData.career) {
                    formData.append('career', registrationData.career);
                }
                if (registrationData.organization) {
                    formData.append('organization', registrationData.organization);
                }

                console.log("=== Resend OTP - Donor Data ===");
                for (let pair of formData.entries()) {
                    console.log(pair[0], pair[1]);
                }

                const response = await APIs.post(endpoints['register_donor'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    // Reset timers
                    setOtpExpiryTime(300);
                    setResendCooldown(60);
                    setCanResend(false);

                    setSuccess("Mã OTP mới đã được gửi đến email của bạn!");

                    // Clear OTP inputs
                    setOtp(['', '', '', '', '', '']);
                    if (inputRefs.current[0]) {
                        inputRefs.current[0].focus();
                    }
                }

            } else {
                // Tạo object account cho staff
                const accountData = {
                    username: registrationData.username || '',
                    password: registrationData.accountData?.password || '', // Cần lấy password từ đâu đó?
                    first_name: registrationData.first_name || '',
                    last_name: registrationData.last_name || '',
                    email: registrationData.email || '',
                    phone: registrationData.phone || '',
                    birth_date: registrationData.birth_date || '',
                    gender: registrationData.gender || ''
                };

                // Append account fields
                Object.keys(accountData).forEach(key => {
                    if (accountData[key] && accountData[key] !== '') {
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                // Append các trường staff
                if (registrationData.department) {
                    formData.append('department', registrationData.department);
                }
                if (registrationData.degree) {
                    formData.append('degree', registrationData.degree);
                }
                if (registrationData.license_number) {
                    formData.append('license_number', registrationData.license_number);
                }
                if (registrationData.emergency_phone) {
                    formData.append('emergency_phone', registrationData.emergency_phone);
                }
                if (registrationData.experience_years) {
                    formData.append('experience_years', Number(registrationData.experience_years));
                }
                if (registrationData.hospital_id) {
                    formData.append('hospital_id', Number(registrationData.hospital_id));
                }

                console.log("=== Resend OTP - Staff Data ===");
                for (let pair of formData.entries()) {
                    console.log(pair[0], pair[1]);
                }

                const response = await APIs.post(endpoints['register_staff'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    // Reset timers
                    setOtpExpiryTime(300);
                    setResendCooldown(60);
                    setCanResend(false);

                    setSuccess("Mã OTP mới đã được gửi đến email của bạn!");

                    // Clear OTP inputs
                    setOtp(['', '', '', '', '', '']);
                    if (inputRefs.current[0]) {
                        inputRefs.current[0].focus();
                    }
                }
            }

            // Auto hide success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);

        } catch (err) {
            console.error("Resend OTP error:", err);

            // Xử lý lỗi chi tiết từ server
            if (err.response?.status === 400) {
                const errorData = err.response.data;
                if (errorData.email) {
                    setError(`Email: ${errorData.email.join(', ')}`);
                } else if (errorData.username) {
                    setError(`Tên đăng nhập: ${errorData.username.join(', ')}`);
                } else if (errorData.non_field_errors) {
                    setError(errorData.non_field_errors.join(', '));
                } else if (errorData.message) {
                    setError(errorData.message);
                } else {
                    setError("Thông tin đăng ký không hợp lệ. Vui lòng đăng ký lại!");
                }
            } else if (err.response?.status === 409) {
                setError("Tài khoản đã được xác thực. Vui lòng đăng nhập!");
                // Clear localStorage vì tài khoản đã được xác thực
                localStorage.removeItem('tempRegistration');

                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(err.response?.data?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">

                    <Link to="/register" className="inline-flex items-center text-gray-600 hover:text-red-600 transition mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại đăng ký
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <Shield className="h-10 w-10 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Xác thực tài khoản</h2>
                        <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-1" />
                            <span>Mã xác thực đã được gửi đến</span>
                        </div>
                        <p className="font-medium text-red-600">{email || "email của bạn"}</p>
                    </div>

                    {/* Error & Success Messages */}
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
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="ml-3 text-sm text-green-700">{success}</p>
                            </div>
                        </div>
                    )}

                    {/* Timers */}
                    <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Mã có hiệu lực trong:</span>
                            <span className={`font-mono font-bold ${otpExpiryTime < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatTime(otpExpiryTime)}
                            </span>
                        </div>
                    </div>

                    {/* OTP Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Inputs */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                Nhập mã xác thực 6 số
                            </label>
                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 focus:outline-none"
                                        maxLength={1}
                                        disabled={loading || otpExpiryTime <= 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.some(d => !d) || otpExpiryTime <= 0}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition transform hover:scale-105 disabled:bg-red-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang xác thực...</span>
                                </div>
                            ) : (
                                "Xác thực"
                            )}
                        </button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            {canResend ? (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="inline-flex items-center text-red-600 hover:text-red-700 font-medium disabled:text-red-300"
                                >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Gửi lại mã xác thực
                                </button>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Có thể gửi lại mã sau {formatTime(resendCooldown)}
                                </p>
                            )}
                        </div>
                    </form>

                    {/* Note */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center">
                            Mã xác thực gồm 6 số được gửi đến email của bạn và có hiệu lực trong 5 phút.
                            Vui lòng kiểm tra cả mục Spam nếu không thấy email.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;