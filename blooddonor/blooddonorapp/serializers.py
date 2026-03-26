import os

from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, Serializer, CharField, EmailField, ValidationError
from .models import Account, Donor, Staff, DonationEvent, Hospital, EmergencyRequest, RewardCategory, Reward, \
    RewardHistory, RecipientInformation, Friend, EmergencyResponse, EventRegistration, MedicalCheckUp, BloodDonation
from dotenv import load_dotenv

load_dotenv()


class AccountSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'username', 'password', 'avatar', 'first_name', 'last_name', 'email', 'phone',
                  'birth_date', 'gender', 'role', 'is_active', 'date_joined',
                  'last_login']  # Cac thuoc tinh response JSON
        extra_kwargs = {
            'password': {
                'write_only': True  # Chi request client -> server, khong response lai
            },
        }
        read_only_fields = ['id', 'role', 'date_joined',
                            'is_active', 'last_login', 'is_superuser', 'is_staff']  # Cac thuoc tinh khong duoc request


class ResetPasswordSerializer(Serializer):
    email = EmailField()
    new_password = CharField(write_only=True, required=True)


class ChangePasswordSerializer(Serializer):
    current_password = CharField(write_only=True, required=True)
    new_password = CharField(write_only=True, required=True)
    confirm_password = CharField(write_only=True, required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise ValidationError("Mật khẩu hiện tại không đúng.")
        return value

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        current_password = attrs.get('current_password')

        if new_password != confirm_password:
            raise ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})

        if new_password == current_password:
            raise ValidationError({"new_password": "Mật khẩu mới phải khác mật khẩu hiện tại."})

        return attrs


class ProfileUpdateSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'username', 'avatar', 'first_name', 'last_name', 'email', 'phone',
                  'birth_date', 'gender', 'role', 'is_active', 'date_joined']

        read_only_fields = ['id', 'role', 'date_joined', 'is_active', 'last_login', 'is_superuser', 'is_staff',
                            'username', 'password', 'email']


class DonorSerializer(ModelSerializer):
    account = AccountSerializer()

    class Meta:
        model = Donor
        fields = ['id', 'account', 'blood_type', 'rh_factor', 'province', 'sub_district', 'permanent_address', 'weight',
                  'height', 'identification', 'bmi', 'career', 'organization', 'donation_count', 'can_donation',
                  'last_donation', 'points', 'is_private', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'blood_type', 'rh_factor', 'weight', 'height', 'bmi', 'donation_count',
                            'last_donation', 'points', 'is_active', 'created_at', 'updated_at']


class HospitalSerializer(ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id', 'is_active', 'created_at', 'updated_at', 'name', 'image_url', 'province', 'sub_district',
                  'hospital_address']


class StaffSerializer(ModelSerializer):
    account = AccountSerializer()
    hospital_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(is_active=True),
        source='hospital',
        write_only=True,
        required=True
    )
    hospital = HospitalSerializer(read_only=True)

    class Meta:
        model = Staff
        fields = ['id', 'account', 'department', 'degree', 'license_number', 'experience_years', 'emergency_phone',
                  'current_status', 'is_verified', 'hospital', 'hospital_id', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'is_verified', 'hospital', 'is_active', 'created_at', 'updated_at']


class DonationEventSerializer(ModelSerializer):
    staff = StaffSerializer(read_only=True)

    class Meta:
        model = DonationEvent
        fields = ['id', 'title', 'description', 'image_url', 'province', 'sub_district', 'location', 'time_start',
                  'is_expire', 'is_active', 'created_at', 'updated_at', 'staff']

        read_only_fields = ['id', 'staff', 'created_at', 'updated_at', 'is_active']


class EmergencyRequestSerializer(ModelSerializer):
    # staff = StaffSerializer(read_only=True)
    hospital_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(is_active=True),
        source='hospital',
        write_only=True,
        required=True
    )
    hospital = HospitalSerializer(read_only=True)

    class Meta:
        model = EmergencyRequest
        fields = ['id', 'staff', 'is_active', 'created_at', 'updated_at', 'blood_type', 'rh_factor', 'donation_type',
                  'patient_name', 'phone', 'blood_volume', 'critical', 'emergency_note', 'is_expire',
                  'hospital', 'hospital_id']

        read_only_fields = ['id', 'staff', 'created_at', 'updated_at', 'is_active']


class RewardCategorySerializer(ModelSerializer):
    class Meta:
        model = RewardCategory
        fields = '__all__'


class RewardSerializer(ModelSerializer):
    reward_category = RewardCategorySerializer(read_only=True)

    class Meta:
        model = Reward
        fields = '__all__'


class RecipientInformationSerializer(ModelSerializer):
    class Meta:
        model = RecipientInformation
        fields = '__all__'
        read_only_fields = ['id', 'updated_at', 'created_at', 'is_active']


class RewardHistorySerializer(ModelSerializer):
    # donor = DonorSerializer(read_only=True)
    recipient_information = RecipientInformationSerializer(read_only=True)
    reward = RewardSerializer(read_only=True)

    class Meta:
        model = RewardHistory
        fields = '__all__'


class EmergencyResponseSerializer(ModelSerializer):
    emergency_request = EmergencyRequestSerializer(read_only=True)
    class Meta:
        model = EmergencyResponse
        fields = ['id', 'status_response', 'emergency_request', 'donor', 'created_at', 'status_registration']
        read_only_fields = ['id', 'donor', 'created_at', 'emergency_request', 'status_registration']


class EventRegistrationSerializer(ModelSerializer):
    donation_event = DonationEventSerializer(read_only=True)
    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['id', 'donor', 'created_at', 'donation_event', 'updated_at', 'is_active']


class FriendSerializer(ModelSerializer):
    requester = DonorSerializer(read_only=True)
    addressee = DonorSerializer(read_only=True)

    class Meta:
        model = Friend
        fields = '__all__'


class MedicalCheckUpSerializer(ModelSerializer):
    staff = StaffSerializer(read_only=True)
    # event_registration = EventRegistrationSerializer(read_only=True)
    # emergency_response = EmergencyResponseSerializer(read_only=True)
    class Meta:
        model = MedicalCheckUp
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'staff', 'event_registration', 'emergency_response']


class BloodDonationSerializer(ModelSerializer):
    staff = StaffSerializer(read_only=True)
    class Meta:
        model = BloodDonation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'staff', 'medical_check_up']
