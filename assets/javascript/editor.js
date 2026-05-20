import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import { BulletList, OrderedList, ListItem, ListKeymap } from '@tiptap/extension-list';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Dropcursor, Gapcursor, UndoRedo } from '@tiptap/extensions';
import { Figure } from './figure.js';

import { csrftoken } from './cookies.js';


export function tiptapInit(ele, fieldName) {
    const editor = new Editor({
        element: document.querySelector(ele),
        extensions: [
            Document,
            Paragraph,
            Text,
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Blockquote,
            BulletList,
            OrderedList,
            ListItem,
            ListKeymap,
            HardBreak,
            HorizontalRule,
            Bold,
            Italic,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Youtube,
            Dropcursor,
            Gapcursor,
            UndoRedo,
            Figure,
        ],
        content: '<p>Sing, O Muse, of the history of science...</p>',
        
        onTransaction({ editor }) {
            checkActive();
        },
    });

    // actions that do not require custom logic
    const toolbarActions = [
        { id: `#${fieldName}-editor-h1`, name: 'heading', command: 'toggleHeading', disable: true, argument: { level: 1 } },
        { id: `#${fieldName}-editor-h2`, name: 'heading', command: 'toggleHeading', disable: true, argument: { level: 2 } },
        { id: `#${fieldName}-editor-h3`, name: 'heading', command: 'toggleHeading', disable: true, argument: { level: 3 } },
        { id: `#${fieldName}-editor-bold`, name: 'bold', command: 'toggleBold', disable: true },
        { id: `#${fieldName}-editor-italic`, name: 'italic', command: 'toggleItalic', disable: true },
        { id: `#${fieldName}-editor-underline`, name: 'underline', command: 'toggleUnderline', disable: true },
        { id: `#${fieldName}-editor-ol`, name: 'orderedList', command: 'toggleOrderedList', disable: true  },
        { id: `#${fieldName}-editor-ul`, name: 'bulletList', command: 'toggleBulletList', disable: true },
        // BUG: Removing links from this list means their activity is not tracked
        // { id: '#editor-link', name: 'link', command: 'toggleLink', disable: true },
        { id: `#${fieldName}-editor-blockquote`, name: 'blockquote', command: 'toggleBlockquote', disable: true },
        { id: `#${fieldName}-editor-clear`, name: 'clear marks', command: 'unsetAllMarks', disable: true },
    ]

    const editorText = JSON.parse(document.querySelector(`#${fieldName}`).value);
    if (editorText) {
        editor.commands.setContent(editorText.json_value);
    }

    for (let i = 0; i < toolbarActions.length; i++) {
        let a = toolbarActions[i]
        if (a.argument) {
            document.querySelector(a.id).addEventListener('click', () => {
                editor.chain().focus()[a.command](a.argument).run()
            })
        }
        else {
            document.querySelector(a.id).addEventListener('click', () => {
                editor.chain().focus()[a.command]().run()
            })

        }
    }

    function checkActive() {
        for (let i in toolbarActions) {
            let a = toolbarActions[i];
            let b = document.querySelector(a.id)
            // disable logic is producing counterintuitive results due to button interactions
            // so removing it for now
            /*
            if (a.disable) {
                if (editor.can().chain().focus()[a.command]().run()) {
                    b.removeAttribute('disabled')
                } else {
                    b.setAttribute('disabled', 'true')
                }
            }
            */
            if (a.argument) {
                if (!editor.isActive(a.name, a.argument)) {
                    b.classList.remove('active');
                } else {
                    if (editor.isActive(a.name, a.argument)) {
                        b.classList.add('active')
                    }
                }
            } else {
                if (!editor.isActive(a.name)) {
                    b.classList.remove('active')
                } else {
                    if (editor.isActive(a.name)) {
                        b.classList.add('active')
                    }
                }
            }
        }
    }

    // handlers for complex actions

    // dropdowns

    const dropdown = document.querySelector(`#${fieldName}-h-dropdown`);
    dropdown.addEventListener('mousedown', (evt) => {
        evt.preventDefault();
    });

    dropdown.addEventListener('click', dropdownHandler);

    // BUG: Dropdown needs to preserve cursor position in editor
    function dropdownHandler() {
        const content = document.querySelector(`#${fieldName}-editor-dropdown-menu`);
        content.classList.toggle('expanded');
        content.addEventListener('click', (evt) => {
            content.classList.remove('expanded')
        });
    }

    // links
    const linkButton = document.querySelector(`#${fieldName}-editor-link`)

    // activate event listeners for popover after first click, otherwise they don't exist
    linkButton.addEventListener('click', linkHandler);

    // BUG: When user puts their cursor in the text box, visual indication of the original link selection should be preserved
    function linkHandler(evt, text) {
        // variables for link submission buttons
        const linkPopover = createPopover('link');
        document.body.appendChild(linkPopover);
        createCloseButton(linkPopover);
        linkPopover.addEventListener('click', (evt) => {
            closeOnClickOutside(evt, linkPopover);
        });
        linkPopover.showModal();
        const linkTextbox = document.querySelector('#tiptap-link-textbox');
        const linkSubmit = document.querySelector('#tiptap-link-submit');
        const linkActivate = document.querySelector('#tiptap-link-activate');
        const linkDelete = document.querySelector('#tiptap-link-delete');

        if (text) {
            linkTextbox.value = text;
        }
        
        linkTextbox.focus();
        // handle link actions submission
        // Call linkTextEvent independently to activaite buttons and listeners
        linkTextEvent();
        // then call again on input change
        linkTextbox.addEventListener('input', linkTextEvent);

        document.querySelector('#tiptap-link-form').addEventListener('submit', submitLink);
        
        // need to declare this function inside linkHandler so that variables are inherited
        function linkTextEvent() {
            const textInput = document.querySelector('#tiptap-link-textbox').value;
            if (textInput.length > 0) {
                linkSubmit.disabled = false;
                linkDelete.disabled = false;
                linkActivate.classList.remove('disabled');

                linkActivate.setAttribute('href', textInput);
                linkDelete.addEventListener('click', linkDeleteHide)
            } else {
                linkSubmit.disabled = true;
                linkDelete.disabled = true;
                linkActivate.classList.add('disabled');
            }
        }
    };

    function submitLink(evt) {
        evt.preventDefault()
        const textInput = document.querySelector('#tiptap-link-textbox').value;
        // only submit link if len > 1
        if (textInput.length > 0) {
            try {
                editor.chain().focus().extendMarkRange('link').setLink({ href: textInput }).run();
                // should popover be redeclared? Should inherit scope from parent function...
                const linkPopover = document.querySelector('#tiptap-link-dialog');
                destroyModal(linkPopover);
                // add event listeners to links in the editor
                initLinks()
            } catch(e) {
                console.log(e.message)
            }
        }
    }

    function linkDeleteHide() {
        const linkPopover = document.querySelector('#tiptap-link-dialog');
        destroyModal(linkPopover);
        editor.chain().focus().unsetLink().run();
    }

    function linkEdit(evt) {
        evt.preventDefault();
        let hrefValue = editor.getAttributes('link').href;
        linkHandler(evt, hrefValue);
    }

    function initLinks() {
        document.querySelectorAll('.tiptap a').forEach((e) => e.addEventListener('click', linkEdit));
    }

    // on editor initialization, initialize existing links:
    document.querySelectorAll('.tiptap a').forEach((e) => e.addEventListener('click', linkEdit));

    // videos
    const videoButton = document.querySelector(`#${fieldName}-editor-youtube`)

    videoButton.addEventListener('click', videoHandler);

    function videoHandler() {
        const videoPopover = createPopover('video');
        document.body.appendChild(videoPopover);
        createCloseButton(videoPopover);
        videoPopover.addEventListener('click', (evt) => {
            closeOnClickOutside(evt, videoPopover);
        });
        videoPopover.showModal();
        const videoTextbox = document.querySelector('#tiptap-video-textbox');
        const videoSubmit = document.querySelector('#tiptap-video-submit');
        const videoActivate = document.querySelector('#tiptap-video-activate');
        const videoDelete = document.querySelector('#tiptap-video-delete');
        
        videoTextbox.focus();

        videoTextbox.addEventListener('input', videoTextEvent);

        document.querySelector('#tiptap-video-form').addEventListener('submit', submitVideo);

        function videoTextEvent() {
            const textInput = document.querySelector('#tiptap-video-textbox').value;
            if (textInput.length > 0) {
                videoSubmit.disabled = false;
                videoDelete.disabled = false;
                videoActivate.classList.remove('disabled');

                videoActivate.setAttribute('href', textInput);
                videoDelete.addEventListener('click', linkDeleteHide)
            } else {
                videoSubmit.disabled = true;
                videoDelete.disabled = true;
                videoActivate.classList.add('disabled');
            }
        }

        function submitVideo(evt) {
            evt.preventDefault()
            const textInput = document.querySelector('#tiptap-video-textbox').value;
            // only submit link if len > 1
            if (textInput.length > 0) {
                try {
                    editor.commands.setYoutubeVideo({
                        src: textInput,
                        width: 640,
                        height: 480
                    });
                    // should popover be redeclared? Should inherit scope from parent function...
                    destroyModal(videoPopover);
                } catch(e) {
                    console.log(e.message)
                }
            }
        }

        function linkDeleteHide() {
            destroyModal(videoPopover);
        }
    }

    function createPopover(mediaType) {
        const mediaPanel = document.createElement('dialog');
        mediaPanel.setAttribute('id', `tiptap-${mediaType}-dialog`);
        // mediaPanel.setAttribute('closedby', 'any')
        const form = document.createElement('form');
        form.setAttribute('id',`tiptap-${mediaType}-form`);
        mediaPanel.appendChild(form);
        const tiptapInput = document.createElement('div');
        tiptapInput.classList.add('tiptap-link-popover');
        form.appendChild(tiptapInput);
        const inputBox = document.createElement('input');
        inputBox.setAttribute('id', `tiptap-${mediaType}-textbox`);
        inputBox.setAttribute('placeholder', 'Paste a link');
        tiptapInput.appendChild(inputBox)
        const submitButton = document.createElement('button')
        submitButton.setAttribute('type', 'submit');
        submitButton.setAttribute('disabled', true);
        submitButton.setAttribute('id', `tiptap-${mediaType}-submit`);
        submitButton.classList.add('tiptap-btn');
        tiptapInput.appendChild(submitButton);
        const submitIcon = document.createElement('i');
        submitIcon.classList.add('ri-corner-down-left-fill');
        submitButton.appendChild(submitIcon);
        const linkButton = document.createElement('a');
        linkButton.setAttribute('href', '#');
        linkButton.setAttribute('target', '_blank');
        linkButton.setAttribute('rel', 'noopener noreferrer nofollow');
        linkButton.setAttribute('id', `tiptap-${mediaType}-activate`);
        linkButton.classList.add('disabled', 'tiptap-btn');
        tiptapInput.appendChild(linkButton);
        const linkIcon = document.createElement('i');
        linkIcon.classList.add('ri-external-link-line')
        linkButton.appendChild(linkIcon);
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('disabled', true);
        deleteButton.setAttribute('id', `tiptap-${mediaType}-delete`);
        deleteButton.classList.add('tiptap-btn');
        tiptapInput.appendChild(deleteButton);
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('ri-delete-bin-line');
        deleteButton.appendChild(deleteIcon);

        return mediaPanel;
    }

    // TODO: Factor this in to modal creation? Or other abstraction
    function createCloseButton(dialog) {
        const closeButton = document.createElement('button');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.setAttribute('aria-hidden', 'true');
        closeButton.classList.add('tiptap-close-icon');
        const closeText = document.createTextNode('×');
        closeButton.append(closeText);
        closeButton.addEventListener('click', () => {
            destroyPopover(dialog, closeButton);
        })
        dialog.append(closeButton);
    }

    // image figure
    const figureButton = document.querySelector(`#${fieldName}-editor-figure`);

    figureButton.addEventListener('click', addFigure);

    async function addFigure() {
        // does this need to be handled via fetch api? We aren't saving this to a model anymore so theoretically it does not need to retrieve the data from the database
        const httpResposne = await setModal('/image_upload');
        const imagePanel = populateModal(httpResposne);
        document.body.appendChild(imagePanel);
        imagePanel.addEventListener('click', (evt) => {
            closeOnClickOutside(evt, imagePanel);
        });
        imagePanel.showModal();
        // submit and close buttons do not exist before the form is populated, so need to add event listeners here
        const imageSubmit = document.querySelector('#image-submit');
        imageSubmit.addEventListener('click', submitModal);
        const imageModalClose = document.querySelector('#image-modal-close');
        imageModalClose.addEventListener('click', () => {
            destroyModal(imagePanel);
        })
    }

    async function setModal(url) {
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "x-requested-with": "XMLHttpRequest"
                }
            });
            if (!response.ok) {
                // TODO: Need to return something to parse as error for the user
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            // populateModal(result);
            return result;
        } catch (error) {
            console.error(error.message);
        }
    }

    function populateModal(htmlString) {
        const imagePanel = document.createElement('dialog');
        // imagePanel.setAttribute('closedby', 'any');
        imagePanel.classList.add('tiptap-image-form');
        imagePanel.innerHTML = htmlString;
        return imagePanel
    }

    function submitModal() {
        const form = document.querySelector('#image-upload-form');
        postImageUpload('/image_upload/', form);
        const imagePanel = document.querySelector('.tiptap-image-form');
        destroyModal(imagePanel);
    }

    function destroyModal(ele) {
        ele.close();
        ele.remove();
        // this returns the cursor, but we also need a method to reset the mark - link still shows as active link in the text area affected
        editor.commands.focus();
        checkActive();
    }

    function destroyPopover(ele) {
        destroyModal(ele);
    }

    function closeOnClickOutside(event, ele) {
        if (event.target === ele) {
            destroyModal(ele);
        }
    }

    async function postImageUpload(url, form) {
        const formData = new FormData(form);
        try {
            const response = await fetch(url, {
                method: "POST",
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken,
                },
                body: formData
            })
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json()
            /*
            const imageModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#imageUpload'));
            imageModal.hide();
            console.log(result);
            */

            const caption = result.caption;

            editor.chain().focus().setFigure({ class: result.image_display, src: result.src, alt: result.alt_text, caption }).run()
        }
        catch (error) {
            console.error(error.message);
        }
    }

    // handle saving the editor

    const form = document.querySelector('form');


    form.addEventListener('submit', function(evt) {
        evt.preventDefault();
        submitTiptap();
    })

    function submitTiptap() {
        const htmlContent = editor.getHTML();
        const jsonContent = editor.getJSON()
        const databaseValue = {
            html: htmlContent,
            json_value: jsonContent
        };
        const jsonInput = document.querySelector(`#${fieldName}`);
        jsonInput.value = JSON.stringify(databaseValue);
        form.submit();
    }
}