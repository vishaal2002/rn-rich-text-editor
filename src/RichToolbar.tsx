import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { actions } from './actions';

export const defaultActions = [
  actions.keyboard,
  actions.setBold,
  actions.setItalic,
  actions.setUnderline,
  actions.removeFormat,
  actions.insertBulletsList,
  actions.indent,
  actions.outdent,
  actions.insertLink,
];

function getDefaultIcon(): Record<string, number> {
  return {
    [actions.insertImage]: require('./img/image.png'),
    [actions.keyboard]: require('./img/keyboard.png'),
    [actions.setBold]: require('./img/bold.png'),
    [actions.setItalic]: require('./img/italic.png'),
    [actions.setSubscript]: require('./img/subscript.png'),
    [actions.setSuperscript]: require('./img/superscript.png'),
    [actions.insertBulletsList]: require('./img/ul.png'),
    [actions.insertOrderedList]: require('./img/ol.png'),
    [actions.insertLink]: require('./img/link.png'),
    [actions.setStrikethrough]: require('./img/strikethrough.png'),
    [actions.setUnderline]: require('./img/underline.png'),
    [actions.heading1]: require('./img/heading1.png'),
    [actions.insertVideo]: require('./img/video.png'),
    [actions.removeFormat]: require('./img/remove_format.png'),
    [actions.undo]: require('./img/undo.png'),
    [actions.redo]: require('./img/redo.png'),
    [actions.checkboxList]: require('./img/checkbox.png'),
    [actions.table]: require('./img/table.png'),
    [actions.code]: require('./img/code.png'),
    [actions.outdent]: require('./img/outdent.png'),
    [actions.indent]: require('./img/indent.png'),
    [actions.alignLeft]: require('./img/justify_left.png'),
    [actions.alignCenter]: require('./img/justify_center.png'),
    [actions.alignRight]: require('./img/justify_right.png'),
    [actions.alignFull]: require('./img/justify_full.png'),
    [actions.blockquote]: require('./img/blockquote.png'),
    [actions.line]: require('./img/line.png'),
    [actions.fontSize]: require('./img/fontSize.png'),
  };
}

const defaultIcons = getDefaultIcon();

interface RichToolbarProps {
  editor?: { current: any };
  getEditor?: () => any;
  actions?: string[];
  disabled?: boolean;
  iconTint?: string;
  selectedIconTint?: string;
  disabledIconTint?: string;
  iconSize?: number;
  iconGap?: number;
  style?: any;
  itemStyle?: any;
  selectedButtonStyle?: any;
  unselectedButtonStyle?: any;
  disabledButtonStyle?: any;
  iconMap?: { [key: string]: any };
  renderAction?: (action: string, selected: boolean) => React.ReactElement;
  onPressAddImage?: () => void;
  onInsertLink?: () => void;
  insertVideo?: () => void;
  flatContainerStyle?: any;
  horizontal?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}

