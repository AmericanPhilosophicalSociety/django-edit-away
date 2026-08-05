from django import forms

from .widgets import TiptapWidget


class TiptapFormField(forms.JSONField):
    widget = TiptapWidget()


class ImageForm(forms.Form):
    file = forms.ImageField(
        required=False,
        label="Image file",
        widget=forms.FileInput(attrs={"class": "tiptap-form"}),
    )
    src = forms.URLField(
        required=False,
        label="Image link",
        widget=forms.URLInput(attrs={"class": "tiptap-form"}),
    )
    alt_text = forms.CharField(widget=forms.TextInput(attrs={"class": "tiptap-form"}))
    caption = forms.CharField(widget=forms.TextInput(attrs={"class": "tiptap-form"}))
    image_display = forms.ChoiceField(
        choices=[("inline-ref", "Inline reference"), ("parallax-ref", "Parallax")],
        widget=forms.Select(attrs={"class": "tiptap-form"}),
    )
