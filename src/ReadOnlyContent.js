import React, { useMemo, useCallback } from 'react';
import { ScrollView, useWindowDimensions, Linking } from 'react-native';

let RenderHtml;
try {
  RenderHtml = require('react-native-render-html').default;
} catch (e) {
  RenderHtml = null;
}

const DANGEROUS_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed', 'form',
  'input', 'base', 'link', 'meta', 'noscript', 'template', 'svg', 'math',
];

const EVENT_ATTR_RE = /^on[a-z]/i;
const DANGEROUS_URL_RE = /^\s*(javascript|vbscript|data):/i;
const URL_ATTRS = [
  'href', 'src', 'action', 'poster', 'background',
  'codebase', 'cite', 'data', 'dynsrc', 'lowsrc',
];

function stripTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  const selfClose = new RegExp(`<${tag}[^>]*/?>`, 'gi');
  return html.replace(re, '').replace(selfClose, '');
}

function sanitizeHtmlString(html) {
  if (typeof html !== 'string' || !html.trim()) return html;
  let result = html;
  DANGEROUS_TAGS.forEach(tag => {
    result = stripTag(result, tag);
  });
  result = result.replace(/<([a-z][a-z0-9]*)\s([^>]*?)>/gi, (match, tag, attrs) => {
    const cleaned = attrs.replace(/([a-z\-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (attrMatch, name, value) => {
      const n = name.toLowerCase();
      if (EVENT_ATTR_RE.test(n)) return '';
      const raw = value.replace(/^["']|["']$/g, '');
      if (URL_ATTRS.includes(n) && DANGEROUS_URL_RE.test(raw)) return '';
      if (n === 'style') {
        const lower = raw.toLowerCase();
        if (/expression|javascript|behavior|vbscript/.test(lower)) return '';
      }
      return attrMatch;
    });
    return `<${tag} ${cleaned.trim()}>`;
  });
  return result;
}

function TableRenderer({ TDefaultRenderer, ...props }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <TDefaultRenderer {...props} />
    </ScrollView>
  );
}

function PreRenderer({ TDefaultRenderer, ...props }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <TDefaultRenderer {...props} />
    </ScrollView>
  );
}

const customRenderers = {
  table: TableRenderer,
  pre: PreRenderer,
};

function parseFontFamilyFromCSS(localFontCSS) {
  if (!localFontCSS) return null;
  const match = localFontCSS.match(/font-family\s*:\s*['"]?([^;'"]+)/i);
  return match ? match[1].trim() : null;
}

function hasItalicFaceInCSS(localFontCSS) {
  if (!localFontCSS || typeof localFontCSS !== 'string') return false;
  return /@font-face[\s\S]*font-style\s*:\s*italic/i.test(localFontCSS);
}

function parseStyleFromCSSText(cssText) {
  if (!cssText || typeof cssText !== 'string') return {};
  const style = {};
  const pairs = cssText.split(';').filter(Boolean);
  const camelCase = (s) =>
    s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  pairs.forEach(pair => {
    const [rawKey, ...valueParts] = pair.split(':');
    if (!rawKey || valueParts.length === 0) return;
    const key = camelCase(rawKey.trim());
    let value = valueParts.join(':').trim();
    if (/^\d+(\.\d+)?(px)?$/.test(value)) {
      value = parseFloat(value);
    }
    style[key] = value;
  });
  return style;
}

export default function ReadOnlyContent({
  html = '',
  editorStyle = {},
  onLink,
  onHeightChange,
  sanitizeHtml: shouldSanitize = true,
  localFontCSS,
  style,
  contentWidth: contentWidthProp,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = contentWidthProp || windowWidth;

  const customFontFamily = useMemo(
    () => parseFontFamilyFromCSS(localFontCSS),
    [localFontCSS],
  );
  const customFontHasItalic = useMemo(
    () => hasItalicFaceInCSS(localFontCSS),
    [localFontCSS],
  );

  const source = useMemo(() => {
    const raw = typeof html === 'string' ? html : '';
    const sanitized = shouldSanitize ? sanitizeHtmlString(raw) : raw;
    return { html: sanitized || '<p></p>' };
  }, [html, shouldSanitize]);

  const {
    backgroundColor,
    color,
    contentCSSText,
  } = editorStyle;

  const contentStyles = useMemo(
    () => parseStyleFromCSSText(contentCSSText),
    [contentCSSText],
  );
  const normalizedContentStyles = useMemo(() => {
    const next = { ...contentStyles };
    // iOS readonly: avoid forcing font-family from CSS, because many custom fonts
    // don't provide italic variants and italic text then renders as regular.
    if (Platform.OS === 'ios') {
      delete next.fontFamily;
    }
    return next;
  }, [contentStyles]);

  const baseStyle = useMemo(() => ({
    // iOS: never force custom font in readonly mode so italic styles are always respected.
    ...(Platform.OS !== 'ios' && customFontFamily && customFontHasItalic ? { fontFamily: customFontFamily } : {}),
    fontSize: 16,
    color: color || '#000033',
    backgroundColor: backgroundColor || 'transparent',
    ...normalizedContentStyles,
  }), [customFontFamily, customFontHasItalic, color, backgroundColor, normalizedContentStyles]);

  const tagsStyles = useMemo(() => ({
    body: {
      margin: 0,
      padding: 0,
    },
    p: {
      marginTop: 0,
      marginBottom: 8,
    },
    ul: {
      marginTop: 0,
      marginBottom: 0,
      paddingLeft: 24,
    },
    ol: {
      marginTop: 0,
      marginBottom: 0,
      paddingLeft: 24,
    },
    li: {
      marginBottom: 0,
    },
    i: {
      fontStyle: 'italic',
    },
    em: {
      fontStyle: 'italic',
    },
    pre: {
      whiteSpace: 'pre',
    },
    table: {
      borderWidth: 1,
      borderColor: '#ccc',
    },
    th: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 4,
      fontWeight: 'bold',
    },
    td: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 4,
    },
    a: {
      color: '#1a73e8',
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: '#ccc',
      paddingLeft: 10,
      marginLeft: 0,
      marginRight: 0,
    },
    img: {
      maxWidth: '100%',
    },
  }), []);

  const onLayout = useCallback(
    (event) => {
      if (onHeightChange) {
        onHeightChange(event.nativeEvent.layout.height);
      }
    },
    [onHeightChange],
  );

  const renderersProps = useMemo(() => ({
    a: {
      onPress: (_event, href) => {
        if (onLink) {
          onLink(href);
        } else if (href) {
          Linking.openURL(href);
        }
      },
    },
  }), [onLink]);

  const defaultTextProps = useMemo(() => ({
    selectable: true,
  }), []);

  if (!RenderHtml) {
    if (__DEV__) {
      console.warn(
        'rn-rich-text-editor: react-native-render-html is not installed. ' +
        'Install it to use native readonly rendering. ' +
        'Falling back to empty view.',
      );
    }
    return null;
  }

  return (
    <RenderHtml
      source={source}
      contentWidth={contentWidth}
      baseStyle={baseStyle}
      tagsStyles={tagsStyles}
      renderers={customRenderers}
      renderersProps={renderersProps}
      defaultTextProps={defaultTextProps}
      enableExperimentalMarginCollapsing
      onLayout={onLayout}
      style={style}
    />
  );
}
