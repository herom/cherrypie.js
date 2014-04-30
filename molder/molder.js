/**
 * Use the Molder to populate models from an (JSON) origin and desolate rich models in an intuitive way.
 *
 * @class Molder
 * @module json-molder
 * @static
 */
var Molder = {
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
      preparedOrigin = this._extractNamespace(origin, modelDescription.__namespace);
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
          parsedValue = this._extractNamespace(preparedOrigin, value);
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
        model[key] = fn.call(model, preparedOrigin, this._extractNamespace, this.populate);
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
   * Takes the given origin (JSON/Object) and namespace and returns
   * the namespaced/reduced object.
   *
   * @param {Object}          origin              The JSON origin.
   * @param {String}          namespace           The model-description namespace.
   * @returns {Object}
   * @private
   */
  _extractNamespace: function (origin, namespace) {
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
    var serializableProperties = [],
        desolatedModel = {};

    if ('serializable' in modelDescription) {
      serializableProperties = modelDescription.serializable;
    } else {
      serializableProperties = Object.keys(modelDescription);
    }

    // ignore the namespace property as it's only useful on populating from the origin
    if (serializableProperties.indexOf('namespace') > -1) {
      serializableProperties.splice(serializableProperties.indexOf('namespace'), 1);
    }

    serializableProperties.forEach(function (key) {
      var property = model[key];

      if (typeof property !== 'function') {
        desolatedModel[key] = property;
      }
    });

    return desolatedModel;
  }
};

module.exports = Molder;