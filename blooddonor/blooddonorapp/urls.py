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

urlpatterns = [
    path('', include(router.urls))
]
