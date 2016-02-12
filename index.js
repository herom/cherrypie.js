var oKeys = Object.keys;
var isArray = Array.isArray;

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
    var context = this;
    var keys = oKeys(modelDescription);
    var preparedOrigin = modelDescription.__namespace ? this.extractNamespace(origin, modelDescription.__namespace) : origin;
    var computedProperties = [];
    var childDescriptions = modelDescription.__children || {};
    var model = {};

    keys = keys.filter(function filterMetaKeyNames(keyName) {
      return !/^__/.test(keyName);
    });

    this._checkForChildren(keys, oKeys(childDescriptions));

    keys.forEach(function (key) {
      var value = modelDescription[key];

      if (typeof value === 'function') {
        // keep computed properties to evaluate them after the ordinary properties have been evaluated.
        // the evaluated properties will be accessible within the property function.
        computedProperties.push(key);
      } else if (preparedOrigin) {
        var parsedValue;

        if (preparedOrigin.hasOwnProperty(value)) {
          parsedValue = preparedOrigin[value];
        } else {
          parsedValue = context.extractNamespace(preparedOrigin, value);
        }

        if (childDescriptions[key]) {
          var childDescription = childDescriptions[key];
          var childModel;

          if (isArray(parsedValue)) {
            var children = parsedValue.slice();
            parsedValue = [];

            children.forEach(function (child) {
              childModel = context.populate(childDescription, child);
              if (childModel) {
                parsedValue.push(childModel);
              }
            });

          } else if (typeof parsedValue === 'object') {
            childModel = context.populate(childDescription, parsedValue);
            if (childModel) {
              parsedValue = childModel;
            }
          }
        }

        model[key] = parsedValue;
      }
    });

    computedProperties.forEach(function (key) {
      if (preparedOrigin) {
        var fn = modelDescription[key];
        model[key] = fn.call(model, preparedOrigin, context);
      } else {
        model[key] = null;
      }
    });

    if (!oKeys(model).length) {
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
      if (modelDescriptionKeys.indexOf(key) > -1) {
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
      var splittedNamespace = namespace.split('.');
      var namespaceKey;
      var iterator = 0;

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
    var context = this;
    var namespace = modelDescription.__namespace;
    var serializablePropertyNames = modelDescription.__serializable;
    var desolatedModel = null;
    var childModels = null;

    if (!isArray(serializablePropertyNames)) {
      serializablePropertyNames = oKeys(modelDescription).filter(function removeUnserializableProperties(name) {
        return !/^__/.test(name);
      });
    }

    // check if any computed properties are defined to be serialized
    serializablePropertyNames.forEach(function checkForComputedProperties(name) {
      if (typeof modelDescription[name] === 'function') {
        throw new Error(
            'cherrypiejs#desolate(): Unable to serialize a "computedProperty" found in the Array ' +
            'of serializable properties (namespace: ' + namespace + ')!'
        );
      }
    });

    if (modelDescription.__children) {
      var childKeys = oKeys(modelDescription.__children);
      childModels = {};

      childKeys.forEach(function (childKey) {
        var keyIndex = serializablePropertyNames.indexOf(childKey);
        if (keyIndex !== -1) {
          serializablePropertyNames.splice(keyIndex, 1);
          childModels[childKey] = context.desolate(modelDescription.__children[childKey], model[childKey]);
        }
      });
    }

    desolatedModel = this._serialize(modelDescription, model, serializablePropertyNames);

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

    if (isArray(model) && model.length) {
      var serializedObject = {};
      serialized = [];

      model.forEach(function (obj) {
        serializedObject = {};

        for (var prop in obj) {
          if (obj.hasOwnProperty(prop) && serializableProperties.indexOf(prop) !== -1) {
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

        if (propertyIndex !== -1 && model[prop]) {
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
      var parts = namespace.split('.');
      var tmpObj;

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