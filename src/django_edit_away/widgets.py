from django.forms.widgets import Textarea
from django.template.loader import render_to_string


class TiptapWidget(Textarea):
    class Media:
        js = ['django_exhibits/tiptap.js']

    def render(self, name, value, attrs, renderer=None):
        print(name)
        attrs_for_textarea = attrs.copy()
        attrs_for_textarea["hidden"] = "true"
        widget_attrs = {'name': attrs_for_textarea['id']}
        return super().render(
            name, value, attrs_for_textarea, renderer
        ) + render_to_string("django_exhibits/tiptap_widget.html", context=widget_attrs)
