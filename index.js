var oKeys = Object.keys;
var isArray = Array.isArray;
var _ = require('lodash');
var get = _.get;
var set = _.set;
var diff = _.difference;
var intersect = _.intersection;
var isFunction = _.isFunction;
var logPrefix = '<cherrypie>';

function filterMetaKeyNames(name) {
  return !/^__/.test(name);
}

/**
 * Use cherrypie.js to populate models from an (JSON) origin and desolate rich models in an intuitive way.
 *
 * @class Cherrypie
 * @module cherrypie.js
 * @static
 */
module.exports = {
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
    var preparedOrigin = modelDescription.__namespace ? get(origin, modelDescription.__namespace) : origin;
    var childDescriptions = modelDescription.__children || {};
    var keys = oKeys(modelDescription).filter(filterMetaKeyNames);
    var computedProperties = keys.filter(function (key) {
      return isFunction(modelDescription[key]);
    });
    var model = {};

    keys = diff(keys, computedProperties);

    this._checkForChildren(keys, oKeys(childDescriptions));

    if (preparedOrigin) {
      keys.forEach(function (key) {
        var value = modelDescription[key];
          var childDescription = childDescriptions[key];
        var parsedValue = preparedOrigin.hasOwnProperty(value) ? preparedOrigin[value] : get(preparedOrigin, value);

        if (childDescription) {
          if (isArray(parsedValue)) {
            parsedValue = parsedValue.map(function (child) {
              return context.populate(childDescription, child);
            }).filter(function (populatedChild) {
              return !!populatedChild;
            });
          } else if (typeof parsedValue === 'object') {
            parsedValue = context.populate(childDescription, parsedValue);
            }
          }

        model[key] = parsedValue;
      });
    }

    if (preparedOrigin) {
      computedProperties.forEach(function (key) {
        model[key] = modelDescription[key].call(model, preparedOrigin, context);
      });
    } else {
      computedProperties.forEach(function (key) {
        model[key] = null;
      });
    }

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
      if (modelDescriptionKeys.indexOf(key) !== -1) {
        return true;
      } else {
        throw new Error(logPrefix + ' Child "' + key + '" declared in __children but not in parent model description!');
      }
    });
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
    var serializedModel = null;
    var childModels = null;

    if (!isArray(serializablePropertyNames)) {
      serializablePropertyNames = oKeys(modelDescription).filter(filterMetaKeyNames);
    }

    // check if any computed properties are defined to be serialized
    serializablePropertyNames.forEach(function checkForComputedProperties(name) {
      if (typeof modelDescription[name] === 'function') {
        throw new Error(
            logPrefix + ' Unable to desolate a computed property ("' + name + '") found in the Array ' +
            'of serializable properties @ namespace "' + namespace + '"!'
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

    serializedModel = this._serialize(modelDescription, model, serializablePropertyNames);

    if (serializedModel && childModels) {
      for (var childModel in childModels) {
        if (childModels.hasOwnProperty(childModel)) {
          serializedModel[modelDescription[childModel]] = childModels[childModel];
        }
      }
    }

    if (namespace) {
      serializedModel = set({}, namespace, serializedModel);
    }

    return serializedModel;
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
      serialized = model.map(function (obj) {
        var serializedObj = {};
        var objKeys = intersect(oKeys(obj), serializableProperties);

        objKeys.forEach(function (key) {
          serializedObj[modelDescription[key]] = obj[key];
        });

        return serializedObj;
      });
    } else {
      serialized = {};
      intersect(oKeys(model), serializableProperties).forEach(function (validPropKey) {
        serialized[modelDescription[validPropKey]] = model[validPropKey];
      });
    }

    return serialized;
  }
};