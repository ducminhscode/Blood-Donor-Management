"""
URL configuration for blooddonor project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os

from django.contrib import admin
from django.urls import path, include, re_path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
import debug_toolbar
from dotenv import load_dotenv

from blooddonorapp.admin import my_admin_site

load_dotenv()

schema_view = get_schema_view(
    openapi.Info(
        title="Blood Donor API",
        default_version='v1',
        description="APIs for BloodDonorApp",
        contact=openapi.Contact(email=os.getenv('EMAIL_SEND')),
        license=openapi.License(name="Blood Donor App"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', my_admin_site.urls),
    path('', include('blooddonorapp.urls')),
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),

    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('__debug__/', include(debug_toolbar.urls))
]
