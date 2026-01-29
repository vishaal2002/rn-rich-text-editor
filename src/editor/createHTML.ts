import { getContentCSS } from './contentCSS';

export function createHTML() {
  return {
    html: `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  html, body {
    margin: 0;
    padding: 0;
    font-family: system-ui;
    min-height: 200px;
    height: 100%;
  }
  #editor {
    padding: 12px;
    min-height: 150px;
    outline: none;
    -webkit-user-select: text;
    user-select: text;
  }
  [placeholder]:empty::before {
    content: attr(placeholder);
    color: #999;
  }
</style>
${getContentCSS()}
</head>
<body>
  <div id="editor" contenteditable="true" placeholder="Start typing..."></div>

<script>
  const editor = document.getElementById('editor');

  function post(type, data) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type, data })
    );
  }

  editor.addEventListener('input', () => {
    post('CONTENT_CHANGE', editor.innerHTML);
    post('OFFSET_HEIGHT', editor.scrollHeight);
  });

  document.addEventListener('selectionchange', () => {
    post('SELECTION_CHANGE', {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  });

  editor.addEventListener('focus', () => {
    post('CONTENT_FOCUSED');
  });

  editor.addEventListener('blur', () => {
    post('CONTENT_BLUR');
  });

  window.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    const type = msg.type;

    if (type === 'focus') {
      editor.focus();
    } else if (type === 'blur') {
      editor.blur();
    } else {
      // Restore focus so format commands apply to the editor (important when toolbar tap steals focus)
      editor.focus();
      if (type === 'bold') {
        document.execCommand('bold');
      } else if (type === 'italic') {
        document.execCommand('italic');
      } else if (type === 'underline') {
        document.execCommand('underline');
      } else if (type === 'strikethrough') {
        document.execCommand('strikeThrough');
      } else if (type === 'removeFormat') {
        document.execCommand('removeFormat');
      } else if (type === 'undo') {
        document.execCommand('undo');
      } else if (type === 'redo') {
        document.execCommand('redo');
      } else if (type === 'insertUnorderedList') {
        document.execCommand('insertUnorderedList');
      } else if (type === 'insertOrderedList') {
        document.execCommand('insertOrderedList');
      } else if (type === 'checkboxList') {
        document.execCommand('insertOrderedList');
      } else if (type === 'indent') {
        document.execCommand('indent');
      } else if (type === 'outdent') {
        document.execCommand('outdent');
      } else if (type === 'justifyLeft') {
        document.execCommand('justifyLeft');
      } else if (type === 'justifyCenter') {
        document.execCommand('justifyCenter');
      } else if (type === 'justifyRight') {
        document.execCommand('justifyRight');
      } else if (type === 'justifyFull') {
        document.execCommand('justifyFull');
      } else if (type === 'blockquote') {
        document.execCommand('formatBlock', false, 'blockquote');
      } else if (type === 'code') {
        document.execCommand('formatBlock', false, 'pre');
      } else if (type === 'link') {
        const url = prompt('Enter link URL:');
        if (url) {
          const sel = window.getSelection();
          const range = sel.getRangeAt(0);
          const link = document.createElement('a');
          link.href = url;
          link.textContent = sel.toString() || url;
          range.deleteContents();
          range.insertNode(link);
        }
      }
    }
  });
</script>
</body>
</html>
    `
  };
}
