from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction

# Create your views here.
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import random

from blooddonor import settings
from .models import Account, Role, Donor, Staff, DonationEvent, Hospital, EmergencyRequest
from .permissions import OwnerPermission, StaffPermission, OwnedStaffPermission, OwnedDonorPermission
from .serializers import AccountSerializer, ResetPasswordSerializer, \
    ChangePasswordSerializer, ProfileUpdateSerializer, DonorSerializer, StaffSerializer, DonationEventSerializer, \
    HospitalSerializer, EmergencyRequestSerializer


class AccountViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action in ['forgot_password', 'reset_password', 'verify_otp']:
            return [AllowAny()]
        if self.action in ['get_current_user', 'change_password', 'profile-update']:
            return [OwnerPermission()]
        return [IsAuthenticated()]

    @action(methods=['patch'], url_path='profile-update', detail=False)
    def profile_update(self, request):
        user = request.user
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['patch'], url_path='change-password', detail=False)
    def change_password(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save(update_fields=['password'])

            return Response({"message": "Mật khẩu đã được thay đổi thành công."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], url_path='current', detail=False)
    def get_current_user(self, request):
        user = request.user
        serializer = AccountSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='forgot-password', detail=False)
    def forgot_password(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)

        if not Account.objects.filter(email=email).exists():
            return Response({"error": "Email không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        otp = f"{random.randint(100000, 999999)}"
        cache_key = f"reset_password_{email}"

        cache.set(
            cache_key,
            {"otp": otp},
            timeout=300
        )

        send_mail(
            subject="Mã OTP đặt lại mật khẩu",
            message=f"Mã OTP reset mật khẩu của bạn là: {otp}. Có hiệu lực 5 phút.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({"message": "OTP đã được gửi qua email"}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='reset-password', detail=False)
    def reset_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        cache_key = f"reset_password_{email}"
        cached_data = cache.get(cache_key)

        if not cached_data:
            return Response({"error": "OTP hết hạn hoặc không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        if cached_data['otp'] != otp:
            return Response({"error": "OTP không đúng"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            acc = Account.objects.get(email=email)
        except Account.DoesNotExist:
            return Response({"error": "Tài khoản không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        acc.set_password(new_password)
        acc.save()

        cache.delete(cache_key)

        return Response({"message": "Đặt lại mật khẩu thành công"}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='verify-otp', detail=False)
    def verify_otp(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        donor_key = f"register_donor_{email}"
        staff_key = f"register_staff_{email}"

        cached_data = cache.get(donor_key)
        role = Role.DONOR.value
        cache_key = donor_key
        is_staff_register = False

        if not cached_data:
            cached_data = cache.get(staff_key)
            role = Role.STAFF.value
            cache_key = staff_key
            is_staff_register = True

        if not cached_data:
            return Response({"error": "OTP hết hạn hoặc không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        if cached_data['otp'] != otp:
            return Response({"error": "OTP không đúng"}, status=status.HTTP_400_BAD_REQUEST)

        data = cached_data['data']
        account_data = data.pop('account')
        try:
            with transaction.atomic():
                account = Account.objects.create_user(**account_data, role=role, is_active=not is_staff_register)

                if role == Role.DONOR.value:
                    Donor.objects.create(account=account, **data)
                else:
                    Staff.objects.create(account=account, **data, is_active=False)

                cache.delete(cache_key)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AccountSerializer(account).data, status=status.HTTP_201_CREATED)


class RegistrationViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(methods=['post'], url_path='donor', detail=False)
    def donor(self, request):
        serializer = DonorSerializer(data=request.data)
        if serializer.is_valid():
            account_data = serializer.validated_data['account']
            email = account_data['email']
            otp = f"{random.randint(100000, 999999)}"

            cache.set(
                f"register_donor_{email}",
                {
                    "data": serializer.validated_data,
                    "otp": otp
                },
                timeout=300)

            send_mail(
                subject="Mã OTP xác thực",
                message=f"Mã OTP của bạn là: {otp}. Mã này có hiệu lực trong 5 phút.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({
                "message": "OTP đã được gửi qua email",
                "email": email,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], url_path='staff', detail=False)
    def staff(self, request):
        serializer = StaffSerializer(data=request.data)
        if serializer.is_valid():
            account_data = serializer.validated_data['account']
            email = account_data['email']
            otp = f"{random.randint(100000, 999999)}"

            cache.set(
                f"register_staff_{email}",
                {
                    "data": serializer.validated_data,
                    "otp": otp
                },
                timeout=300)

            send_mail(
                subject="Mã OTP xác thực",
                message=f"Mã OTP của bạn là: {otp}. Mã này có hiệu lực trong 5 phút.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({
                "message": "OTP đã được gửi qua email",
                "email": email,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DonorViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Donor.objects.filter(is_active=True)
    serializer_class = DonorSerializer

    def get_permissions(self):
        if self.action in ['donor_update']:
            return [OwnedDonorPermission()]
        return super().get_permissions()

    @action(methods=['patch'], url_path='donor-update', detail=False)
    def donor_update(self, request):
        donor = request.user.donor
        serializer = DonorSerializer(donor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer

    def get_permissions(self):
        if self.action in ['staff_update']:
            return [OwnedStaffPermission()]
        return super().get_permissions()

    @action(methods=['patch'], url_path='staff-update', detail=False)
    def staff_update(self, request):
        staff = request.user.staff
        serializer = StaffSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DonationEventViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = DonationEvent.objects.filter(is_active=True, is_expire=False)
    serializer_class = DonationEventSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [StaffPermission()]
        if self.action in ['update', 'destroy']:
            return [OwnedStaffPermission()]
        return super().get_permissions()

    def create(self, request):
        serializer = DonationEventSerializer(data=request.data)
        if serializer.is_valid():
            donation_event = DonationEvent.objects.create(**serializer.validated_data, staff=request.user.staff)
            return Response(DonationEventSerializer(donation_event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        donation_event = get_object_or_404(DonationEvent, pk=pk, is_active=True)
        serializer = DonationEventSerializer(donation_event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        donation_event = get_object_or_404(DonationEvent, pk=pk, is_active=True)
        donation_event.is_active = False
        donation_event.save(update_fields=["is_active"])
        return Response({"message": "Xoá thành công"}, status=status.HTTP_204_NO_CONTENT)


class HospitalViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer


class EmergencyRequestViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = EmergencyRequest.objects.filter(is_active=True, is_expire=False)
    serializer_class = EmergencyRequestSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [StaffPermission()]
        if self.action in ['update', 'destroy']:
            return [OwnedStaffPermission()]
        return super().get_permissions()

    def create(self, request):
        serializer = EmergencyRequestSerializer(data=request.data)
        if serializer.is_valid():
            emergency_request = EmergencyRequest.objects.create(**serializer.validated_data, staff=request.user.staff)
            return Response(EmergencyRequestSerializer(emergency_request).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, is_active=True)
        serializer = EmergencyRequestSerializer(emergency_request, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, is_active=True)
        emergency_request.is_active = False
        emergency_request.save(update_fields=["is_active"])
        return Response({"message": "Xoá thành công"}, status=status.HTTP_204_NO_CONTENT)
