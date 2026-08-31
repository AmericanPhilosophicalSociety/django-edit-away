from django.http import JsonResponse
from django.template.loader import render_to_string
from django.core.files.storage import default_storage

from django.views.generic.edit import BaseFormView

from .forms import ImageForm


class ImageUploadView(BaseFormView):
    """
    Handle requests to upload images to rich text editor
    """

    form_class = ImageForm
    success_url = "/"

    def form_invalid(self, form):
        """
        Return JSON response if request made via AJAX, otherwise
        return default HTML response
        """
        if self.request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse(form.errors, status=400)

        response = super().form_invalid(form)
        return response

    def form_valid(self, form):
        """
        If the form is valid, the contents are saved.

        If the request is made via AJAX, a JSON response returns
        the HTML code for inserting the image in the rich text
        editor, e.g.:

        { image_code: <img class='left-align' src=media/image/foo.jpg> }
        """
        response = super().form_valid(form)

        if self.request.headers.get("x-requested-with") == "XMLHttpRequest":
            data = form.cleaned_data
            del data["file"]
            if self.request.FILES:
                image = self.request.FILES["file"]
                # TODO: before saving image, make sure it is a sane size and format
                image_path = default_storage.save(image.name, image)
                data["src"] = default_storage.url(image_path)
            return JsonResponse(data)

        return response

    def get(self, request, *args, **kwargs):
        """
        If the request comes via AJAX, render HTML and
        dispatch as JSON
        """
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            form = ImageForm()
            html = render_to_string("django_edit_away/image_form.html", {"form": form})
            return JsonResponse(html, safe=False)

        return super().get(self, request, *args, **kwargs)
