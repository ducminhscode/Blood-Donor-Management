import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import MedicalCheckUpDetail from "./components/DonationEvent/MedicalCheckUpDetail";
import BloodDonationDetail from "./components/DonationEvent/BloodDonationDetail";
import StaffEventList from "./components/DonationEvent/StaffEventList";
import StaffEventListDetail from "./components/DonationEvent/StaffEventListDetail";
import StaffRegistrationDetail from "./components/DonationEvent/StaffRegistrationDetail";
import StaffMedicalCheckUpDetail from "./components/DonationEvent/StaffMedicalCheckUpDetail";
import StaffBloodDonationDetail from "./components/DonationEvent/StaffBloodDonationDetail";
import StaffEmergencyRequest from "./components/DonationEvent/StaffEmergencyRequest";
import StaffEmergencyRequestDetail from "./components/DonationEvent/StaffEmergencyRequestDetail";

function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div></div>;
  }

  return (
    <UserContexts.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/list-event" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetail />} />

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
                    <Route path="/event/:id/registrations/:registration_id/medical-checkup" element={user ? <MedicalCheckUpDetail /> : <Login />} />
                    <Route path="/event/:id/registrations/:registration_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? <BloodDonationDetail /> : <Login />} />
                    <Route path="/staff-donation-event" element={user ? (user.role === 2 && <StaffEventList />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations" element={user ? (user.role === 2 && <StaffEventListDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id" element={user ? (user.role === 2 && <StaffRegistrationDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id/medical-checkup" element={user ? (user.role === 2 && <StaffMedicalCheckUpDetail />) : <Login />} />
                    <Route path="/staff-donation-event/:id/registrations/:registration_id/medical-checkup/:medical_check_up_id/blood-donation" element={user ? (user.role === 2 && <StaffBloodDonationDetail />) : <Login />} />
                    <Route path="/staff-emergency-request" element={user ? (user.role === 2 && <StaffEmergencyRequest />) : <Login />} />
                    <Route path="/staff-emergency-request/:id/responses" element={user ? (user.role === 2 && <StaffEmergencyRequestDetail />) : <Login />} />
                    {/* <Route path="/list-event" element={user ? (user.role === 1 ? <ListEvent /> : <Navigate to="/" />) : <Navigate to="/" />} /> */}
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