export function RichToolbar({
  editor: editorProp,
  getEditor,
  actions: actionsProp = defaultActions,
  disabled = false,
  iconTint = '#71787F',
  selectedIconTint,
  disabledIconTint,
  iconSize = 20,
  iconGap = 16,
  style,
  itemStyle,
  selectedButtonStyle,
  unselectedButtonStyle,
  disabledButtonStyle,
  iconMap,
  renderAction,
  onPressAddImage,
  onInsertLink,
  insertVideo,
  flatContainerStyle,
  horizontal = true,
  children,
  ...restProps
}: Readonly<RichToolbarProps>) {
  const editorRef = useRef<any>(null);
  const [items, setItems] = useState<string[]>([]);

  const data = actionsProp.map(action => ({
    action,
    selected: items.includes(action) || items.some(item => item && item === action),
  }));

  const mount = () => {
    const editor = editorProp?.current ?? getEditor?.();
    if (!editor) {
      if (__DEV__) {
        console.warn(
          'Toolbar has no editor. Please make sure the prop getEditor or editor returns a ref to the editor component.',
        );
      }
    } else {
      editor.registerToolbar?.((selectedItems: string[]) => setItems(selectedItems));
      editorRef.current = editor;
    }
  };

  useEffect(() => {
    const t = setTimeout(mount);
    return () => clearTimeout(t);
  }, []);

  const getButtonIcon = (action: string) => {
    if (iconMap?.[action]) return iconMap[action];
    return defaultIcons[action];
  };

  const handleKeyboard = () => {
    const editor = editorRef.current;
    if (!editor) {
      mount();
      return;
    }
    if (editor.isKeyboardOpen) {
      editor.dismissKeyboard?.();
    } else {
      editor.focusContentEditor?.();
    }
  };

  const onPress = (action: string) => {
    const editor = editorRef.current;
    if (!editor) {
      mount();
      return;
    }

    switch (action) {
      case actions.insertLink:
        if (onInsertLink) {
          onInsertLink();
          return;
        }
        editor.showAndroidKeyboard?.();
        editor.sendAction?.(action);
        break;
      case actions.insertImage:
        onPressAddImage?.();
        break;
      case actions.insertVideo:
        insertVideo?.();
        break;
      case actions.keyboard:
        handleKeyboard();
        break;
      case actions.setBold:
      case actions.setItalic:
      case actions.undo:
      case actions.redo:
      case actions.insertBulletsList:
      case actions.insertOrderedList:
      case actions.checkboxList:
      case actions.setUnderline:
      case actions.heading1:
      case actions.heading2:
      case actions.heading3:
      case actions.heading4:
      case actions.heading5:
      case actions.heading6:
      case actions.code:
      case actions.blockquote:
      case actions.line:
      case actions.setParagraph:
      case actions.removeFormat:
      case actions.alignLeft:
      case actions.alignCenter:
      case actions.alignRight:
      case actions.alignFull:
      case actions.setSubscript:
      case actions.setSuperscript:
      case actions.setStrikethrough:
      case actions.setHR:
      case actions.indent:
      case actions.outdent:
        editor.showAndroidKeyboard?.();
        editor.sendAction?.(action);
        break;
      default:
        (restProps as any)[action]?.();
        break;
    }
  };

  const defaultRenderAction = (action: string, selected: boolean) => {
    const icon = getButtonIcon(action);
    const buttonStyle = selected ? selectedButtonStyle : unselectedButtonStyle;
    let tintColor = iconTint;
    if (disabled && disabledIconTint) tintColor = disabledIconTint;
    else if (selected && selectedIconTint) tintColor = selectedIconTint;

    return (
      <TouchableOpacity
        key={action}
        disabled={disabled}
        style={[{ width: iconGap + iconSize }, styles.item, itemStyle, buttonStyle]}
        testID="button_action"
        accessible
        onPress={() => onPress(action)}>
        {icon ? (
          typeof icon === 'function' ? (
            (icon as any)({ selected, disabled, tintColor, iconSize, iconGap })
          ) : (
            <Image
              source={icon as number}
              style={{
                tintColor,
                height: iconSize,
                width: iconSize,
              }}
            />
          )
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderActionItem = (action: string, selected: boolean) =>
    renderAction ? renderAction(action, selected) : defaultRenderAction(action, selected);

  const barStyle = [
    styles.barContainer,
    style,
    disabled && disabledButtonStyle,
  ];

  return (
    <View style={barStyle}>
      <FlatList
        horizontal={horizontal}
        style={flatContainerStyle}
        keyboardShouldPersistTaps="always"
        keyExtractor={(item, index) => item.action + '-' + index}
        data={data}
        alwaysBounceHorizontal={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => renderActionItem(item.action, item.selected)}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    height: 44,
    backgroundColor: '#efefef',
    alignItems: 'center',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RichToolbar;
