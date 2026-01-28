import os
from enum import IntEnum

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from cloudinary.models import CloudinaryField
from django.db.models import Q
from django.db.models.constraints import CheckConstraint
from dotenv import load_dotenv
import uuid

load_dotenv()


# Create your models here.

class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        abstract = True
        ordering = ['-id']


class Role(IntEnum):
    ADMIN = 0
    DONOR = 1
    STAFF = 2

    @classmethod
    def choices(cls):
        return [(role.value, role.name.capitalize()) for role in cls]


class Gender(IntEnum):
    MALE = 0
    FEMALE = 1
    OTHER = 2

    @classmethod
    def choices(cls):
        return [(gender.value, gender.name.capitalize()) for gender in cls]


class Account(AbstractUser):
    last_name = models.CharField(max_length=120)
    first_name = models.CharField(max_length=120)
    birth_date = models.DateField(null=True, blank=True)
    email = models.EmailField(unique=True, max_length=254)
    phone = models.CharField(max_length=15, null=True, blank=True, unique=True)
    gender = models.IntegerField(choices=Gender.choices(), default=Gender.MALE.value, null=True, blank=True)
    avatar = CloudinaryField('avatar', null=True, folder=os.getenv('CLOUD_FOLDER'),
                             default='https://res.cloudinary.com/dp9b0dkkt/image/upload/v1745512749/de995be2-6311-4125-9ac2-19e11fcaf801_jo8gcs.png')
    role = models.IntegerField(choices=Role.choices(), default=Role.ADMIN.value)

    class Meta:
        ordering = ['id']


class BloodType(IntEnum):
    O = 0
    A = 1
    B = 2
    AB = 3

    @classmethod
    def choices(cls):
        return [(blood.value, blood.name.capitalize()) for blood in cls]


class Donor(BaseModel):
    donor_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    blood_type = models.IntegerField(choices=BloodType.choices(), null=True, blank=True)
    rh_factor = models.BooleanField(null=True, blank=True)
    province = models.CharField(max_length=254, null=True, blank=True)
    sub_district = models.CharField(max_length=254, null=True, blank=True)
    permanent_address = models.TextField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    identification = models.CharField(max_length=20, null=True, blank=True, unique=True)
    bmi = models.FloatField(null=True, blank=True)
    career = models.TextField(null=True, blank=True)
    organization = models.TextField(null=True, blank=True)
    donation_count = models.IntegerField(default=0)
    can_donation = models.BooleanField(default=False)
    last_donation = models.DateTimeField(null=True, blank=True)
    points = models.IntegerField(default=0)
    is_private = models.BooleanField(default=False)
    account = models.OneToOneField(Account, on_delete=models.CASCADE)


class FriendStatus(IntEnum):
    ADD_FRIEND = 0
    BEFRIEND = 1
    PENDING = 2

    @classmethod
    def choices(cls):
        return [(friend.value, friend.name.capitalize()) for friend in cls]


class Friend(BaseModel):
    requester = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='sent_friend_request')
    addressee = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='received_friend_request')
    status = models.IntegerField(choices=FriendStatus.choices(), default=FriendStatus.ADD_FRIEND.value)

    class Meta:
        unique_together = ('requester', 'addressee')


class Hospital(BaseModel):
    name = models.CharField(max_length=254, unique=True)
    image_url = CloudinaryField('image_url_hospital', folder=os.getenv('CLOUD_FOLDER'), null=True, blank=True)
    province = models.CharField(max_length=254)
    sub_district = models.CharField(max_length=254)
    hospital_address = models.TextField()


class Staff(BaseModel):
    staff_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    department = models.TextField()
    degree = models.TextField()
    license_number = models.CharField(max_length=50, unique=True)
    experience_years = models.FloatField(null=True, blank=True)
    emergency_phone = models.TextField()
    current_status = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    account = models.OneToOneField(Account, on_delete=models.CASCADE)
    hospital = models.OneToOneField(Hospital, on_delete=models.SET_NULL, null=True, blank=True)


class KnowledgeBase(BaseModel):
    title = models.CharField(max_length=254)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to='knowledgebase/')
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title


class ChatSession(BaseModel):
    session_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    session_name = models.CharField(max_length=254, null=True, default='Trò chuyện mới')
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE)

    @property
    def messages(self):
        return self.messages.all()

    def __str__(self):
        return str(self.session_code)

    class Meta:
        ordering = ['-updated_at']


class Message(BaseModel):
    sender = models.CharField(max_length=10, choices=(('human', 'Human'), ('ai', 'AI')))
    text = models.TextField(null=True, blank=True)
    image_url = CloudinaryField('image_url_message', folder=os.getenv('CLOUD_FOLDER'), null=True, blank=True)
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')

    class Meta:
        ordering = ['created_at']


class RewardCategory(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(null=True, blank=True)


class Reward(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    image_url = CloudinaryField('image_url_reward', folder=os.getenv('CLOUD_FOLDER'), null=True, blank=True)
    points_required = models.IntegerField()
    remaining_stock = models.IntegerField()
    reward_category = models.ForeignKey(RewardCategory, on_delete=models.CASCADE)


class RecipientInformation(BaseModel):
    last_name = models.CharField(max_length=254)
    first_name = models.CharField(max_length=254)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    province = models.CharField(max_length=254)
    sub_district = models.CharField(max_length=254)
    recipient_address = models.TextField()
    recipient_note = models.TextField(null=True, blank=True)


class RewardHistory(BaseModel):
    reward = models.ForeignKey(Reward, on_delete=models.CASCADE)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE)
    points_used = models.IntegerField()
    recipient_information = models.OneToOneField(RecipientInformation, on_delete=models.CASCADE)


class DonationEvent(BaseModel):
    title = models.CharField(max_length=254)
    description = models.TextField(null=True, blank=True)
    image_url = CloudinaryField('image_url_donation_event', folder=os.getenv('CLOUD_FOLDER'), null=True, blank=True)
    province = models.CharField(max_length=254)
    sub_district = models.CharField(max_length=254)
    location = models.TextField()
    time_start = models.DateTimeField()
    time_end = models.DateTimeField()
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)


