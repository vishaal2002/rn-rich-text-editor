import { getContentCSS } from "./contentCSS";

function createHTML(options = {}) {
  const {
    backgroundColor = '#FFF',
    color = '#000033',
    caretColor = '',
    placeholderColor = '#a9a9a9',
    contentCSSText = '',
    cssText = '',
    initialCSSText = '',
    pasteAsPlainText = false,
    pasteListener = false,
    keyDownListener = false,
    keyUpListener = false,
    inputListener = false,
    autoCapitalize = 'off',
    enterKeyHint = '',
    initialFocus = false,
    spellcheck = true,
    autoCorrect = false,
    defaultParagraphSeparator = 'div',
    // When first gaining focus, the cursor moves to the end of the text
    firstFocusEnd = true,
    useContainer = true,
    styleWithCSS = false,
    useCharacter = true,
    defaultHttps = true,
    // XSS Protection: when true, sanitizes HTML on paste and insert operations
    sanitizeHtml = true,
  } = options;
  return String.raw`
<!DOCTYPE html>
<html>
<head>
    <title>RN Rich Text Editor</title>
    <meta name="viewport" content="user-scalable=1.0,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0">
    <style>
        ${initialCSSText}
        * {outline: 0px solid transparent;-webkit-tap-highlight-color: rgba(0,0,0,0);-webkit-touch-callout: none;box-sizing: border-box;}
        html, body { margin: 0; padding: 0;font-family: Arial, Helvetica, sans-serif; font-size:1em; height: 100%}
        body { overflow-y: hidden; -webkit-overflow-scrolling: touch;background-color: ${backgroundColor};caret-color: ${caretColor};}
        .content {font-family: Arial, Helvetica, sans-serif;color: ${color}; width: 100%;${useContainer ? '' : 'height:100%;'
    }-webkit-overflow-scrolling: touch;padding-left: 0;padding-right: 0;}
        .pell { height: 100%;} .pell-content { outline: 0; overflow-y: auto;padding: 10px;height: 100%;${contentCSSText}}
    </style>
    <style>
        [placeholder]:empty:before { content: attr(placeholder); color: ${placeholderColor};}
        [placeholder]:empty:focus:before { content: attr(placeholder);color: ${placeholderColor};display:block;}
    </style>
    ${getContentCSS()}
    <style>${cssText}</style>
</head>
<body>
<div class="content"><div id="editor" class="pell"/></div>
<script>
    var __DEV__ = !!${(window).__DEV__};
    var _ = (function (exports) {
        var anchorNode, focusNode, anchorOffset, focusOffset, _focusCollapse = false, cNode;
        var _log = console.log;
        var placeholderColor = '${placeholderColor}';
        var _randomID = 99;
        var generateId = function (){
            return "auto_" + (++ _randomID);
        }

        var body = document.body, docEle = document.documentElement;
        var defaultParagraphSeparatorString = 'defaultParagraphSeparator';
        var formatBlock = 'formatBlock';
        var editor = null, editorFoucs = false, o_height = 0, compositionStatus = 0, paragraphStatus = 0, enterStatus = 0;
        function addEventListener(parent, type, listener) {
            return parent.addEventListener(type, listener);
        };
        function appendChild(parent, child) {
            return parent.appendChild(child);
        };
        function createElement(tag) {
            return document.createElement(tag);
        };
        function queryCommandState(command) {
            return document.queryCommandState(command);
        };
        function queryCommandValue(command) {
            return document.queryCommandValue(command);
        };
        function query(command){
            return document.querySelector(command);
        }
        function querys(command){
            return document.querySelectorAll(command);
        }

        function exec(command) {
            var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            return document.execCommand(command, false, value);
        };

        function asyncExec(command){
            var args = Array.prototype.slice.call(arguments);
            setTimeout(function(){
                exec.apply(null, args);
            }, 0);
        }

        function _postMessage(data){
            exports.window.postMessage(JSON.stringify(data));
        }
        function postAction(data){
            editor.content.contentEditable === 'true' && _postMessage(data);
        };

        exports.isRN && (
            console.log = function (){
                var data = Array.prototype.slice.call(arguments);
                __DEV__ && _log.apply(null, data);
                __DEV__ && postAction({type: 'LOG', data});
            }
        )

        function formatParagraph(async){
            (async ? asyncExec: exec)(formatBlock, '<' + editor.paragraphSeparator + '>' );
        }

        function getNodeByClass(node, className){
            return node ? (node.nodeType === Node.ELEMENT_NODE && node.classList.contains(className)? node : getNodeByClass(node.parentNode, className)): node;
        }

        function getNodeByName(node, name){
            return node? (node.nodeType === Node.ELEMENT_NODE && node.nodeName === name? node: getNodeByName(node.parentNode, name)): node;
        }

        function setCollapse(node){
            var selection = window.getSelection();
            selection.selectAllChildren(node);
            selection.collapseToEnd();
        }

        function checkboxNode(node){
            return getNodeByClass(node, 'x-todo');
        }

        function execCheckboxList (node, html){
            var html = createCheckbox(node ? node.innerHTML: '');
            var HTML = "<ol class='x-todo'><li>"+ html +"</li></ol>"
            var foNode;
            if (node){
                node.innerHTML = HTML;
                foNode = node.firstChild;
            } else {
                exec("insertHTML", HTML);
            }

            foNode && setTimeout(function (){
                setCollapse(foNode);
            });
        }

        var _checkboxFlag = 0; // 1 = add checkbox; 2 = cancel checkbox
        function cancelCheckboxList(box){
            _checkboxFlag = 2;
            exec("insertOrderedList");
            setCollapse(box);
        }

        function createCheckbox(end){
            var html = '<span contenteditable="false" class="x-todo-box"><input type="checkbox"></span>';
            if (end && typeof end !== 'boolean'){
                html += end;
            } else if(end !== false){
                html += "<br/>"
            }
            return html;
        }

        function insertCheckbox (node){
            var li = getNodeByName(node, 'LI');
            li.insertBefore(document.createRange().createContextualFragment(createCheckbox(false)), li.firstChild);
            setCollapse(node);
        }

        function getCheckbox (node){
            return getNodeByClass(node, "x-todo-box");
        }

        function decodeHtmlEntities(str) {
            if (typeof str !== 'string') return str;
            // Create a temporary element to decode HTML entities
            // When we set innerHTML to a string with HTML entities like &lt;,
            // the browser automatically decodes them
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = str;
            // Return the innerHTML which now has decoded entities
            return tempDiv.innerHTML;
        }

        // XSS Protection: HTML Sanitizer
        var SANITIZE_ENABLED = ${sanitizeHtml};
        
        // Dangerous tags that should be completely removed
        var DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'base', 'link', 'meta', 'noscript', 'template', 'svg', 'math'];
        
        // Event handler attributes pattern (matches on*, formaction, etc.)
        var EVENT_ATTRS_PATTERN = /^(on[a-z]+|formaction|xlink:href|xmlns)$/i;
        
        // Dangerous URL protocols
        var DANGEROUS_URL_PATTERN = /^\s*(javascript|vbscript|data):/i;
        
        // Attributes that can contain URLs
        var URL_ATTRS = ['href', 'src', 'action', 'poster', 'background', 'codebase', 'cite', 'data', 'dynsrc', 'lowsrc'];
        
        function sanitizeHtmlString(html) {
            if (!SANITIZE_ENABLED || typeof html !== 'string' || !html.trim()) {
                return html;
            }
            
            try {
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Remove dangerous tags
                DANGEROUS_TAGS.forEach(function(tagName) {
                    var elements = tempDiv.querySelectorAll(tagName);
                    for (var i = elements.length - 1; i >= 0; i--) {
                        elements[i].parentNode.removeChild(elements[i]);
                    }
                });
                
                // Process all remaining elements
                var allElements = tempDiv.querySelectorAll('*');
                for (var i = 0; i < allElements.length; i++) {
                    var el = allElements[i];
                    var attrs = el.attributes;
                    var attrsToRemove = [];
                    
                    // Collect attributes to remove (can't modify while iterating)
                    for (var j = 0; j < attrs.length; j++) {
                        var attrName = attrs[j].name.toLowerCase();
                        var attrValue = attrs[j].value;
                        
                        // Remove event handlers
                        if (EVENT_ATTRS_PATTERN.test(attrName)) {
                            attrsToRemove.push(attrName);
                            continue;
                        }
                        
                        // Check URL attributes for dangerous protocols
                        if (URL_ATTRS.indexOf(attrName) !== -1) {
                            if (DANGEROUS_URL_PATTERN.test(attrValue)) {
                                attrsToRemove.push(attrName);
                                continue;
                            }
                        }
                        
                        // Remove style expressions (IE-specific XSS vector)
                        if (attrName === 'style') {
                            var styleVal = attrValue.toLowerCase();
                            if (styleVal.indexOf('expression') !== -1 || 
                                styleVal.indexOf('javascript') !== -1 ||
                                styleVal.indexOf('behavior') !== -1 ||
                                styleVal.indexOf('vbscript') !== -1) {
                                attrsToRemove.push(attrName);
                            }
                        }
                    }
                    
                    // Remove collected dangerous attributes
                    attrsToRemove.forEach(function(attr) {
                        el.removeAttribute(attr);
                    });
                }
                
                return tempDiv.innerHTML;
            } catch (e) {
                console.log('Sanitization error:', e);
                // On error, return escaped text to be safe
                return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        }

        function saveSelection(){
            var sel = window.getSelection();
            currentSelection = sel;
            anchorNode = sel.anchorNode;
            anchorOffset = sel.anchorOffset;
            focusNode = sel.focusNode;
            focusOffset = sel.focusOffset;
        }

        function focusCurrent(){
            editor.content.focus();
            try {
                var selection = window.getSelection();
                if (anchorNode){
                    if (anchorNode !== selection.anchorNode && !selection.containsNode(anchorNode)){
                        _focusCollapse = true;
                        selection.collapse(anchorNode, anchorOffset);
                    }
                } else if(${firstFocusEnd} && !_focusCollapse ){
                    _focusCollapse = true;
                    selection.selectAllChildren(editor.content);
                    selection.collapseToEnd();
                }
            } catch(e){
                console.log(e)
            }
        }

        var _keyDown = false;
        function handleChange (event){
            var node = anchorNode;
            Actions.UPDATE_HEIGHT();
            Actions.UPDATE_OFFSET_Y();
            if (_keyDown){
                if(_checkboxFlag === 1 && checkboxNode(node)){
                    _checkboxFlag = 0;
                    var sib = node.previousSibling;
                    if (!sib || sib.childNodes.length > 1){
                        insertCheckbox(node);
                    }
                } else if(_checkboxFlag === 2){
                    _checkboxFlag = 0;
                    var sp = createElement(editor.paragraphSeparator);
                    var br = createElement('br');
                    sp.appendChild(br);
                    setTimeout(function (){
                        node.replaceChild(sp, node.lastElementChild);
                        setCollapse(sp);
                    });
                }
            }
        }

        function adjustNestedElements() {
            // adjust ul/ol if we use p separator
            // since nesting is not valid for p
            if (editor.paragraphSeparator == 'p') {
                var selection = window.getSelection();

                let lists = document.querySelectorAll("ol, ul");
                for (let i = 0; i < lists.length; i++) {
                    let ele = lists[i];
                    let parentNode = ele.parentNode;
                    if (parentNode.tagName === 'P' && parentNode.lastChild === parentNode.firstChild) {
                        parentNode.insertAdjacentElement('beforebegin', ele);
                        parentNode.remove()
                    }
                }

                selection.collapse(anchorNode, anchorOffset);
            }
        }

        var Actions = {
            bold: { state: function() { return queryCommandState('bold'); }, result: function() { return exec('bold'); }},
            italic: { state: function() { return queryCommandState('italic'); }, result: function() { return exec('italic'); }},
            underline: { state: function() { return queryCommandState('underline'); }, result: function() { return exec('underline'); }},
            strikeThrough: { state: function() { return queryCommandState('strikeThrough'); }, result: function() { return exec('strikeThrough'); }},
            subscript: { state: function() { return queryCommandState('subscript'); }, result: function() { return exec('subscript'); }},
            superscript: { state: function() { return queryCommandState('superscript'); }, result: function() { return exec('superscript'); }},
            heading1: { state: function() { return queryCommandValue(formatBlock) === 'h1'; }, result: function() { return exec(formatBlock, '<h1>'); }},
            heading2: { state: function() { return queryCommandValue(formatBlock) === 'h2'; }, result: function() { return exec(formatBlock, '<h2>'); }},
            heading3: { state: function() { return queryCommandValue(formatBlock) === 'h3'; }, result: function() { return exec(formatBlock, '<h3>'); }},
            heading4: { state: function() { return queryCommandValue(formatBlock) === 'h4'; }, result: function() { return exec(formatBlock, '<h4>'); }},
            heading5: { state: function() { return queryCommandValue(formatBlock) === 'h5'; }, result: function() { return exec(formatBlock, '<h5>'); }},
            heading6: { state: function() { return queryCommandValue(formatBlock) === 'h6'; }, result: function() { return exec(formatBlock, '<h6>'); }},
            paragraph: { state: function() { return queryCommandValue(formatBlock) === 'p'; }, result: function() { return exec(formatBlock, '<p>'); }},
            quote: { result: function() { return exec(formatBlock, '<blockquote>'); }},
            removeFormat: { result: function() { return exec('removeFormat'); }},
            orderedList: {
                state: function() { return !checkboxNode(window.getSelection().anchorNode) && queryCommandState('insertOrderedList'); },
                result: function() {
                    if (!!checkboxNode(window.getSelection().anchorNode)) return;

                    let flag = exec('insertOrderedList');
                    adjustNestedElements();
                    return flag;
                }
            },
            unorderedList: {
                state: function() { return queryCommandState('insertUnorderedList');},
                result: function() {
                    if (!!checkboxNode(window.getSelection().anchorNode)) return;

                    let flag =  exec('insertUnorderedList');
                    adjustNestedElements();
                    return flag;
                }
            },
            code: { result: function(type) {
                var flag = exec(formatBlock, '<pre>');
                var node = anchorNode.nodeName === "PRE" ? anchorNode: anchorNode.parentNode;
                if (node.nodeName === 'PRE'){
                    type && node.setAttribute("type", type);
                    node.innerHTML = "<code type='"+(type || '') +"'>" + node.innerHTML + "</code>";
                    // var br = createElement("br");
                    // node.parentNode.insertBefore(br, node.nextSibling);
                    setTimeout(function (){
                        setCollapse(node.firstChild);
                    });
                }
                return flag;
             }},
            line: { result: function() { return exec('insertHorizontalRule'); }},
            redo: { result: function() { return exec('redo'); }},
            undo: { result: function() { return exec('undo'); }},
            indent: { result: function() { return exec('indent'); }},
            outdent: { result: function() { return exec('outdent'); }},
            outdent: { result: function() { return exec('outdent'); }},
            justifyCenter: {  state: function() { return queryCommandState('justifyCenter'); }, result: function() { return exec('justifyCenter'); }},
            justifyLeft: { state: function() { return queryCommandState('justifyLeft'); }, result: function() { return exec('justifyLeft'); }},
            justifyRight: { state: function() { return queryCommandState('justifyRight'); }, result: function() { return exec('justifyRight'); }},
            justifyFull: { state: function() { return queryCommandState('justifyFull'); }, result: function() { return exec('justifyFull'); }},
            hiliteColor: {  state: function() { return queryCommandValue('backColor'); }, result: function(color) { return exec('backColor', color); }},
            foreColor: { state: function() { return queryCommandValue('foreColor'); }, result: function(color) { return exec('foreColor', color); }},
            fontSize: { state: function() { return queryCommandValue('fontSize'); }, result: function(size) { return exec('fontSize', size); }},
            fontName: { result: function(name) { return exec('fontName', name); }},
            lineHeight: {
                result: function(value) {
                    if (value == null || value === '') return;
                    var sel = document.getSelection();
                    if (sel.rangeCount === 0) return;
                    var range = sel.getRangeAt(0);
                    var span = document.createElement('span');
                    span.style.lineHeight = typeof value === 'number' ? String(value) : String(value);
                    try {
                        if (range.collapsed) {
                            range.insertNode(span);
                            range.setStart(span, 0);
                            range.setEnd(span, 0);
                        } else {
                            var fragment = range.extractContents();
                            span.appendChild(fragment);
                            range.insertNode(span);
                            range.setStart(span, 0);
                            range.setEnd(span, 0);
                        }
                        sel.removeAllRanges();
                        sel.addRange(range);
                        saveSelection();
                        editor.settings.onChange();
                    } catch (e) {}
                }
            },
            link: {
                // result: function(data) {
                //     data = data || {};
                //     var title = data.title;
                //     title = title || window.getSelection().toString();
                //     // title = title || window.prompt('Enter the link title');
                //     var url = data.url || window.prompt('Enter the link URL');
                //     if (url){
                //         exec('insertHTML', "<a href='"+ url +"'>"+(title || url)+"</a>");
                //     }
                // }
                result: function(data) {
                    var sel = document.getSelection();
                    data = data || {};
                    var url = data.url || window.prompt('Enter the link URL');

                    if (url) {
                        let href = url
                        if (${defaultHttps} && !href.startsWith("http")) {
                            href = "https://" + href
                        }

                        var el = document.createElement("a");
                        el.setAttribute("href", href);

                        var title = data.title || sel.toString() || url;
                        el.text = title;

                        // when adding a link, if our current node is empty, it may have a <br>
                        // if so, replace it with '' so the added link doesn't end up with an extra space.
                        // Also, if totally empty, we must format the paragraph to add the link into the container.
                        var mustFormat = false;
                        if (sel.anchorNode && sel.anchorNode.innerHTML === '<br>') {
                            sel.anchorNode.innerHTML = '';
                        } else if (!sel.anchorNode || sel.anchorNode === editor.content) {
                            mustFormat = true;
                        }

                        // insert like this so we can replace current selection, if any
                        var range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(el);

                        // restore cursor to end
                        range.setStartAfter(el);
                        range.setEndAfter(el);
                        sel.removeAllRanges();
                        sel.addRange(range);

                        // format paragraph if needed
                        if (mustFormat){
                            formatParagraph();
                        }

                        // save selection, and fire on change to our webview
                        saveSelection();
                        editor.settings.onChange();
                    }
                }
            },
            image: {
                result: function(url, style) {
                    if (url){
                        // Validate URL to prevent javascript: protocol XSS
                        if (SANITIZE_ENABLED && DANGEROUS_URL_PATTERN.test(url)) {
                            console.log('Blocked potentially dangerous image URL');
                            return;
                        }
                        // Sanitize style to prevent expression-based XSS
                        var safeStyle = style || '';
                        if (SANITIZE_ENABLED && safeStyle) {
                            var styleLower = safeStyle.toLowerCase();
                            if (styleLower.indexOf('expression') !== -1 || 
                                styleLower.indexOf('javascript') !== -1 ||
                                styleLower.indexOf('behavior') !== -1) {
                                safeStyle = '';
                            }
                        }
                        exec('insertHTML', "<img style='"+ safeStyle +"' src='"+ url +"'/>");
                        // This is needed, or the image will not be inserted if the html is empty
                        exec('insertHTML', "<br/>");
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            html: {
                result: function (html){
                    if (html){
                        // Sanitize HTML before inserting to prevent XSS
                        exec('insertHTML', sanitizeHtmlString(html));
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            text: { result: function (text){ text && exec('insertText', text); }},
            video: {
                result: function(url, style) {
                    if (url) {
                        // Validate URL to prevent javascript: protocol XSS
                        if (SANITIZE_ENABLED && DANGEROUS_URL_PATTERN.test(url)) {
                            console.log('Blocked potentially dangerous video URL');
                            return;
                        }
                        // Sanitize style to prevent expression-based XSS
                        var safeStyle = style || '';
                        if (SANITIZE_ENABLED && safeStyle) {
                            var styleLower = safeStyle.toLowerCase();
                            if (styleLower.indexOf('expression') !== -1 || 
                                styleLower.indexOf('javascript') !== -1 ||
                                styleLower.indexOf('behavior') !== -1) {
                                safeStyle = '';
                            }
                        }
                        var thumbnail = url.replace(/.(mp4|m3u8)/g, '') + '-thumbnail';
                        var html = "<br><div style='"+ safeStyle +"'><video src='"+ url +"' poster='"+ thumbnail + "' controls><source src='"+ url +"' type='video/mp4'>No video tag support</video></div><br>";
                        exec('insertHTML', html);
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            checkboxList: {
                state: function(){return checkboxNode(window.getSelection().anchorNode)},
                result: function() {
                    if (queryCommandState('insertOrderedList')) return;
                    var pNode;
                    if (anchorNode){
                        pNode = anchorNode.parentNode;
                        if (anchorNode === editor.content) pNode = null;
                    }

                    if (anchorNode === editor.content || queryCommandValue(formatBlock) === ''){
                        formatParagraph();
                    }

                    var box = checkboxNode(anchorNode);
                    if (!!box){
                        cancelCheckboxList(box.parentNode);
                    } else {
                        !queryCommandState('insertOrderedList') && execCheckboxList(anchorNode);
                    }
                }
            },
            content: {
                setDisable: function(dis){ this.blur(); editor.content.contentEditable = !dis},
                setHtml: function(html) { 
                    // Decode HTML entities ONLY if the string contains escaped HTML (e.g., &lt; instead of <)
                    // and does NOT contain unescaped HTML tags. This ensures normal HTML continues to work unchanged.
                    var decodedHtml = html;
                    if (typeof html === 'string') {
                        // Only decode if:
                        // 1. String contains escaped HTML entities (&lt; or &gt;)
                        // 2. String does NOT contain unescaped HTML tags (<)
                        // This way, normal HTML like "<p>Hello</p>" is left unchanged
                        var hasEscapedEntities = html.indexOf('&lt;') !== -1 || html.indexOf('&gt;') !== -1;
                        var hasUnescapedTags = html.indexOf('<') !== -1;
                        var needsDecoding = hasEscapedEntities && !hasUnescapedTags;
                        
                        if (needsDecoding) {
                            // Use decodeHtmlEntities helper to decode escaped HTML entities
                            decodedHtml = decodeHtmlEntities(html);
                            // Fallback: if decodeHtmlEntities didn't work, try direct innerHTML assignment
                            // (browser automatically decodes entities when setting innerHTML)
                            if (decodedHtml === html || decodedHtml.indexOf('&lt;') !== -1) {
                                var tempDiv = document.createElement('div');
                                tempDiv.innerHTML = html;
                                // Browser should have decoded it - check if it did
                                if (tempDiv.innerHTML.indexOf('<') !== -1) {
                                    decodedHtml = tempDiv.innerHTML;
                                }
                            }
                        }
                        // If needsDecoding is false, decodedHtml remains as original html (normal HTML case)
                    }
                    // Sanitize HTML before setting to prevent XSS
                    editor.content.innerHTML = sanitizeHtmlString(decodedHtml); 
                    Actions.UPDATE_HEIGHT(); 
                },
                getHtml: function() { return editor.content.innerHTML; },
                blur: function() { editor.content.blur(); },
                focus: function() { focusCurrent(); },
                postHtml: function (){ postAction({type: 'CONTENT_HTML_RESPONSE', data: editor.content.innerHTML}); },
                setPlaceholder: function(placeholder){ editor.content.setAttribute("placeholder", placeholder) },

                setContentStyle: function(styles) {
                    styles = styles || {};
                    var bgColor = styles.backgroundColor, color = styles.color, pColor = styles.placeholderColor;
                    if (bgColor && bgColor !== body.style.backgroundColor) body.style.backgroundColor = bgColor;
                    if (color && color !== editor.content.style.color) editor.content.style.color = color;
                    if (pColor && pColor !== placeholderColor){
                        var rule1="[placeholder]:empty:before {content:attr(placeholder);color:"+pColor+";}";
                        var rule2="[placeholder]:empty:focus:before{content:attr(placeholder);color:"+pColor+";}";
                        try {
                            document.styleSheets[1].deleteRule(0);document.styleSheets[1].deleteRule(0);
                            document.styleSheets[1].insertRule(rule1); document.styleSheets[1].insertRule(rule2);
                            placeholderColor = pColor;
                        } catch (e){
                            console.log("set placeholderColor error!")
                        }
                    }
                },

                commandDOM: function (command){
                    try {new Function("$", command)(exports.document.querySelector.bind(exports.document))} catch(e){console.log(e.message)};
                },
                command: function (command){
                    try {new Function("$", command)(exports.document)} catch(e){console.log(e.message)};
                }
            },

            init: function (){
                if (${useContainer}){
                    // setInterval(Actions.UPDATE_HEIGHT, 150);
                    Actions.UPDATE_HEIGHT();
                } else {
                    // react-native-webview There is a bug in the body and html height setting of a certain version of 100%
                    // body.style.height = docEle.clientHeight + 'px';
                }
            },

            UPDATE_HEIGHT: function() {
                if (!${useContainer}) return;
                // var height = Math.max(docEle.scrollHeight, body.scrollHeight);
                var height = editor.content.scrollHeight;
                if (o_height !== height){
                    _postMessage({type: 'OFFSET_HEIGHT', data: o_height = height});
                }
            },

            UPDATE_OFFSET_Y: function (){
                if (!${useContainer}) return;
                var node = anchorNode || window.getSelection().anchorNode;
                var sel = window.getSelection();
                if (node){
                    var siblingOffset = (node.nextSibling && node.nextSibling.offsetTop) || (node.previousSibling && node.previousSibling.offsetTop)
                    var rectOffset = null;
                    if (sel.rangeCount > 0) {
                        var range = sel.getRangeAt(0);
                        var rect = range.getClientRects()[0];
                        rectOffset = rect ? rect.y : null;
                    }

                    var offsetY = node.offsetTop || siblingOffset || rectOffset || node.parentNode.offsetTop;
                    if (offsetY){
                        _postMessage({type: 'OFFSET_Y', data: offsetY});
                    }
                }
            }
        };

        var init = function init(settings) {

            var paragraphSeparator = settings[defaultParagraphSeparatorString];
            var content = settings.element.content = createElement('div');
            content.id = 'content';
            content.contentEditable = true;
            content.spellcheck = ${spellcheck};
            content.autofocus = ${initialFocus};
            content.enterKeyHint = '${enterKeyHint}';
            content.autocapitalize = '${autoCapitalize}';
            content.autocorrect = ${autoCorrect};
            content.autocomplete = 'off';
            content.className = "pell-content";
            content.oninput = function (_ref) {
                // var firstChild = _ref.target.firstChild;
                if ((anchorNode === void 0 || anchorNode === content) && queryCommandValue(formatBlock) === ''){
                    if ( !compositionStatus || anchorNode === content){
                        formatParagraph(true);
                        paragraphStatus = 0;
                    } else {
                        paragraphStatus = 1;
                    }
                } else if (content.innerHTML === '<br>'){
                    content.innerHTML = '';
                } else if (enterStatus && queryCommandValue(formatBlock) === 'blockquote') {
                    formatParagraph();
                }

                saveSelection();
                handleChange(_ref);
                settings.onChange();
                ${inputListener} && postAction({type: "ON_INPUT", data: {inputType: _ref.inputType, data: _ref.data}});
            };
            appendChild(settings.element, content);

            if (settings.styleWithCSS) exec('styleWithCSS');
            exec(defaultParagraphSeparatorString, paragraphSeparator);

            var actionsHandler = [];
            for (var k in Actions){
                if (typeof Actions[k] === 'object' && Actions[k].state){
                    actionsHandler[k] = Actions[k]
                }
            }

            function handler() {
                var activeTools = [];
                for(var k in actionsHandler){
                    const state =  Actions[k].state()
                    if ( state ){
                        activeTools.push(typeof state === "boolean" ? k : {type: k, value: Actions[k].state()});
                    }
                }
                postAction({type: 'SELECTION_CHANGE', data: activeTools});
            };

            var _handleStateDT = null;
            function handleState(){
                clearTimeout(_handleStateDT);
                _handleStateDT = setTimeout(function (){
                    handler();
                    saveSelection();
                }, 50);
            }

            function handleSelecting(event){
                event.stopPropagation();
                handleState();
            }

            function postKeyAction(event, type){
                postAction({type: type, data: {keyCode: event.keyCode, key: event.key}});
            }
            function handleKeyup(event){
                enterStatus = 0;
                _keyDown = false;
                if (event.keyCode === 8) handleSelecting (event);
                ${keyUpListener} && postKeyAction(event, "CONTENT_KEYUP")
            }
            function handleKeydown(event){
                _keyDown = true;
                 handleState();
                if (event.key === 'Enter'){
                    enterStatus = 1; // set enter true
                    var box;
                    var block = queryCommandValue(formatBlock);
                    if (anchorNode.innerHTML === '<br>' && anchorNode.parentNode !== editor.content){
                        // setCollapse(editor.content);
                    } else if (queryCommandState('insertOrderedList') && !!(box = checkboxNode(anchorNode))){
                        var node = anchorNode && anchorNode.childNodes[1];
                        if (node && node.nodeName === 'BR'){
                            cancelCheckboxList(box.parentNode);
                            event.preventDefault();
                        } else{
                            // add checkbox
                            _checkboxFlag = 1;
                        }
                    }
                    if (block === 'pre' && anchorNode.innerHTML === '<br>'){
                        // code end enter new line (Unfinished)
                        if (!anchorNode.nextSibling){
                            event.preventDefault();
                            var node = anchorNode.parentNode;
                            var br = createElement("br");
                            node.parentNode.insertBefore(br, node.nextSibling);
                            setTimeout(function (){
                                setCollapse(br);
                            });
                        }
                    }
                }
                ${keyDownListener} && postKeyAction(event, "CONTENT_KEYDOWN");
            }
            function handleFocus (){
                editorFoucs = true;
                setTimeout(function (){
                    Actions.UPDATE_OFFSET_Y();
                });
                postAction({type: 'CONTENT_FOCUSED'});
            }
            function handleBlur (){
                editorFoucs = false;
                postAction({type: 'SELECTION_CHANGE', data: []});
                postAction({type: 'CONTENT_BLUR'});
            }
            function handleClick(event){
                var ele = event.target;
                if (ele.nodeName === 'INPUT' && ele.type === 'checkbox'){
                    // Set whether the checkbox is selected by default
                    if (ele.checked) ele.setAttribute('checked', '');
                    else ele.removeAttribute('checked');
                }
                if (ele.nodeName === 'A' && ele.getAttribute('href')) {
                    postAction({type: 'LINK_TOUCHED', data: ele.getAttribute('href')});
                }
            }
            addEventListener(content, 'touchcancel', handleSelecting);
            addEventListener(content, 'mouseup', handleSelecting);
            addEventListener(content, 'touchend', handleSelecting);
            addEventListener(content, 'keyup', handleKeyup);
            addEventListener(content, 'click', handleClick);
            addEventListener(content, 'keydown', handleKeydown);
            addEventListener(content, 'blur', handleBlur);
            addEventListener(content, 'focus', handleFocus);
            addEventListener(content, 'paste', function (e) {
                var clipboardData = (e.originalEvent || e).clipboardData;
                var text = clipboardData.getData('text/plain');
                var html = clipboardData.getData('text/html');

                ${pasteListener} && postAction({type: 'CONTENT_PASTED', data: text || html});
                if (${pasteAsPlainText}) {
                    e.preventDefault();
                    exec("insertText", text);
                } else if (html && html.trim() !== '') {
                    e.preventDefault();
                    // Sanitize HTML before inserting to prevent XSS
                    exec("insertHTML", sanitizeHtmlString(html));
                } else if (text && (text.indexOf('&lt;') !== -1 || text.indexOf('<') !== -1)) {
                    var htmlFromText = text.indexOf('&lt;') !== -1
                        ? text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                        : text;
                    if (htmlFromText.indexOf('<') !== -1) {
                        e.preventDefault();
                        // Sanitize HTML before inserting to prevent XSS
                        exec("insertHTML", sanitizeHtmlString(htmlFromText));
                    }
                }
            });
            addEventListener(content, 'compositionstart', function(event){
                if(${useCharacter}){
                    compositionStatus = 1;
                }
            })
            addEventListener(content, 'compositionend', function (event){
                if(${useCharacter}){
                    compositionStatus = 0;
                    paragraphStatus && formatParagraph(true);
                }
            })

            var message = function (event){
                var msgData = JSON.parse(event.data), action = Actions[msgData.type];
                if (action ){
                    if ( action[msgData.name]){
                        var flag = msgData.name === 'result';
                        // insert image or link need current focus
                        flag && focusCurrent();
                        action[msgData.name](msgData.data, msgData.options);
                        flag && handleState();
                    } else {
                        action(msgData.data, msgData.options);
                    }
                }
            };
            document.addEventListener("message", message , false);
            window.addEventListener("message", message , false);
            document.addEventListener('mouseup', function (event) {
                event.preventDefault();
                Actions.content.focus();
                handleSelecting(event);
            });
            return {content, paragraphSeparator: paragraphSeparator, settings};
        };

        var _handleCTime = null;
        editor = init({
            element: document.getElementById('editor'),
            defaultParagraphSeparator: '${defaultParagraphSeparator}',
            styleWithCSS: ${styleWithCSS},
            onChange: function (){
                clearTimeout(_handleCTime);
                _handleCTime = setTimeout(function(){
                    var html = Actions.content.getHtml();
                    postAction({type: 'CONTENT_CHANGE', data: html});
                }, 50);
            }
        })
        return {
            sendEvent: function (type, data){
                event.preventDefault();
                event.stopPropagation();
                var id = event.currentTarget.id;
                if ( !id ) event.currentTarget.id = id = generateId();
                _postMessage({type, id, data});
            }
        }
    })({
        window: window.ReactNativeWebView || window.parent,
        isRN: !!window.ReactNativeWebView ,
        document: document
    });
</script>
</body>
</html>
`;
}

