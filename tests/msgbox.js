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
}).use("dump", "test", "console", "event-custom", function(Y) {
    var button = Y.one('#btnRun');
    button.set("disabled", false);
    Y.on("click", function() {
        Y.Test.Runner.run();
    }, button);
    var myConsole = new Y.Console().render();
    // --------------------------------------------------------

    var ns = SWP;
    ns.msg.prompt({
        'title': 'please input image url',
        'value': 'http://url.test.com/?first' || '',
        'fn': function(button, url, options) {
            if (button !== 'yes') return;

            if (url && !url.test(/^http(s)?:\/\/.+$/i)) {
                window.alert(T('invalid url'));
                return;
            }
            option.set('url', url);
        }
    });


    var testCase = new Y.Test.Case({
        name: "Event.subscribe tests",

        setUp : function () {
        },
        
        tearDown : function () {
        },

        test_1: function() {
            // Y.Assert.areEqual(true, sc1, 'sc1 dispatched');
            // this.wait(function(){
            //     Y.Assert.areEqual(true, sc2, 'sc2 dispatched');
            // }, _delay);
        },

        test_2: function() {
        }
    });
    
    Y.Test.Runner.add(testCase);
    Y.Test.Runner.run();
});
