from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from oauth2_provider.models import AccessToken
from oauth2_provider.views import TokenView

# Create your views here.
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import OR
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import random
from datetime import timedelta
import json
from rest_framework.parsers import MultiPartParser, FormParser
import os
from .utils.rag import RAGSystem

from blooddonor import settings
from .models import Account, Role, Donor, Staff, DonationEvent, Hospital, EmergencyRequest, Friend, FriendStatus, \
    RewardCategory, Reward, RewardHistory, ResponseStatus, EmergencyResponse, EventRegistration, RegistrationStatus, \
    MedicalCheckUp, BloodDonation, ChatSession, Message, KnowledgeBase
from .paginators import Pagination
from .permissions import OwnerPermission, StaffPermission, OwnedStaffPermission, OwnedDonorPermission, DonorPermission, \
    AdminPermission
from .serializers import AccountSerializer, ResetPasswordSerializer, \
    ChangePasswordSerializer, ProfileUpdateSerializer, DonorSerializer, StaffSerializer, DonationEventSerializer, \
    HospitalSerializer, EmergencyRequestSerializer, RewardCategorySerializer, RewardSerializer, \
    FriendSerializer, RecipientInformationSerializer, RewardHistorySerializer, EmergencyResponseSerializer, \
    EventRegistrationSerializer, MedicalCheckUpSerializer, BloodDonationSerializer, ChatSessionSerializer, \
    MessageSerializer, KnowledgeBaseSerializer

import logging
from .utils.rag_monitoring import RAGMonitoringCallback

logger = logging.getLogger(__name__)

rag_system = RAGSystem()


