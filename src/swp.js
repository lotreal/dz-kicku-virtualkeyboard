var SWP = window.SWP || {}; // 名字空间：善为派

(function(win, ns) {
    ns.Event = ns.Event || {};

    var observers = {};

    function subscribe(events, bind) {
        for (var i = 0, n = events.length; i < n; i++) {
            var s = events[i], options = {},
                event = s[0], 
                func = s[1],
                delay = parseInt(s[2]);

            if (bind)  options.bind = bind;
            if (!isNaN(delay)) options.delay = delay;

            if (!observers.hasOwnProperty(event)) observers[event] = [];
            observers[event].push(func.create(options));
        }
    }

    function unsubscribe(event) {
        if (event) observers[event] = [];
        else observers = {};
    }

    function notify(event, args) {
        var observer = observers[event];
        if (!observer) return false;

        for (var i = 0, n = observer.length; i < n; i++) {
            observer[i].run(args);
        }
        return true;
    }

    ns.addObservers = ns.Event.subscribe = subscribe;
    ns.notifyObservers = ns.Event.notify = notify;
    ns.deleteObservers = ns.Event.unsubscribe = unsubscribe;
})(window, SWP);


(function(win, ns) { // Element
    var _dontActiveFlag = 'dont-active-me';

    function getLayout(el) {
        var $el = $(el),
            styles = $el.getStyles('padding', 'margin', 'border-width'),
            padding = styles['padding'].split(' ').map(function(item) { 
                return item.toInt(); 
            }),
            margin = styles['margin'].split(' ').map(function(item) { 
                return item.toInt(); 
            }),
            border = styles['border-width'].split(' ').map(function(item) {
                return item.toInt(); 
            }),
            layout = {
                'padding': {
                    'top': padding[0],
                    'right': $defined(padding[1]) ? padding[1] : padding[0],
                    'bottom': $defined(padding[2]) ? padding[2] : padding[0],
                    'left': $defined(padding[3]) ? padding[3] : padding[0]
                },
                'margin': {
                    'top': margin[0],
                    'right': $defined(margin[1]) ? margin[1] : margin[0],
                    'bottom': $defined(margin[2]) ? margin[2] : margin[0],
                    'left': $defined(margin[3]) ? margin[3] : margin[0]
                },
                'border': {
                    'top': border[0],
                    'right': $defined(border[1]) ? border[1] : border[0],
                    'bottom': $defined(border[2]) ? border[2] : border[0],
                    'left': $defined(border[3]) ? border[3] : border[0]
                }
            },
            size = $el.getSize();

        layout['height'] = size.y
            - layout['border']['top'] - layout['border']['bottom']
            - layout['padding']['top'] - layout['padding']['bottom'];
        layout['width'] = size.x
            - layout['border']['left'] - layout['border']['right']
            - layout['padding']['left'] - layout['padding']['right'];

        layout['total'] = {};
        layout['total']['height'] = layout['height']
            + layout['margin']['top'] + layout['margin']['bottom']
            + layout['border']['top'] + layout['border']['bottom']
            + layout['padding']['top'] + layout['padding']['bottom'];

        layout['total']['width'] = layout['width']
            + layout['margin']['left'] + layout['margin']['right']
            + layout['border']['left'] + layout['border']['right']
            + layout['padding']['left'] + layout['padding']['right'];

        return layout;
    }

    ns.Element = {
        dontActiveFlag: _dontActiveFlag,

        focus: function(el) {
            $(el).focus();
        },

        isTextbox: function(el) {
            if (!el) return false;
            var tag = el.tagName;
            return tag == 'TEXTAREA' ||
                (tag == 'INPUT' && el.get('type') == 'text');
        },

        isHidden: function(el) {
            var $el = $(el), 
                w = $el.offsetWidth, 
                h = $el.offsetHeight,
                force = ($el.tagName === 'TR');
            return (w===0 && h===0 && !force) ? true : (w!==0 && h!==0 && !force)
                ? false : $el.getStyle('display') === 'none';
        },

        isVisible: function(el){ return !this.isHidden(el); },

        getLayout: getLayout,

        topZindex: 9999,
        dialogZindex: 999
    };
})(window, SWP);


