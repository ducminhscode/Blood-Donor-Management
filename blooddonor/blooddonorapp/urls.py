from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()

router.register('account', views.AccountViewSet, basename='account')
router.register('register', views.RegistrationViewSet, basename='register')
router.register('donation-event', views.DonationEventViewSet, basename='donation-event')
router.register('emergency-request', views.EmergencyRequestViewSet, basename='emergency-request')
router.register('donor', views.DonorViewSet, basename='donor')
router.register('staff', views.StaffViewSet, basename='staff')
router.register('hospital', views.HospitalViewSet, basename='hospital')
router.register('reward-category', views.RewardCategoryViewSet, basename='reward-category')
router.register('reward', views.RewardViewSet, basename='reward')
router.register('reward-history', views.RewardHistoryViewSet, basename='reward-history')
router.register('event-registration', views.EventRegistrationViewSet, basename='event-registration')
router.register('emergency-response', views.EmergencyResponseViewSet, basename='emergency-response')

urlpatterns = [
    path('', include(router.urls))
]
