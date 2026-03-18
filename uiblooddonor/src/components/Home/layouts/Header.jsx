import { Droplet, LogIn, User, ChevronDown, Menu, X } from 'lucide-react';
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
        const baseClass = "transition px-4 py-2 rounded-full";
        return isActiveTab(path)
            ? `${baseClass} bg-red-100 text-red-600 font-medium`
            : `${baseClass} text-gray-700 hover:text-red-600 hover:bg-red-50`;
    };

    const getMobileTabClass = (path) => {
        const baseClass = "block px-4 py-3 text-base font-medium transition";
        return isActiveTab(path)
            ? `${baseClass} bg-red-50 text-red-600 border-l-4 border-red-600`
            : `${baseClass} text-gray-700 hover:bg-red-50 hover:text-red-600`;
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                        <Droplet className="h-8 w-8 text-red-600" />
                        <Link to="/" className="font-bold text-xl text-gray-800 truncate max-w-[180px] sm:max-w-none">
                            Dòng Máu Lạc Hồng
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-2">
                        <Link to="/" className={getTabClass('/')}>Trang chủ</Link>
                        <Link to="/list-event" className={getTabClass('/list-event')}>Sự kiện</Link>
                        {user?.role === 1 && (
                            <Link to="/reward-category" className={getTabClass('/reward-category')}>Đổi thưởng</Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {!isLoggedIn ? (
                            <>
                                <div className="hidden sm:flex items-center space-x-2">
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-red-600 transition px-4 py-2 rounded-full hover:bg-red-50"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-red-600 transition transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                                <Link
                                    to="/login"
                                    className="sm:hidden flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                                >
                                    <LogIn className="h-5 w-5" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="hidden sm:block relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full pl-3 pr-4 py-2 transition"
                                    >
                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {user?.avatar ? (
                                                <img
                                                    src={getImageUrl(user.avatar)}
                                                    alt={user?.first_name || 'Avatar'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<svg class="h-5 w-5 text-white" ...>';
                                                    }}
                                                />
                                            ) : (
                                                <User className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <span className="text-gray-700 font-medium max-w-[100px] truncate">
                                            {user?.first_name || 'Người dùng'}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Thông tin cá nhân
                                            </Link>
                                            <Link
                                                to="/reward-history"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Lịch sử đổi quà
                                            </Link>
                                            {user?.role === 1 && (
                                                <Link
                                                    to="/friend-list"
                                                    className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    Danh sách bạn bè
                                                </Link>
                                            )}
                                            <Link
                                                to="/registered-events"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Sự kiện đã đăng ký
                                            </Link>
                                            <hr className="my-2 border-gray-100" />
                                            <button
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={handleLogout}
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="sm:hidden flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition"
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
                    className="md:hidden fixed inset-x-0 top-16 bg-white border-t border-gray-200 shadow-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto"
                >
                    <div className="px-4 py-3 space-y-1">
                        {isLoggedIn && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2">
                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {user?.avatar ? (
                                        <img
                                            src={getImageUrl(user.avatar)}
                                            alt={user?.first_name || 'Avatar'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.last_name} {user?.first_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        )}

                        <Link to="/" className={getMobileTabClass('/')}>Trang chủ</Link>
                        <Link to="/list-event" className={getMobileTabClass('/list-event')}>Sự kiện</Link>
                        
                        {user?.role === 1 && (
                            <Link to="/reward-category" className={getMobileTabClass('/reward-category')}>Đổi thưởng</Link>
                        )}

                        {isLoggedIn && (
                            <>
                                <div className="border-t border-gray-200 my-2"></div>
                                <Link to="/profile" className={getMobileTabClass('/profile')}>Thông tin cá nhân</Link>
                                <Link to="/reward-history" className={getMobileTabClass('/reward-history')}>Lịch sử đổi quà</Link>
                                {user?.role === 1 && (
                                    <Link to="/friend-list" className={getMobileTabClass('/friend-list')}>Danh sách bạn bè</Link>
                                )}
                                <Link to="/registered-events" className={getMobileTabClass('/registered-events')}>Sự kiện đã đăng ký</Link>
                                
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 transition border-t border-gray-200 mt-2"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        )}

                        {!isLoggedIn && (
                            <div className="space-y-2 pt-2">
                                <Link
                                    to="/login"
                                    className="block w-full text-center px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-600 transition"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Header;