(function(win, ns) { // Form
    ns.Form = ns.Form || {};
    var F = ns.Form;
    F = {
        setDisabled: function(form, configs) {
            for (name in configs) {
                var $el = form[name];
                if (!configs[name]) {
                    $el.set('disabled', true);
                    if ($el.get('type') === 'button') $el.hide();
                }
            }
        }
    };
})(window, SWP);


(function(win, ns) {
    ns.Widget = ns.Widget || {};
    var E = ns.Element;

    ns.Widget.Dict = new Class(
        {
            Implements: [Events, Options],
            options: {
                'maxVisibleItems': 20,
                'className': 'dict-result',
                'dict': {/*
                    name: 'food',
                    terms: ['code', 'name'],
                    definition: 'cname',
                    data: []
                */}
            },
            initialize: function(el, options) {
                this.setOptions(options);
                this.el = $(el);
                this.list = (new Element('ul', {
                    'class': this.options.className,
                    'style': 'z-index:' + (E.topZindex - 1)
                })).inject(this.el);

                this.visible = false;
                this.last_token = '';
            },
            show: function() {
                this.el.setStyle('display', '');
                this.visible = true;
            },
            hide: function() {
                this.el.setStyle('display', 'none');
                this.visible = false;
                this.last_token = '';
                this.list.empty();                
            },
            addDict: function(dict) {
                var dname = dict['name'] || 'default';
                if ($type(dict.data) != 'array') {
                    var obj = dict.data ,data = [];                    
                    for (var sn in obj) data.push(obj[sn]);
                    dict.data = data;
                }

                this.options.dict[dname] = dict;
                return this;
            },
            search: function(token, dname) {
                var dict = this.options.dict[dname || 'default'];
                if (dict && token !== this.last_token) {
                    this.showList(token, dict);
                    this.last_token = token;
                }
                this.dname = dname;
            },
            showList: function(token, dict) {
                var search = this.filterToken(token, dict),
                    list = this.list;

                list.empty();
                if (!search.length) {
                    this.hide();
                    return;
                }

                var fragment = document.createDocumentFragment();
                for (var i = 0, item; item = search[i]; i++) {
                    fragment.appendChild( this.renderItem(item, token, dict) );
                }
                list.appendChild(fragment);
                list.getElement('li').addClass('focus');
                this.show();
            },
            filterToken: function(token, dict) {
                if (!token) return [];

                var terms = dict.terms, data = dict.data, max = this.options.maxVisibleItems;

                var search = [];

                for (var i = 0, n = data.length; i < n; i++) {
                    if (search.length === max) break;

                    for (var j = 0, m = terms.length; j < m; j++) {
                        if (data[i][terms[j]].startsWith(token)) {
                            search.push(data[i]);
                            break;
                        }
                    }
                }
                return search;
            },
            renderItem: function(item, token, dict) {
                var li = new Element('li'), terms = dict.terms, keys = [];

                for (var j = 0, m = terms.length; j < m; j++) {
                    keys.push(item[terms[j]]);
                }
                keys = keys.join(',').replace(token, '<strong>'+token+'</strong>');

                li.set('html', '<span class="key">'+ keys +'</span><span class="value">'+ item[dict.definition] +'</span>');
                li.addEvent('click', this.select.pass([dict.name, item], this));
                li.store('item', item);
                return li;
            },
            select: function(dname, item) {
                if (!item) {
                    var li = this.list.getElement('li.focus');
                    if (!li) return false;
                    item = li.retrieve('item');
                }

                this.fireEvent('select', [item, dname]);
                this.hide();
                return true;
            }
        });
})(window, SWP);


