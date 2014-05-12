var mongoose = require('mongoose'),
    config = require('./configuration'),
    connectionString = config.get("mongo:url"),
    options = { server: { auto_reconnect: true, poolSize: 10 } };

//This is for heroku logs
console.log('Phonegap.Express:' + connectionString);

mongoose.connect(connectionString, options);

/**
 * User Schema
 * @type {mongoose.Schema}
 */
var UserSchema = new mongoose.Schema({
    created             : { type: Date, default: Date.now },
    expires             : { type: Number, required: true },
    google: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
        name            : { type: String },  //TODO first_name + last_name
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    },
    facebook: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
        name            : { type: String },  //TODO first_name + last_name
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    },
    twitter: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
        name            : { type: String },  //TODO first_name + last_name
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    },
    windowslive: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
        name            : { type: String },  //TODO first_name + last_name
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    },
    provider            : { type: String },
    //TODO: refresh_token ?????????????????????????????????????????????????????????????
    token               : { type: String, index: true }
});
mongoose.model('User', UserSchema);

/**
 * Session Schema
 * @type {mongoose.Schema}
 */
var SessionSchema = new mongoose.Schema({
    address             : { type: String },
    agent               : { type: String },
    created             : { type: Date, default: Date.now },
    error               : { type: String },
    provider            : { type: String },
    returnUrl           : { type: String },
    state               : { type: Number, index: true }
});
mongoose.model('Session', SessionSchema);

/**
 * Content Schema
 * @type {exports.Schema}
 */
var ContentSchema = new mongoose.Schema({
    name         : { type: String, required: true, index: true },
    user         : { type: String, required: true, index: true },
    created      : { type: Date, default: Date.now }
});
mongoose.model('Content', ContentSchema);