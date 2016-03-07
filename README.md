#cherrypie.js
[![NPM](https://nodei.co/npm/cherrypie.js.png)](https://npmjs.org/package/cherrypie.js)
[![Build Status](https://travis-ci.org/herom/cherrypie.js.svg?branch=master)](https://travis-ci.org/herom/cherrypie.js)
[![Coverage Status](https://coveralls.io/repos/github/herom/cherrypie.js/badge.svg?branch=master)](https://coveralls.io/github/herom/cherrypie.js?branch=master)

**cherrypie.js** is a **dead simple, yet powerful JSON-to-rich-model converter** which helps you to convert your incoming JSON
object into a more convenient model object and vice versa with the help of a so called *model-description*.

With **cherrypie.js** you're able to get the primitive "namespaced" object values as well as "computed" properties which
depend on a number of values from the received JSON, as well as reduce/desolate the "rich" model
object back to the object which is expected at the backend.

##JSON-to-Rich-Model Examples

###Parse values from JSON

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


###Parse computed values from JSON

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

###Parse computed values from JSON with minimal model description

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

###Parse properties using child model-descriptions from JSON

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


##Rich-Model-to-JSON Examples
###Reduce a "rich" model

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

##Contribute
If you want to contribute, feel free to raise an issue or open a pull request - I'm glad
if my idea fits your needs ;)
