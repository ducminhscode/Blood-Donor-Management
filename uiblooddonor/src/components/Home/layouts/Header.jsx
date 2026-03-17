import { Droplet, LogIn, User, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useRef, useEffect } from 'react';
import { UserContexts, UserDispatchContext } from '../../../configs/UserContexts';
import cookie from 'react-cookies';
import { getImageUrl } from '../../../utils/Image';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = user !== null;

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        cookie.remove("access_token", { path: "/" });
        cookie.remove("refresh_token", { path: "/" });
        dispatch({ type: "logout" });
        navigate("/");
        setIsDropdownOpen(false);
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

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                        <Droplet className="h-8 w-8 text-red-600" />
                        <Link to="/" className="font-bold text-xl text-gray-800">
                            Dòng Máu Lạc Hồng
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-2">
                        <Link
                            to="/"
                            className={getTabClass('/')}
                        >
                            Trang chủ
                        </Link>
                        <Link
                            to="/list-event"
                            className={getTabClass('/list-event')}
                        >
                            Sự kiện
                        </Link>

                        {user?.role === 1 && (
                            <Link
                                to="/reward-category"
                                className={getTabClass('/reward-category')}
                            >
                                Đổi thưởng
                            </Link>
                        )}

                    </div>

                    <div className="flex items-center space-x-4">
                        {!isLoggedIn ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full pl-3 pr-4 py-2 transition"
                                    >
                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center overflow-hidden">
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
                                        <span className="text-gray-700 font-medium">{user?.first_name || 'Người dùng'}</span>
                                        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                                                onClick={() => { handleLogout(); }}
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;