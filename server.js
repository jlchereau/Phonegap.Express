var express = require('express'),
    http = require('http'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    //mongoose = require('mongoose'),
    //cookieParser = require('cookie-parser'),
    //session = require('express-session'),
    //Store = require('connect-mongo')(session);

    config = require('./api/config/configuration'),
    db = require('./api/config/db'),
    authentication = require('./api/config/passport'),
    id = require('./api/middleware/id'),
    notFound = require('./api/middleware/notFound'),
    routes = require('./api/routes'),

    app = express(),
    router = express.Router(),
    port = process.env.PORT || config.get('express:port');

console.log('Phonegap.ExpressJS: listening on port ' + port);

app.disable('x-powered-by');
app.set('port', port);
//app.use(cookieParser()); //Otherwise 500 TypeError: Cannot read property 'connect.sid' of undefined
//app.use(session({
//    secret: config.get('session:secret'),
//    store: new Store({mongoose_connection : mongoose.connections[0]})
    //store: new Store({db : mongoose.connection.db })
//}));
app.use(express.static(__dirname + '/www'));

//Initialize Passport!  Note: no need to use session middleware when each
// request carries authentication credentials, as is the case with HTTP Bearer.
router.use(authentication.passport.initialize());
//router.use(authentication.passport.session());
router.use(cors());
router.use(bodyParser()); //parse body for Json - IMPORTANT: after CORS
router.param('id', id.validate);

router.route('/api/contents/:id')
    .get(routes.api.contents.getById)
    .put(authentication.passport.authenticate('bearer', { session: false }), routes.api.contents.put)
    .delete(authentication.passport.authenticate('bearer', { session: false }), routes.api.contents.delete);
router.route('/api/contents')
    .get(routes.api.contents.getAll)
    .post(authentication.passport.authenticate('bearer', { session: false }), routes.api.contents.post);

router.route('/heartbeat')
    .get(routes.heartbeat.get);
router.route('/values')
    .get(authentication.passport.authenticate('bearer', { session: false }), routes.api.values);
router.route('/profile')
    .get(authentication.passport.authenticate('bearer', { session: false }), routes.api.profile);

router.route('/auth/:provider/signin')
    .get(routes.authentication.signin);
router.route('/auth/:provider/callback')
    .get(routes.authentication.callback);
//TODO: we also need /auth/:provider/token to renew tokens
router.route('/auth/signout')
    .post(authentication.passport.authenticate('bearer', { session: false }), routes.authentication.signout);

router.use(notFound.handler);

app.use(router);

http.createServer(app).listen(port);
module.exports = app;
