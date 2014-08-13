/**
 * Use cherrypie.js to populate models from an (JSON) origin and desolate rich models in an intuitive way.
 *
 * @class Cherrypie
 * @module cherrypie.js
 * @static
 */
var Cherrypie = {
  /**
   * Takes the given model description along with the origin (JSON) object
   * and returns the populated model.
   *
   * @method populate
   * @param {ModelDescription|Object}     modelDescription        The particular model description object.
   * @param {JSON|Object}                 origin                  The particular JSON origin.
   * @returns {Object}
   */
  populate: function (modelDescription, origin) {
    var keys = Object.keys(modelDescription),
        preparedOrigin = {},
        computedProperties = [],
        childDescriptions = {},
        model = {};

    if (modelDescription.hasOwnProperty('__namespace')) {
      preparedOrigin = this.extractNamespace(origin, modelDescription.__namespace);
      keys.splice(keys.indexOf('__namespace'), 1);
    } else {
      preparedOrigin = origin;
    }

    if (modelDescription.hasOwnProperty('__serializable')) {
      keys.splice(keys.indexOf('__serializable'), 1);
    }

    if (modelDescription.hasOwnProperty('__children')) {
      childDescriptions = modelDescription.__children;
      keys.splice(keys.indexOf('__children'), 1);
    }

    this._checkForChildren(keys,  Object.keys(childDescriptions));

    keys.forEach(function (key) {
      var value = modelDescription[key],
          parsedValue;

      if (typeof value === 'function') {
        // keep computed properties to evaluate them after the ordinary properties have been evaluated.
        // the evaluated properties will be accessible within the property function.
        computedProperties.push(key);
      } else if (preparedOrigin) {
        if (preparedOrigin.hasOwnProperty(value)) {
          parsedValue = preparedOrigin[value];
        } else {
          parsedValue = this.extractNamespace(preparedOrigin, value);
        }

        if (childDescriptions.hasOwnProperty(key)) {
          var children = parsedValue,
              childDescription = childDescriptions[key],
              childModel;

          if (Array.isArray(children)) {
            parsedValue = [];
            children.forEach(function (child) {
              childModel = this.populate(childDescription, child);
              if (childModel) {
                parsedValue.push(childModel);
              }
            }.bind(this));

          } else if (typeof children === 'object') {
            childModel = this.populate(childDescription, children);
            if (childModel) {
              parsedValue = childModel;
            }
          }
        }

        model[key] = parsedValue;
      }
    }.bind(this));

    computedProperties.forEach(function (key) {
      if (preparedOrigin) {
        var fn = modelDescription[key];
        model[key] = fn.call(model, preparedOrigin, this);
      } else {
        model[key] = null;
      }
    }.bind(this));

    if (Object.keys(model).length <= 0) {
      model = null;
    }

    return model;
  },

  /**
   * Checks if all `childKeys` are present in the parent model-description keys
   * and throws an `Error` if not.
   *
   * @method _checkForChildren
   * @param modelDescriptionKeys
   * @param childKeys
   * @returns {Boolean} `true` if all child-keys are also present in the parent model-description.
   * @throws {Error} if not all child-keys are defined in the parent model-description.
   * @private
   */
  _checkForChildren: function (modelDescriptionKeys, childKeys) {
    return childKeys.every(function (key) {
      if(modelDescriptionKeys.indexOf(key) > -1) {
        return true;
      } else {
        throw new Error('Child ' + key + ' declared in __children but not in parent model description!');
      }
    });
  },

  /**
   * Takes the given origin (JSON/Object) and namespace and returns
   * the namespaced/reduced object.
   *
   * @param {Object}          origin              The JSON origin.
   * @param {String}          namespace           The model-description namespace.
   * @returns {Object}
   */
  extractNamespace: function (origin, namespace) {
    var namespacedOrigin = null;

    if (typeof namespace === 'string' && namespace.indexOf('.') > -1) {
      var splittedNamespace = namespace.split('.'),
          namespaceKey,
          iterator = 0;

      namespacedOrigin = origin;

      for (; iterator < splittedNamespace.length; iterator++) {
        namespaceKey = splittedNamespace[iterator];

        if (namespacedOrigin && namespacedOrigin[namespaceKey]) {
          namespacedOrigin = namespacedOrigin[namespaceKey];
        } else {
          break;
        }
      }

      if (iterator < splittedNamespace.length) {
        namespacedOrigin = null;
      }

    } else {
      namespacedOrigin = origin[namespace];
    }

    return namespacedOrigin;
  },

  /**
   * Reduces the given model object to contain only the properties declared
   * in the `modelDescription.serializable` Array so that it could be sent
   * to the backend without all the "junk".
   * <p>
   *     If the model-description lacks of the `serializable` property, all
   *     keys of the model-description will be serialized.
   *
   * @param {ModelDescription|Object}     modelDescription            The particular model description.
   * @param {Object}                      model                       The model to be desolated/reduced.
   * @returns {Object} The plain desolated/reduced model.
   */
  desolate: function (modelDescription, model) {
    var namespace = modelDescription.__namespace,
        serializableProperties = [],
        desolatedModel = null,
        childModels = null;

    if ('__serializable' in modelDescription) {
      serializableProperties = modelDescription.__serializable;
    } else {
      serializableProperties = Object.keys(modelDescription);

      var serializedClone = serializableProperties.slice();

      serializedClone.every(function (clone, index) {
        if (clone.match(/^__/)) {
          serializableProperties.splice(index, 1);
        }
      });
    }

    // check if any computed properties are defined to be serialized
    for(var i = 0; i < serializableProperties.length; i++) {
      if(typeof modelDescription[serializableProperties[i]] === 'function') {
        throw new Error(
            'cherrypiejs#desolate(): Unable to serialize a "computedProperty" found in the Array ' +
                'of serializable properties (namespace: '+ namespace +')!'
        );
      }
    }


    if ('__children' in modelDescription) {
      var childKeys = Object.keys(modelDescription.__children);
      childModels = {};

      childKeys.forEach(function (childKey) {
        if (serializableProperties.indexOf(childKey) > -1) {
          serializableProperties.splice(serializableProperties.indexOf(childKey), 1);
          childModels[childKey] = this.desolate(modelDescription.__children[childKey], model[childKey]);
        }
      }.bind(this));
    }

    desolatedModel = this._serialize(modelDescription, model, serializableProperties);

    if (desolatedModel && childModels) {
      for (var childModel in childModels) {
        if (childModels.hasOwnProperty(childModel)) {
          desolatedModel[modelDescription[childModel]] = childModels[childModel];
        }
      }
    }

    if (namespace) {
      desolatedModel = this._generateNamespacedContainer(namespace, desolatedModel);
    }

    return desolatedModel;
  },

  /**
   * Serializes the model according to the modelDescription and the serializable properties given.
   *
   * @method _serialize
   * @param {Object}          modelDescription          The description for this model.
   * @param {Object|Array}    model                     The model.
   * @param {Array}           serializableProperties    The array of serializable model properties.
   * @returns {Object|Array}
   * @private
   */
  _serialize: function (modelDescription, model, serializableProperties) {
    var serialized;

    if (Array.isArray(model) && model.length > 0) {
      var serializedObject = {};
      serialized = [];
      model.forEach(function (obj) {
        serializedObject = {};

        for (var prop in obj) {
          if (obj.hasOwnProperty(prop) && serializableProperties.indexOf(prop) > -1) {
            serializedObject[modelDescription[prop]] = obj[prop];
          }
        }

        serialized.push(serializedObject);
      });
    } else {
      var propertyIndex = -1;
      serialized = {};

      for (var prop in model) {
        propertyIndex = serializableProperties.indexOf(prop);

        if (propertyIndex > -1 && model.hasOwnProperty(prop)) {
          serialized[modelDescription[prop]] = model[prop];
          serializableProperties.splice(propertyIndex, 1);
        }
      }
    }

    return serialized;
  },

  /**
   * Returns a nested ("namespaced") Object/Container and places the optional given
   * values object at the deepest object level.
   *
   * @method _generateNamespacedContainer
   * @param {String}          namespace       The dot-separated (e.g.: "my.namespace") namespace string.
   * @param {Object}          values          (optional) The values object at the end of the namespace.
   * @returns {Object}
   * @private
   */
  _generateNamespacedContainer: function (namespace, values) {
    var namespacedContainer = {};

    if (values && typeof values === 'object') {
      namespacedContainer = values;
    }

    if (typeof namespace === 'string') {
      var parts = namespace.split('.'),
          tmpObj;

      for (var i = parts.length - 1; i >= 0; i--) {
        tmpObj = {};
        tmpObj[parts[i]] = namespacedContainer;
        namespacedContainer = tmpObj;
      }

      return namespacedContainer;
    }
  }
};

module.exports = Cherrypie;