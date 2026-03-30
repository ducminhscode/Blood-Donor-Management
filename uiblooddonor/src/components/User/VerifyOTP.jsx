import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Clock, RefreshCw, Loader2, ChevronLeft, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import APIs, { endpoints } from "../../configs/APIs";
import { Helmet } from "react-helmet-async";

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [otpExpiryTime, setOtpExpiryTime] = useState(300);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";
    const userType = location.state?.userType || "";

    useEffect(() => {
        if (otpExpiryTime <= 0) {
            setError("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
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
            setError("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
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
            const endpoint = userType === 'donor' ? endpoints['verify_otp'] : endpoints['verify_otp'];

            await APIs.post(endpoint, {
                email: email,
                otp: otpCode
            });

            setSuccess("Xác thực thành công! Đang chuyển đến trang đăng nhập...");

            setTimeout(() => {
                navigate('/login', {
                    state: {
                        success: "Xác thực tài khoản thành công. Vui lòng đăng nhập."
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

        setIsResending(true);
        setError("");
        setSuccess("");

        try {
            const tempData = localStorage.getItem('tempRegistration');
            if (!tempData) {
                setError("Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.");
                setIsResending(false);
                return;
            }

            const registrationData = JSON.parse(tempData);

            if (registrationData.email !== email) {
                setError("Thông tin không hợp lệ. Vui lòng đăng ký lại.");
                setIsResending(false);
                return;
            }

            const formData = new FormData();

            if (userType === 'donor') {
                const accountData = {
                    username: registrationData.username || '',
                    password: registrationData.accountData?.password || '',
                    first_name: registrationData.first_name || '',
                    last_name: registrationData.last_name || '',
                    email: registrationData.email || '',
                    phone: registrationData.phone || '',
                    birth_date: registrationData.birth_date || '',
                    gender: registrationData.gender || ''
                };

                Object.keys(accountData).forEach(key => {
                    if (accountData[key] && accountData[key] !== '') {
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                if (registrationData.province) formData.append('province', registrationData.province);
                if (registrationData.sub_district) formData.append('sub_district', registrationData.sub_district);
                if (registrationData.permanent_address) formData.append('permanent_address', registrationData.permanent_address);
                if (registrationData.identification) formData.append('identification', registrationData.identification);
                if (registrationData.career) formData.append('career', registrationData.career);
                if (registrationData.organization) formData.append('organization', registrationData.organization);

                const response = await APIs.post(endpoints['register_donor'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    setOtpExpiryTime(300);
                    setResendCooldown(60);
                    setCanResend(false);
                    setSuccess("Mã OTP mới đã được gửi đến email của bạn.");
                    setOtp(['', '', '', '', '', '']);
                    if (inputRefs.current[0]) inputRefs.current[0].focus();
                }

            } else {
                const accountData = {
                    username: registrationData.username || '',
                    password: registrationData.accountData?.password || '',
                    first_name: registrationData.first_name || '',
                    last_name: registrationData.last_name || '',
                    email: registrationData.email || '',
                    phone: registrationData.phone || '',
                    birth_date: registrationData.birth_date || '',
                    gender: registrationData.gender || ''
                };

                Object.keys(accountData).forEach(key => {
                    if (accountData[key] && accountData[key] !== '') {
                        formData.append(`account.${key}`, accountData[key]);
                    }
                });

                if (registrationData.department) formData.append('department', registrationData.department);
                if (registrationData.degree) formData.append('degree', registrationData.degree);
                if (registrationData.license_number) formData.append('license_number', registrationData.license_number);
                if (registrationData.emergency_phone) formData.append('emergency_phone', registrationData.emergency_phone);
                if (registrationData.experience_years) formData.append('experience_years', Number(registrationData.experience_years));
                if (registrationData.hospital_id) formData.append('hospital_id', Number(registrationData.hospital_id));

                const response = await APIs.post(endpoints['register_staff'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.status === 201 || response.status === 200) {
                    setOtpExpiryTime(300);
                    setResendCooldown(60);
                    setCanResend(false);
                    setSuccess("Mã OTP mới đã được gửi đến email của bạn.");
                    setOtp(['', '', '', '', '', '']);
                    if (inputRefs.current[0]) inputRefs.current[0].focus();
                }
            }

            setTimeout(() => setSuccess(""), 3000);

        } catch (err) {
            console.error("Resend OTP error:", err);

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
                    setError("Thông tin đăng ký không hợp lệ. Vui lòng đăng ký lại.");
                }
            } else if (err.response?.status === 409) {
                setError("Tài khoản đã được xác thực. Vui lòng đăng nhập.");
                localStorage.removeItem('tempRegistration');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(err.response?.data?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Helmet>
                <title>Xác thực OTP | Dòng Máu Lạc Hồng</title>
            </Helmet>
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-300 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20"></div>

                <div className="absolute top-20 left-10 animate-float">
                    <Heart className="w-6 h-6 text-red-300 opacity-30" />
                </div>
                <div className="absolute bottom-20 right-10 animate-float-delay">
                    <Heart className="w-8 h-8 text-red-300 opacity-30" />
                </div>
                <div className="absolute top-40 right-20 animate-float-slow">
                    <Heart className="w-5 h-5 text-red-300 opacity-30" />
                </div>
            </div>

            <div className="max-w-md mx-auto relative z-10">
                <Link
                    to="/register"
                    className="inline-flex items-center text-gray-600 hover:text-red-600 transition-all duration-300 group mb-4"
                >
                    <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Đăng ký</span>
                </Link>
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Shield className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Xác thực tài khoản
                            </h2>
                            <div className="mt-3">
                                <p className="text-sm text-gray-600">
                                    Mã xác thực đã được gửi đến
                                </p>
                                <p className="font-semibold text-red-600 mt-1 flex items-center justify-center gap-1">
                                    {email || "email của bạn"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-600">Mã có hiệu lực:</span>
                            </div>
                            <div className={`font-mono font-bold text-xl ${otpExpiryTime < 60 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                                {formatTime(otpExpiryTime)}
                            </div>
                        </div>

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
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center mt-4">
                                    Nhập mã xác thực 6 số
                                </label>
                                <div className="flex justify-center gap-3">
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
                                            className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-300 bg-white"
                                            maxLength={1}
                                            disabled={loading || otpExpiryTime <= 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center pt-2">
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isResending}
                                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-all duration-300 hover:gap-3 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isResending ? (
                                            <>
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                <span>Đang gửi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                <span>Gửi lại mã xác thực</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Có thể gửi lại sau {formatTime(resendCooldown)}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.some(d => !d) || otpExpiryTime <= 0}
                                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        <span>Đang xác thực...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Xác thực
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex items-start gap-2">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Mã xác thực gồm 6 số được gửi đến email của bạn và có hiệu lực trong 5 phút.
                                    Vui lòng kiểm tra cả mục Spam nếu không thấy email. Nếu không nhận được mã,
                                    hãy nhấn "Gửi lại mã xác thực".
                                </p>
                            </div>
                        </div>
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
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default VerifyOTP;