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

  window.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'bold') document.execCommand('bold');
    if (msg.type === 'italic') document.execCommand('italic');
    if (msg.type === 'underline') document.execCommand('underline');
  });
</script>
</body>
</html>
    `
  };
}
