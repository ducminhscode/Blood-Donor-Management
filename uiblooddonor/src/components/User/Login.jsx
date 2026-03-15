import { Link, useLocation, useNavigate } from "react-router-dom";
import { Droplet, Lock, Eye, EyeOff, ArrowLeft, User, ChevronLeft } from 'lucide-react';
import { useContext, useState } from 'react';
import { UserDispatchContext } from "../../configs/UserContexts";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import cookie from 'react-cookies';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state?.success || "";

  const clientId = import.meta.env.VITE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {

      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("client_id", clientId);
      formData.append("client_secret", clientSecret);
      formData.append("grant_type", "password");

      let tokenRes = await APIs.post(endpoints["login"], formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const cookieOptions = { path: "/", maxAge: rememberMe ? 24 * 60 * 60 : undefined };

      const accessToken = tokenRes.data.access_token;
      const refreshToken = tokenRes.data.refresh_token;

      cookie.save("access_token", accessToken, cookieOptions);
      cookie.save("refresh_token", refreshToken, cookieOptions);

      let userRes = await authApis().get(endpoints["current_user"]);

      dispatch({
        type: "login",
        payload: userRes.data,
      });

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sai tên đăng nhập hoặc mật khẩu.");
        } else {
          setError(err.response.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
      } else if (err.request) {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-red-600 transition mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Trang chủ
        </Link>

        <div className="text-center">
          <div className="flex justify-center">
            <Droplet className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
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
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Tên tài khoản"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                disabled={loading}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium">
              Quên mật khẩu?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-red-500 group relative w-full flex justify-center hover:from-red-700 hover:to-red-600 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition transform hover:scale-105 disabled:bg-red-400 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-red-600 hover:text-red-700 font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;