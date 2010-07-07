YUI({
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

    var tc_element = new Y.Test.Case({
        name: 'element',

        test_1: function() {
            var isinp = ns.Element.isInputElement;
            Y.Assert.areEqual(true, isinp($('input-0')), 'input-0 is input element');
            Y.Assert.areEqual(true, isinp($('textarea-0')), 'textarea-0 is input element');
            Y.Assert.areEqual(false, isinp($('select-0')), 'select-0 is not input element');
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
            (new Element('input', {type:'text', id:'input-0'})).inject($(document.body));
            (new Element('input', {type:'text', id:'input-1'})).inject($(document.body));
            // Y.Assert.areEqual(true, $('input-0').hasClass('active-element'), 'input-0 actived');

	    // Y.Event.simulate(document.getElementById('vk-key-del'), 'click');
	    // Y.Event.simulate(document.getElementById('vk-key-del'), 'click');
	    // Y.Event.simulate(document.getElementById('vk-key-del'), 'click');

            // Y.Assert.areEqual('hi', $('input-0').value, 'sc1 dispatched');

	    // Y.Event.simulate(document.getElementById('vk-key-1'), 'click');

            // Y.Assert.areEqual('hi1', $('input-0').value, 'sc1 dispatched');
	    // Y.Event.simulate(document.getElementById('vk-key-ok'), 'click');
        }
    });
    
    Y.Test.Runner.add(tc_element);
    Y.Test.Runner.add(testCase);
    Y.Test.Runner.run();
});
