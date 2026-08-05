from django.urls import path
from .views import ImageUploadView

urlpatterns = [
    path("image_upload/", ImageUploadView.as_view(), name="image-upload"),
]
