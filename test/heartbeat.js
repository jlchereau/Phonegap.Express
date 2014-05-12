/**
 * Created by jlchereau on 02/05/2014.
 */
var app = require('../server'),
    request = require('supertest');

describe('heartbeat', function(){
    describe('when requesting resource /heartbeat', function(){
        it('should respond with 200', function(done){
            request(app)
                .get('/heartbeat')
                .expect(200, done);
        });
    });

    describe('when requesting resource /missing', function(){
        it('should respond with 404', function(done){
            request(app)
                .get('/missing')
                .expect(404, done);
        })
    });
});