import { BrowserRouter, Route, Routes } from "react-router-dom";
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
            <Route path="*" element={
              <>
                {user && <Header />}
                <div>
                  <Routes>
                    <Route path="/profile" element={user ? <Profile /> : <Login />} />
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