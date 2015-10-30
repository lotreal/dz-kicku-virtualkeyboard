YUI({
    skin: 'sam',
    logExclude: {
        attribute: true, 
        dom: true, 
        node: true, 
        event: true, 
        // deprecated: true,
        base: true, 
        widget: true, 
        selector: true
    }
}).use("test", "console", function(Y) {
    var button = Y.one('#btnRun');
    button.set("disabled", false);
    Y.on("click", function() {
        Y.Test.Runner.run();
    }, button);
    var myConsole = new Y.Console().render();
    // --------------------------------------------------------

    var ns = SWP;

    var body = $(document.body);
    (new Element('input', {type:'text', id:'input-0'})).inject(body);
    (new Element('textarea', {id:'textarea-0', value:'hi'})).inject(body);
    (new Element('input', {type:'checkbox', id:'checkbox-0'})).inject(body);
    (new Element('input', {type:'text', id:'input-1'})).inject(body);

    var tc_element = new Y.Test.Case({
        name: 'element',

        test_1: function() {
            var isinp = ns.Element.isTextbox;
            Y.Assert.areEqual(true, isinp($('input-0')), 'input-0 is input element');
            Y.Assert.areEqual(true, isinp($('textarea-0')), 'textarea-0 is input element');
            Y.Assert.areEqual(false, isinp($('checkbox-0')), 'select-0 is not input element');
        }
    });

    var testCase = new Y.Test.Case({
        name: "Event.subscribe tests",

        setUp : function () {
            // $('input-0').value = 'hi, a';
        },
        
        tearDown : function () {
        },

        test_3: function() {
            var E = ns.Element, T = ns.Touch;

            ns.Element.focusFirstTextbox();
            Y.Assert.areEqual(true, $('input-0').hasClass(T.activeFlag), 'input-0 actived');

	    Y.Event.simulate(document.getElementById('vk-key-enter'), 'click');

            Y.Assert.areEqual(true, $('textarea-0').hasClass(T.activeFlag), 'textarea-0 actived');

	    Y.Event.simulate(document.getElementById('vk-key-1'), 'click');
            Y.Assert.areEqual('1', $('textarea-0').value, 'textarea:input 1');

	    Y.Event.simulate(document.getElementById('vk-key-del'), 'click');
            Y.Assert.areEqual('', $('textarea-0').value, 'textarea:input del');

	    Y.Event.simulate(document.getElementById('vk-key-del'), 'click');
	    Y.Event.simulate(document.getElementById('vk-key-del'), 'click');
	    Y.Event.simulate(document.getElementById('vk-key-1'), 'click');
	    Y.Event.simulate(document.getElementById('vk-key-2'), 'click');
	    Y.Event.simulate(document.getElementById('vk-key-3'), 'click');
            Y.Assert.areEqual('123', $('textarea-0').value, 'textarea:input del');
        }
    });
    
    Y.Test.Runner.add(tc_element);
    Y.Test.Runner.add(testCase);
    Y.Test.Runner.run();
});
