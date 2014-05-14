//Copyright ©2013-2014 Memba® Sarl. All rights reserved.
/*jslint browser:true*/
/*jshint browser:true*/


; (function ($, undefined) {

    "use strict";

    var fn = Function,
        global = fn('return this')(),
        api = global.api = global.api || {},
        STRING = 'string',
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
        DEBUG = false; //IMPORTANT: Set DEBUG = false in production

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
        //api.endPoints.root = 'http://www.sv-rndev-01.com:3000';
        api.endPoints.root = 'http://localhost:3000';
    }

    $(document).ready(function () {
        api.util.log('access_token: ' + localStorage[ACCESS_TOKEN]);
        api.util.parseAccessToken(window.location.href);
        api.util.cleanHistory();
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
            var accessToken = localStorage[ACCESS_TOKEN];
            if (accessToken) {
                return { 'Authorization': 'Bearer ' + accessToken };
            }
            return {};
        },

        getAccessTokenHashPos: function (location) {
            if ($.type(location) !== STRING) return -1;
            return Math.max(
                location.indexOf(HASH + ACCESS_TOKEN), //Facebook and Google return access_token first
                location.indexOf(HASH + TOKEN_TYPE) //, //Windows Live returns token_type first
                //location.indexOf(HASH + EXPIRES_IN), //Others might have them in a different order
                //location.indexOf(HASH + STATE)
            );
        },

        parseAccessToken: function (url) {
            var pos1 = api.util.getAccessTokenHashPos(url), data = {};
            if (pos1 >= 0) {
                var keyValues = url.substr(pos1 + 1).split('&');
                $.each(keyValues, function (index, keyValue) {
                    var pos2 = keyValue.indexOf(EQUALS);
                    if (pos2 > 0 && pos2 < keyValue.length - EQUALS.length) {
                        data[keyValue.substr(0, pos2)] = decodeURIComponent(keyValue.substr(pos2 + EQUALS.length));
                    }
                });
                //TODO: check state, token type, etc.
                //TODO: set expiration date
                if ($.type(data.access_token) === STRING) {
                    api.util.setAccessToken(data.access_token);
                }
            }
            return data;
        },

        setAccessToken: function (accessToken) {
            localStorage[ACCESS_TOKEN] = accessToken;
            api.util.log('access_token added to localStorage');
        },

        clearAccessToken: function () {
            localStorage.removeItem(ACCESS_TOKEN);
            api.util.log('access_token removed from localStorage');
        },

        /**
         * Remove any token information from a url
         * Check its use in api.getSignInUrl where returnUrl would normally be window.location.href
         * In a browser, the whole authentication process redirects the browser to returnUrl#access_token=...
         * When authenticating again from this location, one would keep adding #access_token=... to the returnUrl, thus a requirement for cleaning it
         * @param url
         * @returns {*}
         */
        cleanUrl: function (url) {
            var ret = url,
                pos = api.util.getAccessTokenHashPos(url);
            api.util.log('url before cleaning token info: ' + url);
            if (pos >= 0) {
                ret = ret.substring(0, pos);
            }
            if (ret.slice(-1) === HASH) { //remove trailing hash if any
                ret = ret.substring(0, ret.length - 1);
            }
            api.util.log('url after cleaning token info: ' + ret);
            return ret;
        },

        /**
         * Clean the history from token information
         */
        cleanHistory: function () {
            var pos = api.util.getAccessTokenHashPos(window.location.hash);
            if (pos >= 0) {
                if (history) {
                    history.replaceState({}, document.title, window.location.pathname + window.location.hash.substr(0, pos));
                } else {
                    window.location.hash = window.location.hash.substr(0, pos); // for older browsers, might leave a # behind
                }
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
            api.util.clearAccessToken(); //TODO: review
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
            api.util.log('destroy');
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