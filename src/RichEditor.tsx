import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { createHTML } from './editor/createHTML';

export const RichEditor = forwardRef((props: any, ref) => {
  const webRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    sendAction(type: string) {
      webRef.current?.postMessage(JSON.stringify({ type }));
    }
  }));

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      javaScriptEnabled
      scrollEnabled={false}
      source={createHTML()}
      onMessage={props.onMessage}
    />
  );
});
