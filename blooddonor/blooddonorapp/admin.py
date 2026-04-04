from django.contrib import admin
from blooddonorapp.models import Account, RewardCategory, Reward, RecipientInformation, Staff, Hospital, RAGConfig


# Register your models here.

class MyAdminSite(admin.AdminSite):
    site_header = "Blood Donor Management"
    site_title = "Blood Donor Admin"
    index_title = "Welcome to Blood Donor Management Admin"


my_admin_site = MyAdminSite(name='myadmin')


class RewardInline(admin.TabularInline):
    model = Reward
    extra = 1


class AccountAdmin(admin.ModelAdmin):
    list_display = ("username", "last_name", "first_name", "email", "phone", "gender", "role", "is_staff", "is_active",
                    "last_login", "date_joined")
    list_filter = ("gender", "role", "is_staff", "is_active")
    search_fields = ("username", "email", "phone")
    ordering = ("id",)


class StaffAdmin(admin.ModelAdmin):
    list_display = ('department', 'degree', 'license_number', 'experience_years', 'emergency_phone', 'current_status',
                    'is_verified', 'account', 'hospital', 'is_active')
    list_filter = ('is_verified', 'hospital', 'current_status', 'is_active')
    search_fields = ('department', 'degree', 'license_number', 'experience_years', 'emergency_phone', 'hospital')
    ordering = ('id',)


class RewardCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "is_active", "created_at", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    ordering = ("id",)
    inlines = (RewardInline,)


class RewardAdmin(admin.ModelAdmin):
    list_display = ("name", "image_url", "points_required", "remaining_stock", "is_active", "created_at", "updated_at",
                    "reward_category")
    list_filter = ("is_active", "reward_category")
    search_fields = ("name", "reward_category", "points_required", "remaining_stock")
    ordering = ("id",)


class RecipientInformationAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "phone", "province", "sub_district", "recipient_address",
                    "recipient_note", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "province", "sub_district",)
    search_fields = ("last_name", "first_name", "email", "phone",)
    ordering = ("-created_at",)


class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "image_url", "province", "sub_district", "hospital_address")
    list_filter = ("province", "sub_district")
    search_fields = ("name",)
    ordering = ("id",)


class RAGConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "embedding_model", "llm_model", "chunk_size", "chunk_overlap", "top_k", "version",
                    "is_active", "vectorstore_path", "notes", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "embedding_model",)
    ordering = ("id",)


my_admin_site.register(Account, AccountAdmin)
my_admin_site.register(RewardCategory, RewardCategoryAdmin)
my_admin_site.register(Reward, RewardAdmin)
my_admin_site.register(RecipientInformation, RecipientInformationAdmin)
my_admin_site.register(Staff, StaffAdmin)
my_admin_site.register(Hospital, HospitalAdmin)
my_admin_site.register(RAGConfig, RAGConfigAdmin)
