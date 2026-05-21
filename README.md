# django-exhibits
WIP exhibit crafter for Django for use in the digital humanities. At the moment, it provides a [Tiptap](https://tiptap.dev/) rich text editor with built-in support for embedding images and Youtube videos.

# Installation

TBD - right now, installing requires compiling the JavaScript dependencies via NPM. A fix is in the works.

Add ```django_exhibits``` to ```INSTALLED_APPS``` in ```settings.py```:

```
INSTALLED_APPS = [
    # ...
    'django_exhibits',
]
```
# Usage

Add ```TiptapField``` to your models:

```
from django.db import models
from django_exhibits.models import TiptapField


class Description(models.Model):
    body = TiptapField()
```

Under the hood, ```TiptapField``` stores data as a ```JSONField``` with two values, ```html``` and ```json_value```. The convenience wrapper ```django_exhibits.tiptap.Tiptap``` provides a ready-made object for holding this data in Python. HTML sanitization is handled via Tiptap. When you use a ```TiptapField``` in a form, the data is always saved from the JSON representation in the Tiptap editor, never from the HTML representation. This means it is only possible to directly modify the stored HTML via the Django shell or direct database access. More robust HTML sanitization for these circumstances is a future work plan.

## In forms

When using a Tiptap field in a form, it is necessary to call the ```form.media``` class to inject additional CSS and JavaScript:

```
<form id="guide-form" method="POST" enctype="multipart/form-data">
    {% csrf_token %}
    {{ form.media }}
    {{ form }}
    <button type="submit" class="btn btn-primary">Save</button>
</form>
```

## In templates

To display rich text content in a Django template outside of forms, call the field by its ```html``` element:

```
{{ object.my_tiptip_field.html|safe }}
```

Since the field stores the raw JSON representation, it is theoretically possible to implement a true WYSIWYG editor by calling a non-editable Tiptap instance, but there are no plans to implement this at present.

## Uploading images

To take advantage of the image upload feature, you must configure your [media settings](https://docs.djangoproject.com/en/6.0/howto/static-files/#serving-files-uploaded-by-a-user-during-development) and add ```django_exhibits.urls``` to your url configuration:

```
from django.urls import path, include

url_patterns = [
    # ...
    path('', include('django_exhibits.urls)),
]
```

The AJAX requests that make image uploads work expect the urlconf to be served from root, so it is essential to follow this configuration exactly. The path ```/image-upload``` should be considered a reserved path for projects using this package.

Uploaded and embedded images can have either the class ```.inline-ref``` or ```.parallax-ref```. The styling of these classes is left to the user, but we hope to provide sample styling in the near future.

## Embedding Youtube videos

To get embedded Youtube videos to work, you must add the following to ```settings.py```:

```
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
```
