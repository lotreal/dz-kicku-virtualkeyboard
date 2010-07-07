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

    function _isInputElement(el) {
        if (!el) return false;
        var tag = el.tagName;
        return tag == 'TEXTAREA' ||
            (tag == 'INPUT' && el.get('type') == 'text');
    }

    ns.Element = {
        dontActiveFlag: _dontActiveFlag,

        focus: function(el) {
            $(el).focus();
        },

        isInputElement: _isInputElement,

        isHidden: function(el) {
            var $el = $(el), 
                w = $el.offsetWidth, 
                h = $el.offsetHeight,
                force = ($el.tagName === 'TR');
            return (w===0 && h===0 && !force) ? true : (w!==0 && h!==0 && !force)
                ? false : $el.getStyle('display') === 'none';
        },

        isVisible: function(el){ return !this.isHidden(el); },

        isUIElement: function(el) { 
            var $el = $(el);
            return !this.isHidden($el) && !$el.get('disabled') 
                && !$el.hasClass(_dontActiveFlag); 
        }
    };
})(window, SWP);


(function(win, ns) {
    ns.Widget = ns.Widget || {};

    ns.Widget.Dict = new Class(
        {
            Implements: [Events, Options],
            options: {
                'maxVisibleItems': 10,
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
                    'class': this.options.className
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
    var Touch = ns.Touch = ns.Touch || {};

    var _activeInput,
        _dontActiveFlag = ns.Element.dontActiveFlag,
        _activeFlag = 'active-element',
        // 是否把焦点保持在可输入文本框上（为提高触摸屏用户体验)
        _holdOnInputs = true,
        _isInputElement = ns.Element.isInputElement;

    function activeInputHandler() {
        var curElement = document.activeElement;
        if (curElement.hasClass(_dontActiveFlag)) return;
        if (_holdOnInputs && !_isInputElement(curElement)) {
            if (_activeInput.setSelectionRange)
                // 移动光标到文本框框末尾
                _activeInput.setSelectionRange(9999, 9999);
            return;
        }
        if (_activeInput != curElement) {
            _activeInput.removeClass(_activeFlag);
            _activeInput = curElement;
        }
        curElement.addClass(_activeFlag);
    }

    function getAllInputs() {
        var all = $$('input[type="text"]', 'textarea').filter(function(el) { return ns.Element.isUIElement(el); });
        all.sort(function(a, b) {return a.offsetTop - b.offsetTop;});
        return all;
    }


    ns.Element.focus = function(el) {
        $(el).focus();
        activeInputHandler();
    };


    ns.Form = {
        tab: function() {
            var curElement = _activeInput,
                all = getAllInputs(),
                len = all.length,
                idx = all.indexOf(curElement);
            console.log(curElement);
            var next = ++idx < len ? idx : 0, $next = all[next];
            curElement.fireEvent('tab', true);
            ns.Element.focus($next);
        }
    };

    function activeTouch() {
        if (Touch._actived) return;
        var all = getAllInputs();
        if (all.length > 0 ) {
            _activeInput = getAllInputs()[0];
            ns.Element.focus(_activeInput);
        } else {
            _activeInput = $(document.body);
        }
        $(document).addEvents({
            'keyup': activeInputHandler,
            'mouseup': activeInputHandler,
            'keydown': function     (event) {
                var target = event.target, key = event.key;
                if (ns.Element.isUIElement(target)) {
                    if (key == 'enter') {
                        ns.Form.tab();
                    }
                }
            }
        });
        Touch._actived = true;
    }

    Touch.active = function() { window.addEvent('domready', activeTouch); };


    function simpleVK(el) {
        el = $(el);
        var vk_keys = el.getElements(".vk-key");
        vk_keys.each(function(key) {
            key.addClass(_dontActiveFlag);
            if (key.get('value').trim().length == 0)
                key.set('value', key.get('text'));
        });

        vk_keys.addEvent('click', (function(event) {
            var target = $(event.target);
            ns.notifyObservers('vk:keydown', [target.get('value')]);
        }).bindWithEvent(this));
    }
    Touch.simpleVK = simpleVK;

    var VKeyboard = {
        key_cache: '',
        keydown: function(key) {
            var curElement = _activeInput;
            if (ns.Element.isInputElement(curElement))
                this.output(curElement, key);
            else
                this.cache(key);
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
                } else if (key === 'ok') {
                    ns.Form.tab();
                }
            }

            var dname = input.get('dict');
            if (dname) {
                if (key === 'ok')
                    dict.select(dname);
                else
                    dict.search(input.value, dname);
            }
        },
        cache: function(key) {
            if (!this.isControlChar(key)) {
                this.key_cache += key;
            } else {
                if (key === 'del') {
                    this.key_cache = this.key_cache.value.substr(0, this.key_cache.value.length - 1);
                } else if (key === 'ok') {
                    this.clearCache();
                    var curElement = _activeInput;
                    curElement.fireEvent('send-key', this.key_cache);
                }
            }
        },
        getCache: function() { return this.key_cache; },
        clearCache: function() { this.key_cache = ''; },
        test: function() {
            //alert(this.key_cache);
        }
    };

    VKeyboard.test();
    ns.addObservers([
        ['vk:keydown', VKeyboard.keydown, 0]
    ], VKeyboard);
})(window, SWP);
