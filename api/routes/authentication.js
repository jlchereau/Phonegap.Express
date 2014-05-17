/**
 * Authentication.js
 * Endpoints for oAuth2 authentication with Google, Facebook, Twitter and Windows Live accounts
 *
 * In the sequence diagram below, the request is represented above the arrow and the response below the arrow
 * Query parameters (in url or posted) are represented in curly brackets
 *
 *  _____________                              _____________                             _____________
 * |  WebApp   |                              | Rest API  |                             | Provider  |
 * | Phonegap  |                              |           |                             | (Google)  |
 * |___________|                              |___________|                             |___________|
 *       |                                          |                                         |
 *       |       GET /auth/:provider/signin         |                                         |
 *       |               {returnURL}                |                                         |
 *       | ---------------------------------------> | ------|                                 |
 *       |             authorizationURL             |       |  Store session {returnURL}      |
 *       |                                          | <-----|                                 |
 *       |                                          |                                         |
 *       |         GET authorizationURL             |                                         |
 *       | ---------------------------------------------------------------------------------> |
 *       |  Login page (agreement not represented)  |                                         |
 *       |                                          |                                         |
 *       |                                          |            GET callbackURL              |
 *       |                                          |                {code}                   |
 *       |                                          | <-------------------------------------- |
 *       |                                          | ------|                                 |
 *       |                                          |       |  Read session {returnURL}       |
 *       |                                          | <-----|                                 |
 *       |                                          |                                         |
 *       |                                          |             POST tokenURL               |
 *       |                                          |                 {code}                  |
 *       |                                          | --------------------------------------> |
 *       |                                          |      access_token (+ refresh_token)     |
 *       |                                          |                                         |
 *       |                                          |                                         |
 *       |                                          |            profileURL(token)            |
 *       |                                          | --------------------------------------> |
 *       |                                          |               profile                   |
 *       |                                          |                                         |
 *       |                                          | ------|                                 |
 *       |                                          |       |  Save user                      |
 *       |             302 returnURL                |       |  Delete session                 |
 *       | <--------------------------------------- | <-----|                                 |
 *       |                                          |                                         |
 *       |                                          |                                         |
 *
 * Documentation:
 * ---------------
 * Google: https://developers.google.com/accounts/docs/OAuth2WebServer
 * Facebook: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/
 * Twitter: https://dev.twitter.com/docs/auth/3-legged-authorization
 * Windows Live: http://msdn.microsoft.com/en-us/library/dn631818.aspx
 * Note: possibly LinkedIn, Yahoo????
 *
 * ClientID and Client Secret
 * -------------------------------
 * Google: https://console.developers.google.com/project
 * Facebook: https://developers.facebook.com/apps/
 * Twitter: https://apps.twitter.com/app/
 * Windows Live: https://account.live.com/developers/applications
 * Note: create a redirection in %systemroot%\system32\drivers\etc\hosts when necessary (windows live)
 */

