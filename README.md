# React Native Rich Text Editor

A powerful, feature-rich text editor component for React Native built with WebView. Perfect for creating rich text editing experiences in your React Native applications.

## Features

- ✨ **Rich Text Formatting**: Bold, italic, underline, strikethrough, and more
- 📝 **Text Styling**: Font size, font family, text color, highlight color, line height
- 📋 **Lists**: Bullet lists, ordered lists, and checkbox lists
- 🔗 **Media Support**: Insert images and videos
- 📐 **Alignment**: Left, center, right, and justify alignment
- 📑 **Headings**: Support for H1-H6 headings
- 💻 **Code Blocks**: Insert code blocks and inline code
- 🔄 **Undo/Redo**: Full undo and redo support
- ⌨️ **Keyboard Management**: Built-in keyboard handling for iOS and Android
- 🎨 **Customizable**: Fully customizable toolbar and editor styles
- 📱 **Cross-Platform**: Works on both iOS and Android
- ♿ **Accessible**: Built with accessibility in mind

## Installation

```bash
npm install rn-rich-text-editor
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install react react-native react-native-webview
```

## Quick Start

```tsx
import React, { useRef } from 'react';
import { View } from 'react-native';
import { Editor, Toolbar } from 'rn-rich-text-editor';

function App() {
  const editorRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <Editor
        ref={editorRef}
        placeholder="Start typing..."
        onChange={(html) => console.log('Content changed:', html)}
      />
      <Toolbar editor={editorRef} />
    </View>
  );
}
```

## Components

### Editor

The main editor component that provides the rich text editing interface.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `RefObject<EditorRef>` | - | Reference to access editor methods |
| `contentInset` | `object` | `{}` | Content inset for the editor |
| `style` | `object` | `{}` | Custom styles for the editor container |
| `placeholder` | `string` | `''` | Placeholder text shown when editor is empty |
| `initialContentHTML` | `string` | `''` | Initial HTML content to load |
| `initialFocus` | `boolean` | `false` | Whether to focus the editor on mount |
| `disabled` | `boolean` | `false` | Disable the editor |
| `readOnly` | `boolean` | `false` | Make the editor read-only |
| `useContainer` | `boolean` | `true` | Use a container wrapper with height |
| `pasteAsPlainText` | `boolean` | `false` | Paste content as plain text |
| `autoCapitalize` | `string` | `'off'` | Auto-capitalization setting |
| `defaultParagraphSeparator` | `string` | `'div'` | Default paragraph separator (`'div'` or `'p'`) |
| `editorInitializedCallback` | `() => void` | `() => {}` | Callback when editor is initialized |
| `initialHeight` | `number` | `0` | Initial height of the editor (0 = auto) |
| `dataDetectorTypes` | `string[]` | `['none']` | Data detector types for links, phone numbers, etc. |
| `editorStyle` | `object` | - | Custom editor styles (see EditorStyle below) |
| `html` | `string \| { html: string }` | - | HTML content (alternative to `initialContentHTML`) |
| `onFocus` | `() => void` | - | Callback when editor gains focus |
| `onBlur` | `() => void` | - | Callback when editor loses focus |
| `onChange` | `(html: string) => void` | - | Callback when content changes |
| `onPaste` | `(data: unknown) => void` | - | Callback when content is pasted |
| `onKeyUp` | `(data: unknown) => void` | - | Callback on key up event |
| `onKeyDown` | `(data: unknown) => void` | - | Callback on key down event |
| `onInput` | `(data: unknown) => void` | - | Callback on input event |
| `onMessage` | `(message: unknown) => void` | - | Callback for editor messages |
| `onCursorPosition` | `(offsetY: number) => void` | - | Callback when cursor position changes |
| `onLink` | `(data: unknown) => void` | - | Callback when a link is clicked |
| `onHeightChange` | `(height: number) => void` | - | Callback when editor height changes |
| `errorMessage` | `string` | - | Error message to display |

#### EditorStyle Object

```typescript
{
  backgroundColor?: string;      // Editor background color
  color?: string;                // Text color
  placeholderColor?: string;     // Placeholder text color
  caretColor?: string;           // Cursor/caret color
  initialCSSText?: string;       // Initial CSS styles
  cssText?: string;              // Additional CSS styles
  contentCSSText?: string;       // Content area CSS styles
}
```

#### EditorRef Methods

Access these methods through the editor ref:

