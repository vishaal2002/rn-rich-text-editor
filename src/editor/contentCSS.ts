export function getContentCSS() {
    return `
    <style>
      img, video {
        max-width: 100%;
        display: block;
        margin: 12px auto;
      }
      blockquote {
        border-left: 4px solid #ddd;
        padding-left: 12px;
        margin: 12px 0;
      }
      pre {
        background: #f4f4f4;
        padding: 10px;
        border-radius: 6px;
        font-family: monospace;
      }
    </style>
    `;
  }
  