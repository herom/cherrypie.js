#cherrypie.js
[![NPM](https://nodei.co/npm/cherrypie.js.png)](https://npmjs.org/package/cherrypie.js)
[![Build Status](https://travis-ci.org/herom/cherrypie.js.svg?branch=master)](https://travis-ci.org/herom/cherrypie.js)
[![Coverage Status](https://coveralls.io/repos/github/herom/cherrypie.js/badge.svg?branch=master)](https://coveralls.io/github/herom/cherrypie.js?branch=master)

**cherrypie.js** is a **dead simple, yet powerful JSON-to-rich-model converter** which helps you to convert your incoming JSON
object into a more convenient model object and vice versa with the help of a so called *model-description*.

With **cherrypie.js** you're able to get the primitive "namespaced" object values as well as "computed" properties which
depend on a number of values from the received JSON, as well as reduce/desolate the "rich" model
object back to the object which is expected at the backend.

There are a few "switches" and "directives" which are unique to each `modelDescription` and can be used to instruct cherrypie
how to process the incoming JSON object. All model descriptions are nestable (as each model description could have a infinite
number of nested `__children`).

|Directive|Type|Description|
|---------|----|-----------|
|__namespace|`String`| The "namespace" of the incoming JSON (if the values you want are "nested") - __namespace can be nested|
|__children|`Object`| An object which holds at least one child model description - __children can be nested|
|__inject :sparkles:|`Object`| An object of properties which should be injected "as is" during model population|
|__serializable|`[String]`| The list of serializable properties when `model.serialize` is called|
|__transferKeys|`Boolean`| Tell `cherrypie.js` to only process the described properties and take others "as is"|
|__ignoredKeys|`[String]`| Use this directive in conjunction with `__transferKeys` so that you don't have to declare and endless amount of properties only to have 1 or 2 properties skipped|


## JSON-to-Rich-Model Examples

### Simple usage
Received JSON (to "parse")
```
{
  "name": "Bruce Wayne",
  "nick": "Batman"
}
```

Model Description ("parse" information)
```
{
  pseudonym: 'name',
  superheroName: 'nickname'
}
```

Populated Model ("parsed")
```
{
  pseudonym: 'Bruce Wayne',
  superheroName: 'Batman'
}
```

### Inject Properties during "population" time
Received JSON (to "parse")
```
{
  "name": "Bruce Wayne",
  "nick": "Batman"
}
```

Injections (properties which should get added to the populated object - no need to touch the populated model anymore)
```
var injectedFriends = ['Alfred'];
```

Model Description ("parse" information)
```
{
  pseudonym: 'name',
  superheroName: 'nickname',
  __inject: {
    friends: injectedFriends
  }
}
```

Populated Model ("parsed")
```
{
  pseudonym: 'Bruce Wayne',
  superheroName: 'Batman',
  friends: ['Alfred']
}
```

### Parse values from JSON

Received JSON:
```
{
  "session": {
    "user": {
      "name": "Bruce Wayne",
      "nick": "Batman"
    }
  }
}
```

Model Description:
```
{
  __namespace: 'session.user',
  name: 'name',
  nick: 'nick',
  __serializable: ['name', 'nick']
}
```

Populated Model:
```
{
  name: 'Bruce Wayne',
  nick: 'Batman',
  __serializable: ['name', 'nick']
}
```


### Parse computed values from JSON

Received JSON:
```
{
  "session": {
    "user": {
      "firstName": "Bruce",
      "lastName": "Wayne",
      "nick": "Batman",
      "comments": [
        {
          commentId: 'c01',
          commentText: 'some text'
        },
        {
          commentId: 'c02',
          commentText: 'another text'
        }
      ]
    }
  }
}
```

Model Description:
```
{
  __namespace: 'session.user',
  firstName: 'firstName',
  lastName: 'lastName',
  name: function () {
    return this.firstName + ' ' + this.lastName;
  },
  comments: function (preparedOrigin, namespaceExtractor, populate) {
    var comments = preparedOrigin.comment,
        commentDescription = {
          id: 'commentId',
          text: 'commentText'
        },
        preparedComments = [];

        if(comments && comment.length > 0) {
          comments.forEach(function (comment) {
            preparedComments.push(populate(commentDescription, comment);
          });
        }

        return preparedComments;
  }
  nick: 'nick',
  __serializable: ['firstName', 'lastName', 'nick']
}
```

Populated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  name: 'Bruce Wayne',
  nick: 'Batman',
  comments: [
    {
      id: 'c01',
      text: 'some text'
    },
    {
      id: 'c02',
      text: 'another text'
    }
  ]
  __serializable: ['firstName', 'lastName', 'nick']
}
```

### Parse computed values from JSON with minimal model description

Received JSON:
```
{
  "session": {
    "user": {
      "firstName": "Bruce",
      "lastName": "Wayne",
      "nick": "Batman"
    }
  }
}
```

Model Description:
```
{
  firstName: 'firstName',
  lastName: 'lastName',
  name: function () {
    return this.firstName + ' ' + this.lastName;
  },
  nick: 'nick',
}
```

Populated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  name: 'Bruce Wayne',
  nick: 'Batman'
}
```

### Parse properties using child model-descriptions from JSON

Received JSON:
```
{
  "session": {
    "user": {
      "firstName": "Bruce",
      "lastName": "Wayne",
      "nick": "Batman",
      "userComments": [
        {
          commentId: 'c01',
          commentText: 'some text'
        },
        {
          commentId: 'c02',
          commentText: 'another text'
        }
      ]
    }
  }
}
```

Model Description:
```
// be aware that the `__children` property names must match the "new" property names of the model
// and not the one of the original JSON!
{
  __namespace: 'session.user',
  firstName: 'firstName',
  lastName: 'lastName',
  name: function () {
    return this.firstName + ' ' + this.lastName;
  },
  comments: 'userComments',
  __children: {
    comments: {
      id: 'commentId',
      text: 'commentText'
    }
  },
  nick: 'nick',
  __serializable: ['firstName', 'lastName', 'nick']
}
```

Populated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  name: 'Bruce Wayne',
  nick: 'Batman',
  comments: [
    {
      id: 'c01',
      text: 'some text'
    },
    {
      id: 'c02',
      text: 'another text'
    }
  ]
  __serializable: ['firstName', 'lastName', 'nick']
}
```

### Parse and process only the described properties and take the others "as is"

Make use of the `__transferKeys` switch in order to tell `cherrypie.js` to process the descriptions
given by the `modelDescription` and transfer the keys which are not explicitly described "as is" from
the origin object.

Received JSON:
```
{
  "session": {
    "user": {
      "firstName": "Bruce",
      "lastName": "Wayne",
      "nick": "Batman",
      "userComments": [
        {
          commentId: 'c01',
          commentText: 'some text'
        },
        {
          commentId: 'c02',
          commentText: 'another text'
        }
      ]
    }
  }
}
```

Model Description:
```
{
  __namespace: 'session.user',
  __transferKeys: true,
  fullName: function (preparedOrigin) {
    return preparedOrigin.firstName + ' ' + preparedOrigin.lastName;
  },
  comments: 'userComments',
  __children: {
    comments: {
      __transferKeys,
      id: 'commentId'
    }
  }
}
```

Populated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  fullName: 'Bruce Wayne',
  nick: 'Batman',
  comments: [
    {
      id: 'c01',
      commentText: 'some text'
    },
    {
      id: 'c02',
      commentText: 'another text'
    }
  ]
}
```


## Rich-Model-to-JSON Examples
### Reduce a "rich" model

Model Description:
```
{
  firstName: 'firstName',
  lastName: 'lastName',
  name: function () {
    return this.firstName + ' ' + this.lastName;
  },
  nick: 'nick',
  __serializable: ['firstName', 'lastName', 'nick']
}
```

Reduced/desolated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  nick: 'Batman'
}
```

## Contribute
If you want to contribute, feel free to raise an issue or open a pull request - I'm glad
if my idea fits your needs ;)
