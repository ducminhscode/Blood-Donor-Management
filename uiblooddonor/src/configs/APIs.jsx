import axios from "axios";
import cookie from 'react-cookies';

const BASE_URL = 'http://127.0.0.1:8000/';

export const endpoints = {
    'login': '/o/token/',
    'profile': '/account/profile-update/',
    'current_user': '/account/current/',
    'change_password': '/account/change-password/',
    'hospital': '/hospital/',
    'register_donor': '/register/donor/',
    'register_staff': '/register/staff/',
    'verify_otp': '/account/verify-otp/',
}

export const authApis = () => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            "Authorization": `Bearer ${cookie.load('access_token')}`,
            'Content-Type': 'application/json'
        }
    });
}

export default axios.create({
    baseURL: BASE_URL
});