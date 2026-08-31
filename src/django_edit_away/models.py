from django.db import models
import nh3

from .tiptap import Tiptap
from .serializers import TiptapJSONEncoder

from .forms import TiptapFormField


class TiptapDescriptor:
    '''Parses field output into Tiptap content'''
    def __init__(self, field):
        self.field = field

    def __get__(self, obj, owner):
        if obj is None:
            return self

        return obj.__dict__[self.field.name]

    def __set__(self, obj, value):
        obj.__dict__[self.field.name] = self.convert_input(value)

    def convert_input(self, value):
        if value is None:
            return None

        if isinstance(value, Tiptap):
            return value

        elif isinstance(value, str):
            # sanitize input
            value = nh3.clean(
                value,
                tags={
                    'p',
                    'h1',
                    'h2',
                    'h3',
                    'blockquote',
                    'ul',
                    'ol',
                    'li',
                    'br',
                    'hr',
                    'strong',
                    'b',
                    'em',
                    'i',
                    'u',
                    'a',
                    'img',
                    'figure',
                    'figcaption',
                },
                attributes={
                    'a': {
                        'href',
                    },
                    'img': {
                        'alt',
                        'src',
                    },
                },
            )
            return Tiptap(value, '')
        else:
            return Tiptap(**value)


class TiptapField(models.JSONField):
    description = 'A Rich text field that stores Tiptap output as JSON'

    def __init__(self, *args, **kwargs):
        kwargs['encoder'] = TiptapJSONEncoder
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        del kwargs['encoder']
        return name, path, args, kwargs

    def from_db_value(self, value, expression, connection):
        db_value = super().from_db_value(value, expression, connection)
        if db_value is None:
            return db_value

        return Tiptap(**db_value)

    def get_prep_value(self, value):
        if not isinstance(value, str):
            dict_val = value
        else:
            dict_val = value.to_dict()
        prep_val = super().get_prep_value(dict_val)
        return prep_val

    def contribute_to_class(self, cls, name, **kwargs):
        super().contribute_to_class(cls, name, **kwargs)
        setattr(cls, self.name, TiptapDescriptor(self))

    def formfield(self, **kwargs):
        defaults = {'form_class': TiptapFormField}
        defaults.update(kwargs)
        return super().formfield(**defaults)