var request = require('request'),//TODO: use https instead of request module to minimize dependencies
    qs = require('querystring'),
    mongoose = require('mongoose'),
    Session = mongoose.model('Session'),
    User = mongoose.model('User'),
    Token = mongoose.model('Token'),
    config = require('../config/configuration'),

    //oAuth 1.0a vocabulary
    oAuth1 = {

        version: 1
        //aAuth1 vocabulary to be used with Twitter and other providers implementing the oAuth1 flow
    },
    //oAuth 2.0 vocabulary
    oAuth2 = {
        version: 2,
        code                        : 'code',
        grant_type                  : 'authorization_code',
        access_token                : 'access_token', //,
        id_token                    : 'id_token'
        //token_type                  : 'token_type',
        //expires_in                  : 'expires_in',
        //state                       : 'state',
    },
    //supported/tested provider configuration
    providers = {
        facebook: {
            oAuth                   : oAuth2,
            authorizationURL        : 'https://www.facebook.com/dialog/oauth',
            tokenURL                : 'https://graph.facebook.com/oauth/access_token',
            refreshUrl              : '', //TODO
            revokeUrl               : '', //TODO
            verifyUrl               : '', //TODO
            profileURL              : 'https://graph.facebook.com/me',
            scope                   : 'email public_profile'
        },
        google: {
            oAuth                   : oAuth2,
            authorizationURL        : 'https://accounts.google.com/o/oauth2/auth',
            tokenURL                : 'https://accounts.google.com/o/oauth2/token',
            refreshUrl              : '', //TODO
            revokeUrl               : 'https://accounts.google.com/o/oauth2/revoke', //TODO
            verifyUrl               : 'https://www.googleapis.com/oauth2/v1/tokeninfo', //TODO
            profileURL              : 'https://www.googleapis.com/oauth2/v1/userinfo',
            scope                   : 'email profile' //'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
        },
        twitter: {
            oAuth                   : oAuth1,
            authorizationURL        : '', //Not used - See https://dev.twitter.com/docs/auth/application-only-auth
            tokenURL                : 'https://api.twitter.com/oauth2/token',
            refreshUrl              : '', //TODO
            revokeUrl               : 'https://api.twitter.com/oauth2/invalidate_token', //TODO
            verifyUrl               : '', //TODO
            profileURL              : '',
            scope                   : ''
        },
        windowslive: {
            oAuth                   : oAuth2,
            authorizationURL        : 'https://login.live.com/oauth20_authorize.srf',
            tokenURL                : 'https://login.live.com/oauth20_token.srf',
            refreshUrl              : '', //TODO
            revokeUrl               : '', //TODO
            verifyUrl               : '', //TODO
            profileURL              : 'https://apis.live.net/v5.0/me',
            scope                   : 'wl.basic wl.signin wl.emails'
           //scope                   : 'wl.basic wl.offline_access wl.signin wl.emails' //See: http://msdn.microsoft.com/en-us/library/dn631845.aspx
        }
    };

/**
 * Get the client IP Address
 * TODO: This needs to be improved to prevent IP spoofing
 * See: http://expressjs.com/guide.html#proxies
 * See: http://stackoverflow.com/questions/14382725/how-to-get-the-correct-ip-address-of-a-client-into-a-node-socket-io-app-hosted-o
 * See: http://esd.io/blog/flask-apps-heroku-real-ip-spoofing.html
 * See: http://stackoverflow.com/questions/10849687/express-js-how-to-get-remote-client-address
 * @param req
 * @returns {*}
 */
function getClientIp(req) {
    var ipAddress;
    // Amazon EC2 / Heroku workaround to get real client IP
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        // 'x-forwarded-for' header may return multiple IP addresses in
        // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
        // the first one
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        // Ensure getting client IP address still works in
        // development environment
        ipAddress = req.connection.remoteAddress; //TODO: https???
    }
    return ipAddress;
}

/**
 * signin function returning a well-formed url to request an authorization code from the oAuth2 security provider (Google, Facebook, ...)
 * @param req
 * @param res
 */
exports.signin = function(req, res) {
    var session = new Session({
        address: getClientIp(req),
        agent: req.headers['user-agent'],
        provider: req.params.provider,
        returnUrl: req.query.returnUrl,
        state: Math.floor(Math.random() * 1e18)
    });
    if(providers[session.provider] === undefined) return res.send(404);
    session.save(function(err, data){
        var params = {
            response_type: oAuth2.code,
            client_id: config.get(session.provider + ':clientID'),
            redirect_uri: (req.connection.encrypted ? 'https://' : 'http://') + req.headers.host + '/auth/' + session.provider + '/callback',
            state: session.state,
            //TODO: access_type: 'offline' and scope 'wl.offline_access' if we want a refresh_token
            scope: providers[session.provider].scope
        };
        res.set('Content-Type', 'text/plain');
        res.send(200, providers[session.provider].authorizationURL + '?' + qs.stringify(params));
    });
};

/**
 * The oAuth2 callback redirected to by the security provider to send a valid token from the authorization code
 * @param req
 * @param res
 */
