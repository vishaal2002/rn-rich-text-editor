import { getContentCSS } from './contentCSS';

export function createHTML() {
  return {
    html: `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  body { margin:0; font-family: system-ui; }
  #editor {
    padding: 12px;
    min-height: 100%;
    outline: none;
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
    
    if (type === 'bold') document.execCommand('bold');
    else if (type === 'italic') document.execCommand('italic');
    else if (type === 'underline') document.execCommand('underline');
    else if (type === 'link') {
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
    else if (type === 'checkboxList') {
      if (document.queryCommandState('insertOrderedList')) {
        document.execCommand('insertOrderedList');
      } else {
        document.execCommand('insertOrderedList');
      }
    }
    else if (type === 'focus') {
      editor.focus();
    }
    else if (type === 'blur') {
      editor.blur();
    }
  });
</script>
</body>
</html>
    `
  };
}
