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
          __serializables: ['status']
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
          __namespace: 'system.env',
          status: 'status',
          __serializable: ['status']
        },
        model;

    model = Molder.populate(modelDescription, response);

    model.should.have.property('status', 'clean');
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
          __namespace: 'session.user',
          name: 'name',
          favCar: 'favourites.car',
          __serializable: ['name', 'favCar']
        },
        model;

    model = Molder.populate(description, origin);

    model.should.have.property('favCar', 'Batmobil');
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
          __namespace: 'session.user',
          nickname: 'nickname',
          statusPhrase: function (origin, namespaceExtractor) {
            var status = namespaceExtractor(origin, 'mood.currentStatus'),
                person = this.nickname;

            return person + ' is ' + status;
          },
          __serializable: ['nickname']
        },
        model;

    model = Molder.populate(description, origin);

    model.should.have.property('statusPhrase', 'Batman is happy');
  });

  it("Should reduce/desolate the model according to the serializable Array in the model-description", function () {
    var model = {
          name: 'Bruce Wayne',
          firstName: 'Bruce',
          lastName: 'Wayne'
        },
        modelDescription = {
          __namespace: 'session.user',
          firstName: 'firstName',
          lastName: 'lastName',
          __serializable: ['firstName', 'lastName']
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
          __namespace: 'session.user',
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
            return 'Hello ' + user + '! This is ' + this.name + '.';
          }
        },
        modelDescription = {
          __namespace: 'session.user',
          firstName: 'firstName',
          lastName: 'lastName',
          greet: function (user) {
            return 'Hello ' + user + '! This is ' + this.name + '.';
          }
        },
        reducedModel;

    reducedModel = Molder.desolate(modelDescription, model);

    reducedModel.should.not.have.property('greet');
  });

  it("Should return null if the given 'namespace' is not present in the returned JSON", function () {
    var origin = {
          name: 'Bruce Wayne',
          nickname: 'Batman'
        },

        description = {
          __namespace: 'session.user',
          name: 'name',
          nickname: 'nickname'
        },
        model;

    model = Molder.populate(description, origin);

    should(model).eql(null);
  });

  it("Should return null if the model-description has the wrong namespace configured", function () {

    var origin = {
          session: {
            user: {
              name: 'Bruce Wayne',
              nickname: 'Batman'
            }
          }
        },

        description = {
          __namespace: 'session.customer',
          name: 'name',
          favCar: 'favourites.car',
          __serializable: ['name', 'favCar']
        },
        model;

    model = Molder.populate(description, origin);

    should(model).eql(null);
  });

  it("Should populate model-descriptions in computed properties", function () {
    var origin = {
          session: {
            user: {
              comments: [
                {
                  commentId: 'a01',
                  commentText: 'some comment'
                },
                {
                  commentId: 'b02',
                  commentText: 'another comment'
                }
              ]
            }
          }
        },
        description = {
          __namespace: 'session.user',

          comments: function (preparedOrigin, namespaceExtractor, populate) {
            var comments = preparedOrigin.comments,
                commentDescripton = {
                  id: 'commentId',
                  text: 'commentText'
                },
                preparedComments = null;

            if (comments) {
              preparedComments = [];
              comments.forEach(function (comment) {
                preparedComments.push(populate(commentDescripton, comment));
              });
            }


            return preparedComments;
          }
        },

        expectedModel = {
          comments: [
            {
              id: 'a01',
              text: 'some comment'
            },
            {
              id: 'b02',
              text: 'another comment'
            }
          ]
        },

        model;

    model = Molder.populate(description, origin);

    should(model).eql(expectedModel);
  });


  it("Should proceed even if the model-description with computed properties has the wrong namespace configured", function () {
    var origin = {
          any: {
            evil: {
              person: 'Jason'
            }
          }
        },
        description = {
          __namespace: 'session.user',

          comments: function (preparedOrigin, namespaceExtractor, populate) {
            var comments = preparedOrigin.comments,
                commentDescripton = {
                  id: 'commentId',
                  text: 'commentText'
                },
                preparedComments = null;

            if (comments) {
              preparedComments = [];
              comments.forEach(function (comment) {
                preparedComments.push(populate(commentDescripton, comment));
              });
            }

            return preparedComments;
          }
        },

        expectedModel = {
          comments: null
        },

        model;

    model = Molder.populate(description, origin);

    should(model).eql(expectedModel);
  });

  it("Should not get the namespace if the model-description has a wrong namespace configured", function () {
    var origin = {
      any: {
        evil: {
          person: 'Jason'
        }
      }
    }, res;

    res = Molder._extractNamespace(origin, 'session.user');

    should(res).eql(null);
  });

  it("Should return the right child properties using a child model-description", function () {
    var origin = {
          "session": {
            "user": {
              "name": "Bruce Wayne",
              "nick": "Batman",
              "hobbyList": [
                {
                  id: 1,
                  activity: 'Hiking'
                },
                {
                  id: 2,
                  activity: 'Biking'
                }
              ]
            }
          }
        },
        modelDescription = {
          __namespace: 'session.user',
          name: 'name',
          nick: 'nick',
          hobbies: 'hobbyList',
          __children: {
            hobbies: {
              id: 'id',
              description: 'activity'
            }
          },
          __serializable: ['name', 'nick']
        },
        expectedModel = {
          name: "Bruce Wayne",
          nick: "Batman",
          hobbies: [
            {id: 1, description: "Hiking"},
            {id: 2, description: "Biking"}
          ]
        },
        model;

    model = Molder.populate(modelDescription, origin);

    should(model).eql(expectedModel);
  });

  it("Should populate all child properties in child properties", function () {
    var origin = {
          "artist": {
            "name": "Iron Maiden",
            "albumList": [
              {
                "title": "Iron Maiden",
                "year": 1980,
                "tracks": [
                  {
                    "number": 1,
                    "title": "Prowler"
                  },
                  {
                    "number": 2,
                    "title": "Remember Tomorrow"
                  },
                  {
                    "number": 3,
                    "title": "Running Free"
                  }
                ]
              },
              {
                "title": "Killers",
                "year": 1981,
                "tracks": [
                  {
                    "number": 1,
                    "title": "The Ides of March"
                  },
                  {
                    "number": 2,
                    "title": "Wrathchild"
                  },
                  {
                    "number": 3,
                    "title": "Murders in the Rue Morgue"
                  }
                ]
              }
            ]
          }
        },
        modelDescription = {
          __namespace: "artist",
          name: "name",
          albums: "albumList",
          __children: {
            albums: {
              title: "title",
              year: "year",
              tracks: "tracks",
              __children: {
                tracks: {
                  number: "number",
                  title: "title"
                }
              }
            }
          },
          __serializable: ['name', 'nick']
        },
        expectedModel = {
          name: "Iron Maiden",
          albums: [
            {
              title: "Iron Maiden",
              year: 1980,
              tracks: [
                {number: 1, title: "Prowler"},
                {number: 2, title: "Remember Tomorrow"},
                {number: 3, title: "Running Free"}
              ]
            },
            {
              title: "Killers",
              year: 1981,
              tracks: [
                {number: 1, title: "The Ides of March"},
                {number: 2, title: "Wrathchild"},
                {number: 3, title: "Murders in the Rue Morgue"}
              ]
            }

          ]
        },
        model;

    model = Molder.populate(modelDescription, origin);

    should(model).eql(expectedModel);
  });


  it("Should child properties using a child model-description with a namespace", function () {
    var origin = {
          "session": {
            "user": {
              "name": "Bruce Wayne",
              "nick": "Batman",
              "hobbyList": [
                {
                  "outdoor": {
                    "sports": {
                      id: 1,
                      activity: 'Hiking'
                    }
                  }
                },
                {
                  "outdoor": {
                    "sports": {
                      id: 2,
                      activity: 'Biking'
                    }
                  }
                }
              ]
            }
          }
        },
        modelDescription = {
          __namespace: 'session.user',
          name: 'name',
          nick: 'nick',
          hobbies: 'hobbyList',
          __children: {
            hobbies: {
              __namespace: "outdoor.sports",
              id: 'id',
              description: 'activity'
            }
          },
          __serializable: ['name', 'nick']
        },
        expectedModel = {
          name: "Bruce Wayne",
          nick: "Batman",
          hobbies: [
            {id: 1, description: "Hiking"},
            {id: 2, description: "Biking"}
          ]
        },
        model;

    model = Molder.populate(modelDescription, origin);

    should(model).eql(expectedModel);
  });

});