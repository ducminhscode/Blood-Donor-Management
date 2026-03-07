import { useState } from 'react';
import {
    User, Mail, Phone, MapPin, Calendar, Droplet, Award, Heart, Clock, Edit2, Save, X, ChevronRight, Activity, AlertCircle, CheckCircle, FileText, Settings, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContexts, UserDispatchContext } from '../../configs/UserContexts';
import cookie from 'react-cookies';

const PersonalInformation = () => {
  const user = useContext(UserContexts);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthDate: user?.birthDate || '',
    bloodType: user?.bloodType || '',
    gender: user?.gender || ''
  });

  // Mock data for donation history
  const donationHistory = [
    { id: 1, date: '15/12/2024', location: 'Bệnh viện Chợ Rẫy', amount: '350ml', status: 'completed' },
    { id: 2, date: '20/10/2024', location: 'Trung tâm hiến máu nhân đạo', amount: '350ml', status: 'completed' },
    { id: 3, date: '05/08/2024', location: 'Bệnh viện Đại học Y Dược', amount: '350ml', status: 'completed' }
  ];

  const upcomingEvents = [
    { id: 1, date: '25/12/2024', location: 'Bệnh viện Chợ Rẫy', time: '08:00 - 11:30', status: 'registered' },
    { id: 2, date: '05/01/2025', location: 'Trung tâm hiến máu Quận 1', time: '13:30 - 16:00', status: 'pending' }
  ];

  const achievements = [
    { id: 1, title: 'Hiến máu lần đầu', date: '15/12/2023', icon: '🎉' },
    { id: 2, title: '3 lần hiến máu', date: '20/10/2024', icon: '🥉' },
    { id: 3, title: 'Tình nguyện viên tích cực', date: '05/08/2024', icon: '⭐' }
  ];

  const handleLogout = () => {
    cookie.remove('access_token');
    cookie.remove('refresh_token');
    dispatch({
      type: 'logout'
    });
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // API call to update profile
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      birthDate: user?.birthDate || '',
      bloodType: user?.bloodType || '',
      gender: user?.gender || ''
    });
    setIsEditing(false);
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: User },
    { id: 'history', label: 'Lịch sử hiến máu', icon: Clock },
    { id: 'achievements', label: 'Thành tích', icon: Award },
    { id: 'settings', label: 'Cài đặt', icon: Settings }
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with cover image */}
      <div className="relative h-48 bg-gradient-to-r from-red-600 to-red-400">
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Info Card */}
        <div className="relative -mt-24 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-red-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-red-600" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {user.fullName || 'Người dùng'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Droplet className="w-4 h-4" />
                        Nhóm máu: {user.bloodType || 'Chưa cập nhật'}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Đã hiến {donationHistory.length} lần
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{donationHistory.length}</div>
                      <div className="text-sm text-gray-500">Lần hiến</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">1.05L</div>
                      <div className="text-sm text-gray-500">Tổng lượng máu</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{achievements.length}</div>
                      <div className="text-sm text-gray-500">Thành tích</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto mt-6 border-t pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Save className="w-4 h-4" />
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      <X className="w-4 h-4" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-600" />
                    Thông tin cơ bản
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={editForm.fullName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giới tính
                        </label>
                        <select
                          name="gender"
                          value={editForm.gender}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          name="birthDate"
                          value={editForm.birthDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhóm máu
                        </label>
                        <select
                          name="bloodType"
                          value={editForm.bloodType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Chọn nhóm máu</option>
                          {bloodTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.fullName || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.birthDate || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Droplet className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.bloodType || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-red-600" />
                    Thông tin liên hệ
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Địa chỉ
                        </label>
                        <textarea
                          name="address"
                          value={editForm.address}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.email || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{user.address || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-600" />
                  Thông tin sức khỏe
                </h3>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">Đủ điều kiện hiến máu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm text-gray-700">Còn 25 ngày đến lần hiến tiếp theo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Lịch sử hiến máu</h2>
              
              <div className="space-y-4">
                {donationHistory.map((donation) => (
                  <div key={donation.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                          <Droplet className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{donation.location}</span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              Hoàn thành
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {donation.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Droplet className="w-4 h-4" />
                              {donation.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        to={`/donation/${donation.id}`}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Xem chi tiết
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Lịch hiến máu sắp tới</h3>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-lg">
                              <Calendar className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{event.location}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  event.status === 'registered' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {event.status === 'registered' ? 'Đã đăng ký' : 'Chờ xác nhận'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {event.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {event.time}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Hủy đăng ký
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Thành tích & Danh hiệu</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4 text-center hover:shadow-md transition">
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-500">{achievement.date}</p>
                  </div>
                ))}
              </div>

              {/* Progress to next achievement */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Tiến độ thành tích tiếp theo</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hiến máu 5 lần</span>
                      <span>{donationHistory.length}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(donationHistory.length / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hiến máu 10 lần</span>
                      <span>{donationHistory.length}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(donationHistory.length / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Cài đặt tài khoản</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Bảo mật</h3>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Đổi mật khẩu
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Thông báo</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Nhận thông báo về sự kiện hiến máu</span>
                      <input type="checkbox" className="rounded text-red-600" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Nhận thông báo qua email</span>
                      <input type="checkbox" className="rounded text-red-600" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Nhận thông báo qua SMS</span>
                      <input type="checkbox" className="rounded text-red-600" />
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Quyền riêng tư</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Hiển thị thông tin cá nhân</span>
                      <input type="checkbox" className="rounded text-red-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Chia sẻ lịch sử hiến máu</span>
                      <input type="checkbox" className="rounded text-red-600" />
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <h3 className="font-semibold text-red-700 mb-2">Nguy hiểm</h3>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;