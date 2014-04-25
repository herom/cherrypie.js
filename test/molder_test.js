var should = require('should'),
    Molder = require('../molder/molder');

describe("Molder", function () {
  it("Should return the namespace-reduced origin", function () {
    var origin = {
          session: {
            user: {
              activities: {
                running: 'hooray'
              }
            }
          }
        },
        namespace = 'session.user.activities',
        result;

    result = Molder._extractNamespace(origin, namespace);

    result.should.have.property('running', 'hooray');
  });

  it("Should return 'primitive' properties from String values", function () {
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

    parsedResult = Molder.populate(modelDescription, response);

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

    parsedResult = Molder.populate(modelDescription, response);

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

    parsedResult = Molder.populate(description, origin);

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

    parsedResult = Molder.populate(description, origin);

    parsedResult.should.have.property('statusPhrase', 'Batman is happy');
  });

  it("Should reduce/desolate the model according to the serializable Array in the model-description", function () {
    var model = {
          name: 'Bruce Wayne',
          firstName: 'Bruce',
          lastName: 'Wayne'
        },
        modelDescription = {
          namespace: 'session.user',
          firstName: 'firstName',
          lastName: 'lastName',
          serializable: ['firstName', 'lastName']
        },
        reducedModel;

    reducedModel = Molder.desolate(modelDescription, model);

    reducedModel.should.not.have.property('name');
  });

  it("Should reduce/desolate the model even without a serializable Array in the model-description", function () {
    var model = {
          name: 'Bruce Wayne',
          firstName: 'Bruce',
          lastName: 'Wayne'
        },
        modelDescription = {
          namespace: 'session.user',
          firstName: 'firstName',
          lastName: 'lastName'
        },
        reducedModel;

    reducedModel = Molder.desolate(modelDescription, model);

    reducedModel.should.not.have.property('namespace');
  });

  it("Should not reduce/desolate functions", function () {
    var model = {
          name: 'Bruce Wayne',
          firstName: 'Bruce',
          lastName: 'Wayne',
          greet: function (user) {
            return 'Hello ' + user + '! This is ' + name + '.';
          }
        },
        modelDescription = {
          namespace: 'session.user',
          firstName: 'firstName',
          lastName: 'lastName',
          greet: function (user) {
            return 'Hello ' + user + '! This is ' + name + '.';
          }
        },
        reducedModel;

    reducedModel = Molder.desolate(modelDescription, model);

    reducedModel.should.not.have.property('greet');
  });

  it("Should proceed even if the given 'namespace' is not present in the returned JSON", function () {
    var origin = {
              name: 'Bruce Wayne',
              nickname: 'Batman'
        },

        description = {
          namespace: 'session.user',
          name: 'name',
          nickname: 'nickname'
        },
        model;

    model = Molder.populate(description, origin);

    model.should.have.property('name');
  });

  it("Should proceed even if the model-description has the wrong namespace configured", function () {

      var origin = {
            session: {
              user: {
                name: 'Bruce Wayne',
                nickname: 'Batman'
              }
            }
          },

          description = {
            namespace: 'session.customer',
            name: 'name',
            favCar: 'favourites.car',
            serializable: ['name', 'favCar']
          },
          model;

      model = Molder.populate(description, origin);

      model.should.have.property('name', undefined);
      model.should.have.property('favCar', {});
  });
});