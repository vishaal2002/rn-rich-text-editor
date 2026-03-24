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
const URL_ATTRS = new Set([
  'href', 'src', 'action', 'poster', 'background',
  'codebase', 'cite', 'data', 'dynsrc', 'lowsrc',
]);

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
      if (URL_ATTRS.has(n) && DANGEROUS_URL_RE.test(raw)) return '';
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

function HorizontalScrollRenderer({ TDefaultRenderer, ...props }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <TDefaultRenderer {...props} />
    </ScrollView>
  );
}

const TableRenderer = HorizontalScrollRenderer;
const PreRenderer = HorizontalScrollRenderer;

const customRenderers = {
  table: TableRenderer,
  pre: PreRenderer,
};

function parseFontFamilyFromCSS(localFontCSS) {
  if (!localFontCSS) return null;
  const match = localFontCSS.match(/font-family\s*:\s*['"]?([^;'"]+)/i);
  return match ? match[1].trim() : null;
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
      value = Number.parseFloat(value);
    }
    style[key] = value;
  });
  return style;
}

function parseFontFamilyFromCSSText(cssText) {
  if (!cssText || typeof cssText !== 'string') return null;
  const match = /font-family\s*:\s*([^;]+)/i.exec(cssText);
  if (!match) return null;
  const value = match[1]
    .split(',')
    .map(part => part.trim().replace(/^['"]|['"]$/g, ''))
    .find(Boolean);
  return value || null;
}

function deriveFontVariants(baseFamily, overrides = {}) {
  const cleanBase = typeof baseFamily === 'string' ? baseFamily.trim() : '';
  if (!cleanBase) {
    return {
      regular: null,
      bold: overrides.fontFamilyBold || null,
      italic: overrides.fontFamilyItalic || null,
      boldItalic: overrides.fontFamilyBoldItalic || null,
    };
  }
  const noQuotes = cleanBase.replace(/^['"]|['"]$/g, '');
  const tryReplace = (from, to) => (noQuotes.includes(from) ? noQuotes.replace(from, to) : null);
  const boldGuess =
    tryReplace('Regular', 'Bold') ||
    tryReplace('-regular', '-bold') ||
    tryReplace('_regular', '_bold') ||
    `${noQuotes}-Bold`;
  const italicGuess =
    tryReplace('Regular', 'Italic') ||
    tryReplace('-regular', '-italic') ||
    tryReplace('_regular', '_italic') ||
    `${noQuotes}-Italic`;
  const boldItalicGuess =
    tryReplace('Regular', 'BoldItalic') ||
    tryReplace('-regular', '-boldItalic') ||
    tryReplace('_regular', '_boldItalic') ||
    `${noQuotes}-BoldItalic`;
  return {
    regular: noQuotes,
    bold: overrides.fontFamilyBold || boldGuess,
    italic: overrides.fontFamilyItalic || italicGuess,
    boldItalic: overrides.fontFamilyBoldItalic || boldItalicGuess,
  };
}

function normalizeInlineFontStyles(html, fontVariants) {
  if (!html || typeof html !== 'string') return html;
  if (!fontVariants || !fontVariants.regular) return html;

  const parseStyleAttribute = (styleValue) => {
    const declarations = styleValue
      .split(';')
      .map(part => part.trim())
      .filter(Boolean);
    const map = {};
    const order = [];
    declarations.forEach((decl) => {
      const idx = decl.indexOf(':');
      if (idx <= 0) return;
      const key = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      if (!order.includes(key)) order.push(key);
      map[key] = value;
    });
    return { map, order };
  };

  const isBoldWeight = (fontWeight) => {
    if (!fontWeight) return false;
    if (fontWeight === 'bold' || fontWeight === 'bolder') return true;
    return /^\d+$/.test(fontWeight) && Number(fontWeight) >= 600;
  };

  const chooseVariantFamily = (isBold, isItalic) => {
    if (isBold && isItalic) {
      // Prefer explicit bold-italic face when available.
      // If not available, keep regular family so native text can combine
      // font-weight + font-style without being forced into a non-italic bold face.
      return fontVariants.boldItalic || fontVariants.regular;
    }
    if (isBold) {
      return fontVariants.bold || fontVariants.regular;
    }
    if (fontVariants.italic) {
      return fontVariants.italic;
    }
    return fontVariants.regular;
  };

  const serializeStyleAttribute = (map, order) => order
    .filter(key => map[key] != null && String(map[key]).trim() !== '')
    .map(key => `${key}: ${map[key]}`)
    .join('; ');

  return html.replace(/style\s*=\s*"([^"]*)"/gi, (full, styleValue) => {
    const { map, order } = parseStyleAttribute(styleValue);
    const fontWeight = (map['font-weight'] || '').toLowerCase();
    const fontStyle = (map['font-style'] || '').toLowerCase();
    const isBold = isBoldWeight(fontWeight);
    const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

    if (!isBold && !isItalic) return full;

    const variantFamily = chooseVariantFamily(isBold, isItalic);

    map['font-family'] = variantFamily;
    if (!order.includes('font-family')) {
      order.push('font-family');
    }
    // Keep original font-weight/font-style values.
    // Normalizing them to "normal" can drop formatting when a variant name is unavailable at runtime.

    const nextStyle = serializeStyleAttribute(map, order);
    return `style="${nextStyle}"`;
  });
}

function normalizeSemanticFontTags(html) {
  if (!html || typeof html !== 'string') return html;
  let next = html;

  // Preserve italic context when bold tags are nested inside italic spans.
  next = next.replace(
    /<span\b([^>]*)style="([^"]*font-style\s*:\s*(italic|oblique)[^"]*)"([^>]*)>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\5>\s*<\/span>/gi,
    (_m, preA, styleA, _italicKind, postA, _bTag, inner) =>
      `<span${preA}style="${styleA}"${postA}><span style="font-weight: bold; font-style: italic">${inner}</span></span>`,
  );

  // Normalize nested semantic combinations first so combined styles are preserved.
  next = next.replace(
    /<(strong|b)\b[^>]*>\s*<(em|i)\b[^>]*>([\s\S]*?)<\/\2>\s*<\/\1>/gi,
    (_m, _bTag, _iTag, inner) => `<span style="font-weight: bold; font-style: italic">${inner}</span>`,
  );
  next = next.replace(
    /<(em|i)\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\2>\s*<\/\1>/gi,
    (_m, _iTag, _bTag, inner) => `<span style="font-weight: bold; font-style: italic">${inner}</span>`,
  );

  // Normalize standalone semantic tags to inline styles so font mapping is consistent.
  next = next.replace(
    /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_m, _tag, inner) => `<span style="font-weight: bold">${inner}</span>`,
  );
  next = next.replace(
    /<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_m, _tag, inner) => `<span style="font-style: italic">${inner}</span>`,
  );

  return next;
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
  const {
    backgroundColor,
    color,
    fontFamily: editorFontFamily,
    fontFamilyBold,
    fontFamilyItalic,
    fontFamilyBoldItalic,
    contentCSSText,
  } = editorStyle;

  const contentStyles = useMemo(
    () => parseStyleFromCSSText(contentCSSText),
    [contentCSSText],
  );
  const resolvedFontFamily = useMemo(
    () => editorFontFamily || parseFontFamilyFromCSSText(contentCSSText) || customFontFamily || null,
    [editorFontFamily, contentCSSText, customFontFamily],
  );
  const fontVariants = useMemo(
    () => deriveFontVariants(resolvedFontFamily, { fontFamilyBold, fontFamilyItalic, fontFamilyBoldItalic }),
    [resolvedFontFamily, fontFamilyBold, fontFamilyItalic, fontFamilyBoldItalic],
  );
  const source = useMemo(() => {
    const raw = typeof html === 'string' ? html : '';
    const sanitized = shouldSanitize ? sanitizeHtmlString(raw) : raw;
    const semanticNormalized = normalizeSemanticFontTags(sanitized);
    const normalized = normalizeInlineFontStyles(semanticNormalized, fontVariants);
    return { html: normalized || '<p></p>' };
  }, [html, shouldSanitize, fontVariants]);

  const normalizedContentStyles = useMemo(() => ({ ...contentStyles }), [contentStyles]);

  const baseStyle = useMemo(() => ({
    ...(fontVariants.regular ? { fontFamily: fontVariants.regular } : {}),
    fontSize: 16,
    color: color || '#000033',
    backgroundColor: backgroundColor || 'transparent',
    ...normalizedContentStyles,
  }), [fontVariants.regular, color, backgroundColor, normalizedContentStyles]);

  const systemFonts = useMemo(() => {
    const defaults = ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'];
    const variants = [
      fontVariants.regular,
      fontVariants.bold,
      fontVariants.italic,
      fontVariants.boldItalic,
    ].filter(Boolean);
    return Array.from(new Set([...variants, ...defaults]));
  }, [fontVariants.regular, fontVariants.bold, fontVariants.italic, fontVariants.boldItalic]);

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
    span: {
      ...(fontVariants.regular ? { fontFamily: fontVariants.regular } : {}),
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
      ...(fontVariants.bold ? { fontFamily: fontVariants.bold, fontWeight: 'normal' } : { fontWeight: 'bold' }),
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
  }), [fontVariants.regular, fontVariants.bold]);

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
      systemFonts={systemFonts}
      renderers={customRenderers}
      renderersProps={renderersProps}
      defaultTextProps={defaultTextProps}
      enableUserAgentStyles={false}
      enableExperimentalMarginCollapsing
      onLayout={onLayout}
      style={style}
    />
  );
}
