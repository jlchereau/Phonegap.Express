//TODO use res.format
var contentService = require('../models/contentService');

//see: https://github.com/jprichardson/string.js/blob/master/lib/string.js
function isEmpty(s) {
    return s === null || s === undefined ? true : /^[\s\xa0]*$/.test(s);
}

//This is a route to protect
exports.values = function(req, res) {
    return res.json(200, ['value1', 'value2']);
};

//This is another route to protect
exports.profile = function(req, res) {
    res.json({ username: req.user[req.user.provider].name, email: req.user[req.user.provider].email });
};

exports.contents = {
    getAll: function (req, res) {
        var userId = 'Jacques' || req.query.user || req.user.id;
        contentService.getAll(userId, function (error, files) {
            if (error) return res.json(500, 'Internal Server Error');
            if (files === null) files = {};
            return res.json(200, files);
        });
    },
    getById: function (req, res) {
        contentService.getById(req.params.id, function (error, file) {
            if (error) return res.json(500, 'Internal Server Error');
            if (file == null) return res.json(404, 'Not Found');
            return res.json(200, file);
        });
    },
    put: function (req, res) {
        if (isEmpty(req.body.name)) return res.json(400, 'Bad Request');
        req.body.user = 'Jacques';
        contentService.put(req.params.id, req.body, function (error, file) {
            if (error) return res.json(500, 'Internal Server Error');
            if (file == null) return res.json(404, 'Not Found');
            return res.json(204, 'No Content');
        });
    },
    post: function (req, res) {
        if (isEmpty(req.body.name)) return res.json(400, 'Bad Request');
        req.body.user = 'Jacques';
        contentService.post(req.body.name, req.body, function (error, file) {
            if (error) return res.json(500, 'Internal Server Error');
            if (file == null) return res.json(409, 'Conflict');
            res.location('/api/v1/files/' + file._id);
            return res.json(201, file);
        });
    },
    delete: function (req, res) {
        contentService.del(req.params.id, function (error, file) {
            if (error) return res.json(500, 'Internal Server Error');
            if (file == null) return res.json(404, 'Not Found');
            return res.json(204, 'No Content');
        });
    }
}


