import React, { Component } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { actions } from './actions';
import { messages } from './messages';
import { Keyboard, Platform, StyleSheet, TextInput, View, Linking } from 'react-native';
import { createHTML } from './editor/createHTML';

const PlatformIOS = Platform.OS === 'ios';

export interface RichTextEditorProps {
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
  editorStyle?: {
    backgroundColor?: string;
    color?: string;
    placeholderColor?: string;
    initialCSSText?: string;
    cssText?: string;
    contentCSSText?: string;
    caretColor?: string;
    [key: string]: any;
  };
  html?: string | { html: string };
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (data: string) => void;
  onPaste?: (data: any) => void;
  onKeyUp?: (data: any) => void;
  onKeyDown?: (data: any) => void;
  onInput?: (data: any) => void;
  onMessage?: (message: any) => void;
  onCursorPosition?: (offsetY: number) => void;
  onLink?: (data: any) => void;
  onHeightChange?: (height: number) => void;
  [key: string]: any;
}

interface RichTextEditorState {
  html: { html: string };
  keyboardHeight: number;
  height: number;
}

export default class RichTextEditor extends Component<RichTextEditorProps, RichTextEditorState> {
  declare readonly props: RichTextEditorProps;
  declare state: RichTextEditorState;
  declare setState: Component<RichTextEditorProps, RichTextEditorState>['setState'];
  webviewBridge: WebView | null = null;
  _input: TextInput | null = null;
  layout: { x?: number; y?: number; width?: number; height?: number } = {};
  unmount = false;
  _keyOpen = false;
  _focus = false;
  selectionChangeListeners: Array<(items: string[]) => void> = [];
  focusListeners: Array<() => void> = [];
  contentResolve?: (value: string) => void;
  contentReject?: (reason?: any) => void;
  pendingContentHtml?: ReturnType<typeof setTimeout>;
  keyboardEventListeners: Array<{ remove: () => void }> = [];

  static defaultProps = {
    contentInset: {},
    style: {},
    placeholder: '',
    initialContentHTML: '',
    initialFocus: false,
    disabled: false,
    useContainer: true,
    pasteAsPlainText: false,
    autoCapitalize: 'off',
    defaultParagraphSeparator: 'div',
    editorInitializedCallback: () => {},
    initialHeight: 0,
    dataDetectorTypes: ['none'],
  };

  constructor(props: RichTextEditorProps) {
    super(props);
    const that = this as RichTextEditor;
    that.renderWebView = that.renderWebView.bind(that);
    that.onMessage = that.onMessage.bind(that);
    that.sendAction = that.sendAction.bind(that);
    that.registerToolbar = that.registerToolbar.bind(that);
    that._onKeyboardWillShow = that._onKeyboardWillShow.bind(that);
    that._onKeyboardWillHide = that._onKeyboardWillHide.bind(that);
    that.init = that.init.bind(that);
    that.setRef = that.setRef.bind(that);
    that.onViewLayout = that.onViewLayout.bind(that);
    that.unmount = false;
    that._keyOpen = false;
    that._focus = false;
    that.layout = {};
    that.selectionChangeListeners = [];
    const {
      editorStyle: {
        backgroundColor,
        color,
        placeholderColor,
        initialCSSText,
        cssText,
        contentCSSText,
        caretColor,
      } = {},
      html,
      pasteAsPlainText,
      onPaste,
      onKeyUp,
      onKeyDown,
      onInput,
      enterKeyHint,
      autoCapitalize,
      autoCorrect,
      defaultParagraphSeparator,
      firstFocusEnd,
      useContainer,
      initialHeight,
      initialFocus,
      disabled,
      styleWithCSS,
      useCharacter,
      defaultHttps,
    } = props;
    const htmlString =
      (typeof html === 'string' ? html : (html && typeof html === 'object' && 'html' in html ? html.html : undefined)) ||
      createHTML({
        backgroundColor,
        color,
        caretColor,
        placeholderColor,
        initialCSSText,
        cssText,
        contentCSSText,
        pasteAsPlainText,
        pasteListener: !!onPaste,
        keyUpListener: !!onKeyUp,
        keyDownListener: !!onKeyDown,
        inputListener: !!onInput,
        enterKeyHint,
        autoCapitalize,
        autoCorrect,
        initialFocus: initialFocus && !disabled,
        defaultParagraphSeparator,
        firstFocusEnd,
        useContainer,
        styleWithCSS,
        useCharacter,
        defaultHttps,
      });
    that.state = {
      html: { html: htmlString },
      keyboardHeight: 0,
      height: (initialHeight ?? 0) as number,
    };
    that.focusListeners = [];
  }

