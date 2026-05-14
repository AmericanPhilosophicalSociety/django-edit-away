from django.forms.widgets import Textarea
from django.template.loader import render_to_string


class TiptapWidget(Textarea):
    class Media:
        css = {
            'all': ['css/tiptap.css']
        }
        js = ['js/tiptap.js']

    def render(self, name, value, attrs, renderer=None):
        attrs_for_textarea = attrs.copy()
        attrs_for_textarea["hidden"] = "true"
        return super().render(
            name, value, attrs_for_textarea, renderer
        ) + render_to_string("django_exhibits/tiptap_widget.html")
