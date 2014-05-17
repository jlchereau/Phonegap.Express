//TODO: add a userService and a sessionService
var mongoose = require('mongoose'),
    Content = mongoose.model('Content');

function ContentService() {};

//Read all
ContentService.prototype.getAll = function(callback){
    Content.find({}, function(error, contents) {
        if (error) return callback(error, null);
        return callback(null, contents);
    });
};

//Read one
ContentService.prototype.getById = function(id, callback){
    var query = {"_id" : id};
    Content.findOne(query, function(error, content) {
        if (error) return callback(error, null);
        return callback(null, content);
    });
};

//Update one
ContentService.prototype.put = function(id, update, callback){
    var query = {"_id" : id};
    delete update._id;
    Content.findOne(query, function(error, content) {
        if (error) return callback(error, null);
        if (content == null) return callback(null, null);

        Content.update(query, update, function(error, content) {
            if (error) return callback(error, null);
            return callback(null, {});
        });
    });
};

//Create one
ContentService.prototype.post = function(name, data, callback){
    var query = {'name': name};
    var model = new Content(data);
    Content.findOne(query, function(error, content) {
        if (error) return callback(error, null);
        if (content != null) return callback(null, null);
        model.save(function (error, f) {
            if (error) return callback(error, null);
            return callback(null, f);
        });
    });
};

//Delete one
ContentService.prototype.del = function(id, callback){
    var query = {'_id': id};
    Content.findOne(query, function(error, content) {
        if (error) return callback(error, null);
        if (content == null) return callback(null, null);
        content.remove(function (error) {
            if (error) return callback(error, null);
            return callback(null, {});
        });
    });
};

module.exports = new ContentService();