  componentDidMount() {
    this.unmount = false;
    if (PlatformIOS) {
      this.keyboardEventListeners = [
        Keyboard.addListener('keyboardWillShow', this._onKeyboardWillShow),
        Keyboard.addListener('keyboardWillHide', this._onKeyboardWillHide),
      ];
    } else {
      this.keyboardEventListeners = [
        Keyboard.addListener('keyboardDidShow', this._onKeyboardWillShow),
        Keyboard.addListener('keyboardDidHide', this._onKeyboardWillHide),
      ];
    }
  }

  componentWillUnmount() {
    this.unmount = true;
    this.keyboardEventListeners.forEach(eventListener => eventListener.remove());
  }

  _onKeyboardWillShow(event) {
    this._keyOpen = true;
  }

  _onKeyboardWillHide(event) {
    this._keyOpen = false;
  }

  onMessage(event: any) {
    const that = this;
    const { onFocus, onBlur, onChange, onPaste, onKeyUp, onKeyDown, onInput, onMessage, onCursorPosition, onLink } =
      that.props;
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const data = message.data;
      switch (message.type) {
        case messages.CONTENT_HTML_RESPONSE:
          if (that.contentResolve) {
            that.contentResolve(message.data);
            that.contentResolve = undefined;
            that.contentReject = undefined;
            if (that.pendingContentHtml) {
              clearTimeout(that.pendingContentHtml);
              that.pendingContentHtml = undefined;
            }
          }
          break;
        case messages.LINK_TOUCHED:
          onLink?.(data);
          break;
        case messages.LOG:
          console.log('FROM EDIT:', ...data);
          break;
        case messages.SELECTION_CHANGE:
          const items = message.data;
          that.selectionChangeListeners.map(listener => {
            listener(items);
          });
          break;
        case messages.CONTENT_FOCUSED:
          that._focus = true;
          that.focusListeners.map(da => da()); // Subsequent versions will be deleted
          onFocus?.();
          break;
        case messages.CONTENT_BLUR:
          that._focus = false;
          onBlur?.();
          break;
        case messages.CONTENT_CHANGE:
          onChange?.(data);
          break;
        case messages.CONTENT_PASTED:
          onPaste?.(data);
          break;
        case messages.CONTENT_KEYUP:
          onKeyUp?.(data);
          break;
        case messages.CONTENT_KEYDOWN:
          onKeyDown?.(data);
          break;
        case messages.ON_INPUT:
          onInput?.(data);
          break;
        case messages.OFFSET_HEIGHT:
          that.setWebHeight(data);
          break;
        case messages.OFFSET_Y: {
          const offsetY = Number(Number(data) + (that.layout.y ?? 0));
          if (offsetY > 0) onCursorPosition?.(offsetY);
          break;
        }
        default:
          onMessage?.(message);
          break;
      }
    } catch {
      //alert('NON JSON MESSAGE');
    }
  }

  setWebHeight(height) {
    const { onHeightChange, useContainer, initialHeight } = this.props;
    if (height !== this.state.height) {
      const maxHeight = Math.max(height, initialHeight);
      if (!this.unmount && useContainer && maxHeight >= initialHeight) {
        this.setState({ height: maxHeight });
      }
      onHeightChange && onHeightChange(height);
    }
  }

  /**
   * @param type - Action type (or single toolbar action name when called with 1 arg)
   * @param action - Optional action name (e.g. 'result', 'setHtml')
   * @param data - Optional payload
   * @param options - Optional options
   */
  sendAction(type: string, action?: string, data?: any, options?: any) {
    // Toolbar calls sendAction(action) with one arg; forward as type + 'result'
    const name = arguments.length === 1 ? 'result' : action;
    const payload = arguments.length === 1 ? undefined : data;
    const opts = arguments.length === 1 ? undefined : options;
    const jsonString = JSON.stringify({ type, name, data: payload, options: opts });
    if (!this.unmount && this.webviewBridge) {
      (this.webviewBridge as any).postMessage(jsonString);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { editorStyle, disabled, placeholder } = this.props;
    if (prevProps.editorStyle !== editorStyle) {
      editorStyle && this.setContentStyle(editorStyle);
    }
    if (disabled !== prevProps.disabled) {
      this.setDisable(disabled);
    }
    if (placeholder !== prevProps.placeholder) {
      this.setPlaceholder(placeholder);
    }
  }

  setRef(ref: WebView | null) {
    this.webviewBridge = ref;
  }

  renderWebView() {
    const that = this;
    const { html: _html, editorStyle, useContainer, style, onLink, dataDetectorTypes, ...rest } = that.props;
    const { html: viewHTML } = that.state;
    return (
      <>
        <WebView
          useWebKit={true}
          scrollEnabled={false}
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
          nestedScrollEnabled={!useContainer}
          style={[styles.webview, style]}
          {...rest}
          ref={that.setRef}
          onMessage={that.onMessage}
          originWhitelist={['*']}
          dataDetectorTypes={dataDetectorTypes}
          domStorageEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          source={viewHTML}
          onLoad={that.init}
          onShouldStartLoadWithRequest={event => {
            if (event.url !== 'about:blank') {
              this.webviewBridge?.stopLoading();
              Linking?.openURL(event.url);
              return false;
            }
            return true;
          }}
        />
        {Platform.OS === 'android' && <TextInput ref={ref => (that._input = ref)} style={styles._input} />}
      </>
    );
  }

  onViewLayout({ nativeEvent: { layout } }) {
    this.layout = layout;
  }

  render() {
    let { height } = this.state;

    // useContainer is an optional prop with default value of true
    // If set to true, it will use a View wrapper with styles and height.
    // If set to false, it will not use a View wrapper
    const { useContainer, style } = this.props;
    return useContainer ? (
      <View style={[style, { height }]} onLayout={this.onViewLayout}>
        {this.renderWebView()}
      </View>
    ) : (
      this.renderWebView()
    );
  }

  registerToolbar(listener) {
    this.selectionChangeListeners = [...this.selectionChangeListeners, listener];
  }

  /**
   * Subsequent versions will be deleted, please use onFocus
   * @deprecated remove
   * @param listener
   */
  setContentFocusHandler(listener) {
    this.focusListeners.push(listener);
  }

  setContentHTML(html) {
    this.sendAction(actions.content, 'setHtml', html);
  }

  setPlaceholder(placeholder) {
    this.sendAction(actions.content, 'setPlaceholder', placeholder);
  }

  setContentStyle(styles) {
    this.sendAction(actions.content, 'setContentStyle', styles);
  }

  setDisable(dis) {
    this.sendAction(actions.content, 'setDisable', !!dis);
  }

  blurContentEditor() {
    this.sendAction(actions.content, 'blur');
  }

  focusContentEditor() {
    this.showAndroidKeyboard();
    this.sendAction(actions.content, 'focus');
  }

  /**
   * open android keyboard
   * @platform android
   */
  showAndroidKeyboard() {
    let that = this;
    if (Platform.OS === 'android') {
      !that._keyOpen && that._input.focus();
      that.webviewBridge?.requestFocus?.();
    }
  }

  /**
   * @param attributes
   * @param [style]
   */
  insertImage(attributes, style) {
    this.sendAction(actions.insertImage, 'result', attributes, style);
  }

  /**
   * @param attributes
   * @param [style]
   */
  insertVideo(attributes, style) {
    this.sendAction(actions.insertVideo, 'result', attributes, style);
  }

  insertText(text) {
    this.sendAction(actions.insertText, 'result', text);
  }

  insertHTML(html) {
    this.sendAction(actions.insertHTML, 'result', html);
  }

  insertLink(title, url) {
    if (url) {
      this.showAndroidKeyboard();
      this.sendAction(actions.insertLink, 'result', { title, url });
    }
  }

  injectJavascript(script: string) {
    return this.webviewBridge?.injectJavaScript?.(script);
  }

  preCode(type) {
    this.sendAction(actions.code, 'result', type);
  }

  setFontSize(size) {
    this.sendAction(actions.fontSize, 'result', size);
  }

  setForeColor(color) {
    this.sendAction(actions.foreColor, 'result', color);
  }

  setHiliteColor(color) {
    this.sendAction(actions.hiliteColor, 'result', color);
  }

  setFontName(name) {
    this.sendAction(actions.fontName, 'result', name);
  }

  commandDOM(command) {
    if (command) {
      this.sendAction(actions.content, 'commandDOM', command);
    }
  }

  command(command) {
    if (command) {
      this.sendAction(actions.content, 'command', command);
    }
  }

  dismissKeyboard() {
    this._focus ? this.blurContentEditor() : Keyboard.dismiss();
  }

  get isKeyboardOpen() {
    return this._keyOpen;
  }

  init() {
    let that = this;
    const { initialFocus, initialContentHTML, placeholder, editorInitializedCallback, disabled } = that.props;
    initialContentHTML && that.setContentHTML(initialContentHTML);
    placeholder && that.setPlaceholder(placeholder);
    that.setDisable(disabled);
    editorInitializedCallback();

    // initial request focus
    initialFocus && !disabled && that.focusContentEditor();
    // no visible ?
    that.sendAction(actions.init);
  }

  /**
   * @deprecated please use onChange
   * @returns {Promise}
   */
  async getContentHtml() {
    return new Promise((resolve, reject) => {
      this.contentResolve = resolve;
      this.contentReject = reject;
      this.sendAction(actions.content, 'postHtml');

      this.pendingContentHtml = setTimeout(() => {
        if (this.contentReject) {
          this.contentReject('timeout');
        }
      }, 5000);
    });
  }
}

const styles = StyleSheet.create({
  _input: {
    position: 'absolute',
    width: 1,
    height: 1,
    zIndex: -999,
    bottom: -999,
    left: -999,
  },

  webview: {
    backgroundColor: 'transparent',
  },
});