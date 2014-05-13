//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/


; (function ($, undefined) {

    "use strict";

    var fn = Function,
        global = fn('return this')(),
        api = global.api = global.api || {},
        EQUALS = '=',
        HASH = '#',
        ACCESS_TOKEN = 'access_token',
        TOKEN_TYPE = 'token_type',
        EXPIRES_IN = 'expires_in',
        STATE = 'state',
        DELETE = 'DELETE',
        GET = 'GET',
        POST = 'POST',
        PUT = 'PUT',
        JSON = 'json',
        FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded',
        //TEXT_CONTENT_TYPE = 'text/plain',
        MODULE = 'api.js: ',
        DEBUG = true; //IMPORTANT: Set DEBUG = false in production

    api.endPoints = {
        root: 'http://expressjs.herokuapp.com',
        signIn: '/auth/{0}/signin',
        signOut: '/auth/signout',
        heartbeat: '/heartbeat',
        error: '/error', //This route does not exist and should return an error
        values: '/values',
        profile: '/profile',
        contents: '/api/contents'
    };

    if (DEBUG) {
        api.endPoints.root = 'http://www.sv-rndev-01.com:3000';
        //api.endPoints.root = 'http://localhost:3000';
    }

    $(document).ready(function () {
        api.util.log('access_token: ' + localStorage[ACCESS_TOKEN]);
        api.util.parseAccessToken();
    });

    api.util = {

        log: function (message) {
            if (DEBUG && global.console) {
                console.log(MODULE + message);
            }
        },

        error: function (message) {
            if (DEBUG && global.console) {
                if (global.console.error) {
                    console.error(MODULE + message);
                } else {
                    console.log(MODULE + message);
                }
            }
        },

        getSecurityHeaders: function () {
            var accessToken = sessionStorage[ACCESS_TOKEN] || localStorage[ACCESS_TOKEN];
            if (accessToken) {
                return { "Authorization": "Bearer " + accessToken };
            }
            return {};
        },

        parseAccessToken: function () {
            var hash = window.location.hash,
                pos1 = Math.max(
                    hash.indexOf(HASH + ACCESS_TOKEN), //Facebook and Google return access_token first
                    hash.indexOf(HASH + TOKEN_TYPE) //, //Windows Live returns token_type first
                    //hash.indexOf(HASH + EXPIRES_IN),
                    //hash.indexOf(HASH + STATE)
                ),
                data = {};
            if (pos1 >= 0) {
                var keyValues = hash.substr(pos1 + 1).split('&');
                $.each(keyValues, function (index, keyValue) {
                    var pos2 = keyValue.indexOf(EQUALS);
                    if (pos2 > 0 && pos2 < keyValue.length - EQUALS.length) {
                        data[keyValue.substr(0, pos2)] = decodeURIComponent(keyValue.substr(pos2 + EQUALS.length));
                    }
                });
                //TODO: check state, token type, etc.
                api.util.setAccessToken(data.access_token, true);
                if (history) {
                    history.replaceState({}, document.title, window.location.pathname + hash.substr(0, pos1));
                } else {
                    window.location.hash = hash.substr(0, pos1); // for older browsers, might leave a # behind
                }
            }
            return data;
        },

        setAccessToken: function (accessToken, persistent) {
            if (persistent) {
                localStorage[ACCESS_TOKEN] = accessToken;
            } else {
                sessionStorage[ACCESS_TOKEN] = accessToken;
            }
            api.util.log('access_token added to ' + persistent ? 'localStorage' : 'sessionStorage');
        },

        clearAccessToken: function () {
            localStorage.removeItem(ACCESS_TOKEN);
            sessionStorage.removeItem(ACCESS_TOKEN);
            api.util.log('access_token removed from localStorage and sessionStorage');
        },

        cleanUrl: function (url) {
            var ret = url,
                pos = Math.max(
                    ret.indexOf(HASH + ACCESS_TOKEN), //Google and Facebook return access_token first
                    ret.indexOf(HASH + TOKEN_TYPE)    //Windows Live returns token_type first
                    //ret.indexOf(HASH + EXPIRES_IN),
                    //ret.indexOf(HASH + STATE)
                );
            api.util.log('url before cleaning token info: ' + url);
            if (pos >= 0) {
                ret = ret.substring(0, pos);
            }
            if (ret.slice(-1) === HASH) {
                ret = ret.substring(0, ret.length - 1);
            }
            api.util.log('url after cleaning token info: ' + ret);
            return ret;
        },

        //TODO: check OWIN code about this....
        archiveSessionStorageToLocalStorage: function () {
            var backup = {};

            for (var i = 0; i < sessionStorage.length; i++) {
                backup[sessionStorage.key(i)] = sessionStorage[sessionStorage.key(i)];
            }

            localStorage["sessionStorageBackup"] = JSON.stringify(backup);
            sessionStorage.clear();
        },

        restoreSessionStorageFromLocalStorage: function () {
            var backupText = localStorage["sessionStorageBackup"],
                backup;

            if (backupText) {
                backup = JSON.parse(backupText);

                for (var key in backup) {
                    sessionStorage[key] = backup[key];
                }

                localStorage.removeItem("sessionStorageBackup");
            }
        }
    };

    //Use $.deferred as in http://jsfiddle.net/L96cD/
    //See http://jqfundamentals.com/chapter/ajax-deferreds
    //Se also http://joseoncode.com/2011/09/26/a-walkthrough-jquery-deferred-and-promise/

    api.getSignInUrl = function (provider, returnUrl) {
        api.util.log('calling getSignInUrl for ' + provider)
        return $.ajax({
            url: api.endPoints.root + api.endPoints.signIn.replace('{0}', provider),
            type: GET,
            cache: false, //Adds a parameter _ with a timestamp to the query string
            data: { returnUrl: api.util.cleanUrl(returnUrl) /*encodeURIComponent(returnUrl)*/ }
        });
    };

    /**
     * Api's that require being logged in (security headers)
     */
    api.signOut = function () {
        api.util.log('calling signOut');
        return $.ajax({
            url: api.endPoints.root + api.endPoints.signOut,
            contentType: FORM_CONTENT_TYPE,
            type: POST,
            //xhrFields: { withCredentials: true },
            headers: api.util.getSecurityHeaders()
        }).always(function () {
            api.util.clearAccessToken();
        });
    };

    api.getHeartbeat = function () {
        api.util.log('calling getHeartbeat');
        return $.ajax({
            url: api.endPoints.root + api.endPoints.heartbeat,
            type: GET,
            //xhrFields: { withCredentials: true }, //send cookies
            //headers: api.util.getSecurityHeaders(),
            crossDomain: true //TODO: not sure this is necessary????
            /*
             beforeSend: function (xhr, settings) {
             xhr.withCredentials = true;
             xhr.setRequestHeader('Authorization', 'Bearer ' + session.access_token);
             }
             */
        });
    };

    api.getError = function () {
        api.util.log('calling getError');
        return $.ajax({
            url: api.endPoints.root + api.endPoints.error,
            type: GET,
            //xhrFields: { withCredentials: true }, //send cookies
            ///headers: api.util.getSecurityHeaders(),
            crossDomain: true
        });
    };

    api.getProfile = function () {
        api.util.log('calling getProfile');
        return $.ajax({
            url: api.endPoints.root + api.endPoints.profile,
            type: GET,
            cache: false,
            //xhrFields: { withCredentials: true },
            headers: api.util.getSecurityHeaders(),
            crossDomain: true
        });
    };

    api.getValues = function () {
        api.util.log('calling getValues');
        return $.ajax({
            url: api.endPoints.root + api.endPoints.values,
            type: GET,
            //xhrFields: { withCredentials: true }, //send cookies
            headers: api.util.getSecurityHeaders(),
            crossDomain: true
        });
    };

    api.contents = {
        create: function (data) {
            api.util.log('calling createContent');
            delete data._id; //!IMPORTANT
            return $.ajax({
                url: api.endPoints.root + api.endPoints.contents,
                type: POST,
                dataType: JSON,
                data: data,
                //xhrFields: { withCredentials: true }, //send cookies
                headers: api.util.getSecurityHeaders(),
                crossDomain: true
            });
        },

        readAll: function () {
            api.util.log('calling readAllContents');
            return $.ajax({
                url: api.endPoints.root + api.endPoints.contents,
                type: GET,
                dataType: JSON,
                //xhrFields: { withCredentials: true }, //send cookies
                headers: api.util.getSecurityHeaders(),
                crossDomain: true
            });
        },

        update: function (data) {
            api.util.log('calling readAllContents');
            return $.ajax({
                url: api.endPoints.root + api.endPoints.contents + '/' + data._id,
                type: 'PUT',
                dataType: JSON,
                data: data,
                //xhrFields: { withCredentials: true }, //send cookies
                headers: api.util.getSecurityHeaders(),
                crossDomain: true
            });
        },

        destroy: function (data) {
            console.log('destroy');
            return $.ajax({
                url: api.endPoints.root + api.endPoints.contents + '/' + data._id,
                type: 'DELETE',
                dataType: JSON,
                //xhrFields: { withCredentials: true }, //send cookies
                headers: api.util.getSecurityHeaders(),
                crossDomain: true
            });
        }
    }

}(jQuery));