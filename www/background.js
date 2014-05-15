chrome.app.runtime.onLaunched.addListener(function() {
    // create a new window and position it with a fixed size
    var win = chrome.app.window.create('chrome.html', {
        width: 580,
        height: 800 /*,
        minWidth:580,
        minHeight:800,
        left:100,
        top:100*/
    });

});