| Method | Parameters | Description |
|--------|------------|-------------|
| `setContentHTML` | `(html: string)` | Set the editor content HTML |
| `getContentHtml` | `()` | Get the current content HTML (returns Promise) |
| `setPlaceholder` | `(placeholder: string)` | Set the placeholder text |
| `setContentStyle` | `(styles: object)` | Update editor styles dynamically |
| `setDisable` | `(disabled: boolean)` | Enable/disable the editor |
| `focusContentEditor` | `()` | Focus the editor |
| `blurContentEditor` | `()` | Blur the editor |
| `showAndroidKeyboard` | `()` | Show keyboard on Android |
| `dismissKeyboard` | `()` | Dismiss the keyboard |
| `insertText` | `(text: string)` | Insert plain text at cursor |
| `insertHTML` | `(html: string)` | Insert HTML at cursor |
| `insertImage` | `(attributes: object, style?: object)` | Insert an image |
| `insertVideo` | `(attributes: object, style?: object)` | Insert a video |
| `insertLink` | `(title: string, url: string)` | Insert a link |
| `setFontSize` | `(size: unknown)` | Set font size |
| `setFontName` | `(name: string)` | Set font family |
| `setForeColor` | `(color: string)` | Set text color |
| `setHiliteColor` | `(color: string)` | Set highlight/background color |
| `setLineHeight` | `(value: number \| string)` | Set line height |
| `command` | `(command: unknown)` | Execute a command |
| `commandDOM` | `(command: unknown)` | Execute a DOM command |
| `injectJavascript` | `(script: string)` | Inject custom JavaScript |
| `registerToolbar` | `(listener: (items: string[]) => void)` | Register toolbar selection listener |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isKeyboardOpen` | `boolean` | Whether the keyboard is currently open |

### Toolbar

A customizable toolbar component that provides formatting buttons for the editor.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editor` | `{ current: EditorRef \| null }` | - | Editor ref object (use `editor={editorRef}`) |
| `getEditor` | `() => EditorRef \| null` | - | Function that returns editor ref (alternative to `editor`) |
| `actions` | `string[]` | `defaultActions` | Array of action keys to display (see Actions below) |
| `disabled` | `boolean` | `false` | Disable all toolbar buttons |
| `readOnly` | `boolean` | `false` | Hide toolbar when read-only |
| `iconTint` | `string` | `'#71787F'` | Default icon color |
| `selectedIconTint` | `string` | - | Selected icon color |
| `disabledIconTint` | `string` | - | Disabled icon color |
| `iconSize` | `number` | `20` | Size of toolbar icons |
| `iconGap` | `number` | `16` | Gap between toolbar icons |
| `style` | `object` | - | Custom styles for toolbar container |
| `itemStyle` | `object` | - | Custom styles for toolbar items |
| `selectedButtonStyle` | `object` | - | Styles for selected buttons |
| `unselectedButtonStyle` | `object` | - | Styles for unselected buttons |
| `disabledButtonStyle` | `object` | - | Styles for disabled buttons |
| `iconMap` | `Record<string, unknown>` | - | Custom icon map (override default icons) |
| `renderAction` | `(action: string, selected: boolean) => React.ReactElement` | - | Custom render function for actions |
| `onPressAddImage` | `() => void` | - | Callback when image button is pressed |
| `onInsertLink` | `() => void` | - | Callback when link button is pressed |
| `insertVideo` | `() => void` | - | Callback when video button is pressed |
| `flatContainerStyle` | `object` | - | Styles for the FlatList container |
| `horizontal` | `boolean` | `true` | Whether to display toolbar horizontally |
| `children` | `React.ReactNode` | - | Additional content to render in toolbar |

#### Custom Action Handlers

You can provide custom handlers for specific actions by passing them as props:

```tsx
<Toolbar
  editor={editorRef}
  fontSize={() => {
    // Custom font size handler
    editorRef.current?.setFontSize(18);
  }}
  foreColor={() => {
    // Custom color picker handler
    editorRef.current?.setForeColor('#FF0000');
  }}
  lineHeight={() => {
    // Custom line height handler
    editorRef.current?.setLineHeight(1.5);
  }}
/>
```

## Actions

The toolbar uses action constants to identify different formatting options. Import them from the package:

```tsx
import { actions } from 'rn-rich-text-editor';
```

### Available Actions

