//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/

; (function ($, undefined) {

    "use strict";

    var fn = Function,
        global = fn('return this')(),

        MODULE = 'app.js',
        DEBUG = true;

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

    $(document).ready(function (){

        debug.log('application loaded at ' + window.location.href);
        debug.log('access_token: ' + localStorage['access_token']);

        $('.login').on('click', function(e) {
            e.preventDefault(); //do not execute href
            var provider = $(e.target).data('provider');
            if (provider === 'twitter') {
                alert('Not yet implemented!');
            } else {
                global.device = true;
                api.getSignInUrl(provider, window.location.href)
                    .done(function (url) {
                        if(global.device) { //running under Phonegap
                            // open Cordova inapp-browser with login url
                            var authWindow = window.open(url, '_blank', 'location=yes');
                            //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
                            //which sets the authorization code in the browser's title. However, we can't
                            //access the title of the InAppBrowser.
                            //
                            //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
                            //authorization code will get set in the url. We can access the url in the
                            //loadstart and loadstop events. So if we bind the loadstart event, we can
                            //find the authorization code and close the InAppBrowser after the user
                            //has granted us access to their data.
                            $(authWindow).on('load loadstart', function(e) {
                                var url = e.originalEvent.url;
                                debug.log(url);
                            });
                        } else { //this is a browser
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
    });


    /*
    var app = {
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        bindEvents: function() {
            document.addEventListener('deviceready', this.onDeviceReady, false);
        },
        // deviceready Event Handler
        //
        // The scope of 'this' is the event. In order to call the 'receivedEvent'
        // function, we must explicity call 'app.receivedEvent(...);'
        onDeviceReady: function() {
            app.receivedEvent('deviceready');
        },
        // Update DOM on a Received Event
        receivedEvent: function(id) {
            var parentElement = document.getElementById(id);
            var listeningElement = parentElement.querySelector('.listening');
            var receivedElement = parentElement.querySelector('.received');

            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');

            console.log('Received Event: ' + id);
        }
    };
    */

}(jQuery));