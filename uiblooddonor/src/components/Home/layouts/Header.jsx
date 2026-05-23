import { Droplet, LogIn, User, ChevronDown, Menu, X, Heart, Award, Shield, Clock, History, Users, CalendarCheck2, Ambulance, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useRef, useEffect } from 'react';
import { UserContexts, UserDispatchContext } from '../../../configs/UserContexts';
import cookie from 'react-cookies';
import { getImageUrl } from '../../../utils/Image';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = user !== null;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        cookie.remove("access_token", { path: "/" });
        cookie.remove("refresh_token", { path: "/" });
        dispatch({ type: "logout" });
        navigate("/");
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const isActiveTab = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const getTabClass = (path) => {
        const baseClass = "relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-xl";
        return isActiveTab(path)
            ? `${baseClass} text-red-600 bg-red-50/80 shadow-sm`
            : `${baseClass} text-gray-600 hover:text-red-600 hover:bg-red-50/50`;
    };

    const getMobileTabClass = (path) => {
        const baseClass = "flex items-center space-x-3 px-4 py-3 text-base font-medium transition-all duration-200 rounded-xl";
        return isActiveTab(path)
            ? `${baseClass} bg-red-50 text-red-600`
            : `${baseClass} text-gray-700 hover:bg-gray-50 hover:text-red-600`;
    };

    const getDropdownItemClass = (path) => {
        const baseClass = "flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-200";
        return isActiveTab(path)
            ? `${baseClass} bg-red-50 text-red-600 font-medium`
            : `${baseClass} text-gray-700 hover:bg-red-50 hover:text-red-600`;
    };

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                            <Droplet className="relative h-8 w-8 lg:h-9 lg:w-9 text-red-600 drop-shadow-sm" />
                        </div>
                        <Link to="/" className="group">
                            <h1 className="font-bold text-xl lg:text-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 bg-clip-text text-transparent">
                                Dòng Máu Lạc Hồng
                            </h1>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                        <Link to="/" className={getTabClass('/')}>
                            Trang chủ
                        </Link>
                        <Link to="/list-event" className={getTabClass('/list-event')}>
                            <div className="flex items-center">
                                Hoạt động hiến máu
                            </div>
                        </Link>
                        <Link to="/list-emergency-request" className={getTabClass('/list-emergency-request')}>
                            <div className="flex items-center">
                                Hiến máu khẩn cấp
                            </div>
                        </Link>
                        {user?.role === 1 && (
                            <Link to="/reward-category" className={getTabClass('/reward-category')}>
                                <div className="flex items-center">
                                    Kho đổi thưởng
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {!isLoggedIn ? (
                            <>
                                <div className="hidden sm:flex items-center space-x-2">
                                    <Link
                                        to="/login"
                                        className="home-login-link group relative px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-all duration-300 rounded-xl overflow-hidden"
                                    >
                                        <span className="relative z-10">Đăng nhập</span>
                                        <div className="absolute inset-0 bg-red-50 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="relative px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        <span className="relative z-10">Đăng ký</span>
                                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                                    </Link>
                                </div>
                                <Link
                                    to="/login"
                                    className="sm:hidden flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 text-red-600 rounded-xl hover:shadow-md transition-all duration-300"
                                >
                                    <LogIn className="h-5 w-5" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="hidden sm:block relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="cursor-pointer flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl pl-2 pr-4 py-1.5 transition-all duration-300 border border-gray-200 hover:shadow-md"
                                    >
                                        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                                            {user?.avatar ? (
                                                <img
                                                    src={getImageUrl(user.avatar)}
                                                    alt={user?.first_name || 'Avatar'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <User className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">
                                                {user?.first_name || 'Người dùng'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user?.role === 1 ? 'Thành viên' : 'Nhân viên'}
                                            </p>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-all duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-2 border border-gray-100 animate-fadeInDown">
                                            <div className="px-4 py-3 border-b border-gray-100 mb-2">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {user?.last_name} {user?.first_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className={getDropdownItemClass('/profile')}
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <User className="h-4 w-4" />
                                                <span>Thông tin cá nhân</span>
                                            </Link>

                                            {user?.role === 1 && (
                                                <>
                                                    <Link
                                                        to="/friend-list"
                                                        className={getDropdownItemClass('/friend-list')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <Users className="h-4 w-4" />
                                                        <span>Danh sách bạn bè</span>
                                                    </Link>
                                                    <Link
                                                        to="/chat"
                                                        className={getDropdownItemClass('/chat')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span>Trò chuyện</span>
                                                    </Link>
                                                    <Link
                                                        to="/reward-history"
                                                        className={getDropdownItemClass('/reward-history')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <History className="h-4 w-4" />
                                                        <span>Lịch sử đổi thưởng</span>
                                                    </Link>
                                                    <Link
                                                        to="/event-registration"
                                                        className={getDropdownItemClass('/event-registration')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <CalendarCheck2 className="h-4 w-4" />
                                                        <span>Hoạt động đã tham gia</span>
                                                    </Link>
                                                    <Link
                                                        to="/emergency-response"
                                                        className={getDropdownItemClass('/emergency-response')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <Ambulance className="h-4 w-4" />
                                                        <span>Khẩn cấp đã ứng cứu</span>
                                                    </Link>
                                                </>
                                            )}

                                            {user?.role === 2 && (
                                                <>
                                                    <Link
                                                        to="/staff-donation-event"
                                                        className={getDropdownItemClass('/staff-donation-event')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <Heart className="h-4 w-4" />
                                                        <span>Quản lý sự kiện</span>
                                                    </Link>
                                                    <Link
                                                        to="/staff-emergency-request"
                                                        className={getDropdownItemClass('/staff-emergency-request')}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                        <span>Hiến máu khẩn cấp</span>
                                                    </Link>
                                                </>
                                            )}

                                            <div className="border-t border-gray-100 mt-2 pt-2">
                                                <button
                                                    className="cursor-pointer w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                    onClick={handleLogout}
                                                >
                                                    <LogIn className="h-4 w-4 rotate-180" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="sm:hidden flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="h-5 w-5 text-gray-700" />
                                    ) : (
                                        <Menu className="h-5 w-5 text-gray-700" />
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="md:hidden fixed inset-x-0 top-16 lg:top-20 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl z-40 max-h-[calc(100vh-4rem)] overflow-y-auto animate-slideDown"
                >
                    <div className="px-4 py-4 space-y-2">
                        {isLoggedIn && (
                            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-md">
                                    {user?.avatar ? (
                                        <img
                                            src={getImageUrl(user.avatar)}
                                            alt={user?.first_name || 'Avatar'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-7 w-7 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-gray-900 truncate">
                                        {user?.last_name} {user?.first_name}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                        {user?.role === 1 ? 'Thành viên' : 'Nhân viên'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Link to="/" className={getMobileTabClass('/')}>
                            <span>Trang chủ</span>
                        </Link>
                        <Link to="/list-event" className={getMobileTabClass('/list-event')}>
                            <Heart className="w-5 h-5" />
                            <span>Sự kiện</span>
                        </Link>
                        <Link to="/list-emergency-request" className={getMobileTabClass('/list-emergency-request')}>
                            <Clock className="w-5 h-5" />
                            <span>Khẩn cấp</span>
                        </Link>

                        {user?.role === 1 && (
                            <Link to="/reward-category" className={getMobileTabClass('/reward-category')}>
                                <Award className="w-5 h-5" />
                                <span>Đổi thưởng</span>
                            </Link>
                        )}

                        {isLoggedIn && (
                            <>
                                <div className="border-t border-gray-200 my-3"></div>
                                <Link to="/profile" className={getMobileTabClass('/profile')}>
                                    <User className="w-5 h-5" />
                                    <span>Thông tin cá nhân</span>
                                </Link>
                                {user?.role === 1 && (
                                    <>
                                        <Link to="/reward-history" className={getMobileTabClass('/reward-history')}>
                                            <Award className="w-5 h-5" />
                                            <span>Lịch sử đổi quà</span>
                                        </Link>
                                        <Link to="/friend-list" className={getMobileTabClass('/friend-list')}>
                                            <Heart className="w-5 h-5" />
                                            <span>Danh sách bạn bè</span>
                                        </Link>
                                        <Link to="/event-registration" className={getMobileTabClass('/event-registration')}>
                                            <Clock className="w-5 h-5" />
                                            <span>Sự kiện đã đăng ký</span>
                                        </Link>
                                        <Link to="/emergency-response" className={getMobileTabClass('/emergency-response')}>
                                            <Shield className="w-5 h-5" />
                                            <span>Yêu cầu đã phản hồi</span>
                                        </Link>
                                    </>
                                )}
                                {user?.role === 2 && (
                                    <>
                                        <Link to="/staff-donation-event" className={getMobileTabClass('/staff-donation-event')}>
                                            <Heart className="w-5 h-5" />
                                            <span>Quản lý sự kiện</span>
                                        </Link>
                                        <Link to="/staff-emergency-request" className={getMobileTabClass('/staff-emergency-request')}>
                                            <Shield className="w-5 h-5" />
                                            <span>Hiến máu khẩn cấp</span>
                                        </Link>
                                    </>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl mt-3"
                                >
                                    <LogIn className="h-5 w-5 rotate-180" />
                                    <span>Đăng xuất</span>
                                </button>
                            </>
                        )}

                        {!isLoggedIn && (
                            <div className="space-y-3 pt-4">
                                <Link
                                    to="/login"
                                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl font-medium hover:from-red-100 hover:to-red-200 transition-all duration-300"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-md"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeInDown {
                    animation: fadeInDown 0.2s ease-out;
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </nav>
    );
};

export default Header;