class RegistrationStatus(IntEnum):
    REGISTERED = 0
    APPROVED = 1
    REJECTED = 2
    CHECKED_IN = 3
    COMPLETED = 4

    @classmethod
    def choices(cls):
        return [(register.value, register.name.capitalize()) for register in cls]


class EventRegistration(BaseModel):
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE)
    donation_event = models.ForeignKey(DonationEvent, on_delete=models.CASCADE)
    last_name = models.CharField(max_length=254)
    first_name = models.CharField(max_length=254)
    birth_date = models.DateField()
    gender = models.IntegerField(choices=Gender.choices(), default=Gender.MALE.value)
    identification = models.CharField(max_length=20)
    phone = models.CharField(max_length=15)
    expected_arrive = models.DateTimeField()
    province = models.CharField(max_length=254)
    sub_district = models.CharField(max_length=254)
    permanent_address = models.TextField()
    email = models.EmailField()
    career = models.TextField()
    organization = models.TextField()
    status = models.IntegerField(choices=RegistrationStatus.choices(), default=RegistrationStatus.REGISTERED.value)
    is_proxy = models.BooleanField(default=False)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['identification', 'donation_event'],
                name='unique_identification_per_event'
            ),
            models.UniqueConstraint(
                fields=['phone', 'donation_event'],
                name='unique_phone_per_event'
            ),
            models.UniqueConstraint(
                fields=['email', 'donation_event'],
                name='unique_email_per_event'
            )
        ]

    def clean(self):
        if not self.is_proxy:
            exists = EventRegistration.objects.filter(
                donor=self.donor,
                donation_event=self.donation_event,
                is_proxy=False
            ).exclude(pk=self.pk).exists()

            if exists:
                raise ValidationError('unique_donor_per_event')


class DonationType(IntEnum):
    WHOLE = 0
    PLATELETS = 1
    PLASMA = 2
    WBC = 3

    @classmethod
    def choices(cls):
        return [(type.value, type.name.capitalize()) for type in cls]


class EmergencyRequest(BaseModel):
    blood_type = models.IntegerField(choices=BloodType.choices())
    rh_factor = models.BooleanField()
    donation_type = models.IntegerField(choices=DonationType.choices())
    patient_name = models.CharField(max_length=254)
    phone = models.CharField(max_length=15)
    blood_volume = models.IntegerField()
    critical = models.BooleanField(default=True)
    emergency_note = models.TextField(null=True, blank=True)
    deadline_at = models.DateTimeField()
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    hospital = models.OneToOneField(Hospital, on_delete=models.SET_NULL, null=True, blank=True)


class ResponseStatus(IntEnum):
    NO_RESPONSE = 0
    ACCEPTED = 1
    REJECTED = 2

    @classmethod
    def choices(cls):
        return [(response.value, response.name.capitalize()) for response in cls]


class EmergencyResponse(BaseModel):
    status = models.IntegerField(choices=ResponseStatus.choices(), default=ResponseStatus.NO_RESPONSE.value)
    emergency_request = models.ForeignKey(EmergencyRequest, on_delete=models.CASCADE)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE)


class MedicalCheckUp(BaseModel):
    weight = models.FloatField()
    height = models.FloatField()
    blood_pressure = models.CharField(max_length=50)
    heart_rate = models.IntegerField()
    body_temperature = models.FloatField()
    hemoglobin_level = models.FloatField()
    has_infectious = models.BooleanField(default=False)
    has_chronic = models.BooleanField(default=False)
    medical_note = models.TextField(null=True, blank=True)
    last_donation = models.DateTimeField(null=True, blank=True)
    recent_surgery = models.BooleanField(default=False)
    recent_tattoo = models.BooleanField(default=False)
    is_drug = models.BooleanField(default=False)
    is_pregnant = models.BooleanField(default=False)
    is_breast_feeding = models.BooleanField(default=False)
    is_eligible = models.BooleanField(default=False)
    doctor = models.CharField(max_length=254)
    event_registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, null=True, blank=True)
    emergency_response = models.OneToOneField(EmergencyResponse, on_delete=models.CASCADE, null=True, blank=True)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        constraints = [
            CheckConstraint(
                check=(
                        Q(event_registration__isnull=True, emergency_response__isnull=False) | Q(
                    event_registration__isnull=False, emergency_response__isnull=True)
                ),
                name='medical_check_up_only_one_target'
            )
        ]


class BloodDonation(BaseModel):
    blood_type = models.IntegerField(choices=BloodType.choices())
    rh_factor = models.BooleanField()
    blood_volume = models.IntegerField()
    donation_note = models.TextField(null=True, blank=True)
    blood_taker = models.CharField(max_length=254)
    donation_type = models.IntegerField(choices=DonationType.choices())
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    medical_check_up = models.OneToOneField(MedicalCheckUp, on_delete=models.CASCADE)
