import { tiptapInit } from './javascript/editor.js';

import 'remixicon/fonts/remixicon.css';
import './styles/main.scss';

// is there a way to do this without declaring this function here?
export function createTiptap(ele, fieldName) {
    tiptapInit(ele, fieldName);
}
