# Release Notes

## Version 1.5.0 (Latest)

### Major Feature
- **XSS Protection**: Added built-in HTML sanitization to protect against cross-site scripting (XSS) attacks
  - New `sanitizeHtml` prop (default: `true`) controls sanitization behavior
  - Automatically removes dangerous elements: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, etc.
  - Strips event handler attributes: `onclick`, `onerror`, `onload`, etc.
  - Blocks dangerous URL protocols: `javascript:`, `vbscript:`, `data:`
  - Sanitizes HTML on paste, insert, and content load operations
  - Set `sanitizeHtml={false}` only if you fully trust all HTML content sources

### Bug Fixes
- **Read-Only Layout**: Reduced excessive padding below read-only rich text fields for tighter layout spacing

### TypeScript
- Added `sanitizeHtml` prop to TypeScript definitions with full documentation

---

## Version 1.4.0

### Major Feature
- **ColorPicker Component**: Released ColorPicker component as a stable feature for selecting colors with preset options and custom hex input. Perfect for text color (`foreColor`) and highlight color (`hiliteColor`) selection in the toolbar.

### Improvements
- Removed unwanted compiled code from repository
- Enhanced documentation with comprehensive ColorPicker usage examples

---

## Version 1.3.7

### Changes
- **UI Enhancement**: Updated line icon in Toolbar and added new linebreak image asset for better visual consistency

---

## Version 1.3.6

### Changes
- **HTML Processing**: Added HTML entity decoding in createHTML function to handle escaped entities while preserving normal HTML structure

---

## Version 1.3.5

### Major Feature
- **ColorPicker Component**: Introduced new ColorPicker component for selecting colors with preset options and custom hex input, enhancing text color and highlight color selection capabilities

---

## Version 1.3.4

### Bug Fixes
- **iOS Support**: Added disabled state handling in Editor component to prevent interaction and adjust styles accordingly for iOS platform

### Documentation
- Enhanced README with improved clarity, version badges, and better project description

---

## Version 1.3.3

### Bug Fixes
- **Paste Handling**: Enhanced paste handling in createHTML function to support HTML content and improve text insertion logic

---

## Version 1.3.2

### Improvements
- **Code Quality**: Simplified FadeOverlay component and streamlined icon rendering in Toolbar for better maintainability

---

## Version 1.3.1

### Bug Fixes
- **Toolbar**: Enhanced separator handling in Toolbar component for improved style flexibility

---

## Version 1.3.0 (Minor Release)

### Major Features
- **Toolbar Enhancement**: Added visual separator to toolbar actions for improved layout and usability, making it easier to group related actions

### Improvements
- **Read-Only Mode**: Updated read-only HTML styles to improve spacing and layout consistency

### Bug Fixes (from v1.2.1 - v1.2.3)
- Fixed height calculation in read-only mode to ensure proper content visibility and alignment
- Corrected nestedScrollEnabled logic and ensured container expands fully in read-only mode
- Enhanced editor component to support dynamic height adjustment in read-only mode and improved WebView styling

---

## Version 1.2.0 (Minor Release)

### Major Features
- **Read-Only HTML Generation**: Improved read-only HTML generation by adding default font handling and adjusting body styles for better layout and consistency

### Improvements
- Enhanced dynamic height adjustment in read-only mode
- Fixed nestedScrollEnabled logic for better content visibility
- Improved WebView styling in read-only mode

---

## Version 1.1.0 (Minor Release)

### Major Features
- **Read-Only Mode**: Introduced comprehensive read-only mode support with dynamic height adjustment
  - Editor and Toolbar components now support read-only mode
  - Dynamic height adjustment for better content display
  - Improved styling logic for read-only state

---

## Version 1.0.0 (Major Release)

### Initial Stable Release

This is the first major stable release of the React Native Rich Text Editor. Key features include:

#### Core Features
- **Rich Text Formatting**: Bold, italic, underline, strikethrough, subscript, superscript
- **Text Styling**: Font size, family, colors, highlights, line height
- **Lists & Structure**: Bullet lists, numbered lists, checkbox lists, headings (H1-H6)
- **Media Support**: Insert images and videos with custom styling
- **Alignment**: Left, center, right, justify with cycle button
- **Code & Blocks**: Code blocks, blockquotes, horizontal rules
- **Smart Paste**: Automatically preserves HTML formatting from web pages and documents
- **Keyboard Management**: Built-in iOS/Android keyboard handling

#### Component Architecture
- **Editor Component**: Main rich text editing component with WebView-based editor
- **Toolbar Component**: Customizable toolbar with action buttons
- **TypeScript Support**: Full TypeScript definitions included
- **Customizable**: Toolbar, icons, styles, and behavior fully customizable

#### Platform Support
- iOS (WebKit WebView)
- Android (Android WebView)

#### Developer Experience
- Comprehensive API with ref-based methods
- Event callbacks (onChange, onFocus, onBlur, onPaste, etc.)
- Custom styling support
- Action-based toolbar configuration

---

## Summary of Major Changes by Release Type

### Major Releases
- **v1.0.0**: Initial stable release with full rich text editing capabilities

### Minor Releases
- **v1.1.0**: Read-only mode with dynamic height adjustment
- **v1.2.0**: Enhanced read-only HTML generation and layout improvements
- **v1.3.0**: Visual toolbar separators and improved read-only styling
- **v1.4.0**: ColorPicker component released as stable feature
- **v1.5.0**: XSS protection with HTML sanitization

### Key Unique Features by Version
- **v1.0.0**: Core rich text editing functionality
- **v1.1.0**: Read-only mode support
- **v1.2.0**: Improved read-only HTML rendering
- **v1.3.0**: Toolbar visual enhancements
- **v1.3.5**: ColorPicker component (introduced)
- **v1.4.0**: ColorPicker component (stable release)
- **v1.5.0**: Built-in XSS protection
