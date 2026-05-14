from django.core.serializers.json import DjangoJSONEncoder

from .tiptap import Tiptap


class TiptapJSONEncoder(DjangoJSONEncoder):
    '''Custom JSON Encoder to handle items of class Tiptap'''

    def default(self, obj):
        if isinstance(obj, Tiptap):
            return obj.to_dict()
        return super().default(obj)
