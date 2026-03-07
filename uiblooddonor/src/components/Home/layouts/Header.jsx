import { Droplet, LogIn, User, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from 'react';
import { UserContexts, UserDispatchContext } from '../../../configs/UserContexts';
import cookie from 'react-cookies';
import { getImageUrl } from '../../../utils/Image';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const user = useContext(UserContexts);
    const dispatch = useContext(UserDispatchContext);
    const navigate = useNavigate();
    const isLoggedIn = user !== null;

    const handleLogout = () => {
        cookie.remove("access_token", { path: "/" });
        cookie.remove("refresh_token", { path: "/" });
        dispatch({ type: "logout" });
        navigate("/");
        setIsDropdownOpen(false);
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

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-red-600 transition">Trang chủ</Link>
                        <Link to="/" className="text-gray-700 hover:text-red-600 transition">Về chúng tôi</Link>
                        <Link to="/" className="text-gray-700 hover:text-red-600 transition">Sự kiện</Link>
                        <Link to="/" className="text-gray-700 hover:text-red-600 transition">Tin tức</Link>
                        <Link to="/" className="text-gray-700 hover:text-red-600 transition">Liên hệ</Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {!isLoggedIn ? (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition px-4 py-2 rounded-full hover:bg-red-50"
                                >
                                    <span>Đăng nhập</span>
                                </Link>
                                <Link to="/register" className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition transform hover:scale-105">
                                    Đăng ký
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="relative">
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

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Thiết lập tài khoản
                                            </Link>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Thông tin hiến máu
                                            </Link>
                                            <Link
                                                to="/my-donations"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Lịch sử hiến máu
                                            </Link>
                                            <Link
                                                to="/my-events"
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