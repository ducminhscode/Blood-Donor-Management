from django.contrib import admin
from collections import OrderedDict

from django.db.models import Count
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone

from blooddonorapp.models import Account, DonationEvent, EventRegistration, RegistrationStatus, RewardCategory, Reward, \
    RecipientInformation, Staff, Hospital, RAGConfig, RewardHistory


# Register your models here.

class MyAdminSite(admin.AdminSite):
    site_header = "Blood Donor Management"
    site_title = "Blood Donor Management Admin"
    index_title = "Welcome to Blood Donor Management Admin"
    index_template = "admin/my_index.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('stats-event/', self.admin_view(self.stats_event), name='stats-event'),
            path('stats-user-join-event/', self.admin_view(self.stats_user_join_event), name='stats-user-join-event'),
            path('stats-completed-registration/', self.admin_view(self.stats_event_registration),
                 name='stats-completed-registration'),
        ]
        return custom_urls + urls

    def stats_event(self, request):
        now = timezone.localtime(timezone.now())
        current_year = now.year
        event_queryset = DonationEvent.objects.filter(time_start__lte=now)

        selected_year = request.GET.get("year")
        try:
            selected_year = int(selected_year) if selected_year else current_year
        except (TypeError, ValueError):
            selected_year = current_year

        available_years = list(
            DonationEvent.objects.filter(time_start__isnull=False)
            .values_list("time_start__year", flat=True)
            .distinct()
            .order_by("time_start__year")
        )
        if current_year not in available_years:
            available_years.append(current_year)
            available_years.sort()
        if selected_year not in available_years:
            available_years.append(selected_year)
            available_years.sort()

        monthly_labels = [f"Tháng {month}" for month in range(1, 13)]
        monthly_counts = [0] * 12
        monthly_data = (
            event_queryset.filter(time_start__year=selected_year)
            .values("time_start__month")
            .annotate(total=Count("id"))
            .order_by("time_start__month")
        )
        for item in monthly_data:
            month_index = item["time_start__month"] - 1
            monthly_counts[month_index] = item["total"]

        quarterly_labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"]
        quarterly_counts = [0] * 4
        quarterly_data = (
            event_queryset.filter(time_start__year=selected_year)
            .values("time_start__month")
            .annotate(total=Count("id"))
            .order_by("time_start__month")
        )
        for item in quarterly_data:
            quarter_index = (item["time_start__month"] - 1) // 3
            quarterly_counts[quarter_index] += item["total"]

        start_year = selected_year - 4
        yearly_labels = [str(year) for year in range(start_year, selected_year + 1)]
        yearly_counts_map = OrderedDict((year, 0) for year in range(start_year, selected_year + 1))
        yearly_data = (
            event_queryset.filter(time_start__year__gte=start_year, time_start__year__lte=selected_year)
            .values("time_start__year")
            .annotate(total=Count("id"))
            .order_by("time_start__year")
        )
        for item in yearly_data:
            yearly_counts_map[item["time_start__year"]] = item["total"]

        context = {
            "total_events": event_queryset.filter(time_start__year=selected_year).count(),
            "monthly_chart": {
                "labels": monthly_labels,
                "data": monthly_counts,
            },
            "quarterly_chart": {
                "labels": quarterly_labels,
                "data": quarterly_counts,
            },
            "yearly_chart": {
                "labels": yearly_labels,
                "data": list(yearly_counts_map.values()),
            },
            "chart_title_year": current_year,
            "selected_year": selected_year,
            "available_years": available_years,
        }

        return TemplateResponse(request, 'admin/stats_event.html', context)

    def stats_user_join_event(self, request):
        now = timezone.localtime(timezone.now())
        current_year = now.year
        participant_queryset = EventRegistration.objects.filter(
            updated_at__lte=now,
            status=RegistrationStatus.COMPLETED.value,
        )

        selected_year = request.GET.get("year")
        try:
            selected_year = int(selected_year) if selected_year else current_year
        except (TypeError, ValueError):
            selected_year = current_year

        available_years = list(
            EventRegistration.objects.filter(updated_at__isnull=False, status=RegistrationStatus.COMPLETED.value)
            .values_list("updated_at__year", flat=True)
            .distinct()
            .order_by("updated_at__year")
        )
        if current_year not in available_years:
            available_years.append(current_year)
            available_years.sort()
        if selected_year not in available_years:
            available_years.append(selected_year)
            available_years.sort()

        monthly_labels = [f"Tháng {month}" for month in range(1, 13)]
        monthly_counts = [0] * 12
        monthly_data = (
            participant_queryset.filter(updated_at__year=selected_year)
            .values("updated_at__month")
            .annotate(total=Count("donor", distinct=True))
            .order_by("updated_at__month")
        )
        for item in monthly_data:
            month_index = item["updated_at__month"] - 1
            monthly_counts[month_index] = item["total"]

        quarterly_labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"]
        quarterly_counts = [0] * 4
        quarterly_data = (
            participant_queryset.filter(updated_at__year=selected_year)
            .values("updated_at__month")
            .annotate(total=Count("donor", distinct=True))
            .order_by("updated_at__month")
        )
        for item in quarterly_data:
            quarter_index = (item["updated_at__month"] - 1) // 3
            quarterly_counts[quarter_index] += item["total"]

        start_year = selected_year - 4
        yearly_labels = [str(year) for year in range(start_year, selected_year + 1)]
        yearly_counts_map = OrderedDict((year, 0) for year in range(start_year, selected_year + 1))
        yearly_data = (
            participant_queryset.filter(
                updated_at__year__gte=start_year,
                updated_at__year__lte=selected_year,
            )
            .values("updated_at__year")
            .annotate(total=Count("donor", distinct=True))
            .order_by("updated_at__year")
        )
        for item in yearly_data:
            yearly_counts_map[item["updated_at__year"]] = item["total"]

        context = {
            "total_participants": participant_queryset.filter(updated_at__year=selected_year)
            .values("donor_id")
            .distinct()
            .count(),
            "monthly_chart": {
                "labels": monthly_labels,
                "data": monthly_counts,
            },
            "quarterly_chart": {
                "labels": quarterly_labels,
                "data": quarterly_counts,
            },
            "yearly_chart": {
                "labels": yearly_labels,
                "data": list(yearly_counts_map.values()),
            },
            "selected_year": selected_year,
            "available_years": available_years,
        }

        return TemplateResponse(request, 'admin/stats_user_join_event.html', context)

    def stats_event_registration(self, request):
        now = timezone.localtime(timezone.now())
        current_year = now.year
        completed_queryset = EventRegistration.objects.filter(
            updated_at__lte=now,
            status=RegistrationStatus.COMPLETED.value,
        )

        selected_year = request.GET.get("year")
        try:
            selected_year = int(selected_year) if selected_year else current_year
        except (TypeError, ValueError):
            selected_year = current_year

        available_years = list(
            EventRegistration.objects.filter(
                updated_at__isnull=False,
                status=RegistrationStatus.COMPLETED.value,
            )
            .values_list("updated_at__year", flat=True)
            .distinct()
            .order_by("updated_at__year")
        )
        if current_year not in available_years:
            available_years.append(current_year)
            available_years.sort()
        if selected_year not in available_years:
            available_years.append(selected_year)
            available_years.sort()

        monthly_labels = [f"Tháng {month}" for month in range(1, 13)]
        monthly_counts = [0] * 12
        monthly_data = (
            completed_queryset.filter(updated_at__year=selected_year)
            .values("updated_at__month")
            .annotate(total=Count("id"))
            .order_by("updated_at__month")
        )
        for item in monthly_data:
            month_index = item["updated_at__month"] - 1
            monthly_counts[month_index] = item["total"]

        quarterly_labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"]
        quarterly_counts = [0] * 4
        quarterly_data = (
            completed_queryset.filter(updated_at__year=selected_year)
            .values("updated_at__month")
            .annotate(total=Count("id"))
            .order_by("updated_at__month")
        )
        for item in quarterly_data:
            quarter_index = (item["updated_at__month"] - 1) // 3
            quarterly_counts[quarter_index] += item["total"]

        start_year = selected_year - 4
        yearly_labels = [str(year) for year in range(start_year, selected_year + 1)]
        yearly_counts_map = OrderedDict((year, 0) for year in range(start_year, selected_year + 1))
        yearly_data = (
            completed_queryset.filter(
                updated_at__year__gte=start_year,
                updated_at__year__lte=selected_year,
            )
            .values("updated_at__year")
            .annotate(total=Count("id"))
            .order_by("updated_at__year")
        )
        for item in yearly_data:
            yearly_counts_map[item["updated_at__year"]] = item["total"]

        context = {
            "total_completed_registrations": completed_queryset.filter(updated_at__year=selected_year).count(),
            "monthly_chart": {
                "labels": monthly_labels,
                "data": monthly_counts,
            },
            "quarterly_chart": {
                "labels": quarterly_labels,
                "data": quarterly_counts,
            },
            "yearly_chart": {
                "labels": yearly_labels,
                "data": list(yearly_counts_map.values()),
            },
            "selected_year": selected_year,
            "available_years": available_years,
        }

        return TemplateResponse(request, 'admin/stats_event_registration.html', context)

my_admin_site = MyAdminSite(name='myadmin')


class RewardInline(admin.TabularInline):
    model = Reward
    extra = 1


class RewardHistoryInline(admin.TabularInline):
    model = RewardHistory
    extra = 0
    can_delete = False
    readonly_fields = ("get_username", "get_reward_name", "quantity", "points_used", "created_at",)
    fields = ("get_username", "get_reward_name", "quantity", "points_used", "created_at",)

    def get_username(self, obj):
        return obj.donor.account.username

    get_username.short_description = "Donor"

    def get_reward_name(self, obj):
        return obj.reward.name

    get_reward_name.short_description = "Reward"


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
    list_filter = ("is_active", "province", "sub_district")
    search_fields = ("last_name", "first_name", "email", "phone")
    ordering = ("-created_at",)

    inlines = (RewardHistoryInline,)


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