| Action | Constant | Description |
|--------|----------|-------------|
| **Text Formatting** |
| Bold | `actions.setBold` | Make text bold |
| Italic | `actions.setItalic` | Make text italic |
| Underline | `actions.setUnderline` | Underline text |
| Strikethrough | `actions.setStrikethrough` | Strikethrough text |
| Subscript | `actions.setSubscript` | Subscript text |
| Superscript | `actions.setSuperscript` | Superscript text |
| Remove Format | `actions.removeFormat` | Remove all formatting |
| **Headings** |
| Heading 1 | `actions.heading1` | Apply H1 heading |
| Heading 2 | `actions.heading2` | Apply H2 heading |
| Heading 3 | `actions.heading3` | Apply H3 heading |
| Heading 4 | `actions.heading4` | Apply H4 heading |
| Heading 5 | `actions.heading5` | Apply H5 heading |
| Heading 6 | `actions.heading6` | Apply H6 heading |
| Paragraph | `actions.setParagraph` | Apply paragraph style |
| **Alignment** |
| Align Left | `actions.alignLeft` | Align text left |
| Align Center | `actions.alignCenter` | Align text center |
| Align Right | `actions.alignRight` | Align text right |
| Align Full | `actions.alignFull` | Justify text |
| Align (Cycle) | `actions.align` | Cycle through alignments |
| **Lists** |
| Bullet List | `actions.insertBulletsList` | Insert unordered list |
| Ordered List | `actions.insertOrderedList` | Insert ordered list |
| Checkbox List | `actions.checkboxList` | Insert checkbox list |
| Indent | `actions.indent` | Increase indent |
| Outdent | `actions.outdent` | Decrease indent |
| **Media** |
| Insert Image | `actions.insertImage` | Insert image |
| Insert Video | `actions.insertVideo` | Insert video |
| Insert Link | `actions.insertLink` | Insert hyperlink |
| **Text Styling** |
| Font Size | `actions.fontSize` | Change font size |
| Font Name | `actions.fontName` | Change font family |
| Text Color | `actions.foreColor` | Change text color |
| Highlight Color | `actions.hiliteColor` | Change highlight color |
| Line Height | `actions.lineHeight` | Change line height |
| **Other** |
| Code Block | `actions.code` | Insert code block |
| Blockquote | `actions.blockquote` | Insert blockquote |
| Horizontal Rule | `actions.setHR` | Insert horizontal line |
| Line | `actions.line` | Insert line break |
| Undo | `actions.undo` | Undo last action |
| Redo | `actions.redo` | Redo last action |
| Table | `actions.table` | Insert table |
| Keyboard | `actions.keyboard` | Toggle keyboard |

### Default Actions

The toolbar comes with a default set of actions:

```tsx
import { defaultActions } from 'rn-rich-text-editor';

// Default actions include:
// - keyboard
// - setBold
// - setItalic
// - setUnderline
// - removeFormat
// - insertBulletsList
// - indent
// - outdent
// - insertLink
// - lineHeight
```

## Usage Examples

### Basic Editor with Toolbar

```tsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Editor, Toolbar } from 'rn-rich-text-editor';

function RichTextEditor() {
  const editorRef = useRef(null);

  return (
    <View style={styles.container}>
      <Editor
        ref={editorRef}
        placeholder="Start typing..."
        onChange={(html) => {
          console.log('Content:', html);
        }}
        style={styles.editor}
      />
      <Toolbar editor={editorRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editor: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    minHeight: 200,
  },
});
```

### Custom Toolbar Actions

```tsx
import React, { useRef } from 'react';
import { Editor, Toolbar, actions } from 'rn-rich-text-editor';

function CustomToolbar() {
  const editorRef = useRef(null);

  const customActions = [
    actions.keyboard,
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.heading1,
    actions.insertBulletsList,
    actions.insertOrderedList,
    actions.insertLink,
    actions.insertImage,
  ];

  return (
    <>
      <Editor ref={editorRef} />
      <Toolbar editor={editorRef} actions={customActions} />
    </>
  );
}
```

### Inserting Content Programmatically

```tsx
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { Editor } from 'rn-rich-text-editor';

function ProgrammaticEditor() {
  const editorRef = useRef(null);

  const insertImage = () => {
    editorRef.current?.insertImage(
      { src: 'https://example.com/image.jpg', alt: 'Image' },
      { width: '100%', height: 'auto' }
    );
  };

  const insertLink = () => {
    editorRef.current?.insertLink('Click here', 'https://example.com');
  };

  const insertText = () => {
    editorRef.current?.insertText('Hello World!');
  };

  return (
    <View>
      <Editor ref={editorRef} />
      <Button title="Insert Image" onPress={insertImage} />
      <Button title="Insert Link" onPress={insertLink} />
      <Button title="Insert Text" onPress={insertText} />
    </View>
  );
}
```

### Styling the Editor

```tsx
import React, { useRef } from 'react';
import { Editor } from 'rn-rich-text-editor';

function StyledEditor() {
  const editorRef = useRef(null);

  return (
    <Editor
      ref={editorRef}
      editorStyle={{
        backgroundColor: '#f5f5f5',
        color: '#333',
        placeholderColor: '#999',
        caretColor: '#007AFF',
        contentCSSText: `
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          line-height: 1.6;
        `,
      }}
    />
  );
}
```

### Custom Toolbar Styling

