import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./components/Home/Home";
import Login from "./components/User/Login";
import Profile from "./components/User/Profile";
import { useEffect, useReducer, useState } from "react";
import { authApis, endpoints } from "./configs/APIs";
import { UserContexts, UserDispatchContext } from "./configs/UserContexts";
import cookie from 'react-cookies';
import MyUserReducer from "./configs/UserReducers";
import Header from "./components/Home/layouts/Header";
import Footer from "./components/Home/layouts/Footer";
import Register from "./components/User/Register";
import VerifyOTP from "./components/User/VerifyOTP";
import ForgotPassword from "./components/User/ForgotPassword";
import EventList from "./components/DonationEvent/EventList";
import Category from "./components/Reward/Category";
import Reward from "./components/Reward/Reward";
import RewardDetail from "./components/Reward/RewardDetail";
import FriendList from "./components/User/Friend/FriendList";
import PendingList from "./components/User/Friend/PendingList";
import DonorList from "./components/User/Friend/DonorList";
import EventDetail from "./components/DonationEvent/EventDetail";
import RewardHistory from "./components/Reward/RewardHistory";
import EventRegistration from "./components/DonationEvent/EventRegistration";
import EventRegistrationDetail from "./components/DonationEvent/EventRegistrationDetail";
import StaffEventList from "./components/DonationEvent/StaffEventList";
import StaffEventListDetail from "./components/DonationEvent/StaffEventListDetail";
import StaffRegistrationDetail from "./components/DonationEvent/StaffRegistrationDetail";
import StaffEmergencyRequest from "./components/DonationEvent/StaffEmergencyRequest";
import StaffEmergencyRequestDetail from "./components/DonationEvent/StaffEmergencyRequestDetail";
import EmergencyRequestList from "./components/DonationEvent/EmergencyRequestList";
import EmergencyRequestDetail from "./components/DonationEvent/EmergencyRequestDetail";
import EmergencyResponse from "./components/DonationEvent/EmergencyResponse";
import EmergencyResponseDetail from "./components/DonationEvent/EmergencyResponseDetail";
import EventMedicalCheckUpDetail from "./components/DonationEvent/EventMedicalCheckUpDetail";
import EventBloodDonationDetail from "./components/DonationEvent/EventBloodDonationDetail";
import EmergencyMedicalCheckUpDetail from "./components/DonationEvent/EmergencyMedicalCheckUpDetail";
import EmergencyBloodDonationDetail from "./components/DonationEvent/EmergencyBloodDonationDetail";
import StaffResponseDetail from "./components/DonationEvent/StaffResponseDetail";
import StaffEventMedicalCheckUpDetail from "./components/DonationEvent/StaffEventMedicalCheckUpDetail";
import StaffEventBloodDonationDetail from "./components/DonationEvent/StaffEventBloodDonationDetail";
import StaffEmergencyMedicalCheckUpDetail from "./components/DonationEvent/StaffEmergencyMedicalCheckUpDetail";
import StaffEmergencyBloodDonationDetail from "./components/DonationEvent/StaffEmergencyBloodDonationDetail";
import ChatBox from "./components/User/ChatBox/ChatBox";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "blood-donor-theme";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const token = cookie.load("access_token");
    if (token) {
      authApis().get(endpoints['current_user'])
        .then(res => {
          dispatch({
            type: 'login',
            payload: res.data,
          });
        })
        .catch(err => {
          console.error('Failed to load user data:', err);
          cookie.remove('access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <UserContexts.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <ScrollToTop />
          <button
            type="button"
            onClick={toggleTheme}
            className="cursor-pointer fixed bottom-6 left-6 z-[9999] inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/85 px-4 py-3 text-sm font-semibold text-gray-800 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark-theme-surface"
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5 text-amber-400" />
                <span>Sáng</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-slate-700" />
                <span>Tối</span>
              </>
            )}
          </button>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/list-event" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetail />} />

            <Route path="/list-emergency-request" element={<EmergencyRequestList />} />
            <Route path="/emergency-request/:id" element={<EmergencyRequestDetail />} />

            <Route path="*" element={
              <>
                {user && <Header />}
                <div>
                  <Routes>
                    <Route path="/profile" element={user ? <Profile /> : <Login />} />
                    <Route path="/friend-list" element={user ? (user.role === 1 && <FriendList />) : <Login />} />
                    <Route path="/pending-list" element={user ? (user.role === 1 && <PendingList />) : <Login />} />
                    <Route path="/search-donor" element={user ? (user.role === 1 && <DonorList />) : <Login />} />
                    <Route path="/reward-category" element={user ? (user.role === 1 && <Category />) : <Login />} />
                    <Route path="/reward-category/:id" element={user ? (user.role === 1 && <Reward />) : <Login />} />
                    <Route path="/reward-category/:id/reward/:reward_id" element={user ? (user.role === 1 && <RewardDetail />) : <Login />} />
                    <Route path="/reward-history" element={user ? (user.role === 1 && <RewardHistory />) : <Login />} />
                    <Route path="/event-registration" element={user ? (user.role === 1 && <EventRegistration />) : <Login />} />
                    <Route path="/event-registration/:id" element={user ? (user.role === 1 && <EventRegistrationDetail />) : <Login />} />
                    <Route path="/emergency-response" element={user ? (user.role === 1 && <EmergencyResponse />) : <Login />} />
                    <Route path="/emergency-response/:id" element={user ? (user.role === 1 && <EmergencyResponseDetail />) : <Login />} />
                    <Route path="/event/:id/registrations/:registration_id/medical-checkup" element={user ? <EventMedicalCheckUpDetail /> : <Login />} />
                    <Route path="/event/:id/registrations/:registration_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? <EventBloodDonationDetail /> : <Login />} />
                    <Route path="/emergency-request/:id/responses/:response_id/medical-checkup" element={user ? <EmergencyMedicalCheckUpDetail /> : <Login />} />
                    <Route path="/emergency-request/:id/responses/:response_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? <EmergencyBloodDonationDetail /> : <Login />} />
                    <Route path="/staff-donation-event" element={user ? (user.role === 2 && <StaffEventList />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations" element={user ? (user.role === 2 && <StaffEventListDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id" element={user ? (user.role === 2 && <StaffRegistrationDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id/medical-checkup" element={user ? (user.role === 2 && <StaffEventMedicalCheckUpDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? (user.role === 2 && <StaffEventBloodDonationDetail />) : <Login />} />
                    <Route path="/staff-emergency-request" element={user ? (user.role === 2 && <StaffEmergencyRequest />) : <Login />} />
                    <Route path="/staff-emergency-request/:id/responses" element={user ? (user.role === 2 && <StaffEmergencyRequestDetail />) : <Login />} />
                    <Route path="/staff-emergency-request/:id/responses/:response_id" element={user ? (user.role === 2 && <StaffResponseDetail />) : <Login />} />
                    <Route path="/staff-emergency-request/:id/responses/:response_id/medical-checkup" element={user ? (user.role === 2 && <StaffEmergencyMedicalCheckUpDetail />) : <Login />} />
                    <Route path="/staff-emergency-request/:id/responses/:response_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? (user.role === 2 && <StaffEmergencyBloodDonationDetail />) : <Login />} />
                    <Route path="/chat" element={user ? (user.role === 1 && <ChatBox />) : <Login />} />
                  </Routes>
                </div>
                {user && <Footer />}
              </>
            } />
          </Routes>
        </BrowserRouter>
      </UserDispatchContext.Provider>
    </UserContexts.Provider>
  );
}

export default App;

