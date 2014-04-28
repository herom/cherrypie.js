/**
 * The description object which holds all "transformation" info to
 * populate a model from the given origin.
 *
 * Usage:
 * ```
 * // The origin (JSON) object.
 * var origin = {
 *   session: {
 *     user: {
 *       name: 'Bruce Wayne',
 *       nickname: 'Batman',
 *       pet: 'Bat-Cat',
 *       favourites: {
 *         food: 'T-Bone Steak',
 *         car: 'Batmobil'
 *       },
 *       mood: {
 *         currentStatus: 'angry'
 *       }
 *     }
 *   }
 * };
 *
 * // The corresponding model description.
 * var description = {
 *   namespace: 'session.user',
 *
 *   name: 'name',
 *
 *   nickname: 'nickname',
 *
 *   pet: 'pet',
 *
 *   favCar: 'favourites.car'
 *
 *   serializabe: ['name', 'nickname']
 * };
 *
 * // The model.
 * var model = ModelFactory.populate(description, origin);
 * ```
 *
 * @class ModelDescription
 * @module
 * @static
 */
var ModelDescription = {
  /**
   * The namespace of the origin (JSON) object.
   *
   * @property namespace
   * @type {String}
   */
  __namespace: 'session.user',

  /**
   * An *example* property which should be populated into the model
   * from the origin (JSON) object's own "primitive" data type values.
   */
  name: 'name',

  /**
   * An *example* computed property which should be populated from
   * any of the origin (JSON) object's "primitive' data type values.
   * <p>
   *   The properties `origin` and `namespaceExtractor` are injected
   *   by the `Molder`.
   *
   * For example:
   * ```
   * // this function
   * statusPhrase: function (origin, namespaceExtractor) {
     *   var status = namespaceExtractor(origin, 'system.user.status'),
     *       person = this.name;
     *
     *   return person + ' is ' + status;
     * }
   *
   * // would lead to this "model output":
   * {
     *  statusPhrase: "Batman is angry"
     * }
   * ```
   *
   * @param {JSON|Object}             origin              This JSON origin.
   * @param {Function}                namespaceExtractor  The namespace extractor function of the Molder.
   * @returns {String}
   */
  statusPhrase: function (origin, namespaceExtractor) {
    var status = namespaceExtractor(origin, 'mood.currentStatus'),
        person = this.name;

    return person + ' is ' + status;
  },


  /**
   * An *example* property which has it's own child model-description defined
   * in the `__children` property. Properties with a child model-description
   * have to be arrays.
   */
  hobbies: 'hobbies',

  /**
   * An *example* child model-description. These descriptions are applied to every
   * entry of the array of the corresponding property.
   *
   * For example:
   * ```
   * __children: {
   *   hobbies: {
   *       id: 'id',
   *       description: 'activity'
   *     }
   *   }
   *
   * @property __children
   * @type {Object}
   */
  __children: {
    hobbies: {
      id: 'id',
      description: 'description'
    }
  },

  /**
   * The array of properties which should be serialized when sending
   * this model object via Ajax to the backend.
   *
   * For example:
   * ```
   * // this serializable properties
   * {
     *   serializable: ['name', 'nickname']
     * }
   *
   * // will create the following serialized model object:
   * {
     *   name: "Bruce Wayne",
     *   nickname: "Batman"
     * }
   * ```
   *
   * @property serializable
   * @type {Array}
   */
  __serializable: ['name', 'nickname']
};

module.exports = ModelDescription;
