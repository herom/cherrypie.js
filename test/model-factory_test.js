var should = require('should'),
    ModelFactory = require('../molder/model-factory');

describe("ModelFactory", function () {
    it("Should return the namespace-reduced origin", function () {
        var origin = {
                system: {
                    user: {
                        activities: {
                            running: 'hooray'
                        }
                    }
                }
            },
            namespace = 'system.user.activities',
            result;

        result = ModelFactory._extractNamespace(origin, namespace);

        result.should.have.property('running', 'hooray');
    });

    it("Should return the right properties from String keys", function () {
        var response = {
                system: {
                    env: {
                        status: 'clean'
                    },
                    dummy: []
                }
            },
            modelDescription = {
                status: 'system.env.status',
                serializable: ['status']
            },
            parsedResult;

        parsedResult = ModelFactory.populate(modelDescription, response);

        parsedResult.should.have.property('status', 'clean');
    });
});