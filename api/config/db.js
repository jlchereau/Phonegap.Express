var mongoose = require('mongoose'),
    config = require('./configuration'),
    connectionString = /*process.env.MONGOLAB_URI || process.env.MONGOHQ_URL ||*/ config.get("mongo:url"),
    options = { server: { auto_reconnect: true, poolSize: 10 } };

//This is for heroku logs
console.log('Phonegap.Express: connection to ' + connectionString);

mongoose.connect(connectionString, options);

/**
 * User Schema
 * @type {mongoose.Schema}
 */
var UserSchema = new mongoose.Schema({
    created             : { type: Date, default: Date.now },
    facebook: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    },
    google: {
        email           : { type: String },
        first_name      : { type: String },
        gender          : { type: String },
        id              : { type: String, index: true },
        last_name       : { type: String },
        link            : { type: String },
        locale          : { type: String },
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
        timezone        : { type: Number },
        picture         : { type: String },
        updated         : { type: Date },
        verified        : { type: Boolean }
    }
});
//See http://mongoosejs.com/docs/guide.html#virtuals
UserSchema.virtual('facebook.name').get(function () {
    if (this.facebook.first_name && this.facebook.last_name) {
        return this.facebook.first_name + ' ' + this.facebook.last_name;
    } else {
        return undefined;
    }
});
UserSchema.virtual('google.name').get(function () {
    if(this.google.first_name && this.google.last_name) {
        return this.google.first_name + ' ' + this.google.last_name;
    } else {
        return undefined;
    }
});
UserSchema.virtual('twitter.name').get(function () {
    if (this.twitter.first_name && this.twitter.last_name) {
        return this.twitter.first_name + ' ' + this.twitter.last_name;
    } else {
        return undefined;
    }
});
UserSchema.virtual('windowslive.name').get(function () {
    if (this.windowslive.first_name && this.windowslive.last_name) {
        return this.windowslive.first_name + ' ' + this.windowslive.last_name;
    } else {
        return undefined;
    }
});
UserSchema.virtual('name').get(function () {
    return this.google.name || this.facebook.name || this.windowslive.name || this.twitter.name;
});
UserSchema.virtual('email').get(function () {
    return this.google.email || this.facebook.email || this.windowslive.email || this.twitter.email;
});
mongoose.model('User', UserSchema);

/**
 * Token Schema
 * @type {exports.Schema}
 */
var TokenSchema = new mongoose.Schema({
    user_id             : { type: mongoose.Schema.Types.ObjectId, required: true },
    provider            : { type: String },
    agent               : { type: String }, //the agent should always remain the same
    address             : { type: String }, //maybe the ip address might change
    updated             : { type: Date, default: Date.now },
    expires             : { type: Number, required: true },
    access              : { type: String, required: true, index: true },
    refresh             : { type: String }
});
mongoose.model('Token', TokenSchema);

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
    state               : { type: Number, unique: true }
});
mongoose.model('Session', SessionSchema);

/**
 * Content Schema
 * @type {exports.Schema}
 */
var ContentSchema = new mongoose.Schema({
    user_id      : { type: mongoose.Schema.Types.ObjectId, required: true, indexed: true },
    name         : { type: String, required: true },
    date         : { type: Date, default: Date.now }
});
mongoose.model('Content', ContentSchema);