from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

# Create your views here.
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import OR
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import random

from blooddonor import settings
from .models import Account, Role, Donor, Staff, DonationEvent, Hospital, EmergencyRequest, Friend, FriendStatus, \
    RewardCategory, Reward, RewardHistory, ResponseStatus, EmergencyResponse, EventRegistration, RegistrationStatus, \
    MedicalCheckUp, BloodDonation
from .permissions import OwnerPermission, StaffPermission, OwnedStaffPermission, OwnedDonorPermission, DonorPermission
from .serializers import AccountSerializer, ResetPasswordSerializer, \
    ChangePasswordSerializer, ProfileUpdateSerializer, DonorSerializer, StaffSerializer, DonationEventSerializer, \
    HospitalSerializer, EmergencyRequestSerializer, RewardCategorySerializer, RewardSerializer, \
    FriendSerializer, RecipientInformationSerializer, RewardHistorySerializer, EmergencyResponseSerializer, \
    EventRegistrationSerializer, MedicalCheckUpSerializer, BloodDonationSerializer


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
        if self.action in ['request_friend', 'accept_friend', 'reject_friend', 'pending_list', 'friend_list',
                           'unfriend']:
            return [DonorPermission()]
        return [IsAuthenticated()]

    @action(methods=['patch'], url_path='donor-update', detail=False)
    def donor_update(self, request):
        donor = request.user.donor
        serializer = DonorSerializer(donor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], url_path='request-friend', detail=True)
    def request_friend(self, request, pk=None):
        requester = request.user.donor
        addressee_id = pk

        try:
            addressee_id = int(addressee_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid donor_id"}, status=status.HTTP_400_BAD_REQUEST)

        if requester.id == addressee_id:
            return Response({"error": "Can't be friend with yourself"}, status=status.HTTP_400_BAD_REQUEST)

        addressee = get_object_or_404(Donor, id=addressee_id, is_active=True)

        if Friend.objects.filter(requester=requester, addressee=addressee).exists():
            return Response({"error": "Already sent friend request"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            friend_request = Friend.objects.create(
                requester=requester,
                addressee=addressee,
                status=FriendStatus.ADD_FRIEND.value
            )
            Friend.objects.create(
                requester=addressee,
                addressee=requester,
                status=FriendStatus.PENDING.value
            )
        return Response(FriendSerializer(friend_request).data, status=status.HTTP_201_CREATED)

    @action(methods=['post'], url_path='accept-friend', detail=True)
    def accept_friend(self, request, pk=None):
        donor = request.user.donor
        requester_id = pk

        try:
            requester_id = int(requester_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid donor_id"}, status=status.HTTP_400_BAD_REQUEST)

        if donor.id == requester_id:
            return Response({"error": "Can't accept yourself"}, status=status.HTTP_400_BAD_REQUEST)

        friend = get_object_or_404(
            Friend,
            requester_id=requester_id,
            addressee=donor,
            status=FriendStatus.ADD_FRIEND.value
        )

        with transaction.atomic():
            Friend.objects.filter(
                requester=friend.requester,
                addressee=friend.addressee
            ).update(status=FriendStatus.BEFRIEND.value)

            Friend.objects.filter(
                requester=friend.addressee,
                addressee=friend.requester
            ).update(status=FriendStatus.BEFRIEND.value)

            friend.refresh_from_db()

        return Response(FriendSerializer(friend).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='reject-friend', detail=True)
    def reject_friend(self, request, pk=None):
        donor = request.user.donor
        requester_id = pk

        try:
            requester_id = int(requester_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid donor_id"}, status=status.HTTP_400_BAD_REQUEST)

        if donor.id == requester_id:
            return Response({"error": "Can't reject yourself"}, status=status.HTTP_400_BAD_REQUEST)

        get_object_or_404(Friend, requester_id=requester_id, addressee=donor)

        with transaction.atomic():
            Friend.objects.filter(
                requester_id=requester_id,
                addressee=donor
            ).delete()

            Friend.objects.filter(
                requester=donor,
                addressee_id=requester_id
            ).delete()

        return Response({"message": "Invitation refused"}, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='pending-list', detail=False)
    def pending_list(self, request):
        donor = request.user.donor

        pending = Friend.objects.filter(
            addressee=donor,
            status=FriendStatus.ADD_FRIEND.value
        ).select_related('requester')

        donors = [f.requester for f in pending]
        serializer = DonorSerializer(donors, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='friend-list', detail=False)
    def friend_list(self, request):
        donor = request.user.donor

        friends = Friend.objects.filter(
            requester=donor,
            status=FriendStatus.BEFRIEND.value
        ).select_related('addressee')

        donors = [f.addressee for f in friends]
        serializer = DonorSerializer(donors, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='unfriend', detail=True)
    def unfriend(self, request, pk=None):
        donor = request.user.donor
        friend_id = pk

        try:
            friend_id = int(friend_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid donor_id"}, status=status.HTTP_400_BAD_REQUEST)

        if donor.id == friend_id:
            return Response({"error": "Can't unfriend"}, status=status.HTTP_400_BAD_REQUEST)

        get_object_or_404(Friend, requester=donor, addressee_id=friend_id, status=FriendStatus.BEFRIEND.value)

        with transaction.atomic():
            Friend.objects.filter(
                requester=donor,
                addressee_id=friend_id,
                status=FriendStatus.BEFRIEND.value
            ).delete()

            Friend.objects.filter(
                requester_id=friend_id,
                addressee=donor,
                status=FriendStatus.BEFRIEND.value
            ).delete()

        return Response({"message": "Unfriended"}, status=status.HTTP_200_OK)


class StaffViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer

    def get_permissions(self):
        if self.action in ['staff_update']:
            return [OwnedStaffPermission()]
        if self.action in ['donation_event', 'emergency_request']:
            return [StaffPermission()]
        return [IsAuthenticated()]

    @action(methods=['patch'], url_path='staff-update', detail=False)
    def staff_update(self, request):
        staff = request.user.staff
        serializer = StaffSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], url_path='donation-event', detail=False)
    def donation_event(self, request):
        staff = request.user.staff
        events = DonationEvent.objects.filter(staff=staff, is_active=True).order_by('-created_at')
        serializer = DonationEventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='emergency-request', detail=False)
    def emergency_request(self, request):
        staff = request.user.staff
        emergency = EmergencyRequest.objects.filter(staff=staff, is_active=True).order_by('-created_at')
        serializer = EmergencyRequestSerializer(emergency, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DonationEventViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = DonationEvent.objects.filter(is_active=True, is_expire=False)
    serializer_class = DonationEventSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [StaffPermission()]
        if self.action in ['update', 'destroy', 'dnt_detail_staff', 'registrations', 'registration_detail',
                           'reject_registration', 'approve_registration']:
            return [OwnedStaffPermission()]
        if self.action in ['medical_checkup', 'blood_donation']:
            if self.request.method == 'GET':
                return [OR(OwnedStaffPermission(), OwnedDonorPermission())]
            return [OwnedStaffPermission()]
        if self.action in ['register', 'my_registrations', 'my_registration_detail']:
            return [DonorPermission()]
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

    @action(methods=['get'], url_path='staff', detail=True)
    def dnt_detail_staff(self, request, pk=None):
        staff = request.user.staff
        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        serializer = DonationEventSerializer(donation_event)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='register', detail=True)
    def register(self, request, pk=None):
        donor = request.user.donor
        donation_event = get_object_or_404(DonationEvent, pk=pk, is_active=True, is_expire=False)
        serializer = EventRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identification = serializer.validated_data.get('identification')
        phone = serializer.validated_data.get('phone')
        email = serializer.validated_data.get('email')
        is_proxy = serializer.validated_data.get('is_proxy', False)

        with transaction.atomic():
            if not is_proxy:
                exists = EventRegistration.objects.filter(
                    donor=donor,
                    donation_event=donation_event,
                    is_proxy=False
                ).exists()

                if exists:
                    return Response(
                        {"error": "Donor already registered for this event"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if EventRegistration.objects.filter(
                    donation_event=donation_event,
                    identification=identification
            ).exists():
                return Response(
                    {"error": "Identification already registered for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if EventRegistration.objects.filter(
                    donation_event=donation_event,
                    phone=phone
            ).exists():
                return Response(
                    {"error": "Phone number already registered for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if EventRegistration.objects.filter(donation_event=donation_event, email=email).exists():
                return Response(
                    {"error": "Email already registered for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            registration = EventRegistration.objects.create(
                donor=donor,
                donation_event=donation_event,
                **serializer.validated_data
            )

        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], url_path='registrations', detail=True)
    def registrations(self, request, pk=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registrations = EventRegistration.objects.filter(
            donation_event=donation_event,
            is_active=True
        ).order_by('-created_at')

        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path=r'registrations/(?P<registration_id>[^/.]+)', detail=True)
    def registration_detail(self, request, pk=None, registration_id=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        serializer = EventRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='my-registrations', detail=False)
    def my_registrations(self, request):
        donor = request.user.donor
        registrations = EventRegistration.objects.filter(
            donor=donor,
            is_active=True
        ).select_related('donation_event').order_by('-created_at')
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path=r'my-registrations/(?P<registration_id>[^/.]+)', detail=False)
    def my_registration_detail(self, request, registration_id=None):

        donor = request.user.donor

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donor=donor,
            is_active=True
        )

        serializer = EventRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='registrations/(?P<registration_id>[^/.]+)/reject', detail=True)
    def reject_registration(self, request, pk=None, registration_id=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        if registration.status == RegistrationStatus.COMPLETED.value:
            return Response(
                {"error": "Cannot reject a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.APPROVED.value:
            return Response(
                {"error": "Cannot reject a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.CHECKED_IN.value:
            return Response(
                {"error": "Cannot reject a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.REJECTED.value:
            return Response({"error": "Donor already rejected"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            registration.status = RegistrationStatus.REJECTED.value
            registration.save(update_fields=['status'])

        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='registrations/(?P<registration_id>[^/.]+)/approve', detail=True)
    def approve_registration(self, request, pk=None, registration_id=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        if registration.status == RegistrationStatus.COMPLETED.value:
            return Response(
                {"error": "Cannot approve a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.CHECKED_IN.value:
            return Response(
                {"error": "Cannot approve a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.REJECTED.value:
            return Response(
                {"error": "Cannot approve a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.APPROVED.value:
            return Response({"error": "Donor already approved"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            registration.status = RegistrationStatus.APPROVED.value
            registration.save(update_fields=['status'])

        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='registrations/(?P<registration_id>[^/.]+)/checkin', detail=True)
    def checkin_registration(self, request, pk=None, registration_id=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        if registration.status == RegistrationStatus.COMPLETED.value:
            return Response(
                {"error": "Cannot checkin a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.REJECTED.value:
            return Response(
                {"error": "Cannot checkin a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.REGISTERED.value:
            return Response(
                {"error": "Cannot checkin a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.CHECKED_IN.value:
            return Response({"error": "Donor already checked in"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            registration.status = RegistrationStatus.CHECKED_IN.value
            registration.save(update_fields=['status'])

        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='registrations/(?P<registration_id>[^/.]+)/complete', detail=True)
    def complete_registration(self, request, pk=None, registration_id=None):
        staff = request.user.staff

        donation_event = get_object_or_404(DonationEvent, pk=pk, staff=staff, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        if registration.status == RegistrationStatus.REGISTERED.value:
            return Response(
                {"error": "Cannot complete a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.REJECTED.value:
            return Response(
                {"error": "Cannot complete a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.APPROVED.value:
            return Response(
                {"error": "Cannot complete a completed registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.COMPLETED.value:
            return Response({"error": "Donor already completed"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            registration.status = RegistrationStatus.COMPLETED.value
            registration.save(update_fields=['status'])

            if not registration.is_proxy:
                donor = registration.donor

                medical_checkup = MedicalCheckUp.objects.filter(event_registration=registration, is_active=True).first()
                if medical_checkup:
                    height_m = donor.height / 100
                    bmi = round(donor.weight / (height_m * height_m), 2)

                    donor.weight = medical_checkup.weight
                    donor.height = medical_checkup.height
                    donor.bmi = bmi
                    donor.province = registration.province
                    donor.sub_district = registration.sub_district
                    donor.permanent_address = registration.permanent_address
                    donor.identification = registration.identification
                    donor.career = registration.career
                    donor.organization = registration.organization

                    blood_donation = BloodDonation.objects.filter(
                        medical_check_up=medical_checkup,
                        is_active=True
                    ).first()

                    if blood_donation:
                        donor.blood_type = blood_donation.blood_type
                        donor.rh_factor = blood_donation.rh_factor
                        donor.donation_count += 1
                        donor.last_donation = timezone.now()
                        donor.points += 100

                    donor.save()

        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_200_OK)

    @action(methods=['get', 'post', 'patch', 'delete'],
            url_path=r'registrations/(?P<registration_id>[^/.]+)/medical-checkup', detail=True)
    def medical_checkup(self, request, pk=None, registration_id=None):
        donation_event = get_object_or_404(DonationEvent, pk=pk, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        if request.method == 'GET':
            medical_checkup = get_object_or_404(MedicalCheckUp, event_registration=registration, is_active=True)

            return Response(MedicalCheckUpSerializer(medical_checkup).data, status=status.HTTP_200_OK)

        staff = request.user.staff

        if request.method == 'POST':

            if registration.status != RegistrationStatus.CHECKED_IN.value:
                return Response(
                    {"error": "Medical checkup only allowed for CHECKED_IN registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if MedicalCheckUp.objects.filter(event_registration=registration).exists():
                return Response(
                    {"error": "Medical checkup already exists for this registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = MedicalCheckUpSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                medical_checkup = serializer.save(event_registration=registration, staff=staff)

            return Response(MedicalCheckUpSerializer(medical_checkup).data, status=status.HTTP_201_CREATED)

        elif request.method == 'PATCH':

            medical_checkup = get_object_or_404(MedicalCheckUp, event_registration=registration, is_active=True)

            if registration.status == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = MedicalCheckUpSerializer(medical_checkup, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            medical_checkup = get_object_or_404(MedicalCheckUp, event_registration=registration, is_active=True)

            if registration.status == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot delete medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                medical_checkup.is_active = False
                medical_checkup.save(update_fields=['is_active'])

            return Response({"message": "Medical checkup deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(methods=['get', 'post', 'patch', 'delete'],
            url_path=r'registrations/(?P<registration_id>[^/.]+)/medical-checkup/(?P<medical_check_up_id>[^/.]+)/blood-donation',
            detail=True)
    def blood_donation(self, request, pk=None, registration_id=None, medical_check_up_id=None):

        donation_event = get_object_or_404(DonationEvent, pk=pk, is_active=True)

        registration = get_object_or_404(
            EventRegistration,
            pk=registration_id,
            donation_event=donation_event,
            is_active=True
        )

        medical_checkup = get_object_or_404(
            MedicalCheckUp,
            pk=medical_check_up_id,
            event_registration=registration,
            is_active=True
        )

        if request.method == 'GET':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)
            return Response(BloodDonationSerializer(blood_donation).data, status=status.HTTP_200_OK)

        staff = request.user.staff

        if request.method == 'POST':

            if not medical_checkup.is_eligible:
                return Response(
                    {"error": "Donor is not eligible for blood donation"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if BloodDonation.objects.filter(medical_check_up=medical_checkup).exists():
                return Response(
                    {"error": "Blood donation already exists for this medical checkup"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = BloodDonationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                blood_donation = serializer.save(medical_check_up=medical_checkup, staff=staff)

            return Response(BloodDonationSerializer(blood_donation).data, status=status.HTTP_201_CREATED)

        if request.method == 'PATCH':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)

            if registration.status == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = BloodDonationSerializer(blood_donation, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        if request.method == 'DELETE':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)

            if registration.status == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                blood_donation.is_active = False
                blood_donation.save(update_fields=['is_active'])

            return Response({"message": "Blood donation deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class HospitalViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer


class EmergencyRequestViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = EmergencyRequest.objects.filter(is_active=True, is_expire=False)
    serializer_class = EmergencyRequestSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [StaffPermission()]
        if self.action in ['update', 'destroy', 'emc_detail_staff', 'responses', 'response_detail', 'checkin_response',
                           'complete_response']:
            return [OwnedStaffPermission()]
        if self.action in ['medical_checkup', 'blood_donation']:
            if self.request.method == 'GET':
                return [OR(OwnedStaffPermission(), OwnedDonorPermission())]
            return [OwnedStaffPermission()]
        if self.action in ['response', 'my_responses', 'my_response_detail']:
            return [DonorPermission()]
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

    @action(methods=['get'], url_path='staff', detail=True)
    def emc_detail_staff(self, request, pk=None):
        staff = request.user.staff
        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, staff=staff, is_active=True)

        serializer = EmergencyRequestSerializer(emergency_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='response', detail=True)
    def response(self, request, pk=None):
        donor = request.user.donor
        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, is_active=True, is_expire=False)

        status_value = request.data.get('status_response')

        try:
            status_value = int(status_value)
        except (TypeError, ValueError):
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        if status_value not in [ResponseStatus.ACCEPTED.value, ResponseStatus.REJECTED.value]:
            return Response({"error": "Invalid response status"}, status=status.HTTP_400_BAD_REQUEST)

        if EmergencyResponse.objects.filter(emergency_request=emergency_request, donor=donor).exists():
            return Response(
                {"error": "You have already responded to this emergency request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            response_data = {
                "emergency_request": emergency_request,
                "donor": donor,
                "status_response": status_value
            }

            if status_value == ResponseStatus.ACCEPTED.value:
                response_data["status_registration"] = RegistrationStatus.APPROVED.value
            response_obj = EmergencyResponse.objects.create(**response_data)

        return Response(EmergencyResponseSerializer(response_obj).data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], url_path='responses', detail=True)
    def responses(self, request, pk=None):
        staff = request.user.staff

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, staff=staff, is_active=True)

        responses = EmergencyResponse.objects.filter(
            emergency_request=emergency_request,
            is_active=True
        )

        serializer = EmergencyResponseSerializer(responses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path=r'responses/(?P<response_id>[^/.]+)', detail=True)
    def response_detail(self, request, pk=None, response_id=None):
        staff = request.user.staff

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, staff=staff, is_active=True)

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            emergency_request=emergency_request,
            is_active=True
        )

        serializer = EmergencyResponseSerializer(response_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='my-responses', detail=False)
    def my_responses(self, request):
        donor = request.user.donor

        responses = EmergencyResponse.objects.filter(
            donor=donor,
            is_active=True
        ).select_related('emergency_request').order_by('-created_at')

        serializer = EmergencyResponseSerializer(responses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path=r'my-responses/(?P<response_id>[^/.]+)', detail=False)
    def my_response_detail(self, request, response_id=None):
        donor = request.user.donor

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            donor=donor,
            is_active=True
        )

        serializer = EmergencyResponseSerializer(response_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path=r'responses/(?P<response_id>[^/.]+)/checkin', detail=True)
    def checkin_response(self, request, pk=None, response_id=None):
        staff = request.user.staff

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, staff=staff, is_active=True)

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            emergency_request=emergency_request,
            is_active=True
        )

        if response_obj.status_response != ResponseStatus.ACCEPTED.value:
            return Response(
                {"error": "Donor has not accepted this emergency request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if response_obj.status_registration == RegistrationStatus.CHECKED_IN.value:
            return Response({"error": "Donor already checked in"}, status=status.HTTP_400_BAD_REQUEST)

        response_obj.status_registration = RegistrationStatus.CHECKED_IN.value
        response_obj.save(update_fields=['status_registration'])

        return Response(EmergencyResponseSerializer(response_obj).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path=r'responses/(?P<response_id>[^/.]+)/complete', detail=True)
    def complete_response(self, request, pk=None, response_id=None):
        staff = request.user.staff

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, staff=staff, is_active=True)

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            emergency_request=emergency_request,
            is_active=True
        )

        if response_obj.status_response != ResponseStatus.ACCEPTED.value:
            return Response(
                {"error": "Donor has not accepted this emergency request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if response_obj.status_registration == RegistrationStatus.COMPLETED.value:
            return Response({"error": "Donor already complete"}, status=status.HTTP_400_BAD_REQUEST)

        response_obj.status_registration = RegistrationStatus.COMPLETED.value
        response_obj.save(update_fields=['status_registration'])

        donor = response_obj.donor

        medical_checkup = MedicalCheckUp.objects.filter(emergency_response=response_obj, is_active=True).first()
        if medical_checkup:
            height_m = donor.height / 100
            bmi = round(donor.weight / (height_m * height_m), 2)

            donor.weight = medical_checkup.weight
            donor.height = medical_checkup.height
            donor.bmi = bmi

            blood_donation = BloodDonation.objects.filter(medical_check_up=medical_checkup, is_active=True).first()

            if blood_donation:
                donor.donation_count += 1
                donor.last_donation = timezone.now()
                donor.points += 200

            donor.save()

        return Response(EmergencyResponseSerializer(response_obj).data, status=status.HTTP_200_OK)

    @action(methods=['get', 'post', 'patch', 'delete'], url_path=r'responses/(?P<response_id>[^/.]+)/medical-checkup',
            detail=True)
    def medical_checkup(self, request, pk=None, response_id=None):

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, is_active=True)

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            emergency_request=emergency_request,
            is_active=True
        )

        if request.method == 'GET':
            medical_checkup = get_object_or_404(MedicalCheckUp, emergency_response=response_obj, is_active=True)

            return Response(MedicalCheckUpSerializer(medical_checkup).data, status=status.HTTP_200_OK)

        staff = request.user.staff

        if request.method == 'POST':

            if response_obj.status_registration != RegistrationStatus.CHECKED_IN.value:
                return Response({"error": "Donor has not checked in"}, status=status.HTTP_400_BAD_REQUEST)

            if MedicalCheckUp.objects.filter(emergency_request=emergency_request).exists():
                return Response(
                    {"error": "Medical checkup already exists for this registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = MedicalCheckUpSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                medical_checkup = serializer.save(emergency_response=response_obj, staff=staff)

            return Response(MedicalCheckUpSerializer(medical_checkup).data, status=status.HTTP_201_CREATED)

        elif request.method == 'PATCH':

            medical_checkup = get_object_or_404(MedicalCheckUp, emergency_response=response_obj, is_active=True)

            if response_obj.status_registration == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = MedicalCheckUpSerializer(medical_checkup, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            medical_checkup = get_object_or_404(MedicalCheckUp, emergency_response=response_obj, is_active=True)

            if response_obj.status == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot delete medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                medical_checkup.is_active = False
                medical_checkup.save(update_fields=['is_active'])

            return Response({"message": "Medical checkup deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(methods=['get', 'post', 'patch', 'delete'],
            url_path=r'responses/(?P<response_id>[^/.]+)/medical-checkup/(?P<medical_check_up_id>[^/.]+)/blood-donation',
            detail=True)
    def blood_donation(self, request, pk=None, response_id=None, medical_check_up_id=None):

        emergency_request = get_object_or_404(EmergencyRequest, pk=pk, is_active=True)

        response_obj = get_object_or_404(
            EmergencyResponse,
            pk=response_id,
            emergency_request=emergency_request,
            is_active=True
        )

        medical_checkup = get_object_or_404(
            MedicalCheckUp,
            pk=medical_check_up_id,
            emergency_response=response_obj,
            is_active=True
        )

        if request.method == 'GET':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)
            return Response(BloodDonationSerializer(blood_donation).data, status=status.HTTP_200_OK)

        staff = request.user.staff

        if request.method == 'POST':

            if not medical_checkup.is_eligible:
                return Response(
                    {"error": "Donor is not eligible for blood donation"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if BloodDonation.objects.filter(medical_check_up=medical_checkup).exists():
                return Response(
                    {"error": "Blood donation already exists for this medical checkup"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = BloodDonationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                blood_donation = serializer.save(medical_check_up=medical_checkup, staff=staff)

            return Response(BloodDonationSerializer(blood_donation).data, status=status.HTTP_201_CREATED)

        if request.method == 'PATCH':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)

            if response_obj.status_registration == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = BloodDonationSerializer(blood_donation, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        if request.method == 'DELETE':
            blood_donation = get_object_or_404(BloodDonation, medical_check_up=medical_checkup, is_active=True)

            if response_obj.status_registration == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot update medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                blood_donation.is_active = False
                blood_donation.save(update_fields=['is_active'])

            return Response({"message": "Blood donation deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class RewardCategoryViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = RewardCategory.objects.filter(is_active=True)
    serializer_class = RewardCategorySerializer

    @action(methods=['get'], url_path='reward', detail=True)
    def get_reward_by_category(self, request, pk=None):
        category = self.get_object()

        rewards = Reward.objects.filter(reward_category=category, is_active=True)

        serializer = RewardSerializer(rewards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='reward/(?P<reward_id>\d+)', detail=True)
    def get_reward_retrieve_by_category(self, request, pk=None, reward_id=None):
        category = self.get_object()

        reward = get_object_or_404(Reward, pk=reward_id, reward_category=category, is_active=True)

        serializer = RewardSerializer(reward)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RewardViewSet(viewsets.ViewSet):
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer

    def get_permissions(self):
        if self.action in ['redeem_reward']:
            return [DonorPermission()]
        return [IsAuthenticated()]

    @action(methods=['post'], url_path='redeem', detail=True)
    def redeem_reward(self, request, pk=None):
        donor = request.user.donor
        reward = get_object_or_404(Reward, pk=pk, is_active=True)

        if reward.remaining_stock <= 0:
            return Response({"error": "This reward is gone"}, status=status.HTTP_400_BAD_REQUEST)

        if donor.points < reward.points_required:
            return Response({"error": "Not enough points"}, status=status.HTTP_400_BAD_REQUEST)

        recipient_serializer = RecipientInformationSerializer(data=request.data)
        recipient_serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            recipient = recipient_serializer.save()

            donor.points -= reward.points_required
            donor.save(update_fields=['points'])

            reward.remaining_stock -= 1
            reward.save(update_fields=['remaining_stock'])

            history = RewardHistory.objects.create(
                reward=reward,
                donor=donor,
                points_used=reward.points_required,
                recipient_information=recipient
            )

        return Response(RewardHistorySerializer(history).data, status=status.HTTP_201_CREATED)


class RewardHistoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, OwnedDonorPermission]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return RewardHistory.objects.none()

        user = self.request.user

        if user.is_anonymous:
            return RewardHistory.objects.none()

        return RewardHistory.objects.filter(
            is_active=True,
            donor__account=user
        )

    def list(self, request):
        queryset = self.get_queryset()
        serializer = RewardHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        reward_history = get_object_or_404(RewardHistory, pk=pk, is_active=True, donor__account=request.user)
        self.check_object_permissions(request, reward_history)

        serializer = RewardHistorySerializer(reward_history)
        return Response(serializer.data, status=status.HTTP_200_OK)