(function(win, ns) {
    var T = ns.Touch = ns.Touch || {},
        F = ns.Form,
        E = ns.Element,

        dict = T.dict = null,

        _activeTextbox = null,
        _dontActiveFlag = E.dontActiveFlag,
        _activeFlag = T.activeFlag = 'active-textbox',
        // 是否把焦点保持在可输入文本框上（为提高触摸屏用户体验)
        _holdOnInputs = true,
        _isTextbox = E.isTextbox;

    function activeTextboxHandler() {
        var curElement = document.activeElement;
        // console.log('cur', curElement);
        // console.log(_activeTextbox);

        if (curElement.hasClass(_dontActiveFlag)) return;
        if (_isTextbox(curElement)) {
            if (curElement == _activeTextbox) return;
            // var srt = curElement.selectionStart,
            //     len = curElement.selectionEnd;
            // console.log(srt,len);
            if (_activeTextbox != null) _activeTextbox.removeClass(_activeFlag);
            _activeTextbox = curElement;
            _activeTextbox.select();
            _activeTextbox.addClass(_activeFlag);
        } else {
            if (_holdOnInputs) {
                try {
                    if (_activeTextbox != null && _activeTextbox.setSelectionRange)
                        _activeTextbox.setSelectionRange(9999, 9999);
                } catch(ex) {}
            } else {
                if (_activeTextbox != null) _activeTextbox.removeClass(_activeFlag);
                _activeTextbox = null;
            }
        }
    }

    function getUsableTextboxs() {
        var all = $$('input[type="text"]', 'textarea').filter(function(el) {
            return ! ( E.isHidden(el) || el.get('disabled') 
                       || el.hasClass(_dontActiveFlag)); 
        });
        all.sort(function(a, b) {
            var pa = a.getPosition(), pb = b.getPosition();
            if (Math.abs(pa.y - pb.y) < 6 ) return pa.x - pb.x;
            else return pa.y - pb.y;
        });
        return all;
    }


    E.focus = function(el) {
        $(el).focus();
        activeTextboxHandler();
    };

    E.focusFirstTextbox = function () {
        var all = getUsableTextboxs();
        if (all.length > 0) E.focus(all[0]);
    };

    F.tab = function() {
        var curElement = _activeTextbox;
        curElement.fireEvent('tab', true);

        var all = getUsableTextboxs(),
        len = all.length,
        idx = all.indexOf(curElement);

        if (++idx < len) E.focus(all[idx]);
    };

    function activeTouch() {
        if (T._actived) return;

        dict = T.dict = new ns.Widget.Dict('input-suggest');
        $(document).addEvents({
            'keyup': activeTextboxHandler,
            'click': activeTextboxHandler,
            'keydown': function     (event) {
                var target = event.target, key = event.key;
                if (E.isTextbox(target)) {
                    if (key == 'enter') {
                        ns.Form.tab();
                    }
                }
            }
        });
        T._actived = true;
    }

    T.active = function() { window.addEvent('domready', activeTouch); };
    T.activeTextbox = function() { return _activeTextbox; };

    T.scrollPanel = function(el, height) {
        // console.log(el, height);
        var $el = $(el),
            height = parseInt(height) - 56,
            $wrapper = new Element('div', {'height': height, 'class':'scroll-panel'}),
            $up = (new Element('div', { 'class': 'scroll-up', 'html':'<span></span>' })).inject($wrapper),
            $zone = new Element('div', { 'class':'scroll-zone' }),
            $down = new Element('div', { 'class': 'scroll-down', 'html':'<span></span>' }),
            scroll = Math.floor(height * 0.8);
        $zone.setStyles({
            'height': height - $up.getSize().y - $down.getSize().y,
            'overflow': 'hidden'
        });
        $zone.wraps($el);
        $wrapper.wraps($zone);
        $up.inject($wrapper, 'top');
        $down.inject($wrapper, 'bottom');

        $up.addEvent('click', function() { $zone.scrollTop -= scroll; });
        $down.addEvent('click', function() { $zone.scrollTop += scroll; });
    };

    // 生成软键盘 UI 并嵌入到指定的 el 内
    T.simpleVK = simpleVK = function(el) {
        var $el = $(el), $ul = new Element('ul', {'class': 'vk-keyboards'}),
            buttons = [1,2,3,4,5,6,7,8,9,['del','删除'], 0, ['enter','确定']];

        for (var i = 0, n = buttons.length; i < n; i++) {
            var btn = buttons[i], label, value, $li = new Element('li');
            if ($type(btn) == 'array') { label = btn[1]; value = btn[0]; }
            else { label = value = btn; }

            $ul.adopt($li.adopt((new Element('button', {
                'class':'vk-key',
                'type': 'button',
                'id': 'vk-key-' + value,
                'value': value,
                'text': label
            })).addEvent('click', function(event) {
                var target = $(event.target);
                ns.notifyObservers('vk:keydown', [target.get('value')]);
            })));
        }
        $el.setStyle('z-index', E.topZindex);
        $ul.inject($el);
    };

    // 处理虚拟键盘事件
    var TouchCore = {
        key_cache: '',
        keydown: function(key) {
            var curElement = _activeTextbox;
            if (E.isTextbox(curElement))
                this.output(curElement, key);
        },
        off: function() {},
        isControlChar: function(key) { return key.length > 1; },
        output: function(input, key) {
            if (!this.isControlChar(key)) {
                if (input.setSelectionRange) {
                    var srt = input.selectionStart,
                        len = input.selectionEnd;
                    input.value = input.value.substr(0, srt) + key + input.value.substr(len);
                    input.setSelectionRange(srt + key.length, srt + key.length);
                } else {
                    input.value += key;
                }
            } else {
                if (key === 'del') {
                    if (input.setSelectionRange) {
                        var srt = input.selectionStart - 1;
                        var len = input.selectionEnd;
                        input.value = input.value.substr(0, srt) + input.value.substr(len);
                        input.setSelectionRange(srt, srt);
                    } else {
                        input.value = input.value.substr(0, input.value.length - 1);
                    }
                } else if (key === 'enter') {
                    // var node = YUI.one("#input-0");
                    // node.simulate("keydown", { keyCode: 28 });
                    ns.Form.tab();
                }
            }

            if (dict != null) {
                var dname = input.get('dict');
                if (dname) {
                    if (key === 'enter')
                        dict.select(dname);
                    else
                        dict.search(input.value, dname);
                }
            }
        }
    };

    ns.addObservers([['vk:keydown', TouchCore.keydown, 0]], TouchCore);
})(window, SWP);


