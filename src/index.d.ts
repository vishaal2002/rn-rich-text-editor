import type React from 'react';

/** Editor ref API (use with ref on Editor) */
export interface EditorRef {
  registerToolbar: (listener: (items: string[]) => void) => void;
  setContentFocusHandler: (listener: () => void) => void;
  setContentHTML: (html: string) => void;
  setPlaceholder: (placeholder: string) => void;
  setContentStyle: (styles: object) => void;
  setDisable: (disabled: boolean) => void;
  blurContentEditor: () => void;
  focusContentEditor: () => void;
  showAndroidKeyboard: () => void;
  insertImage: (attributes: object, style?: object) => void;
  insertVideo: (attributes: object, style?: object) => void;
  insertText: (text: string) => void;
  insertHTML: (html: string) => void;
  insertLink: (title: string, url: string) => void;
  injectJavascript: (script: string) => void | undefined;
  preCode: (type: unknown) => void;
  setFontSize: (size: unknown) => void;
  setForeColor: (color: string) => void;
  setHiliteColor: (color: string) => void;
  setFontName: (name: string) => void;
  setLineHeight: (value: number | string) => void;
  commandDOM: (command: unknown) => void;
  command: (command: unknown) => void;
  dismissKeyboard: () => void;
  getContentHtml: () => Promise<string>;
  readonly isKeyboardOpen: boolean;
  sendAction: (action: string) => void;
}

/** Props for the Editor component */
export interface EditorProps {
  contentInset?: object;
  style?: object;
  placeholder?: string;
  initialContentHTML?: string;
  initialFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  useContainer?: boolean;
  pasteAsPlainText?: boolean;
  autoCapitalize?: string;
  defaultParagraphSeparator?: string;
  editorInitializedCallback?: () => void;
  initialHeight?: number;
  dataDetectorTypes?: string[];
  editorStyle?: object;
  html?: string | { html: string };
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (html: string) => void;
  onPaste?: (data: unknown) => void;
  onKeyUp?: (data: unknown) => void;
  onKeyDown?: (data: unknown) => void;
  onInput?: (data: unknown) => void;
  onMessage?: (message: unknown) => void;
  onCursorPosition?: (offsetY: number) => void;
  onLink?: (data: unknown) => void;
  onHeightChange?: (height: number) => void;
  errorMessage?: string;
  /**
   * XSS Protection: when true (default), sanitizes HTML on paste and insert operations.
   * This removes dangerous elements (script, iframe, etc.) and event handlers (onclick, onerror, etc.).
   * Set to false only if you trust all HTML content sources.
   * @default true
   */
  sanitizeHtml?: boolean;
  [key: string]: unknown;
}

/** Props for the Toolbar component */
export interface ToolbarProps {
  editor?: { current: EditorRef | null };
  getEditor?: () => EditorRef | null;
  actions?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  iconTint?: string;
  selectedIconTint?: string;
  disabledIconTint?: string;
  iconSize?: number;
  iconGap?: number;
  style?: object;
  itemStyle?: object;
  selectedButtonStyle?: object;
  unselectedButtonStyle?: object;
  disabledButtonStyle?: object;
  separatorStyle?: object;
  iconMap?: Record<string, unknown>;
  renderAction?: (action: string, selected: boolean) => React.ReactElement;
  onPressAddImage?: () => void;
  onInsertLink?: () => void;
  insertVideo?: () => void;
  flatContainerStyle?: object;
  horizontal?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/** Action name constants for toolbar and editor */
export const actions: {
  content: string;
  updateHeight: string;
  setBold: string;
  setItalic: string;
  setUnderline: string;
  heading1: string;
  heading2: string;
  heading3: string;
  heading4: string;
  heading5: string;
  heading6: string;
  insertLine: string;
  setParagraph: string;
  removeFormat: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  alignFull: string;
  align: string;
  insertBulletsList: string;
  insertOrderedList: string;
  checkboxList: string;
  insertLink: string;
  insertText: string;
  insertHTML: string;
  insertImage: string;
  insertVideo: string;
  fontSize: string;
  fontName: string;
  lineHeight: string;
  setSubscript: string;
  setSuperscript: string;
  setStrikethrough: string;
  setHR: string;
  indent: string;
  outdent: string;
  undo: string;
  redo: string;
  code: string;
  table: string;
  line: string;
  foreColor: string;
  hiliteColor: string;
  blockquote: string;
  keyboard: string;
  separator: string;
  [key: string]: string;
};

/** Default toolbar action keys */
export const defaultActions: string[];

/** Create the WebView HTML source for the editor */
export function createHTML(options?: object): string;

/** Get content CSS string for the editor */
export function getContentCSS(): string;

/** Editor component (use ref to get EditorRef) */
export const Editor: React.ComponentType<EditorProps>;

/** Toolbar component for the editor */
export const Toolbar: React.ComponentType<ToolbarProps>;

/** Color picker props (for use with Toolbar foreColor / hiliteColor) */
export interface ColorPickerProps {
  visible?: boolean;
  onClose?: () => void;
  onSelectColor?: (color: string) => void;
  title?: string;
  initialColor?: string;
}

/** Color picker modal component */
export const ColorPicker: React.ComponentType<ColorPickerProps>;
