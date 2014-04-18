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

    it("Should return the right properties using the namespace", function () {
        var response = {
                system: {
                    env: {
                        status: 'clean'
                    },
                    dummy: []
                }
            },
            modelDescription = {
                namespace: 'system.env',
                status: 'status',
                serializable: ['status']
            },
            parsedResult;

        parsedResult = ModelFactory.populate(modelDescription, response);

        parsedResult.should.have.property('status', 'clean');
    });

    it("Should return the right properties using a namespace and hierarchical key", function () {
        var origin = {
                session: {
                    user: {
                        name: 'Bruce Wayne',
                        nickname: 'Batman',
                        pet: 'Bat-Cat',
                        favourites: {
                            food: 'T-Bone Steak',
                            car: 'Batmobil'
                        },
                        mood: {
                            currentStatus: 'angry'
                        }
                    }
                }
            },

            description = {
                namespace: 'session.user',
                name: 'name',
                favCar: 'favourites.car',
                serializable: ['name', 'favCar']
            },
            parsedResult;

        parsedResult = ModelFactory.populate(description, origin);

        parsedResult.should.have.property('favCar', 'Batmobil');
    });


    it("Should return the computed properties", function () {
        var origin = {
                session: {
                    user: {
                        name: 'Bruce Wayne',
                        nickname: 'Batman',
                        pet: 'Bat-Cat',
                        favourites: {
                            food: 'T-Bone Steak',
                            car: 'Batmobil'
                        },
                        mood: {
                            currentStatus: 'happy'
                        }
                    }
                }
            },

            description = {
                namespace: 'session.user',
                nickname: 'nickname',
                statusPhrase: function (origin, namespaceExtractor) {
                    var status = namespaceExtractor(origin, 'mood.currentStatus'),
                        person = this.nickname;

                    return person + ' is ' + status;
                },
                serializable: ['nickname']
            },
            parsedResult;

        parsedResult = ModelFactory.populate(description, origin);

        parsedResult.should.have.property('statusPhrase', 'Batman is happy');
    });
});