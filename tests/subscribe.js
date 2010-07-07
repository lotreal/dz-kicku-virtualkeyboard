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

    var sc1, 
        sc2,
        _delay = 400,
        f1 = function() {
            sc1 = true;
            console.log((new Date()).getTime(), 'sc1 called'); 
        },
        f2 = function() {
            sc2 = true;
            console.log((new Date()).getTime(), 'sc2 called'); 
        },
        f3 = f2.create({delay: _delay});

    var testCase = new Y.Test.Case({
        name: "Event.subscribe tests",

        setUp : function () {
                sc1 = false;
            sc2 = false;
            console.log('reset');
        },
        
        tearDown : function () {
            ns.Event.unsubscribe();
        },

        test_1: function() {
            ns.Event.subscribe([
                ['sc1', f1, 0],
                ['sc2', f3, 0]
            ]);

            ns.Event.notify('sc1');
            ns.Event.notify('sc2');

            Y.Assert.areEqual(true, sc1, 'sc1 dispatched');
            this.wait(function(){
                Y.Assert.areEqual(true, sc2, 'sc2 dispatched');
            }, _delay);
        },

        test_2: function() {
            ns.Event.subscribe([
                ['sc1', f1]
            ]);

            ns.Event.subscribe([
                ['sc2', f2, _delay]
            ]);

            ns.Event.notify('sc1');
            ns.Event.notify('sc2');

            Y.Assert.areEqual(true, sc1, 'sc1 dispatched');
            Y.Assert.areEqual(false, sc2, 'sc2 dispatched but delay ' + _delay +'ms');
            this.wait(function(){
                Y.Assert.areEqual(true, sc2, 'sc2 dispatched');
            }, _delay);
        },

        test_3: function() {
            ns.Event.subscribe([
                ['sc1', f1],
                ['sc2', f2, _delay]
            ]);

            ns.Event.notify('sc1');
            ns.Event.notify('sc2');

            Y.Assert.areEqual(true, sc1, 'sc1 dispatched');
            Y.Assert.areEqual(false, sc2, 'sc2 dispatched but delay ' + _delay +'ms');
            this.wait(function(){
                Y.Assert.areEqual(true, sc2, 'sc2 dispatched');
            }, _delay);
        }
    });
    
    Y.Test.Runner.add(testCase);
    Y.Test.Runner.run();
});
