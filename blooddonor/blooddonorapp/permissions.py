from rest_framework import permissions


class OwnerPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_permission(request, view) and request.user == obj


class AdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 0


class DonorPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 1


class OwnedDonorPermission(DonorPermission):
    def has_object_permission(self, request, view, obj):
        return (
                request.user.is_authenticated
                and hasattr(request.user, 'donor')
                and obj.donor == request.user.donor
        )


class StaffPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 2


class OwnedStaffPermission(StaffPermission):
    def has_object_permission(self, request, view, obj):
        return (
                request.user.is_authenticated
                and hasattr(request.user, 'staff')
                and obj.staff == request.user.staff
        )
