export function getContentCSS() {
  return `
  <style>
      video {max-width: 98%;margin-left:auto;margin-right:auto;display: block;}
      img {max-width: 98%;vertical-align: middle;}
      table {width: 100% !important;}
      table td {width: inherit;}
      table span { font-size: 12px !important; }
      .x-todo li {list-style:none;}
      .x-todo-box {position: relative; left: -24px;}
      .x-todo-box input{position: absolute;}
      blockquote{border-left: 6px solid #ddd;padding: 5px 0 5px 10px;margin: 15px 0 15px 15px;}
      hr{display: block;height: 0; border: 0;border-top: 1px solid #ccc; margin: 15px 0; padding: 0;}
      pre{padding: 10px 5px 10px 10px;margin: 15px 0;display: block;line-height: 18px;background: #F0F0F0;border-radius: 6px;font-size: 13px; font-family: 'monaco', 'Consolas', "Liberation Mono", Courier, monospace; word-break: break-all; word-wrap: break-word;overflow-x: auto;}
      pre code {display: block;font-size: inherit;white-space: pre-wrap;color: inherit;}
  </style>
  `;
  }
  