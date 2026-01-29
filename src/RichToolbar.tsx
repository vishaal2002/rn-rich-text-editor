import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { actions } from './actions';

export const defaultActions = [
  actions.keyboard,
  actions.undo,
  actions.redo,
  actions.setBold,
  actions.setItalic,
  actions.setUnderline,
  actions.strikethrough,
  actions.removeFormat,
  actions.insertUnorderedList,
  actions.insertOrderedList,
  actions.checkboxList,
  actions.blockquote,
  actions.code,
  actions.indent,
  actions.outdent,
  actions.justifyLeft,
  actions.justifyCenter,
  actions.justifyRight,
  actions.justifyFull,
  actions.insertLink,
];

// Icons from img folder - direct require now that icons exist
function getDefaultIcon(): Record<string, number> {
  return {
    [actions.setBold]: require('./img/bold.png'),
    [actions.setItalic]: require('./img/italic.png'),
    [actions.setUnderline]: require('./img/underline.png'),
    [actions.strikethrough]: require('./img/strikethrough.png'),
    [actions.removeFormat]: require('./img/remove_format.png'),
    [actions.checkboxList]: require('./img/checkbox.png'),
    [actions.insertUnorderedList]: require('./img/ul.png'),
    [actions.insertOrderedList]: require('./img/ol.png'),
    [actions.blockquote]: require('./img/blockquote.png'),
    [actions.code]: require('./img/code.png'),
    [actions.insertLink]: require('./img/link.png'),
    [actions.indent]: require('./img/indent.png'),
    [actions.outdent]: require('./img/outdent.png'),
    [actions.justifyLeft]: require('./img/justify_left.png'),
    [actions.justifyCenter]: require('./img/justify_center.png'),
    [actions.justifyRight]: require('./img/justify_right.png'),
    [actions.justifyFull]: require('./img/justify_full.png'),
    [actions.undo]: require('./img/undo.png'),
    [actions.redo]: require('./img/redo.png'),
    [actions.keyboard]: require('./img/keyboard.png'),
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
}

export function RichToolbar({
  editor,
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
}: Readonly<RichToolbarProps>) {
  const editorRef = useRef<any>(null);
  const [items, setItems] = useState<string[]>([]);
  const [data, setData] = useState<Array<{ action: string; selected: boolean }>>(
    actionsProp.map(action => ({ action, selected: false })),
  );


  const setSelectedItems = (newItems: string[]) => {
    setItems(prev => (prev === newItems ? prev : newItems));
    setData(actionsProp.map(action => ({
      action,
      selected: newItems.includes(action) || newItems.some(item => item && item === action),
    })));
  };

  const mount = () => {
    const editorInstance = editor?.current ?? getEditor?.();
    if (!editorInstance) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Toolbar has no editor. Please make sure the prop editor or getEditor returns a ref to the editor component.',
        );
      }
    } else {
      editorInstance.registerToolbar?.(setSelectedItems);
      editorRef.current = editorInstance;
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
    const editorInstance = editorRef.current;
    if (!editorInstance) {
      mount();
      return;
    }
    if (editorInstance.isKeyboardOpen) {
      editorInstance.dismissKeyboard?.();
    } else {
      editorInstance.focusContentEditor?.();
    }
  };

  const onPress = (action: string) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) {
      mount();
      return;
    }

    switch (action) {
      case actions.insertLink:
        if (onInsertLink) {
          onInsertLink();
          return;
        }
        editorInstance.showAndroidKeyboard?.();
        editorInstance.sendAction?.(action);
        break;
      case actions.keyboard:
        handleKeyboard();
        break;
      case actions.setBold:
      case actions.setItalic:
      case actions.setUnderline:
      case actions.strikethrough:
      case actions.removeFormat:
      case actions.checkboxList:
      case actions.insertUnorderedList:
      case actions.insertOrderedList:
      case actions.blockquote:
      case actions.code:
      case actions.indent:
      case actions.outdent:
      case actions.justifyLeft:
      case actions.justifyCenter:
      case actions.justifyRight:
      case actions.justifyFull:
      case actions.undo:
      case actions.redo:
        editorInstance.showAndroidKeyboard?.();
        editorInstance.sendAction?.(action);
        break;
      default:
        if (action === 'image' && onPressAddImage) {
          onPressAddImage();
          return;
        }
        if (action === 'video' && insertVideo) {
          insertVideo();
          return;
        }
        editorInstance.sendAction?.(action);
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
        ) : (
          <View style={{ padding: 4 }} />
        )}
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
