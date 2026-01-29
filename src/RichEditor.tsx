import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { actions } from './actions';
import { messages } from './messages';
import { Keyboard, Platform, StyleSheet, TextInput, View, Linking } from 'react-native';
import { createHTML } from './editor/createHTML';

const PlatformIOS = Platform.OS === 'ios';

function buildCreateHTMLOptions(props: any) {
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
    initialFocus,
    disabled,
    styleWithCSS,
    useCharacter,
    defaultHttps,
  } = props;
  return {
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
  };
}

export interface RichTextEditorRef {
  registerToolbar: (listener: (items: string[]) => void) => void;
  setContentFocusHandler: (listener: () => void) => void;
  setContentHTML: (html: string) => void;
  setPlaceholder: (placeholder: string) => void;
  setContentStyle: (styles: any) => void;
  setDisable: (dis: boolean) => void;
  blurContentEditor: () => void;
  focusContentEditor: () => void;
  showAndroidKeyboard: () => void;
  insertImage: (attributes: any, style?: any) => void;
  insertVideo: (attributes: any, style?: any) => void;
  insertText: (text: string) => void;
  insertHTML: (html: string) => void;
  insertLink: (title: string, url: string) => void;
  injectJavascript: (script: string) => void;
  preCode: (type: any) => void;
  setFontSize: (size: any) => void;
  setForeColor: (color: string) => void;
  setHiliteColor: (color: string) => void;
  setFontName: (name: string) => void;
  commandDOM: (command: any) => void;
  command: (command: any) => void;
  dismissKeyboard: () => void;
  getContentHtml: () => Promise<string>;
  isKeyboardOpen: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, any>(function RichTextEditor(
  {
    contentInset = {},
    style = {},
    placeholder = '',
    initialContentHTML = '',
    initialFocus = false,
    disabled = false,
    useContainer = true,
    pasteAsPlainText = false,
    autoCapitalize = 'off',
    defaultParagraphSeparator = 'div',
    editorInitializedCallback = () => {},
    initialHeight = 0,
    dataDetectorTypes = ['none'],
    editorStyle,
    html: htmlProp,
    onFocus,
    onBlur,
    onChange,
    onPaste,
    onKeyUp,
    onKeyDown,
    onInput,
    onMessage,
    onCursorPosition,
    onLink,
    onHeightChange,
    ...rest
  },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const inputRef = useRef<TextInput>(null);
  const selectionChangeListeners = useRef<Array<(items: string[]) => void>>([]);
  const focusListeners = useRef<Array<() => void>>([]);
  const contentResolveRef = useRef<((value: string) => void) | undefined>();
  const contentRejectRef = useRef<((reason?: any) => void) | undefined>();
  const pendingContentHtmlRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const unmountRef = useRef(false);
  const keyOpenRef = useRef(false);
  const focusRef = useRef(false);
  const layoutRef = useRef<any>({});

  const viewHTML = useMemo(
    () =>
      htmlProp || createHTML(buildCreateHTMLOptions({
        editorStyle,
        html: htmlProp,
        pasteAsPlainText,
        onPaste,
        onKeyUp,
        onKeyDown,
        onInput,
        enterKeyHint: (rest as any).enterKeyHint,
        autoCapitalize,
        autoCorrect: (rest as any).autoCorrect,
        defaultParagraphSeparator,
        firstFocusEnd: (rest as any).firstFocusEnd,
        useContainer,
        initialFocus,
        disabled,
        styleWithCSS: (rest as any).styleWithCSS,
        useCharacter: (rest as any).useCharacter,
        defaultHttps: (rest as any).defaultHttps,
      })),
    [], // eslint-disable-line react-hooks/exhaustive-deps -- intentional: only from initial props
  );

  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    unmountRef.current = false;
    const keyboardShow = () => {
      keyOpenRef.current = true;
    };
    const keyboardHide = () => {
      keyOpenRef.current = false;
    };
    const listeners = PlatformIOS
      ? [
          Keyboard.addListener('keyboardWillShow', keyboardShow),
          Keyboard.addListener('keyboardWillHide', keyboardHide),
        ]
      : [
          Keyboard.addListener('keyboardDidShow', keyboardShow),
          Keyboard.addListener('keyboardDidHide', keyboardHide),
        ];
    return () => {
      unmountRef.current = true;
      listeners.forEach(l => l.remove());
    };
  }, []);