(function(win, ns) {
    var S = ns.Switchable = ns.Switchable || {};
    S.byTitle = function(trigger) {
        var $trigger = $(trigger),
            label = $trigger.get('text'),
            panel = $$('.switchable-panel[title="'+label+'"]');
        if (trigger.hasClass('active')) panel.show();
        else panel.hide();
        trigger.addEvent('click', function() {
            $$('.switchable-trigger').removeClass('active');
            $$('.switchable-panel').hide();
            trigger.addClass('active');
            panel.show();
            return false;
        });
    };
    S.byTitles = function() {
        $$('.switchable-trigger').each(function(trigger) {
            S.byTitle(trigger); 
        });
    };
})(window, SWP);


(function(win, ns) {
    var E = ns.Element;
    var dlg, opt, activeTextEl;

    // private    
    var handleButton = function(button){
        if (!dlg.isVisible()) return;
        dlg.hide();
        var callback = opt['on' + button.capitalize()] || opt.fn;
        if ($type(callback) == 'function') {
            // callback.delay(1, opt.scope||window, 
            //                [activeTextEl.get('value').trim(), button, opt]);
            callback.run([activeTextEl.get('value').trim(), button],
                         opt.scope || window);
        }
    };

    var Dialog = new Class({
        Implements: [Options, Events],
        options: {
            'modal': true,
            'dragable': false,
            'title': '',
            'auto_scroll': false,
            'footer_align': 'center',
            'width': 'auto',
            'height': 'auto',
            'top': 'auto',
            'left': 'auto',
            'z_index': E.dialogZindex
        },
        initialize: function(/* HTMLElement|string */el, /* object */options) {
            this.setOptions(options);
            this.el = $(el) || new Element('div');
            this._fixElement()._fixLayout()._bindEvents();
        },
        _fixElement: function() {
            var opt = this.options,
                box = new Element('div', {
                    'class': 'windowbox',
                    'styles': {
                        'visibility': 'hidden',
                        'position': 'absolute',
                        'z-index': opt.z_index
                    }
                }),
                root = this.el;

            box.appendChild(root);

            if (!root.hasClass('container')) { root.addClass('container'); }
            root.setStyle('position', 'relative');
            root.setStyles({'height': opt.height, 'width': opt.width});

            var header = root.getElement('.header');
            if (!header) {
                header = new Element('div', {'class': 'header'});
                header.inject(root, 'top');
            }

            var header_title = header.getElement('.title');
            if (!header_title) {
                header_title = new Element('span', {'class': 'title'});
                header_title.inject(header, 'top');
            }

            var title = opt.title;
            this.header_title = header_title;
            this.setTitle(title);

            var header_tool = header.getElement('.close');
            if (!header_tool) {
                header_tool = new Element('button', {'class': 'close', 'text': 'x', 'style': 'float:right;border:1px solid auto;margin:0;'});
                header_tool.inject(header, 'top');
            }

            var body = root.getElement('.body');
            if (!body) {
                body = new Element('div', {'class': 'body'});
                body.inject(header, 'after');
            }
            body.setStyle('overflow', opt.auto_scroll ? 'auto' : 'hidden');

            var footer = root.getElement('.footer');
            if (!footer) {
                footer = new Element('div', {'class': 'footer'});
                footer.inject(body, 'after');
            }
            footer.setStyle('text-align', opt.footer_align);

            if (opt.modal) { this._modal_layer = new Dialog.Modal(); }

            $(document.body).appendChild(box);
            this.box = box;
            return this;
        },
        setTitle: function (title) {
            if (title) { this.header_title.set('html', title); }
        },
        setWidth: function(value) {
            this.el.setStyles('width', value);
        },
        setHeight: function(value) {
            this.el.setStyles('height', value);
        },
        _bindEvents: function() {
            var header = this.getEl('header'),
                opt = this.options;
            if (opt.dragable) {
                try {
                    header.setStyle('cursor', 'move');
                    new Drag(this.box, {'handle': header});
                } catch(ex) {}
            }

            header.getElement('.close').addEvent('click', this.hide.bind(this));

            if (opt.top == 'auto' || opt.left == 'auto') {
                    window.addEvents({
                        'resize': this._fixPosition.bind(this),
                        'scroll': this._fixPosition.bind(this)
                    });
            }

            return this;
        },
        _fixLayout: function() {
            var root = this.el,
                root_layout = E.getLayout(root),
                header_layout = E.getLayout(this.getEl('header')),
                body = this.getEl('body'),
                body_layout = E.getLayout(body),
                footer_layout = E.getLayout(this.getEl('footer')),
                offset = [
                    header_layout['total']['height'],
                    footer_layout['total']['height'],
                    body_layout['total']['height'] - body_layout['height']
                ], sum = 0;

            for (var i = 0, len = offset.length; i < len; i++) {
                sum += offset[i];
            }

            body.setStyle('height', root_layout['height'] - sum);

            return this;
        },
        _fixPosition: function() {
            var box = this.box, box_size = box.getSize();
            var body_size = $(document.body).getSize();
            var styles = {}, config = this.options;

            styles['top'] = (config['top'] == 'auto') ? ((body_size['y'] - box_size['y']) / 2) : config['top'];
            styles['left'] = (config['left'] == 'auto') ? ((body_size['x'] - box_size['x']) / 2) : config['left'];

            box.setStyles(styles);
            return this;
        },
        setBody: function(/* HTMLElement|string */content, /* string */method) {
            var body = this.getEl('body');
            body.empty();

            if ($type(content) == 'string') {
                body.set('html', content);
            } else {
                body.appendChild(content);
            }
            this._fixLayout();

            return this;
        },
        addButton: function(/* string|object */properties, /* function */callback) {
            if ($type(properties) == 'string') { properties = {'text': properties}; }
            properties['type'] = 'button';

            var button = new Element('button', properties);

            if ($type(callback) == 'function') {
                button.addEvent('click', callback);
            }
            this.getEl('footer').appendChild(button);
            this._fixLayout();

            return button;
        },
        getEl: function(/* string */place) {
            switch (place) {
              case 'header': return this.el.getElement('.header'); break;
              case 'body': return this.el.getElement('.body'); break;
              case 'footer': return this.el.getElement('.footer'); break;
            default: return this.el;
            }
        },
        show: function() {
            this._fixPosition();
            if (this._modal_layer) { this._modal_layer.show(this.options.z_index - 10); }
            this.box.setStyle('visibility', 'visible');

            this.fireEvent('show', this);
            this._visible = true;
        },
        hide: function(/* string|event */event) {
            this.box.setStyle('visibility', 'hidden');

            if (this._modal_layer) { this._modal_layer.hide(); }
            if ($type(event) == 'string') { this.fireEvent(event, this); }
            this.fireEvent('hide', this);
            this._visible = false;
        },
        isVisible: function() {
            return this._visible || false;
        }
    });

    Dialog.Modal = new Class({
        initialize: function() {
            var body = $(document.body);
            this.layer = new Element('div', {
                'styles': {
                    'display': 'none',
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'background': '#000000',
                    'z-index': 1000
                }
            });
            this.layer.setStyle('opacity', 0.5);
            body.appendChild(this.layer);
            if (Browser.Engine.trident4) {
                this.iframe = new Element('iframe', {
                    'src': 'javascript: void(0)',
                    'scrolling': 'no',
                    'marginWidth': 0,
                    'marginHeight': 0,
                    'styles': {
                        'display': 'none',
                        'position': 'absolute',
                        'top': 0,
                        'left': 0,
                        'width': '100%',
                        'opacity': 0,
                        'filter': 'alpha(opacity=0)',
                        'z-index': E.topZindex
                    }
                });
                body.appendChild(this.iframe);
            }

            this._fixSize();
            window.addEvent('resize', this._fixSize.bind(this));
        },
        _fixSize: function() {
            var styles = {
                'height': $(document).getCoordinates().height
            };

            this.layer.setStyles(styles);
            if (this.iframe) { this.iframe.setStyles(styles); }
        },
        show: function(/* integer */zIndex) {
            var zIndex = zIndex || 10000;
            this.layer.setStyles({'display': '', 'z-index': zIndex});
            if (this.iframe) { this.iframe.setStyles({'visibility': 'visible', 'display': '', 'z-index': zIndex - 10}); }
        },
        hide: function() {
            this.layer.setStyle('display', 'none');
            if (this.iframe) { this.iframe.setStyle('display', 'none'); }
        }
    });


/*
    SWP.msg.prompt({
        'title': T('please input image url'),
        'value': option.get('url') || '',
        'fn': (function(button, url, options) {
            if (button !== 'yes') return;

            if (url && !url.test(/^http(s)?:\/\/.+$/i)) {
                window.alert(T('invalid url'));
                return;
            }
            option.set('url', url);

            var status_el = this._getOptionEl(option).getElement('span[name=url_status]');
            status_el.set('class', url ? 'url_set' : 'url_not_set');

            this.fireEvent('change', this);
        }).bind(this)
    });
*/
    
    ns.MessageBox = {
        getDialog: function(titleText) {
            if (!dlg) {
                dlg = new Dialog(null, {
                    'title': titleText, 'width': 320, 'height': 130, modal:true
                });
                activeTextEl = new Element('input');
                activeTextEl.addEvent('keydown', function(event) {
                    if (event.key == 'enter') {
                        event.stopPropagation();
                        handleButton('yes');
                    } else if (event.key == 'esc') {
                        event.stopPropagation();
                        handleButton('cancel');
                    }
                });
                activeTextEl.addEvent('tab', function(event) {
                    handleButton('yes');
                });

                dlg.setBody(activeTextEl);
                dlg.addButton({'text':'yes', 'class':'normal simple ok'}, handleButton.pass('yes'));
                dlg.addButton({'text':'cancel', 'class':'normal simple cancel'}, handleButton.pass('cancel'));
            }
            return dlg;
        },
        isVisible: function(){
            return dlg && dlg.isVisible();
        },
        hide: function() {
            if(this.isVisible()) {
                dlg.hide();
            }
            return this;
        },
        prompt: function(options) {
            if(this.isVisible()){
                this.hide();
            }
            opt = options || {};
            var d = this.getDialog(opt.title || "&#160;");
            d.setTitle(opt.title || "&#160;");
            activeTextEl.show();
            activeTextEl.set('value', opt['value']);
            if (opt.maxlength)
                activeTextEl.set('maxlength', opt.maxlength);
            if (opt.width) d.setWidth(opt.width);
            if (opt.height) d.setWidth(opt.height);

            opt.maxlength = opt.maxlength || 999;
            activeTextEl.set('maxlength', opt.maxlength);
            if(!d.isVisible()) {
                d.show();
            }
            E.focus(activeTextEl);
        },
        confirm: function(options) {
            if(this.isVisible()) this.hide();
            opt = options || {};
            var d = this.getDialog(opt.title || "&#160;");
            d.setTitle(opt.title || "&#160;");
            activeTextEl.hide();
            d.show();
        }
    };
    ns.msg = ns.MessageBox;
})(window, SWP);


(function(win, ns) {
    ns.util = ns.util || {};

    // eval b/a
    ns.util.evalPercent = function(b, a, suffix) {
        var r, suffix = suffix || '%';
        if (a <= 0) return '';
        return ( Math.round(10000 * b / a) / 100 ) + suffix;
    };
})(window, SWP);
