//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/

(function($) {

    "use strict";

    var MODULE = 'chrome_wrapper.js: ',
        STRING = 'string',
        EQUALS = '=',
        HASH = '#',
        ACCESS_TOKEN = 'access_token',
        TOKEN_TYPE = 'token_type',
        DEBUG = true;

    $(document).ready(function() {

        if(DEBUG && console) {
            console.log(MODULE + 'launched');
        }

        // get a reference to the iframe that holds the app
        var iframe = $('#iframe'),
            webview = $('#webview');

        //do some prep work only if running as a chrome packaged app
        if(chrome && chrome.storage && chrome.runtime && chrome.runtime.getManifest && iframe.length && webview.length) {

            if(DEBUG && console) {
                console.log(MODULE + 'initializing');
            }

            // initialize the postman. He needs to know who the recipient is.
            // It's the iframe where the app lives.
            $.pkg.init(iframe.get(0).contentWindow);

            // Load access token from storage and notify sandboxed iframe once ready
            $.pkg.listen('/ready', function (url) {
                chrome.storage.local.get(ACCESS_TOKEN, function(accessToken) {
                    if($.type(accessToken[ACCESS_TOKEN]) === STRING) $.pkg.send('/token', [accessToken[ACCESS_TOKEN]]);
                });
            });

            //Listen to any /navigate message to load url in webview
            $.pkg.listen('/navigate', function (url) {
                if(DEBUG && console) {
                    console.log(MODULE + 'navigate to ' + url);
                }
                webview.attr('src', url);
                iframe.hide();
                webview.show();
            });

            //Listen to any /clear message to remove the token from storage
            $.pkg.listen('/clear', function () {
                if(DEBUG && console) {
                    console.log(MODULE + 'clear token');
                }
                chrome.storage.local.remove(ACCESS_TOKEN);
            });

            //handle the loadredirect event of the webview to read the auth_token and send it to the sandboxed iframe
            webview.on('loadredirect', function (e) {
                if(DEBUG && console) {
                    console.log(MODULE + 'loadredirect ' + e.originalEvent.newUrl);
                }
                var data = parseAccessToken(e.originalEvent.newUrl); //parse the url
                if ($.type(data.access_token) === STRING) {
                    chrome.storage.local.set({access_token: data.access_token});
                    $.pkg.send('/token', [data.access_token]);
                    webview.attr('src', 'about:blank');
                    webview.hide();
                    iframe.show();
                }
            });
            //Note: unfortunately, all redirects do not go through loadstart
            if (DEBUG && console) {
                webview.on('loadstart', function (e) {
                    console.log(MODULE + 'loadstart ' + e.originalEvent.url);
                }).on('loadabort', function (e) {
                    console.log(MODULE + 'loadabort');
                });
            }

            if(DEBUG && console) {
                console.log(MODULE + 'initialized');
            }
        } else {
            //do not run in a frame otherwise oAuth fails (X-FRAME-OPTIONS = 'DENY')
            window.top.location.replace(iframe.attr('src'));
        }
    });


    /**
     * The  following functions is (almost) copied from api.js
     */
    function parseAccessToken(url) {
        if ($.type(url) !== STRING) return -1;
        var data = {},
        pos1 = Math.max(
            url.indexOf(HASH + ACCESS_TOKEN), //Facebook and Google return access_token first
            url.indexOf(HASH + TOKEN_TYPE) //, //Windows Live returns token_type first
            //url.indexOf(HASH + EXPIRES_IN), //Others might have them in a different order
            //url.indexOf(HASH + STATE)
        );
        if (pos1 >= 0) {
            var keyValues = url.substr(pos1 + 1).split('&');
            $.each(keyValues, function (index, keyValue) {
                var pos2 = keyValue.indexOf(EQUALS);
                if (pos2 > 0 && pos2 < keyValue.length - EQUALS.length) {
                    data[keyValue.substr(0, pos2)] = decodeURIComponent(keyValue.substr(pos2 + EQUALS.length));
                }
            });
        }
        return data;
    }

})(jQuery);