  useEffect(() => {
    if (editorStyle) {
      sendAction(actions.content, 'setContentStyle', editorStyle);
    }
  }, [editorStyle]);

  useEffect(() => {
    sendAction(actions.content, 'setDisable', !!disabled);
  }, [disabled]);

  useEffect(() => {
    sendAction(actions.content, 'setPlaceholder', placeholder);
  }, [placeholder]);

  function sendAction(type: string, action?: string, data?: any, options?: any) {
    const jsonString = JSON.stringify({ type, name: action, data, options });
    if (unmountRef.current || !webRef.current) return;
    const webRefAny = webRef.current as any;
    if (typeof webRefAny.postMessage === 'function') {
      webRefAny.postMessage(jsonString);
    } else {
      webRef.current.injectJavaScript?.(
        `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(jsonString)} })); true;`,
      );
    }
  }

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const data = message.data;
      switch (message.type) {
        case messages.CONTENT_HTML_RESPONSE:
          if (contentResolveRef.current) {
            contentResolveRef.current(message.data);
            contentResolveRef.current = undefined;
            contentRejectRef.current = undefined;
            if (pendingContentHtmlRef.current) {
              clearTimeout(pendingContentHtmlRef.current);
              pendingContentHtmlRef.current = undefined;
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
          selectionChangeListeners.current.forEach(listener => listener(message.data));
          break;
        case messages.CONTENT_FOCUSED:
          focusRef.current = true;
          focusListeners.current.forEach(fn => fn());
          onFocus?.();
          break;
        case messages.CONTENT_BLUR:
          focusRef.current = false;
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
          if (data !== height) {
            const maxHeight = Math.max(data, initialHeight);
            if (!unmountRef.current && useContainer && maxHeight >= initialHeight) {
              setHeight(maxHeight);
            }
            onHeightChange?.(data);
          }
          break;
        case messages.OFFSET_Y:
          const offsetY = Number(Number(data) + (layoutRef.current?.y ?? 0));
          if (offsetY > 0) onCursorPosition?.(offsetY);
          break;
        default:
          onMessage?.(message);
          break;
      }
    } catch {
      // Non-JSON message, ignore
    }
  };

  const init = () => {
    if (initialContentHTML) sendAction(actions.content, 'setHtml', initialContentHTML);
    if (placeholder) sendAction(actions.content, 'setPlaceholder', placeholder);
    sendAction(actions.content, 'setDisable', !!disabled);
    editorInitializedCallback();
    if (initialFocus && !disabled) {
      if (Platform.OS === 'android') {
        if (!keyOpenRef.current) inputRef.current?.focus();
        webRef.current?.requestFocus?.();
      }
      sendAction(actions.content, 'focus');
    }
    sendAction(actions.init);
  };

