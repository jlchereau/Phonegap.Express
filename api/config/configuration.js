var nconf = require('nconf'),
    path = require('path');

function Config(){
    nconf.argv().env('_');
    var environment = nconf.get('NODE:ENV') || 'development';
    console.log('Phonegap.Express: environment is ' + environment);
    nconf.file(environment, path.join(__dirname, '../../config/' + environment + '.json'));
    nconf.file('default', path.join(__dirname, '../../config/default.json'));
}

Config.prototype.get = function(key) {
    return nconf.get(key);
};

module.exports = new Config();
