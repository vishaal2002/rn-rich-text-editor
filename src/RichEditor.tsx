import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Keyboard, Platform, TextInput, StyleSheet } from 'react-native';
import { createHTML } from './editor/createHTML';
import { messages } from './messages';

const PlatformIOS = Platform.OS === 'ios';

export const RichEditor = forwardRef((props: any, ref) => {
  const webRef = useRef<WebView>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const selectionChangeListeners = useRef<Array<(items: string[]) => void>>([]);

  useEffect(() => {
    const keyboardEventListeners = PlatformIOS
      ? [
          Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true)),
          Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false)),
        ]
      : [
          Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true)),
          Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false)),
        ];

    return () => {
      keyboardEventListeners.forEach(listener => listener.remove());
    };
  }, []);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const { type, data } = message;

      switch (type) {
        case messages.SELECTION_CHANGE: {
          // Convert selection data to array of active actions
          const activeItems: string[] = [];
          if (data.bold) activeItems.push('bold');
          if (data.italic) activeItems.push('italic');
          if (data.underline) activeItems.push('underline');
          selectionChangeListeners.current.forEach(listener => listener(activeItems));
          break;
        }
        case messages.CONTENT_CHANGE:
          props.onChange?.(data);
          break;
        case messages.CONTENT_FOCUSED:
          props.onFocus?.();
          break;
        case messages.CONTENT_BLUR:
          props.onBlur?.();
          break;
        case messages.OFFSET_HEIGHT:
          props.onHeightChange?.(data);
          break;
        default:
          props.onMessage?.(message);
          break;
      }
    } catch {
      // Non-JSON message, ignore
    }
  };

  const sendToWebView = (type: string) => {
    const data = JSON.stringify({ type });
    const script = `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(data)} })); true;`;
    webRef.current?.injectJavaScript(script);
  };

  useImperativeHandle(ref, () => ({
    sendAction(type: string) {
      sendToWebView(type);
    },
    registerToolbar(listener: (items: string[]) => void) {
      selectionChangeListeners.current.push(listener);
    },
    focusContentEditor() {
      if (Platform.OS === 'android') {
        !keyboardOpen && inputRef.current?.focus();
        webRef.current?.requestFocus?.();
      }
      sendToWebView('focus');
    },
    dismissKeyboard() {
      sendToWebView('blur');
      Keyboard.dismiss();
    },
    get isKeyboardOpen() {
      return keyboardOpen;
    },
    showAndroidKeyboard() {
      if (Platform.OS === 'android') {
        !keyboardOpen && inputRef.current?.focus();
        webRef.current?.requestFocus?.();
      }
    },
  }));

  return (
    <>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
        source={createHTML()}
        onMessage={handleMessage}
        style={[styles.editorWebView, props.style]}
        {...props.webViewProps}
      />
      {Platform.OS === 'android' && (
        <TextInput ref={inputRef} style={styles.hiddenInput} />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  editorWebView: {
    minHeight: 150,
    backgroundColor: '#fff',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    zIndex: -999,
    bottom: -999,
    left: -999,
  },
});