  useImperativeHandle(ref, () => ({
    registerToolbar(listener: (items: string[]) => void) {
      selectionChangeListeners.current = [...selectionChangeListeners.current, listener];
    },
    setContentFocusHandler(listener: () => void) {
      focusListeners.current.push(listener);
    },
    setContentHTML(html: string) {
      sendAction(actions.content, 'setHtml', html);
    },
    setPlaceholder(placeholderText: string) {
      sendAction(actions.content, 'setPlaceholder', placeholderText);
    },
    setContentStyle(styles: any) {
      sendAction(actions.content, 'setContentStyle', styles);
    },
    setDisable(dis: boolean) {
      sendAction(actions.content, 'setDisable', !!dis);
    },
    blurContentEditor() {
      sendAction(actions.content, 'blur');
    },
    focusContentEditor() {
      if (Platform.OS === 'android') {
        if (!keyOpenRef.current) inputRef.current?.focus();
        webRef.current?.requestFocus?.();
      }
      sendAction(actions.content, 'focus');
    },
    showAndroidKeyboard() {
      if (Platform.OS === 'android') {
        if (!keyOpenRef.current) inputRef.current?.focus();
        webRef.current?.requestFocus?.();
      }
    },
    insertImage(attributes: any, styleOpt?: any) {
      sendAction(actions.insertImage, 'result', attributes, styleOpt);
    },
    insertVideo(attributes: any, styleOpt?: any) {
      sendAction(actions.insertVideo, 'result', attributes, styleOpt);
    },
    insertText(text: string) {
      sendAction(actions.insertText, 'result', text);
    },
    insertHTML(html: string) {
      sendAction(actions.insertHTML, 'result', html);
    },
    insertLink(title: string, url: string) {
      if (url) {
        if (Platform.OS === 'android') {
          if (!keyOpenRef.current) inputRef.current?.focus();
          webRef.current?.requestFocus?.();
        }
        sendAction(actions.insertLink, 'result', { title, url });
      }
    },
    injectJavascript(script: string) {
      return webRef.current?.injectJavaScript?.(script);
    },
    preCode(type: any) {
      sendAction(actions.code, 'result', type);
    },
    setFontSize(size: any) {
      sendAction(actions.fontSize, 'result', size);
    },
    setForeColor(color: string) {
      sendAction(actions.foreColor, 'result', color);
    },
    setHiliteColor(color: string) {
      sendAction(actions.hiliteColor, 'result', color);
    },
    setFontName(name: string) {
      sendAction(actions.fontName, 'result', name);
    },
    commandDOM(command: any) {
      if (command) sendAction(actions.content, 'commandDOM', command);
    },
    command(command: any) {
      if (command) sendAction(actions.content, 'command', command);
    },
    dismissKeyboard() {
      if (focusRef.current) sendAction(actions.content, 'blur');
      else Keyboard.dismiss();
    },
    get isKeyboardOpen() {
      return keyOpenRef.current;
    },
    getContentHtml(): Promise<string> {
      return new Promise((resolve, reject) => {
        contentResolveRef.current = resolve;
        contentRejectRef.current = reject;
        sendAction(actions.content, 'postHtml');
        pendingContentHtmlRef.current = setTimeout(() => {
          if (contentRejectRef.current) contentRejectRef.current('timeout');
        }, 5000);
      });
    },
  }));

  const onViewLayout = ({ nativeEvent: { layout } }: any) => {
    layoutRef.current = layout;
  };

  const renderWebView = () => (
    <>
      <WebView
        ref={webRef}
        useWebKit
        scrollEnabled={false}
        hideKeyboardAccessoryView
        keyboardDisplayRequiresUserAction={false}
        nestedScrollEnabled={!useContainer}
        style={[styles.webview, style]}
        {...rest}
        onMessage={handleMessage}
        originWhitelist={['*']}
        dataDetectorTypes={dataDetectorTypes}
        domStorageEnabled={false}
        bounces={false}
        javaScriptEnabled
        source={{ html: typeof viewHTML === 'string' ? viewHTML : (viewHTML as any)?.html ?? '' }}
        onLoad={init}
        onShouldStartLoadWithRequest={(event: any) => {
          if (event.url !== 'about:blank') {
            webRef.current?.stopLoading?.();
            Linking?.openURL?.(event.url);
            return false;
          }
          return true;
        }}
      />
      {Platform.OS === 'android' && <TextInput ref={inputRef} style={styles._input} />}
    </>
  );

  if (useContainer) {
    return (
      <View style={[style, { height }]} onLayout={onViewLayout}>
        {renderWebView()}
      </View>
    );
  }
  return renderWebView();
});

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

export default RichTextEditor;
export { RichTextEditor as RichEditor };
