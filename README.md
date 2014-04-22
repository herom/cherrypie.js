#JSON-Molder
JSON-Molder is just another model populating model-factory which converts your incoming JSON
object into a simpler model object with the help of a so called model description. With JSON-Molder
you're able to get the primitive "namespaced" object values as well as "computed" properties which
depend on a number of values from the received JSON as well as reduce/desolate the "rich" model
object back to the object which is expected at the backend.

##Examples

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
  namespace: 'session.user',
  name: 'name',
  nick: 'nick',
  serializable: ['name', 'nick']
}
```

Populated Model:
```
{
  name: 'Bruce Wayne',
  nick: 'Batman',
  serializable: ['name', 'nick']
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
      "nick": "Batman"
    }
  }
}
```

Model Description:
```
{
  namespace: 'session.user',
  firstName: 'firstName',
  lastName: 'lastName',
  name: function () {
    return this.firstName + ' ' + this.lastName;
  },
  nick: 'nick',
  serializable: ['firstName', 'lastName', 'nick']
}
```

Populated Model:
```
{
  firstName: 'Bruce',
  lastName: 'Wayne',
  name: 'Bruce Wayne',
  nick: 'Batman',
  serializable: ['firstName', 'lastName', 'nick']
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
  serializable: ['firstName', 'lastName', 'nick']
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


If you want to contribute, feel free to raise an issue or open a pull request - I'm glad
if my idea fits your needs ;)
