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
    'forgot_password': '/account/forgot-password/',
    'reset_password': '/account/reset-password/',
    'donation_event': '/donation-event/',
    'donation_event_detail': '/donation-event/${id}/',
    'donation_register': '/donation-event/${id}/register/',
    'donor_me': '/donor/me/',
    'staff_me': '/staff/me/',
    'donor_update': '/donor/update/',
    'staff_update': '/staff/update/',
    'reward_category': '/reward-category/',
    'reward_by_category': '/reward-category/${id}/reward/',
    'reward_detail': '/reward-category/${id}/reward/${reward_id}/',
    'redeem_reward': '/reward/${id}/redeem/',
    'friend_list': '/donor/friend-list/',
    'pending_list': '/donor/pending-list/',
    'accept_friend': '/donor/${id}/accept-friend/',
    'reject_friend': '/donor/${id}/reject-friend/',
    'request_friend': '/donor/${id}/request-friend/',
    'unfriend': '/donor/${id}/unfriend/',
    'cancel_request': '/donor/${id}/cancel-request/',
    'friend_status': '/donor/friend-status/',
    'donor_detail': '/donor/${id}/',
    'donor': '/donor/',
    'reward': '/reward/',
    'reward_history': '/reward-history/',
    'reward_history_detail': '/reward-history/${id}/',
    'event_registration': '/event-registration/',
    'event_registration_detail': '/event-registration/${id}',
    'donation_medical_checkup': '/donation-event/${id}/registrations/${registration_id}/medical-checkup/',
    'donation_blood_donation': '/donation-event/${id}/registrations/${registration_id}/medical-checkup/${medical_check_up_id}/blood-donation/',
    'staff_donation_event': '/staff/donation-event/',
    'staff_donation_event_detail': '/donation-event/${id}/staff/',
    'staff_registrations_event': '/donation-event/${id}/registrations/',
    'staff_registrations_event_detail': '/donation-event/${id}/registrations/${registration_id}/',
    'staff_emergency_request': '/staff/emergency-request/',
    'emergency_request': '/emergency-request/',
    'staff_emergency_request_detail': '/emergency-request/${id}/staff/',
    'staff_responses_request': '/emergency-request/${id}/responses/',
    'staff_responses_request_detail': '/emergency-request/${id}/responses/${response_id}/',
    'emergency_response': '/emergency-request/${id}/response/',
    'emergency_request_detail': '/emergency-request/${id}/',
    'emergency_responses': '/emergency-response/',
    'emergency_responses_detail': '/emergency-response/${id}/',
    'emergency_medical_checkup': '/emergency-request/${id}/responses/${response_id}/medical-checkup/',
    'emergency_blood_donation': '/emergency-request/${id}/responses/${response_id}/medical-checkup/${medical_check_up_id}/blood-donation/',
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