/**
 * Escapes a string for safe embedding inside a JavaScript double-quoted string in HTML.
 * Newlines and quotes must be escaped or the script will be invalid.
 */
function escapeForScript(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/script/gi, '<\\/script');
}

/**
 * Creates minimal HTML for read-only display: content expands to full height, no scroll.
 * No editor, no toolbar. Content is escaped and embedded in the template.
 */
function createReadOnlyHTML(options = {}) {
  const {
    content = '',
    backgroundColor = '#FFF',
    color = '#000033',
    contentCSSText = '',
    cssText = '',
    initialCSSText = '',
    // XSS Protection: when true, sanitizes HTML content before rendering
    sanitizeHtml = true,
  } = options;
  const escapedContent = escapeForScript(content);
  const useDefaultFont =
    !/font-family\s*:/i.test(contentCSSText) && !/font-size\s*:/i.test(contentCSSText);
  return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="user-scalable=1.0,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0">
    <style>
        ${initialCSSText}
        * { outline: 0; -webkit-tap-highlight-color: rgba(0,0,0,0); box-sizing: border-box; }
        html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 1em; overflow: hidden; height: auto !important; min-height: 0 !important; }
        body { background-color: ${backgroundColor}; color: ${color}; }
        .readonly-container {
            ${useDefaultFont ? 'font-family: Arial, Helvetica, sans-serif; font-size: 1em;' : ''}
            color: ${color};
            padding: 0;
            margin: 0;
            height: auto !important;
            min-height: 0 !important;
            width: 100%;
            ${contentCSSText}
        }
        .readonly-container > *:first-child {
            margin-top: 0 !important;
        }
        .readonly-container p {
            margin-top: 0;
            margin-bottom: 0.5em;
        }
        .readonly-container p:last-child {
            margin-bottom: 0;
        }
    </style>
    ${getContentCSS()}
    <style>${cssText}</style>
