import type React from 'react';

/** Rich text editor ref API (use with ref on RichEditor) */
export interface RichEditorRef {
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

/** Props for the RichEditor component */
export interface RichEditorProps {
  contentInset?: object;
  style?: object;
  placeholder?: string;
  initialContentHTML?: string;
  initialFocus?: boolean;
  disabled?: boolean;
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
  [key: string]: unknown;
}

/** Props for the RichToolbar component */
export interface RichToolbarProps {
  editor?: { current: RichEditorRef | null };
  getEditor?: () => RichEditorRef | null;
  actions?: string[];
  disabled?: boolean;
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
  [key: string]: string;
};

/** Default toolbar action keys */
export const defaultActions: string[];

/** Create the WebView HTML source for the editor */
export function createHTML(options?: object): string;

/** Get content CSS string for the editor */
export function getContentCSS(): string;

/** Rich text editor component (use ref to get RichEditorRef) */
export const RichEditor: React.ComponentType<RichEditorProps>;

/** Toolbar component for the rich editor */
export const RichToolbar: React.ComponentType<RichToolbarProps>;
