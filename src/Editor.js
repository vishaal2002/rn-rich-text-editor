import React, { Component } from 'react';
import { WebView } from 'react-native-webview';
import { actions } from './actions';
import { messages } from './messages';
import { Keyboard, Platform, StyleSheet, TextInput, View, Linking } from 'react-native';
import { createHTML, createReadOnlyHTML } from './editor/createHTML';

const PlatformIOS = Platform.OS === 'ios';

/** Default editor height when user doesn't set initialHeight */
const DEFAULT_EDITOR_HEIGHT = 128;

export default class Editor extends Component {
  static defaultProps = {
    contentInset: {},
    style: {},
    placeholder: '',
    initialContentHTML: '',
    initialFocus: false,
    disabled: false,
    readOnly: false,
    useContainer: true,
    pasteAsPlainText: false,
    autoCapitalize: 'off',
    defaultParagraphSeparator: 'div',
    editorInitializedCallback: () => {},
    initialHeight: 0,
    dataDetectorTypes: ['none'],
  };

  constructor(props) {
    super(props);
    let that = this;
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
      readOnly,
      styleWithCSS,
      useCharacter,
      defaultHttps,
      initialContentHTML,
    } = props;
    const contentForReadOnly = initialContentHTML || (typeof html === 'string' ? html : (html && html.html)) || '';
    that.state = {
      html: {
        html: readOnly
          ? createReadOnlyHTML({
              content: contentForReadOnly,
              backgroundColor,
              color,
              initialCSSText,
              cssText,
              contentCSSText,
            })
          : (html ||
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
            })),
      },
      keyboardHeight: 0,
      height: initialHeight > 0 ? initialHeight : DEFAULT_EDITOR_HEIGHT,
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
    // console.log('!!!!', event);
    /*const newKeyboardHeight = event.endCoordinates.height;
        if (this.state.keyboardHeight === newKeyboardHeight) {
            return;
        }
        if (newKeyboardHeight) {
            this.setEditorAvailableHeightBasedOnKeyboardHeight(newKeyboardHeight);
        }
        this.setState({keyboardHeight: newKeyboardHeight});*/
  }

  _onKeyboardWillHide(event) {
    this._keyOpen = false;
    // this.setState({keyboardHeight: 0});
  }


  onMessage(event) {
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
        case messages.OFFSET_Y:
          let offsetY = Number.parseInt(Number.parseInt(data) + that.layout.y || 0);
          offsetY > 0 && onCursorPosition(offsetY);
          break;
        default:
          onMessage?.(message);
          break;
      }
    } catch (e) {
      //alert('NON JSON MESSAGE');
    }
  }

  setWebHeight(height) {
    const { onHeightChange } = this.props;
    // Editor has fixed height (from initialHeight or DEFAULT_EDITOR_HEIGHT); we do not resize on content growth
    onHeightChange && onHeightChange(height);
  }

  /**
   * @param {String} type
   * @param {String} action
   * @param {any} data
   * @param [options]
   * @private
   */
  sendAction(type, action, data, options) {
    let jsonString = JSON.stringify({ type, name: action, data, options });
    if (!this.unmount && this.webviewBridge) {
      this.webviewBridge.postMessage(jsonString);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { editorStyle, disabled, placeholder, readOnly, initialContentHTML, html } = this.props;
    if (readOnly) {
      const contentChanged = initialContentHTML !== prevProps.initialContentHTML || html !== prevProps.html;
      if (prevProps.readOnly !== readOnly || contentChanged || prevProps.editorStyle !== editorStyle) {
        const contentForReadOnly = initialContentHTML || (typeof html === 'string' ? html : (html?.html)) || '';
        const { backgroundColor, color, initialCSSText, cssText, contentCSSText } = editorStyle || {};
        this.setState({
          html: {
            html: createReadOnlyHTML({
              content: contentForReadOnly,
              backgroundColor,
              color,
              initialCSSText,
              cssText,
              contentCSSText,
            }),
          },
        });
      }
      return;
    }
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

  setRef(ref) {
    this.webviewBridge = ref;
  }

  renderWebView() {
    let that = this;
    const { html, editorStyle, useContainer, style, onLink, dataDetectorTypes, readOnly, ...rest } = that.props;
    const { html: viewHTML } = that.state;
    return (
      <>
        <WebView
          useWebKit={true}
          scrollEnabled={false}
          hideKeyboardAccessoryView={!readOnly}
          keyboardDisplayRequiresUserAction={false}
          nestedScrollEnabled={readOnly || !useContainer}
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
        {!readOnly && Platform.OS === 'android' && <TextInput ref={ref => (that._input = ref)} style={styles._input} />}
      </>
    );
  }

  onViewLayout({ nativeEvent: { layout } }) {
    // const {x, y, width, height} = layout;
    this.layout = layout;
  }

  render() {
    let { height } = this.state;

    // useContainer is an optional prop with default value of true
    // If set to true, it will use a View wrapper with styles and height.
    // If set to false, it will not use a View wrapper
    const { useContainer, style, errorMessage } = this.props;
    const errorStyle = errorMessage ? { borderWidth: 1, borderColor: '#d92d20' } : {};
    
    return useContainer ? (
      <View style={[editorBorderStyle, style, { height }, errorStyle]} onLayout={this.onViewLayout}>
        {this.renderWebView()}
      </View>
    ) : (
      <View style={[editorBorderStyle, errorStyle]}>
        {this.renderWebView()}
      </View>
    );
  }

  //-------------------------------------------------------------------------------
  //--------------- Public API

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

  injectJavascript(script) {
    return this.webviewBridge.injectJavaScript(script);
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

  setLineHeight(value) {
    this.sendAction(actions.lineHeight, 'result', value);
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
    const { initialFocus, initialContentHTML, placeholder, editorInitializedCallback, disabled, readOnly } = that.props;
    if (readOnly) {
      editorInitializedCallback();
      return;
    }
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

const BORDER_COLOR = '#C9CED7';
const BORDER_RADIUS = 6;

const editorBorderStyle = {
  borderColor: BORDER_COLOR,
  borderTopWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderTopLeftRadius: BORDER_RADIUS,
  borderTopRightRadius: BORDER_RADIUS,
};

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