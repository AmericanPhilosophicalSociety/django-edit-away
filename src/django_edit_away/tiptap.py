class Tiptap:
    '''Container for representing tiptap data as HTML and JSON'''

    def __init__(self, html, json_value):
        self.html = html
        self.json_value = json_value

    def to_dict(self):
        return {
            'html': self.html,
            'json_value': self.json_value,
        }
