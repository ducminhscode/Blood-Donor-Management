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
            <Route path="/reward-category" element={<Category />} />
            <Route path="/reward-category/:id" element={<Reward />} />
            <Route path="/reward-category/:id/reward/:reward_id" element={<RewardDetail />} />

            <Route path="*" element={
              <>
                {user && <Header />}
                <div>
                  <Routes>
                    <Route path="/profile" element={user ? <Profile /> : <Login />} />
                    <Route path="/friend-list" element={user ? (user.role === 1 && <FriendList />) : <Login />}/>
                    <Route path="/pending-list" element={user ? (user.role === 1 && <PendingList />) : <Login />}/>
                    <Route path="/search-donor" element={user ? (user.role === 1 && <DonorList />) : <Login />}/>
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