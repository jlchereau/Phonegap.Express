//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/

; (function ($, undefined) {

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
            name: 'Jacques',
            contents: dataSource
        });

    $(document).ready(function (){

        debug.log('application loaded at ' + window.location.href);
        debug.log('access_token: ' + localStorage['access_token']);

        $('.login').on('click', function(e) {
            e.preventDefault(); //do not execute href
            api.getSignInUrl($(e.target).data('provider'), window.location.href)
                .done(function(url) {
                    window.location.assign(url);
                })
                .fail(function(xhr, status, error){
                    debug.error(status + ': ' + error);
                });
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

        $('#profile').on('click', function(e) {
            e.preventDefault(); //do not execute href
            api.getProfile()
                .done(function(profile) {
                    debug.log(JSON.stringify(profile));
                })
                .fail(function(xhr, status, error){
                    debug.error(status + ': ' + error);
                });
        });

        $('#values').on('click', function(e) {
            e.preventDefault(); //do not execute href
            api.getValues()
                .done(function(values) {
                    debug.log(JSON.stringify(values));
                })
                .fail(function(xhr, status, error){
                    debug.error(status + ': ' + error);
                });
        });

        $('.share').on('click', function(e) {
            e.preventDefault(); //do not execute href
            alert('Not yet implemented!')
        });

        kendo.bind($('body'), viewModel);
    });

}(jQuery));