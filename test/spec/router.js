/*global describe, beforeEach, afterEach, should, it, curl, sinon, Backbone*/
(function () {
    "use strict";
    describe('Router', function () {

        var sandbox;

        beforeEach(function () {
            // create a sandbox
            sandbox = sinon.sandbox.create();

            // stub fetch
            sandbox.stub(Backbone.Collection.prototype, "fetch");

            // mute console
            sandbox.stub(console, "info");
        });

        afterEach(function () {
            // restore the environment as it was before
            sandbox.restore();
        });

        describe('instance', function () {
            it('should have 6 routes', function (done) {
                curl(['helper/logger'], function (Logger) {
                    sandbox.stub(Logger, "startApp");
                    curl(['router'], function (appRouter) {
                        appRouter.routes.should.have.keys(['', 'open', 'noconnection', 'book/:hash', 'book/:hash/:chapter', 'book/:hash/:idref/:cfi']);
                        done();
                    });
                });
            });
        });
    });
}());