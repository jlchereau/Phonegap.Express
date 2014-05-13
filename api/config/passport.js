var BearerStrategy = require('passport-http-bearer').Strategy,
    config = require('./configuration'),
    mongoose = require('mongoose'),
    User = mongoose.model('User');

function Authentication() {

    this.passport = require('passport');

    this.passport.use('bearer', new BearerStrategy(
        { /*"passReqToCallback": true*/ },
        function(/*req,*/ token, done) {
            // asynchronous validation, for effect...
            process.nextTick(function () {
                // Find the user by token.  If there is no user with the given token, set
                // the user to `false` to indicate failure.  Otherwise, return the
                // authenticated `user`.  Note that in a production-ready application, one
                // would want to validate the token for authenticity.

                //TODO Google: https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=
                User.findOne({ token: token }, function(err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    return done(null, user);
                });
            });
        }
    ));

    /*
     // Serialize
     passport.serializeUser(function(user, done) {
     done(null, user._id);
     });

     // Deserialize
     passport.deserializeUser(function(id, done) {
     User.findOne({ _id: id }).exec(function(err, user) {
     done(err, user);
     });
     });
     */

};

module.exports = new Authentication();