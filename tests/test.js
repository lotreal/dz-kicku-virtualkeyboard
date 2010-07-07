var SWP = window.SWP || {}; // 名字空间：善为派

(function(win, ns) {

    function test(testCase) {

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

            // Set up the page
            button.set("disabled", false);
            Y.on("click", function() {
                Y.Test.Runner.run();
            }, button);

            var myConsole = new Y.Console().render();

            Y.Test.Runner.add(testCase);
            Y.Test.Runner.run();
        });
    }

    ns.unittest = test;
})(window, SWP);
