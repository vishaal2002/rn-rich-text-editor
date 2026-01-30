import React, { Component } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { actions } from './actions';

const FADE_WIDTH = 24;
const FADE_STRIPS = 5;
const TOOLBAR_BG = '#efefef';

function hexToRgb(hex) {
  const match = hex.replace('#', '').match(/.{2}/g);
  return match ? match.map((x) => parseInt(x, 16)) : [239, 239, 239];
}

function FadeOverlay({ side, visible, backgroundColor }) {
  if (!visible) return null;
  const bg = backgroundColor || TOOLBAR_BG;
  const rgb = bg.startsWith('rgb')
    ? bg.match(/\d+/g)?.map(Number) || [239, 239, 239]
    : hexToRgb(bg);
  const strips = Array.from({ length: FADE_STRIPS }, (_, i) => {
    const alpha = ((i + 1) / FADE_STRIPS) * 0.85;
    const stripWidth = FADE_WIDTH / FADE_STRIPS;
    return (
      <View
        key={i}
        style={[
          styles.fadeStrip,
          {
            width: stripWidth,
            backgroundColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`,
            left: side === 'left' ? FADE_WIDTH - (i + 1) * stripWidth : i * stripWidth,
          },
        ]}
      />
    );
  });
  return (
    <View
      style={[styles.fadeOverlay, side === 'right' ? styles.fadeRight : styles.fadeLeft]}
      pointerEvents="none"
    >
      {strips}
    </View>
  );
}

const ALIGN_ACTIONS = [
  actions.alignLeft,
  actions.alignCenter,
  actions.alignRight,
  // actions.alignFull,
];

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

function getDefaultIcon() {
  const texts = {};
  // new icon styles of experiment
  texts[actions.insertImage] = require('./img/image.png');
  texts[actions.keyboard] = require('./img/keyboard.png');
  texts[actions.setBold] = require('./img/bold.png');
  texts[actions.setItalic] = require('./img/italic.png');
  texts[actions.setSubscript] = require('./img/subscript.png');
  texts[actions.setSuperscript] = require('./img/superscript.png');
  texts[actions.insertBulletsList] = require('./img/list.png');
  texts[actions.insertOrderedList] = require('./img/numbered_list.png');
  texts[actions.insertLink] = require('./img/link.png');
  texts[actions.setStrikethrough] = require('./img/strikethrough.png');
  texts[actions.setUnderline] = require('./img/underline.png');
  texts[actions.heading1] = require('./img/heading1.png');
  texts[actions.insertVideo] = require('./img/video.png');
  texts[actions.removeFormat] = require('./img/remove_format.png');
  texts[actions.undo] = require('./img/undo.png');
  texts[actions.redo] = require('./img/redo.png');
  texts[actions.checkboxList] = require('./img/checkbox.png');
  texts[actions.table] = require('./img/table.png');
  texts[actions.code] = require('./img/code.png');
  texts[actions.outdent] = require('./img/outdent.png');
  texts[actions.indent] = require('./img/intdent.png');
  texts[actions.alignLeft] = require('./img/align_left.png');
  texts[actions.alignCenter] = require('./img/align_center.png');
  texts[actions.alignRight] = require('./img/align_right.png');
  texts[actions.alignFull] = require('./img/justify_full.png');
  texts[actions.align] = require('./img/align_left.png');
  texts[actions.blockquote] = require('./img/blockquote.png');
  texts[actions.line] = require('./img/line.png');
  return texts;
}

// noinspection FallThroughInSwitchStatementJS
export default class Toolbar extends Component {
  static defaultProps = {
    actions: defaultActions,
    disabled: false,
    readOnly: false,
    iconTint: '#71787F',
    iconSize: 20,
    iconGap: 16,
  };

  constructor(props) {
    super(props);
    this.editor = null;
    this.state = {
      items: [],
      selectedAlign: null,
      showLeftFade: false,
      showRightFade: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    let that = this;
    return (
      nextState.items !== that.state.items ||
      nextState.actions !== that.state.actions ||
      nextState.data !== that.state.data ||
      nextState.selectedAlign !== that.state.selectedAlign ||
      nextState.showLeftFade !== that.state.showLeftFade ||
      nextState.showRightFade !== that.state.showRightFade ||
      nextProps.style !== that.props.style
    );
  }

  _scrollWidth = 0;
  _layoutWidth = 0;

  _onScroll = (e) => {
    const scrollX = e.nativeEvent.contentOffset.x;
    const showLeft = scrollX > 5;
    const showRight = scrollX + this._layoutWidth < this._scrollWidth - 5;
    this.setState((s) =>
      s.showLeftFade !== showLeft || s.showRightFade !== showRight
        ? { showLeftFade: showLeft, showRightFade: showRight }
        : null
    );
  };

  _onContentSizeChange = (contentWidth) => {
    this._scrollWidth = contentWidth;
    this._updateFades();
  };

  _onLayout = (e) => {
    this._layoutWidth = e.nativeEvent.layout.width;
    this._updateFades();
  };

  _updateFades = () => {
    if (this._scrollWidth <= 0 || this._layoutWidth <= 0) return;
    const canScroll = this._scrollWidth > this._layoutWidth;
    this.setState((s) => {
      const showRight = canScroll;
      const showLeft = canScroll && s.showLeftFade;
      if (s.showRightFade !== showRight || (showLeft !== s.showLeftFade && canScroll)) {
        return { showRightFade: showRight, showLeftFade: showLeft };
      }
      return null;
    });
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { actions } = nextProps;
    if (actions !== prevState.actions) {
      const items = prevState.items || [];
      const isItemSelected = (action) =>
        items.includes(action) || items.some(item => item && item.type === action);
      return {
        actions,
        data: actions.map(action => ({
          action,
          selected:
            action === actions.align
              ? ALIGN_ACTIONS.some(a => isItemSelected(a))
              : isItemSelected(action),
        })),
      };
    }
    return null;
  }

  componentDidMount() {
    setTimeout(this._mount);
  }

  _mount = () => {
    const { editor: { current: editor } = { current: this.props.getEditor?.() } } = this.props;
    if (!editor) {
      // No longer throw an error, just try to re-load it when needed.
      // This is because the webview may go away during long periods of inactivity,
      // and the ref will be lost, causing the entire app to crash in this throw new error.
      //throw new Error('Toolbar has no editor!');
      if (__DEV__) {
        console.warn(
          'Toolbar has no editor. Please make sure the prop getEditor returns a ref to the editor component.',
        );
      }
    } else {
      editor.registerToolbar(selectedItems => this.setSelectedItems(selectedItems));
      this.editor = editor;
    }
  };

  _isItemSelected(items, action) {
    return (
      items.includes(action) || items.some(item => item && item.type === action)
    );
  }

  setSelectedItems(items) {
    const { items: selectedItems } = this.state;
    if (this.editor && items !== selectedItems) {
      const selectedAlign = ALIGN_ACTIONS.find(a => this._isItemSelected(items, a)) || null;
      this.setState({
        items,
        selectedAlign,
        data: this.state.actions.map(action => {
          const isAlignAction = action === actions.align;
          const selected = isAlignAction
            ? !!selectedAlign
            : this._isItemSelected(items, action);
          return { action, selected };
        }),
      });
    }
  }

  _getButtonSelectedStyle() {
    return this.props.selectedButtonStyle && this.props.selectedButtonStyle;
  }

  _getButtonUnselectedStyle() {
    return this.props.unselectedButtonStyle && this.props.unselectedButtonStyle;
  }

  _getButtonDisabledStyle() {
    return this.props.disabledButtonStyle && this.props.disabledButtonStyle;
  }

  _getButtonIcon(action) {
    const { iconMap } = this.props;
    if (iconMap && iconMap[action]) {
      return iconMap[action];
    } else {
      return getDefaultIcon()[action];
    }
  }

  handleKeyboard() {
    const editor = this.editor;
    if (!editor) {
      this._mount();
      return;
    }
    if (editor.isKeyboardOpen) {
      editor.dismissKeyboard();
    } else {
      editor.focusContentEditor();
    }
  }

  _onPress(action) {
    const { onPressAddImage, onInsertLink, insertVideo } = this.props;
    const editor = this.editor;

    if (!editor) {
      this._mount();
      return;
    }

    if (action === actions.align) {
      const { selectedAlign } = this.state;
      // Cycle through alignments: Left -> Center -> Right -> Justify -> Left
      let nextAlignIndex = 0; // Default to Left
      if (selectedAlign) {
        const currentIndex = ALIGN_ACTIONS.indexOf(selectedAlign);
        if (currentIndex >= 0) {
          nextAlignIndex = (currentIndex + 1) % ALIGN_ACTIONS.length;
        }
      }
      const nextAlign = ALIGN_ACTIONS[nextAlignIndex];
      editor.showAndroidKeyboard();
      editor.sendAction(nextAlign, 'result');
      // The selectedAlign will be updated when setSelectedItems is called by the editor
      return;
    }

    switch (action) {
      case actions.insertLink:
        if (onInsertLink) return onInsertLink();
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
        editor.showAndroidKeyboard();
        editor.sendAction(action, 'result');
        break;
      case actions.fontName:
      case actions.foreColor:
      case actions.hiliteColor:
        if (this.props[action]) {
          this.props[action]();
        }
        break;
      case actions.insertImage:
        onPressAddImage?.();
        break;
      case actions.insertVideo:
        insertVideo?.();
        break;
      case actions.keyboard:
        this.handleKeyboard();
        break;
      default:
        this.props[action]?.();
        break;
    }
  }

  _defaultRenderAction(action, selected) {
    let that = this;
    const icon = that._getButtonIcon(action);
    const { iconSize, iconGap, disabled, itemStyle } = that.props;
    const style = selected ? that._getButtonSelectedStyle() : that._getButtonUnselectedStyle();
    const tintColor = disabled
      ? that.props.disabledIconTint
      : selected
        ? that.props.selectedIconTint
        : that.props.iconTint;
    return (
      <TouchableOpacity
        key={action}
        disabled={disabled}
        style={[{ width: iconGap + iconSize }, styles.item, itemStyle, style]}
        testID={'button_action'}
        accessible={true}
        onPress={() => that._onPress(action)}>
        {icon ? (
          typeof icon === 'function' ? (
            icon({
              selected,
              disabled,
              tintColor,
              iconSize,
              iconGap,
              width: iconSize,
              height: iconSize,
              color: tintColor,
              fill: tintColor,
            })
          ) : (
            <Image
              source={icon}
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
  }

  _renderAlignButton(action, selected) {
    const that = this;
    const { iconSize, iconGap, disabled, itemStyle } = that.props;
    const style = selected ? that._getButtonSelectedStyle() : that._getButtonUnselectedStyle();
    const tintColor = disabled
      ? that.props.disabledIconTint
      : selected
        ? that.props.selectedIconTint
        : that.props.iconTint;
    const { selectedAlign } = that.state;

    // Use the icon for the current alignment, or default to alignLeft icon
    const currentAlignAction = selectedAlign || actions.alignLeft;
    const icon = that._getButtonIcon(currentAlignAction);

    return (
      <TouchableOpacity
        key={action}
        disabled={disabled}
        style={[{ width: iconGap + iconSize }, styles.item, itemStyle, style]}
        testID={'button_align'}
        accessible={true}
        onPress={() => that._onPress(action)}>
        {icon ? (
          typeof icon === 'function' ? (
            icon({
              selected,
              disabled,
              tintColor: tintColor,
              iconSize,
              iconGap,
              width: iconSize,
              height: iconSize,
              color: tintColor,
              fill: tintColor,
            })
          ) : (
            <Image
              source={icon}
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
  }

  _renderAction(action, selected) {
    if (action === actions.align) {
      return this._renderAlignButton(action, selected);
    }
    return this.props.renderAction
      ? this.props.renderAction(action, selected)
      : this._defaultRenderAction(action, selected);
  }

  render() {
    const { style, disabled, readOnly, children, flatContainerStyle, horizontal = true } = this.props;
    if (readOnly) {
      return null;
    }
    const vStyle = [styles.barContainer, style, disabled && this._getButtonDisabledStyle()];
    const barBg = (style && style.backgroundColor) || TOOLBAR_BG;
    const showFades = horizontal;
    return (
      <View style={vStyle}>
        <View style={styles.scrollWrapper} onLayout={showFades ? this._onLayout : undefined}>
          <FlatList
            horizontal={horizontal}
            style={[flatContainerStyle, showFades && styles.scrollList]}
            keyboardShouldPersistTaps={'always'}
            keyExtractor={(item, index) => item.action + '-' + index}
            data={this.state.data}
            alwaysBounceHorizontal={false}
            showsHorizontalScrollIndicator={false}
            onScroll={showFades ? this._onScroll : undefined}
            onContentSizeChange={showFades ? this._onContentSizeChange : undefined}
            scrollEventThrottle={16}
            renderItem={({ item }) => this._renderAction(item.action, item.selected)}
          />
          {showFades && (
            <>
              <FadeOverlay
                side="left"
                visible={this.state.showLeftFade}
                backgroundColor={barBg}
              />
              <FadeOverlay
                side="right"
                visible={this.state.showRightFade}
                backgroundColor={barBg}
              />
            </>
          )}
        </View>
        {children}
      </View>
    );
  }
}

const BORDER_COLOR = '#C9CED7';
const BORDER_RADIUS = 6;

const styles = StyleSheet.create({
  barContainer: {
    height: 44,
    backgroundColor: '#efefef',
    alignItems: 'center',
    borderColor: BORDER_COLOR,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
  },

  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    position: 'relative',
  },

  scrollList: {
    flex: 1,
  },

  fadeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },

  fadeLeft: {
    left: 0,
  },

  fadeRight: {
    right: 0,
  },

  fadeStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});