exports.callback = function(req, res) {
    var state = parseFloat(req.query.state),
        session, token, user;

    //TODO: maybe we should check that the referrer is a known identity provider

    //if(req.query.code === undefined) relevant test?
    //test invalid scope => req.query.error + req.query.error_description

    Session.findOne({state: state}, function(err, data) {
        //Ensure that the token is delivered to the IP address which has requested the authorization code
        if(data.address !== getClientIp(req)) return res.send(400);
        //Ensure that the token is delivered to the user agent which has requested the authorization code
        if(data.agent !== req.headers['user-agent']) return res.send(400);
        //Ensure that the identity provider used to deliver the token is the identity provider for which an authorization code has been requested (maybe overkill)
        if(data.provider !== req.params.provider) return res.send(400);
        session = data;
        var params = {
            code: req.query.code,
            client_id: config.get(session.provider + ':clientID'),
            client_secret: config.get(session.provider + ':clientSecret'),
            redirect_uri: (req.connection.encrypted ? 'https://' : 'http://') + req.headers.host + '/auth/' + session.provider + '/callback',
            grant_type: oAuth2.grant_type
        };
        request.post(providers[session.provider].tokenURL, {form: params}, tokenHandler);
    });

    /**
     * tokenHandler
     * The body is the token which Google and Windows Live return as JSON and which Facebook returns as query string (key=value&key=value)
     * The token has the following properties:
     *                            Google          Facebook          Twitter        Windows Live
     * access_token                 X                X                                   X
     * authentication_token                                                              X      TODO: what is the authentication_token?
     * expires                                       X
     * expires_in                   X                                                    X
     * id_token (JWT)               X
     * refresh_token     access_type: 'offline'                                   wl.offline_access
     * scope                        X                                                    X
     * token_type                   X                                                    X
     * user_id                                                                           X
     *
     * @param err
     * @param res
     * @param body
     */
    function tokenHandler(err, resp, body) {
        try { //google
            token = JSON.parse(body);
        } catch(err) { //facebook
            token = qs.parse(body);
        }
        if (token.error) return res.send(502, token.error); //TODO: improve error management
        //Facebook gives no token_type, Google gives 'Bearer' and Windows Live gives 'bearer', but is this test really useful?
        if ((token.token_type) && (token.token_type.toLowerCase() !== 'bearer')) return res.send(502, 'Invalid token type');
        request.get(providers[session.provider].profileURL + '?' + oAuth2.access_token + '=' + encodeURIComponent(token.access_token), profileHandler);
        //TODO: isn't it too soon to redirect as the profile may not have been saved yet?
        if(session.returnUrl) {
            var params = {
                access_token: token.access_token,
                expires: token.expires_in || token.expires, //Note: Facebook as token.expires instead of token.expires_in
                state: session.state
            };
            token.state = session.state;
            res.redirect(session.returnUrl + '#' + qs.stringify(params));
        }
        res.json(token); //Without returnUrl, the client receives the token as json to do whatever he/she deems necessary
    }

    /**
     * profileHandler
     * The body is the profile which all providers return as JSON
     * The profile has the following properties
     *                            Google          Facebook          Twitter        Windows Live
     * email                                          X
     * emails.account                                                                   X
     * emails.business                                                                  X
     * email.personal                                                                   X
     * email.preferred                                                                  X
     * family_name                  X
     * first_name                                     X                                 X
     * gender                       X                 X                                 X
     * given_name                   X
     * id                           X                 X                                 X
     * last_name                                      X                                 X
     * link                         X                 X                                 X
     * locale                       X                 X                                 X
     * name                         X                 X                                 X
     * picture                      X
     * timezone                                       X
     * updated_time                                   X                                 X
     * verified                                       X
     * verified_email               X
     *
     *
     * @param err
     * @param res
     * @param body
     */
    function profileHandler(err, resp, body) {
        var profile = profileParser(body), query = {};
        if (profile.error) return console.error("Error returned from Google: ", profile.error); //TODO: improve

        //Find profile using unique identity provider's id
        query[session.provider + '.id'] = profile.id;
        User.findOne(query, function(err, data) {
            if (err) return console.error(err); //TODO: improve
            if(data === null) { //profile not found
                data = {};
                data[session.provider] = profile;
                user = new User(data);
            } else { //profile found -> update user
                user = data;
                user[session.provider] = profile;
            }
            //Save new or updated user
            user.save(function(err, data){
                if (err) return console.error(err); //TODO: improve
                user = data; //so as to have an _id
                //Find token
                Token.findOne({access : token.access_token }, function(err, data) {
                    if (err) return console.error(err); //TODO: improve
                    if(data === null) {
                        data = {
                            user_id: user._id,
                            provider: session.provider,
                            agent: session.agent,
                            address: session.address,
                            //updated,
                            expires: token.expires_in || token.expires, //Google uses expires_in, Facebook uses expires
                            access: token.access_token
                            //refresh: ''
                        };
                        new Token(data).save();
                        //TODO: remove expired tokens?
                    }
                });
                session.remove(); //.exec();
                //Also purge sessions older than 24 hours
                Session.where('created').lte(Date.now() - 24*60*60*1000).remove().exec();
            });
        });
    }

    /**
     * Ensures that the parsed profile will fit the database schema
     * @param body
     */
    function profileParser(body) {
        var temp = JSON.parse(body), profile = {};
        if (temp.error) {
            profile.error = temp.error;
            //TODO: there might be other properties to consider
        }
        if (temp.email) {
            profile.email = temp.email;
        } else if (temp.emails) {
            if (temp.emails.preferred) {
                profile.email = temp.emails.preferred;
            } else if (temp.emails.account) {
                profile.email = temp.emails.account;
            } else if (temp.emails.business) {
                profile.email = temp.emails.business;
            } else if (temp.emails.personal) {
                profile.email = temp.emails.personal;
            }
        }
        if (temp.first_name) {
            profile.first_name = temp.first_name;
        } else if (temp.given_name) {
            profile.first_name = temp.given_name;
        }
        if (temp.last_name) {
            profile.last_name = temp.last_name;
        } else if (temp.family_name) {
            profile.last_name = temp.family_name;
        }
        if (temp.gender) {
            profile.gender = temp.gender;
        }
        if (temp.id) {
            profile.id = temp.id;
        }
        if(temp.link) {
            profile.link = temp.link;
        }
        if (temp.locale) {
            profile.locale = temp.locale;
        }
        //if (temp.name) {
        //    profile.name = temp.name;
        //}
        if (temp.picture) {
            profile.picture = temp.picture;
        }
        if (temp.timezone) { //only Facebook
            profile.timezone = temp.timezone;
        }
        if (temp.updated_time) {
            profile.updated = temp.updated_time;
        }
        if (temp.verified) {
            profile.verified = temp.verified;
        } else if (temp.verified_email) {
            profile.verified = temp.verified_email;
        }
        return profile;
    }
};

/**
 * Method used by passport-http-bearer to verify the token
 * @param req
 * @param res
 */
exports.verify = function(req, res) {
    console.log('verify token');
};


/**
 * TODO: The endpoint to renew/refresh tokens
 * @param req
 * @param res
 */
exports.token = function(req, res) {};

/**
 * signout
 * TODO: shouldn't we revoke the token instead?
 * NOTE: difference between logout and token revokation?
 * SEE: http://social.msdn.microsoft.com/Forums/windowsazure/en-US/f92e24bc-e685-4709-9e5e-7b203efef44b/how-do-i-sign-out-of-google-yahoo-or-liveid-and-use-a-different-account?forum=windowsazuresecurity
 * @param req
 * @param res
 */
exports.signout = function(req, res) {
    var user = req.user;
    if(user instanceof User) {
        //TODO: shouldn't we revoke the token instead?
        //But in this case, what happens to offline access?
        user.token = null;
        user.save();
    }
    res.send(200);
};