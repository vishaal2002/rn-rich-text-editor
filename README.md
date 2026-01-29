# React Native Rich Editor

A rich text editor component for React Native using WebView.

## Installation

```bash
npm install rn-rich-text-editor
```

## Usage

```tsx
import { Editor, Toolbar, actions } from 'rn-rich-text-editor';

function App() {
  return (
    <>
      <Editor ref={editorRef} onMessage={handleMessage} />
      <Toolbar editorRef={editorRef} />
    </>
  );
}
```

## API

### Editor

Main editor component.

**Props:**
- `onMessage?: (event: any) => void` - Callback for editor messages

**Ref Methods:**
- `sendAction(type: string)` - Send action to editor

### Toolbar

Toolbar component for editor actions.

**Props:**
- `editorRef: RefObject` - Reference to Editor instance

### Actions

Predefined editor actions.

## License

MIT