</head>
<body>
    <div id="readonly-content" class="readonly-container"></div>
    <script>
        (function() {
            var SANITIZE_ENABLED = ${sanitizeHtml};
            var DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'base', 'link', 'meta', 'noscript', 'template', 'svg', 'math'];
            var EVENT_ATTRS_PATTERN = /^(on[a-z]+|formaction|xlink:href|xmlns)$/i;
            var DANGEROUS_URL_PATTERN = /^\\s*(javascript|vbscript|data):/i;
            var URL_ATTRS = ['href', 'src', 'action', 'poster', 'background', 'codebase', 'cite', 'data', 'dynsrc', 'lowsrc'];
            
            function sanitizeHtmlString(html) {
                if (!SANITIZE_ENABLED || typeof html !== 'string' || !html.trim()) {
                    return html;
                }
                try {
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    DANGEROUS_TAGS.forEach(function(tagName) {
                        var elements = tempDiv.querySelectorAll(tagName);
                        for (var i = elements.length - 1; i >= 0; i--) {
                            elements[i].parentNode.removeChild(elements[i]);
                        }
                    });
                    var allElements = tempDiv.querySelectorAll('*');
                    for (var i = 0; i < allElements.length; i++) {
                        var el = allElements[i];
                        var attrs = el.attributes;
                        var attrsToRemove = [];
                        for (var j = 0; j < attrs.length; j++) {
                            var attrName = attrs[j].name.toLowerCase();
                            var attrValue = attrs[j].value;
                            if (EVENT_ATTRS_PATTERN.test(attrName)) {
                                attrsToRemove.push(attrName);
                                continue;
                            }
                            if (URL_ATTRS.indexOf(attrName) !== -1 && DANGEROUS_URL_PATTERN.test(attrValue)) {
                                attrsToRemove.push(attrName);
                                continue;
                            }
                            if (attrName === 'style') {
                                var styleVal = attrValue.toLowerCase();
                                if (styleVal.indexOf('expression') !== -1 || 
                                    styleVal.indexOf('javascript') !== -1 ||
                                    styleVal.indexOf('behavior') !== -1 ||
                                    styleVal.indexOf('vbscript') !== -1) {
                                    attrsToRemove.push(attrName);
                                }
                            }
                        }
                        attrsToRemove.forEach(function(attr) {
                            el.removeAttribute(attr);
                        });
                    }
                    return tempDiv.innerHTML;
                } catch (e) {
                    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            }
            
            var content = "${escapedContent}";
            var el = document.getElementById('readonly-content');
            if (el) {
                el.innerHTML = sanitizeHtmlString(content);
                var lastH = 0;
                var sendHeight = function() {
                    var scrollH = el.scrollHeight;
                    var offsetH = el.offsetHeight;
                    var h = Math.ceil(Math.max(scrollH, offsetH)) + 8;
                    if (h !== lastH && window.ReactNativeWebView) {
                        lastH = h;
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'OFFSET_HEIGHT', data: h}));
                    }
                };
                setTimeout(sendHeight, 0);
                requestAnimationFrame(function() { requestAnimationFrame(sendHeight); });
                setTimeout(sendHeight, 100);
                if (typeof ResizeObserver !== 'undefined') {
                    try {
                        new ResizeObserver(sendHeight).observe(el);
                    } catch (e) {}
                }
            }
        })();
    <\/script>
</body>
</html>
`;
}

const HTML = createHTML();
export { HTML, createHTML, createReadOnlyHTML };