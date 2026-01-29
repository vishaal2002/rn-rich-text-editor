# React Native Rich Editor

A rich text editor component for React Native using WebView.

## Installation

```bash
npm install rn-rich-text-editor
```

## Usage

```tsx
import { RichEditor, RichToolbar, actions } from 'rn-rich-text-editor';

function App() {
  return (
    <>
      <RichEditor ref={editorRef} onMessage={handleMessage} />
      <RichToolbar editorRef={editorRef} />
    </>
  );
}
```

## API

### RichEditor

Main editor component.

**Props:**
- `onMessage?: (event: any) => void` - Callback for editor messages

**Ref Methods:**
- `sendAction(type: string)` - Send action to editor

### RichToolbar

Toolbar component for editor actions.

**Props:**
- `editorRef: RefObject` - Reference to RichEditor instance

### Actions

Predefined editor actions.

## License

MIT