class CustomTokenView(TokenView):
    def post(self, request, *args, **kwargs):

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                if hasattr(response, 'content') and response.content:
                    content = json.loads(response.content)
                    token = content.get('access_token')

                    if token:
                        access_token = AccessToken.objects.select_related('user').get(token=token)
                        user = access_token.user

                        user.last_login = timezone.now()
                        user.save(update_fields=['last_login'])

            except AccessToken.DoesNotExist:
                print("Không tìm thấy AccessToken")
            except json.JSONDecodeError as e:
                print(f"Lỗi parse JSON: {e}")
            except Exception as e:
                print(f"Lỗi không xác định: {e}")

        return response


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
        username = request.data.get("username")
        email = request.data.get("email")

        if not username or not email:
            return Response({"error": "Vui lòng nhập username và email."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Account.objects.get(username=username, email=email)
        except Account.DoesNotExist:
            return Response({"error": "Username hoặc email không đúng."}, status=status.HTTP_404_NOT_FOUND)

        otp = f"{random.randint(100000, 999999)}"
        cache_key = f"reset_password_{user.email}"

        cache.set(
            cache_key,
            {"otp": otp},
            timeout=300
        )

        send_mail(
            subject="Mã OTP đặt lại mật khẩu",
            message=f"Mã OTP reset mật khẩu của bạn là: {otp}. Có hiệu lực 5 phút.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"message": "OTP đã được gửi qua email"}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='reset-password', detail=False)
    def reset_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']

        verified_key = f"reset_verified_{email}"
        is_verified = cache.get(verified_key)

        if not is_verified:
            return Response({"error": "Bạn chưa xác thực OTP"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            acc = Account.objects.get(email=email)
        except Account.DoesNotExist:
            return Response({"error": "Tài khoản không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        acc.set_password(new_password)
        acc.save()

        cache.delete(verified_key)

        return Response({"message": "Đặt lại mật khẩu thành công"}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='verify-otp', detail=False)
    def verify_otp(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        reset_key = f"reset_password_{email}"
        reset_cached = cache.get(reset_key)

        if reset_cached:
            if not reset_cached:
                return Response({"error": "OTP hết hạn hoặc không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

            if reset_cached["otp"] != otp:
                return Response({"error": "OTP không đúng"}, status=status.HTTP_400_BAD_REQUEST)

            cache.set(f"reset_verified_{email}", True, timeout=300)

            return Response({"message": "OTP hợp lệ, bạn có thể đặt lại mật khẩu"}, status=status.HTTP_200_OK)

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
    pagination_class = Pagination

    def get_permissions(self):
        if self.action in ['donor_update']:
            return [OwnedDonorPermission()]
        if self.action in ['request_friend', 'accept_friend', 'reject_friend', 'pending_list', 'friend_list',
                           'unfriend', 'get_my_donor', 'cancel_request', 'get_friend_status']:
            return [DonorPermission()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Donor.objects.filter(is_active=True).select_related('account')
        search = self.request.query_params.get('search')
        if search:
            keywords = search.strip().split()

            query = Q()
            for word in keywords:
                query &= (
                        Q(account__first_name__icontains=word) |
                        Q(account__last_name__icontains=word) |
                        Q(account__email__icontains=word) |
                        Q(account__phone__icontains=word)
                )

            queryset = queryset.filter(query)

        return queryset

    @action(methods=['get'], url_path='me', detail=False)
    def get_my_donor(self, request):
        donor = request.user.donor
        serializer = DonorSerializer(donor)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='update', detail=False)
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

        donor_ids = [f.requester.id for f in pending]

        donors = Donor.objects.filter(
            id__in=donor_ids,
            is_active=True
        ).select_related('account')

        friend_created_at = {f.requester.id: f.created_at for f in pending}

        search = request.query_params.get('search')
        if search:
            keywords = search.strip().split()
            query = Q()
            for word in keywords:
                query &= (
                        Q(account__first_name__icontains=word) |
                        Q(account__last_name__icontains=word) |
                        Q(account__email__icontains=word) |
                        Q(account__phone__icontains=word)
                )
            donors = donors.filter(query)

        paginator = Pagination()
        page = paginator.paginate_queryset(donors, request)

        serializer = DonorSerializer(page, many=True)

        response_data = serializer.data
        for donor_data in response_data:
            donor_id = donor_data['id']
            donor_data['friend_request_created_at'] = friend_created_at.get(donor_id)

        return paginator.get_paginated_response(response_data)

    @action(methods=['get'], url_path='friend-list', detail=False)
    def friend_list(self, request):
        donor = request.user.donor

        friends = Friend.objects.filter(
            requester=donor,
            status=FriendStatus.BEFRIEND.value
        ).select_related('addressee', 'addressee__account')

        donors = Donor.objects.filter(
            id__in=[f.addressee.id for f in friends],
            is_active=True
        ).select_related('account')

        search = request.query_params.get('search')

        if search:
            keywords = search.strip().split()

            query = Q()
            for word in keywords:
                query &= (
                        Q(account__first_name__icontains=word) |
                        Q(account__last_name__icontains=word) |
                        Q(account__email__icontains=word) |
                        Q(account__phone__icontains=word)
                )

            donors = donors.filter(query)

        paginator = Pagination()
        page = paginator.paginate_queryset(donors, request)

        serializer = DonorSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

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

    @action(methods=['post'], url_path='cancel-request', detail=True)
    def cancel_request(self, request, pk=None):
        donor = request.user.donor
        addressee_id = pk

        try:
            addressee_id = int(addressee_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid donor_id"}, status=status.HTTP_400_BAD_REQUEST)

        if donor.id == addressee_id:
            return Response({"error": "Can't cancel yourself"}, status=status.HTTP_400_BAD_REQUEST)

        get_object_or_404(
            Friend,
            requester=donor,
            addressee_id=addressee_id,
            status=FriendStatus.ADD_FRIEND.value
        )

        with transaction.atomic():
            Friend.objects.filter(
                requester=donor,
                addressee_id=addressee_id,
                status=FriendStatus.ADD_FRIEND.value
            ).delete()

            Friend.objects.filter(
                requester_id=addressee_id,
                addressee=donor,
                status=FriendStatus.PENDING.value
            ).delete()

        return Response({"message": "Friend request cancelled"}, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='friend-status', detail=False)
    def get_friend_status(self, request):
        donor = request.user.donor
        donor_ids = request.query_params.get('donor_ids', '')

        if not donor_ids:
            return Response({}, status=status.HTTP_200_OK)

        try:
            donor_ids = [int(id.strip()) for id in donor_ids.split(',') if id.strip()]
        except ValueError:
            return Response({"error": "Invalid donor_ids"}, status=status.HTTP_400_BAD_REQUEST)

        donor_ids = [id for id in donor_ids if id != donor.id]

        if not donor_ids:
            return Response({}, status=status.HTTP_200_OK)

        friend_relations = Friend.objects.filter(
            Q(requester=donor, addressee_id__in=donor_ids) |
            Q(addressee=donor, requester_id__in=donor_ids)
        ).select_related('requester', 'addressee')

        status_map = {}

        for donor_id in donor_ids:
            status_map[donor_id] = 'none'

        for rel in friend_relations:
            other_id = rel.addressee_id if rel.requester_id == donor.id else rel.requester_id

            if rel.status == FriendStatus.BEFRIEND.value:
                status_map[other_id] = 'friend'
            elif rel.status == FriendStatus.ADD_FRIEND.value:
                if rel.requester_id == donor.id:
                    status_map[other_id] = 'pending_sent'
                else:
                    status_map[other_id] = 'pending_received'
            elif rel.status == FriendStatus.PENDING.value:
                if rel.addressee_id == donor.id:
                    status_map[other_id] = 'pending_received'

        return Response(status_map, status=status.HTTP_200_OK)


class StaffViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer
    pagination_class = Pagination

    def get_permissions(self):
        if self.action in ['staff_update', 'get_my_staff']:
            return [OwnedStaffPermission()]
        if self.action in ['donation_event', 'emergency_request']:
            return [StaffPermission()]
        return [IsAuthenticated()]

    @action(methods=['get'], url_path='me', detail=False)
    def get_my_staff(self, request):
        staff = request.user.staff
        serializer = StaffSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='update', detail=False)
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

        search = request.query_params.get('search')
        if search:
            events = events.filter(title__icontains=search)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(events, request)

        serializer = DonationEventSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(methods=['get'], url_path='emergency-request', detail=False)
    def emergency_request(self, request):
        staff = request.user.staff
        emergency = EmergencyRequest.objects.filter(staff=staff, is_active=True).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            emergency = emergency.filter(
                Q(patient_name__icontains=search)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(emergency, request)

        serializer = EmergencyRequestSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class DonationEventViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = DonationEvent.objects.filter(is_active=True, is_expire=False)
    serializer_class = DonationEventSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = DonationEvent.objects.filter(is_active=True, is_expire=False)

        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(province=province)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        queryset = queryset.order_by('-created_at')

        return queryset

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
        if self.action in ['register']:
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
        donation_event.delete()
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

        if not donor.can_donation:
            return Response(
                {"error": "Bạn hiện không đủ điều kiện để hiến máu. Vui lòng kiểm tra lại thông tin sức khỏe."},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        search = request.query_params.get('search')
        if search:
            keywords = search.strip().split()
            query = Q()
            for word in keywords:
                query |= (
                        Q(donor__account__first_name__icontains=word) |
                        Q(donor__account__last_name__icontains=word) |
                        Q(donor__account__email__icontains=word) |
                        Q(donor__account__phone__icontains=word) |
                        Q(identification__icontains=word)
                )
            registrations = registrations.filter(query)

        status_filter = request.query_params.get('status')
        if status_filter:
            try:
                status_int = int(status_filter)
                if status_int in [s.value for s in RegistrationStatus]:
                    registrations = registrations.filter(status=status_int)
            except (ValueError, TypeError):
                pass

        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if from_date:
            registrations = registrations.filter(created_at__gte=from_date)
        if to_date:
            registrations = registrations.filter(created_at__lte=to_date)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(registrations, request)

        serializer = EventRegistrationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

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

        # Kiểm tra trạng thái
        if registration.status in [RegistrationStatus.REGISTERED.value,
                                   RegistrationStatus.REJECTED.value,
                                   RegistrationStatus.APPROVED.value]:
            return Response(
                {"error": "Cannot complete this registration"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if registration.status == RegistrationStatus.COMPLETED.value:
            return Response({"error": "Donor already completed"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            registration.status = RegistrationStatus.COMPLETED.value
            registration.save(update_fields=['status'])

            if not registration.is_proxy:
                donor = registration.donor

                medical_checkup = MedicalCheckUp.objects.filter(
                    event_registration=registration,
                    is_active=True
                ).first()

                if medical_checkup:
                    donor.weight = medical_checkup.weight
                    donor.height = medical_checkup.height

                    if medical_checkup.weight and medical_checkup.height:
                        height_m = medical_checkup.height / 100
                        donor.bmi = round(medical_checkup.weight / (height_m * height_m), 2)
                    else:
                        donor.bmi = None

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
                medical_checkup.delete()

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
                blood_donation.delete()

            return Response({"message": "Blood donation deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class HospitalViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer


class EmergencyRequestViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = EmergencyRequest.objects.filter(is_active=True, is_expire=False)
    serializer_class = EmergencyRequestSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = EmergencyRequest.objects.filter(is_active=True, is_expire=False)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(patient_name__icontains=search)

        queryset = queryset.order_by('-created_at')

        return queryset

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
        if self.action in ['response']:
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
        emergency_request.delete()
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

        if not donor.can_donation:
            return Response(
                {"error": "Bạn hiện không đủ điều kiện để hiến máu. Vui lòng kiểm tra lại thông tin sức khỏe."},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        ).select_related(
            'donor',
            'donor__account'
        ).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            keywords = search.strip().split()
            query = Q()
            for word in keywords:
                query &= (
                        Q(donor__account__first_name__icontains=word) |
                        Q(donor__account__last_name__icontains=word) |
                        Q(donor__account__email__icontains=word) |
                        Q(donor__account__phone__icontains=word)
                )
            responses = responses.filter(query)

        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if from_date:
            responses = responses.filter(created_at__gte=from_date)
        if to_date:
            responses = responses.filter(created_at__lte=to_date)

        paginator = Pagination()
        page = paginator.paginate_queryset(responses, request)

        if page is not None:
            serializer = EmergencyResponseSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

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

        with transaction.atomic():
            response_obj.status_registration = RegistrationStatus.COMPLETED.value
            response_obj.save(update_fields=['status_registration'])

            donor = response_obj.donor

            medical_checkup = MedicalCheckUp.objects.filter(
                emergency_response=response_obj,
                is_active=True
            ).first()

            if medical_checkup:
                # Cập nhật thông tin từ medical_checkup vào donor
                donor.weight = medical_checkup.weight
                donor.height = medical_checkup.height

                # Tính BMI nếu có cả weight và height
                if medical_checkup.weight and medical_checkup.height:
                    height_m = medical_checkup.height / 100
                    donor.bmi = round(medical_checkup.weight / (height_m * height_m), 2)
                else:
                    donor.bmi = None

                blood_donation = BloodDonation.objects.filter(
                    medical_check_up=medical_checkup,
                    is_active=True
                ).first()

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

            if MedicalCheckUp.objects.filter(emergency_response=response_obj).exists():
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

            if response_obj.status_registration == RegistrationStatus.COMPLETED.value:
                return Response(
                    {"error": "Cannot delete medical checkup for completed registration"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                medical_checkup.delete()

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
                blood_donation.delete()

            return Response({"message": "Blood donation deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class RewardCategoryViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = RewardCategory.objects.filter(is_active=True)
    serializer_class = RewardCategorySerializer
    pagination_class = Pagination

    def get_permissions(self):
        if self.action in ['get_queryset', 'get_reward_by_category', 'get_reward_retrieve_by_category',
                           'get_reward_retrieve_by_category']:
            return [DonorPermission()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = RewardCategory.objects.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    @action(methods=['get'], url_path='reward', detail=True)
    def get_reward_by_category(self, request, pk=None):
        category = self.get_object()
        rewards = Reward.objects.filter(reward_category=category, is_active=True)

        serializer = RewardSerializer(rewards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='reward/(?P<reward_id>[^/.]+)', detail=True)
    def get_reward_retrieve_by_category(self, request, pk=None, reward_id=None):
        category = self.get_object()

        reward = get_object_or_404(Reward, pk=reward_id, reward_category=category, is_active=True)

        serializer = RewardSerializer(reward)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RewardViewSet(viewsets.ViewSet, generics.ListAPIView):
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

        quantity = request.data.get("quantity")

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"error": "Số lượng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({"error": "Số lượng phải lớn hơn 0"}, status=status.HTTP_400_BAD_REQUEST)

        if reward.remaining_stock < quantity:
            return Response({"error": "Không đủ số lượng"}, status=status.HTTP_400_BAD_REQUEST)

        total_points = reward.points_required * quantity

        if donor.points < total_points:
            return Response({"error": "Không đủ điểm"}, status=status.HTTP_400_BAD_REQUEST)

        recipient_serializer = RecipientInformationSerializer(data=request.data)
        recipient_serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            recipient = recipient_serializer.save()

            donor.points -= total_points
            donor.save(update_fields=['points'])

            reward.remaining_stock -= quantity
            reward.save(update_fields=['remaining_stock'])

            history = RewardHistory.objects.create(
                reward=reward,
                donor=donor,
                points_used=total_points,
                quantity=quantity,
                recipient_information=recipient
            )

        return Response(RewardHistorySerializer(history).data, status=status.HTTP_201_CREATED)


class RewardHistoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    permission_classes = [IsAuthenticated, OwnedDonorPermission]
    pagination_class = Pagination
    serializer_class = RewardHistorySerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return RewardHistory.objects.none()

        user = self.request.user

        if user.is_anonymous:
            return RewardHistory.objects.none()

        queryset = RewardHistory.objects.filter(
            is_active=True,
            donor__account=user
        ).select_related('reward', 'recipient_information')

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(reward__name__icontains=search))

        queryset = queryset.order_by('-created_at')

        return queryset

    def list(self, request):
        queryset = self.get_queryset()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        reward_history = get_object_or_404(RewardHistory, pk=pk, is_active=True, donor__account=request.user)
        self.check_object_permissions(request, reward_history)

        serializer = self.get_serializer(reward_history)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EventRegistrationViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    permission_classes = [DonorPermission]
    serializer_class = EventRegistrationSerializer
    pagination_class = Pagination

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EventRegistration.objects.none()

        user = self.request.user

        if user.is_anonymous:
            return EventRegistration.objects.none()

        queryset = EventRegistration.objects.filter(
            donor=user.donor,
            is_active=True
        ).select_related(
            'donation_event',
            'donor__account'
        )

        search = self.request.query_params.get('search')
        if search:
            keywords = search.strip().split()
            query = Q()
            for word in keywords:
                query &= (
                    Q(donation_event__title__icontains=word)
                )
            queryset = queryset.filter(query)

        status = self.request.query_params.get('status')
        if status is not None:
            try:
                status_int = int(status)
                if status_int in [s.value for s in RegistrationStatus]:
                    queryset = queryset.filter(status=status_int)
            except (ValueError, TypeError):
                pass

        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')

        if from_date:
            queryset = queryset.filter(created_at__gte=from_date)
        if to_date:
            queryset = queryset.filter(created_at__lte=to_date)

        queryset = queryset.order_by('-created_at')

        return queryset


class EmergencyResponseViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    permission_classes = [DonorPermission]
    serializer_class = EmergencyResponseSerializer
    pagination_class = Pagination

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EmergencyResponse.objects.none()

        user = self.request.user

        if user.is_anonymous:
            return EmergencyResponse.objects.none()

        queryset = EmergencyResponse.objects.filter(
            donor=user.donor,
            is_active=True
        ).select_related(
            'emergency_request',
            'donor__account'
        ).order_by('-created_at')

        search = self.request.query_params.get('search')
        if search:
            keywords = search.strip().split()
            query = Q()
            for word in keywords:
                query &= (
                    Q(emergency_request__patient_name__icontains=word)
                )
            queryset = queryset.filter(query)

        status_registration = self.request.query_params.get('status_registration')
        if status_registration is not None:
            try:
                status_int = int(status_registration)
                if status_int in [s.value for s in RegistrationStatus]:
                    queryset = queryset.filter(status_registration=status_int)
            except (ValueError, TypeError):
                pass

        # Lọc theo ngày
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')

        if from_date:
            queryset = queryset.filter(created_at__gte=from_date)
        if to_date:
            queryset = queryset.filter(created_at__lte=to_date)

        return queryset


class ChatSessionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, OwnerPermission]

    def get_donor(self, request):
        return Donor.objects.filter(account=request.user).first()

    def get_object(self, pk, request):
        return ChatSession.objects.filter(
            session_code=pk,
            donor__account=request.user
        ).first()

    def list(self, request):
        queryset = ChatSession.objects.filter(donor__account=request.user)

        paginator = Pagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)

        serializer = ChatSessionSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def create(self, request):
        donor = self.get_donor(request)
        if not donor:
            return Response({"error": "Donor not found"}, status=400)

        serializer = ChatSessionSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(donor=donor)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        chat_session = self.get_object(pk, request)

        if not chat_session:
            return Response({"error": "Not found"}, status=404)

        serializer = ChatSessionSerializer(chat_session)
        return Response(serializer.data)

    def update(self, request, pk=None):
        chat_session = self.get_object(pk, request)

        if not chat_session:
            return Response({"error": "Not found"}, status=404)

        serializer = ChatSessionSerializer(
            chat_session,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def destroy(self, request, pk=None):
        chat_session = self.get_object(pk, request)

        if not chat_session:
            return Response({"error": "Not found"}, status=404)

        chat_session.delete()
        return Response(status=204)


class MessageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, OwnerPermission]

    def list(self, request, session_id=None):
        try:
            chat_session = ChatSession.objects.get(session_code=session_id, donor__account=request.user)
        except ChatSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        messages = chat_session.chat_session_message.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def create(self, request, session_id=None):
        try:
            chat_session = ChatSession.objects.get(
                session_code=session_id,
                donor__account=request.user
            )
        except ChatSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Rate limiting
        recent_messages = Message.objects.filter(
            chat_session=chat_session,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).count()

        if recent_messages > 10:
            return Response(
                {"error": "Too many messages. Please wait."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Lấy lịch sử chat
        messages = chat_session.chat_session_message.all().order_by('-created_at')[:20]
        chat_history = []

        human_msgs = [m for m in messages if m.sender == 'human'][:5]
        ai_msgs = [m for m in messages if m.sender == 'ai'][:5]

        for h, a in zip(reversed(human_msgs), reversed(ai_msgs)):
            chat_history.append((h.text, a.text))

        # Tạo tin nhắn của người dùng
        user_message = Message.objects.create(
            sender='human',
            text=request.data.get('text', ''),
            chat_session=chat_session
        )

        ai_response = "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."

        try:
            callback = RAGMonitoringCallback(model=rag_system.OPENAI_MODEL)
            result = rag_system.qa_chain.invoke(
                {
                    "question": request.data.get('text', ''),
                    "chat_history": chat_history
                },
                config={"callbacks": [callback]}
            )
            ai_response = result.get("answer", ai_response)

        except Exception as e:
            logger.error(f"RAG Error for question: {request.data.get('text', '')}", exc_info=True)

        # Tạo tin nhắn trả lời từ AI
        ai_message = Message.objects.create(
            sender='ai',
            text=ai_response,
            chat_session=chat_session
        )

        chat_session.save()

        serializer = MessageSerializer([user_message, ai_message], many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class KnowledgeBaseViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, AdminPermission]
    parser_classes = [MultiPartParser, FormParser]

    def list(self, request):
        queryset = KnowledgeBase.objects.all()

        paginator = Pagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)

        serializer = KnowledgeBaseSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            knowledge = KnowledgeBase.objects.get(pk=pk)
        except KnowledgeBase.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = KnowledgeBaseSerializer(knowledge)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        files = request.FILES.getlist('file')
        if not files:
            return Response({"error": "Không có file nào được upload."}, status=status.HTTP_400_BAD_REQUEST)

        title = request.data.get('title', '').strip()
        if not title:
            return Response({"error": "Vui lòng nhập tiêu đề cho tài liệu."}, status=status.HTTP_400_BAD_REQUEST)

        created_objects = []
        for f in files:
            knowledge = KnowledgeBase.objects.create(
                title=request.data.get('title', ''),
                description=request.data.get('description', ''),
                file=f,
                account=request.user
            )
            created_objects.append(knowledge)

            file_path = os.path.join(settings.MEDIA_ROOT, knowledge.file.name)
            rag_system.add_documents(file_path)

        serializer = KnowledgeBaseSerializer(created_objects, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            knowledge = KnowledgeBase.objects.get(pk=pk)
        except KnowledgeBase.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        file_path = os.path.join(settings.MEDIA_ROOT, knowledge.file.name)

        try:
            rag_system.vectorstore.delete(where={"source": file_path})

        except Exception as e:
            print(f"Lỗi khi xóa khỏi vectorstore: {e}")

        if os.path.exists(file_path):
            os.remove(file_path)

        knowledge.delete()
        return Response({"success": "File đã được xóa."}, status=status.HTTP_204_NO_CONTENT)
