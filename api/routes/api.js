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
    res.json({ username: req.user.name, email: req.user.email });
};

exports.contents = {
    getAll: function (req, res) {
        contentService.getAll(function (error, contents) {
            if (error) return res.json(500, 'Internal Server Error');
            if (contents === null) contents = {};
            return res.json(200, contents);
        });
    },
    getById: function (req, res) {
        contentService.getById(req.params.id, function (error, content) {
            if (error) return res.json(500, 'Internal Server Error');
            if (content == null) return res.json(404, 'Not Found');
            return res.json(200, content);
        });
    },
    put: function (req, res) {
        if (isEmpty(req.body.name)) return res.json(400, 'Bad Request');
        req.body.user_id = req.user.id;
        contentService.put(req.params.id, req.body, function (error, content) {
            if (error) return res.json(500, 'Internal Server Error');
            if (content == null) return res.json(404, 'Not Found');
            return res.json(204, 'No Content');
        });
    },
    post: function (req, res) {
        if (isEmpty(req.body.name)) return res.json(400, 'Bad Request');
        req.body.user_id = req.user.id;
        contentService.post(req.body.name, req.body, function (error, content) {
            if (error) return res.json(500, 'Internal Server Error');
            if (content == null) return res.json(409, 'Conflict');
            res.location('/api/contents/' + content._id);
            return res.json(201, content);
        });
    },
    delete: function (req, res) {
        contentService.del(req.params.id, function (error, content) {
            if (error) return res.json(500, 'Internal Server Error');
            if (content == null) return res.json(404, 'Not Found');
            return res.json(204, 'No Content');
        });
    }
}


