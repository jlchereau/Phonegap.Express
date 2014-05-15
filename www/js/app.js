//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/

; (function ($, undefined) {

    "use strict";

    var fn = Function,
        global = fn('return this')(),
        STRING = 'string',
        MODULE = 'app.js: ',
        DEBUG = false;

    var ContentModel = kendo.data.Model.define({
            id: '_id',
            fields: {
                "name": {
                    type: "string",
                    required: true
                },
                "user": {
                    type: "string",
                    required: true
                },
                "created": {
                    type: "date"
                    //defaultValue: new Date()
                },
                "__v" : {
                    type: "number"
                }
            }
        }),
        dataSource = new kendo.data.DataSource({
            //autoSync: true,
            transport: {
                create: function(options) {
                    api.contents.create(options.data)
                        .done(function(result) {
                            // notify the data source that the request succeeded
                            options.success(result);
                        })
                        .fail(function(xhr) {
                            // notify the data source that the request failed
                            options.error(xhr);
                        });
                },
                read: function(options) {
                    api.contents.readAll()
                        .done(function(result) {
                            // notify the data source that the request succeeded
                            options.success(result);
                        })
                        .fail(function(xhr) {
                            // notify the data source that the request failed
                            options.error(xhr);
                        });
                },
                update: function(options) {
                    api.contents.update(options.data)
                        .done(function(result) {
                            // notify the data source that the request succeeded
                            options.success(result);
                        })
                        .fail(function(xhr) {
                            // notify the data source that the request failed
                            options.error(xhr);
                        });
                },
                destroy: function(options) {
                    api.contents.destroy(options.data)
                        .done(function(result) {
                            // notify the data source that the request succeeded
                            options.success(result);
                        })
                        .fail(function(xhr) {
                            // notify the data source that the request failed
                            options.error(xhr);
                        });
                }
            },
            schema: {
                model: ContentModel
            }
        }),
        viewModel = window.viewModel = kendo.observable({
            user: 'Jacques', //TODO
            contents: dataSource
        });

    $(document).ready(function () {
        api.util.log(MODULE + 'DOM ready');
        if ((global.device) && ($.type(global.device.cordova) === STRING)) {
            document.addEventListener("deviceready", onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });

    function onDeviceReady() {

        api.util.log(MODULE + 'device ready');
        debug.log('application loaded at ' + window.location.href);
        debug.log('access_token: ' + api.util.getAccessToken());

        $('.login').on('click', function(e) {
            e.preventDefault(); //do not execute href
            var provider = $(e.target).data('provider');
            if (provider === 'twitter') {
                alert('Not yet implemented!');
            } else {
                //In Phonegap, windows.location.href = "x-wmapp0:www/index.html" and our server cannot redirect the InAppBrowser to such location
                //The oAuth recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob" which sets the authorization code in the browser's title.
                //However, we can't access the title of the InAppBrowser.
                //Instead, we pass a bogus redirect_uri of "http://localhost", which means the authorization code will get set in the url.
                //We can access this url in the loadstart and loadstop events.
                //So if we bind the loadstart event, we can find the access_token code and close the InAppBrowser after the user has granted us access to their data.
                var returnUrl = (global.device && ($.type(global.device.cordova) === STRING)) ? 'http://localhost' : window.location.href
                api.getSignInUrl(provider, returnUrl)
                    .done(function (url) {
                        if(global.device && ($.type(global.device.cordova) === STRING)) { //running under Phonegap -> open InAppBrowser
                            var authWindow = window.open(url, '_blank', 'location=no');
                            $(authWindow).on('loadstart', function(e) {
                                var url = e.originalEvent.url;
                                debug.log(url); //the loadstart event is triggered each time a new url (redirection) is loaded
                                var data = api.util.parseAccessToken(url);
                                if ($.type(data.access_token) === STRING) { //so we only close teh InAppBrowser once we have received an auth_token
                                    $(authWindow).off();
                                    authWindow.close();
                                }
                            }).on('loaderror', function (e) {
                                debug.error(e.type + ': ' + e.message);
                            });
                        } else { //this is a browser --> simply redirect to login url
                            window.location.assign(url);
                        }
                    })
                    .fail(function (xhr, status, error) {
                        debug.error(status + ': ' + error);
                    });
            }
        });

        $('#signout').on('click', function(e) {
            e.preventDefault(); //do not execute href
            api.signOut()
                .done(function() {
                    debug.log('Signed out');
                })
                .fail(function(xhr, status, error){
                    debug.error(status + ': ' + error);
                });
        });

        $('.test').on('click', function(e) {
            e.preventDefault(); //do not execute href
            var endpoint = $(e.target).data('endpoint'), handler;
            switch(endpoint) {
                case 'heartbeat':
                    handler = api.getHeartbeat;
                    break;
                case 'profile':
                    handler =  api.getProfile;
                    break;
                case 'values':
                    handler = api.getValues;
                    break;
                case 'error':
                default:
                    handler = api.getError;
            }
            handler()
                .done(function(profile) {
                    debug.log(JSON.stringify(profile));
                })
                .fail(function(xhr, status, error){
                    debug.error(status + ': ' + error);
                });
        });

        $('.share').on('click', function(e) {
            e.preventDefault(); //do not execute href
            alert('Not yet implemented!');
        });

        kendo.bind($('body'), viewModel);
    }

}(jQuery));