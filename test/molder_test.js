var should = require('should'),
    Molder = require('../molder/molder');

describe("Molder", function () {
  describe("#populate()", function () {
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

    it("Should populate properties with a namespace and a global defined namespace ", function () {
      var origin = {
            session: {
              state: "Active",
              detail: {
                actions: [
                  {id: 1, name: "login"},
                  {id: 2, name: "update"}
                ]
              }
            }
          },
          modelDescription = {
            __namespace: 'session',
            state: 'state',
            actions: 'detail.actions'
          },
          expectedModel = {
            state: "Active",
            actions: [
              {id: 1, name: "login"},
              {id: 2, name: "update"}
            ]
          },
          model;

      model = Molder.populate(modelDescription, origin);

      should(model).eql(expectedModel);
    });

    it("Should populate child properties with a namespace and a a global defined namespace ", function () {
      var origin = {
            session: {
              state: "Active",
              detail: {
                actions: [
                  {id: 1, name: "login"},
                  {id: 2, name: "update"}
                ]
              }
            }
          },
          modelDescription = {
            __namespace: 'session',
            state: 'state',
            actions: 'detail.actions',
            __children: {
              actions: {
                id: 'id',
                action: 'name'
              }
            }
          },
          expectedModel = {
            state: "Active",
            actions: [
              {id: 1, action: "login"},
              {id: 2, action: "update"}
            ]
          },
          model;

      model = Molder.populate(modelDescription, origin);

      should(model).eql(expectedModel);
    });

    it("Schould populate a child properties which are objects and not arrays", function () {
      var origin = {
            session: {
              state: "Active",
              detail: {
                action: {
                  id: 1,
                  name: "login"
                }
              }
            }
          },
          modelDescription = {
            __namespace: 'session',
            state: 'state',
            action: 'detail.action',
            __children: {
              action: {
                id: 'id',
                action: 'name'
              }
            }
          },
          expectedModel = {
            state: "Active",
            action: {
              id: 1,
              action: "login"
            }
          },
          model;

      model = Molder.populate(modelDescription, origin);

      should(model).eql(expectedModel);
    });
  });

  describe("#_generateNamespacedContainer()", function () {
    it("Should return a namespaced container object if a namespace is given", function () {
      var namespace = 'batman.batcave.batcar',
          expected = {
            batman: {
              batcave: {
                batcar: {

                }
              }
            }
          },
          result;

      result = Molder._generateNamespacedContainer(namespace);

      should(result).eql(expected);
    });

    it("Should work with a one-dimensional namespace", function () {
      var namespace = 'batman',
          expected = {
            batman: {}
          },
          result;

      result = Molder._generateNamespacedContainer(namespace);

      should(result).eql(expected);
    });
  });

  describe("#_serialize()", function () {
    it("Should serialize the given properties", function () {
      var modelDescription = {
            id: 'serverId',
            text: 'serverText'
          },
          model = {
            id: 'a0123',
            text: 'An incredible sensation!'
          },
          expected = {
            serverId: 'a0123',
            serverText: 'An incredible sensation!'
          },
          serializedProperties = ['id', 'text'],
          result;

      result = Molder._serialize(modelDescription, model, serializedProperties);

      should(result).eql(expected);
    });

    it("Should serialize the given array", function () {
      var modelDescription = {
            id: 'serverId',
            text: 'serverText'
          },
          model = [
            {id: 'a1', text: 'Killed'},
            {id: 'b2', text: 'By'},
            {id: 'c3', text: 'Death'}
          ],
          expected = [
            {serverId: 'a1', serverText: 'Killed'},
            {serverId: 'b2', serverText: 'By'},
            {serverId: 'c3', serverText: 'Death'}
          ],
          serializedProperties = ['id', 'text'],
          result;

      result = Molder._serialize(modelDescription, model, serializedProperties);

      should(result).eql(expected);
    });

    it("Should serialize the given array in respect of the given serialized properties", function () {
      var modelDescription = {
            id: 'serverId',
            text: 'serverText'
          },
          model = [
            {id: 'a1', text: 'Killed'},
            {id: 'b2', text: 'By'},
            {id: 'c3', text: 'Death'}
          ],
          expected = [
            {serverText: 'Killed'},
            {serverText: 'By'},
            {serverText: 'Death'}
          ],
          serializedProperties = ['text'],
          result;

      result = Molder._serialize(modelDescription, model, serializedProperties);

      should(result).eql(expected);
    });
  });

  describe("#desolate()", function () {
    it("Should desolate a simple model", function () {
      var modelDescription = {
            __namespace: 'awesome',
            id: 'serverId',
            text: 'serverText',
            __serializable: ['id', 'text']
          },
          model = {
            id: 'a0123',
            text: 'An incredible sensation!'
          },
          expected = {
            awesome: {
              serverId: 'a0123',
              serverText: 'An incredible sensation!'
            }
          },
          result;

      result = Molder.desolate(modelDescription, model);

      should(result).eql(expected);
    });

    it("Should desolate a model with a child-model object", function () {
      var modelDescription = {
            __namespace: 'awesome',
            id: 'serverId',
            text: 'serverText',
            author: 'serverAuthor',
            __children: {
              author: {
                id: 'authorId',
                name: 'authorName',
                __serializable: ['id', 'name']
              }
            },
            __serializable: ['id', 'text', 'author']
          },
          model = {
            id: 'a0123',
            text: 'An incredible sensation!',
            author: {
              id: 'asdf1234',
              name: 'Roger Penrose'
            }
          },
          expected = {
            awesome: {
              serverId: 'a0123',
              serverText: 'An incredible sensation!',
              serverAuthor: {
                authorId: 'asdf1234',
                authorName: 'Roger Penrose'
              }
            }
          },
          result;

      result = Molder.desolate(modelDescription, model);

      should(result).eql(expected);
    });

    it("Should desolate a model with a child-model array", function () {
      var modelDescription = {
            __namespace: 'book',
            id: 'bookId',
            title: 'bookTitle',
            subTitle: 'bookSubTitle',
            authors: 'bookAuthors',
            __children: {
              authors: {
                id: 'authorId',
                name: 'authorName',
                __serializable: ['id', 'name']
              }
            },
            __serializable: ['id', 'title', 'subTitle', 'authors']
          },
          model = {
            id: 'a0123',
            title: 'Design Patterns',
            subTitle: 'Elements of Reusable Object-Oriented Software',
            authors: [
              {id: 'asdf1234', name: 'Erich Gamma'},
              {id: 'asdf1235', name: 'Richard Helm'},
              {id: 'asdf1236', name: 'Ralph Johnson'},
              {id: 'asdf1237', name: 'John Vlissides'}
            ]
          },
          expected = {
            book: {
              bookId: 'a0123',
              bookTitle: 'Design Patterns',
              bookSubTitle: 'Elements of Reusable Object-Oriented Software',
              bookAuthors: [
                {authorId: 'asdf1234', authorName: 'Erich Gamma'},
                {authorId: 'asdf1235', authorName: 'Richard Helm'},
                {authorId: 'asdf1236', authorName: 'Ralph Johnson'},
                {authorId: 'asdf1237', authorName: 'John Vlissides'}
              ]
            }
          },
          result;

      result = Molder.desolate(modelDescription, model);

      should(result).eql(expected);
    });

    it("Should desolate a model and ignore child-models if they are not defined in the __serializable array", function () {
      var modelDescription = {
            __namespace: 'book',
            id: 'bookId',
            title: 'bookTitle',
            subTitle: 'bookSubTitle',
            authors: 'bookAuthors',
            __children: {
              authors: {
                id: 'authorId',
                name: 'authorName',
                __serializable: ['id', 'name']
              }
            },
            __serializable: ['id', 'title', 'subTitle']
          },
          model = {
            id: 'a0123',
            title: 'Design Patterns',
            subTitle: 'Elements of Reusable Object-Oriented Software',
            authors: [
              {id: 'asdf1234', name: 'Erich Gamma'},
              {id: 'asdf1235', name: 'Richard Helm'},
              {id: 'asdf1236', name: 'Ralph Johnson'},
              {id: 'asdf1237', name: 'John Vlissides'}
            ]
          },
          expected = {
            book: {
              bookId: 'a0123',
              bookTitle: 'Design Patterns',
              bookSubTitle: 'Elements of Reusable Object-Oriented Software'
            }
          },
          result;

      result = Molder.desolate(modelDescription, model);

      should(result).eql(expected);
    });
  });
});