```tsx
import React, { useRef } from 'react';
import { Editor, Toolbar } from 'rn-rich-text-editor';

function CustomStyledToolbar() {
  const editorRef = useRef(null);

  return (
    <>
      <Editor ref={editorRef} />
      <Toolbar
        editor={editorRef}
        iconTint="#333"
        selectedIconTint="#007AFF"
        iconSize={24}
        iconGap={20}
        style={{
          backgroundColor: '#f0f0f0',
          paddingVertical: 8,
        }}
        selectedButtonStyle={{
          backgroundColor: '#e0e0e0',
          borderRadius: 4,
        }}
      />
    </>
  );
}
```

### Handling Image Insertion

```tsx
import React, { useRef, useState } from 'react';
import { Editor, Toolbar, actions } from 'rn-rich-text-editor';
import { ImagePicker } from 'react-native-image-picker';

function ImageEditor() {
  const editorRef = useRef(null);
  const [html, setHtml] = useState('');

  const handleAddImage = () => {
    ImagePicker.launchImageLibrary({}, (response) => {
      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        editorRef.current?.insertImage(
          { src: imageUri, alt: 'Image' },
          { width: '100%', height: 'auto' }
        );
      }
    });
  };

  return (
    <>
      <Editor
        ref={editorRef}
        onChange={setHtml}
        initialContentHTML={html}
      />
      <Toolbar
        editor={editorRef}
        onPressAddImage={handleAddImage}
      />
    </>
  );
}
```

### Read-Only Mode

```tsx
import React from 'react';
import { Editor } from 'rn-rich-text-editor';

function ReadOnlyViewer() {
  const htmlContent = '<p>This is read-only content</p>';

  return (
    <Editor
      readOnly={true}
      initialContentHTML={htmlContent}
      editorStyle={{
        backgroundColor: '#fff',
        color: '#333',
      }}
    />
  );
}
```

### Getting Content

```tsx
import React, { useRef } from 'react';
import { Button } from 'react-native';
import { Editor } from 'rn-rich-text-editor';

function ContentGetter() {
  const editorRef = useRef(null);

  const getContent = async () => {
    try {
      const html = await editorRef.current?.getContentHtml();
      console.log('Editor content:', html);
      // Use html for saving, sending, etc.
    } catch (error) {
      console.error('Error getting content:', error);
    }
  };

  return (
    <>
      <Editor ref={editorRef} />
      <Button title="Get Content" onPress={getContent} />
    </>
  );
}
```

## Advanced Usage

### Custom Icon Map

```tsx
import React, { useRef } from 'react';
import { Editor, Toolbar, actions } from 'rn-rich-text-editor';
import { Image } from 'react-native';

function CustomIcons() {
  const editorRef = useRef(null);

  const iconMap = {
    [actions.setBold]: require('./assets/custom-bold.png'),
    [actions.setItalic]: require('./assets/custom-italic.png'),
    // ... more custom icons
  };

  return (
    <>
      <Editor ref={editorRef} />
      <Toolbar editor={editorRef} iconMap={iconMap} />
    </>
  );
}
```

### Custom Action Renderer

```tsx
import React, { useRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Editor, Toolbar, actions } from 'rn-rich-text-editor';

function CustomRenderer() {
  const editorRef = useRef(null);

  const renderAction = (action, selected) => {
    if (action === actions.setBold) {
      return (
        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: selected ? '#007AFF' : 'transparent',
          }}
          onPress={() => editorRef.current?.sendAction(action, 'result')}
        >
          <Text style={{ fontWeight: 'bold' }}>B</Text>
        </TouchableOpacity>
      );
    }
    // Return null to use default rendering
    return null;
  };

  return (
    <>
      <Editor ref={editorRef} />
      <Toolbar editor={editorRef} renderAction={renderAction} />
    </>
  );
}
```

## TypeScript Support

This package includes TypeScript definitions. Import types as needed:

```typescript
import { Editor, Toolbar, EditorRef, EditorProps, ToolbarProps, actions } from 'rn-rich-text-editor';

const editorRef = useRef<EditorRef>(null);

const editorProps: EditorProps = {
  placeholder: 'Type here...',
  onChange: (html) => console.log(html),
};
```

## Platform-Specific Notes

### iOS
- Uses WebKit WebView
- Keyboard handling is automatic
- Supports all features

### Android
- Uses Android WebView
- May require additional keyboard handling
- All features supported

## Troubleshooting

### Editor not focusing
- Ensure `initialFocus` is set to `true` if needed
- Call `editorRef.current?.focusContentEditor()` programmatically
- On Android, use `showAndroidKeyboard()` before focusing

### Content not updating
- Use `onChange` callback instead of polling `getContentHtml()`
- Ensure `initialContentHTML` is set correctly on mount

### Toolbar not responding
- Verify `editor` prop is correctly passed with ref object
- Check that editor is initialized before toolbar interactions
- Ensure `disabled` prop is not set to `true`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/vishaal2002/rn-rich-text-editor).
