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
 * TODO
 * -------
 * Error handling
 * Missing: offline access + refresh tokens + revoke token + link accounts
 * Questions: refresh tokens and impact on signout; see: https://developers.facebook.com/blog/post/2011/05/13/how-to--handle-expired-access-tokens/
 * Is this not reinventing the wheel considering passport-oauth2?
 *
 * Documentation:
 * ---------------
 * Google: https://developers.google.com/accounts/docs/OAuth2WebServer
 * Facebook: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/
 * Twitter: https://dev.twitter.com/docs/auth/application-only-auth
 * Windows Live: http://msdn.microsoft.com/en-us/library/dn631818.aspx
 * Note: possibly LinkedIn, Yahoo????
 *
 * ClientID and Client Secret
 * -------------------------------
 * Google: https://console.developers.google.com/project
 * Facebook: https://developers.facebook.com/apps/
 * Twitter:
 * Windows Live: https://account.live.com/developers/applications
 * Note: create a redirection in %systemroot%\system32\drivers\etc\hosts when necessary (windows live)
 */

var request = require('request'),//TODO: use https instead to minimize dependencies
    qs = require('querystring'),
    mongoose = require('mongoose'),
    Session = mongoose.model('Session'),
    User = mongoose.model('User'),
    config = require('../config/configuration'),
    oAuth2 = {
        code                        : 'code',
        grant_type                  : 'authorization_code',
        access_token                : 'access_token', //,
        id_token                    : 'id_token'
        //token_type                  : 'token_type',
        //expires_in                  : 'expires_in',
        //state                       : 'state',
    },
    providers = {
        facebook: {
            authorizationURL        : 'https://www.facebook.com/dialog/oauth',
            tokenURL                : 'https://graph.facebook.com/oauth/access_token',
            refreshUrl              : '', //TODO
            revokeUrl               : '', //TODO
            profileURL              : 'https://graph.facebook.com/me',
            scope                   : 'email public_profile'
        },
        google: {
            authorizationURL        : 'https://accounts.google.com/o/oauth2/auth',
            tokenURL                : 'https://accounts.google.com/o/oauth2/token',
            refreshUrl              : '', //TODO
            revokeUrl               : 'https://accounts.google.com/o/oauth2/revoke', //TODO
            profileURL              : 'https://www.googleapis.com/oauth2/v1/userinfo',
            scope                   : 'email profile' //'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
        },
        twitter: {
            authorizationURL        : '', //Not used - See https://dev.twitter.com/docs/auth/application-only-auth
            tokenURL                : 'https://api.twitter.com/oauth2/token',
            refreshUrl              : '', //TODO
            revokeUrl               : 'https://api.twitter.com/oauth2/invalidate_token', //TODO
            profileURL              : '',
            scope                   : ''
        },
        windowslive: {
            authorizationURL        : 'https://login.live.com/oauth20_authorize.srf',
            tokenURL                : 'https://login.live.com/oauth20_token.srf',
            refreshUrl              : '', //TODO
            revokeUrl               : '', //TODO
            profileURL              : 'https://apis.live.net/v5.0/me',
            scope                   : 'wl.basic wl.signin wl.emails'
          //scope                   : 'wl.basic wl.offline_access wl.signin wl.emails' //See: http://msdn.microsoft.com/en-us/library/dn631845.aspx
        }
    };

/**
 * signin function returning a well-formed url to request an authorization code from the oAuth2 security provider (Google, Facebook, ...)
 * @param req
 * @param res
 */
exports.signin = function(req, res) {
    //TODO limit list of allowed providers
    var session = new Session({
        address: req.connection.remoteAddress,
        agent: req.headers['user-agent'],
        provider: req.params.provider,
        returnUrl: req.query.returnUrl,
        state: Math.floor(Math.random() * 1e18)
    });
    session.save(function(err, data){
        var params = {
            response_type: oAuth2.code,
            client_id: config.get(session.provider + ':clientID'),
            redirect_uri: (req.connection.encrypted ? 'https://' : 'http://') + req.headers.host + '/auth/' + session.provider + '/callback',
            state: session.state,
            //TODO: access_type: 'offline' and scope 'wl.offline_access'
            scope: providers[session.provider].scope
        };
        res.set('Content-Type', 'text/plain');
        res.send(200, providers[session.provider].authorizationURL + '?' + qs.stringify(params));
    });
};

/**
 * The oAuth2 callback called by the security provider to a valid token from teh authorization code
 * @param req
 * @param res
 */
exports.callback = function(req, res) {
    var state = parseFloat(req.query.state),
        session, token, user;

    //if(req.query.code === undefined) relevant test?
    //invalide scope => req.query.error + req.query.error_description

    Session.findOne({state: state}, function(err, data) {
        if(data.address !== req.connection.remoteAddress) return res.send(400);
        if(data.agent !== req.headers['user-agent']) return res.send(400);
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
        if (token.error) return res.send(502, token.error);
        //Facebook gives no token_type, Google gives 'Bearer' and Windows Live gives 'bearer', but is this test really useful?
        if ((token.token_type) && (token.token_type.toLowerCase() !== 'bearer')) return res.send(502, 'Invalid token type');
        //Note: Google adds token.id_token, a JWT token - see http://stackoverflow.com/questions/8311836/how-to-identify-a-google-oauth2-user/13016081#13016081
        if (token.id_token) delete token.id_token;
        request.get(providers[session.provider].profileURL + '?' + oAuth2.access_token + '=' + encodeURIComponent(token.access_token), profileHandler);
        //TODO: isn't it too soon to redirect as the profile may not have been saved yet?
        if(session.returnUrl) {
            token.state = session.state;
            res.redirect(session.returnUrl + '#' + qs.stringify(token));
        }
        res.json(token); //Without returnUrl, the client receives the token as json
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
        var profile = parseProfile(body), query = {};
        if (profile.error) return console.error("Error returned from Google: ", profile.error);
        query[session.provider + '.id'] = profile.id;
        User.findOne(query, function(err, data) {
            if(data === null) { //user not found
                data = {
                    provider: session.provider,
                    token: token.access_token,
                    expires: token.expires_in || token.expires  //Google uses expires_in, Facebook uses expires
                };
                data[session.provider] = profile;
                user = new User(data);
            } else { //user found -> update
                user = data;
                user.provider = session.provider;
                user.token = token.access_token;
                user.expires = token.expires_in || token.expires;
                user[session.provider] = profile;
            }
            user.save(function(err, data){
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
    function parseProfile(body) {
        var temp = JSON.parse(body), profile = {};
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
        if (temp.name) {
            profile.name = temp.name;
        }
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
 * TODO: The token endpoint to renew tokens
 * @param req
 * @param res
 */
exports.token = function(req, res) {};

/**
 * signout function removing the token from the user account
 * TODO: shouldn't we revoke the token instead?
 * NOTE: difference between logout and token revokation?
 * SEE: http://social.msdn.microsoft.com/Forums/windowsazure/en-US/f92e24bc-e685-4709-9e5e-7b203efef44b/how-do-i-sign-out-of-google-yahoo-or-liveid-and-use-a-different-account?forum=windowsazuresecurity
 * @param req
 * @param res
 */
exports.signout = function(req, res) {
    var user = req.user;
    if(user instanceof User) {
        user.token = null;
        user.save();
    }
    res.send(200);
};