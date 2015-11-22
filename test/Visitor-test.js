import assert from 'power-assert';
import Visitor from '../src/Visitor';
import Link from '../src/Link';

describe('Visitor', () => {

  let visitor;
  let rawJsonSchema;
  beforeEach(() => {
    rawJsonSchema = {
      "$schema": "http://interagent.github.io/interagent-hyper-schema",
      "type": [
        "object"
      ],
      "definitions": {
        "user": {
          "$schema": "http://json-schema.org/draft-04/hyper-schema",
          "title": "User",
          "description": "fixture for test",
          "stability": "prototype",
          "strictProperties": true,
          "type": [
            "object"
          ],
          "definitions": {
            "id": {
              "description": "unique identifier of user",
              "readOnly": true,
              "example": 10001,
              "type": [
                "number"
              ]
            },
            "name": {
              "description": "name of user",
              "example": "alice",
              "type": [
                "string"
              ]
            }
          },
          "links": [
            {
              "description": "List existing users.",
              "href": "/users",
              "method": "GET",
              "rel": "self",
              "targetSchema": {
                "properties": {
                  "users": {
                    "items": {
                      "$ref": "#/definitions/user"
                    },
                    "type": [
                      "array"
                    ]
                  }
                },
                "type": [
                  "object"
                ]
              },
              "title": "List"
            }
          ],
          "properties": {
            "id": {
              "$ref": "#/definitions/user/definitions/id"
            },
            "name": {
              "$ref": "#/definitions/user/definitions/name"
            }
          }
        }
      },
      "properties": {
        "user": {
          "$ref": "#/definitions/user"
        }
      }
    };
    visitor = new Visitor(rawJsonSchema);
  });

  describe('#run', () => {
    it('should return resources', () => {
      const resources = visitor.run();
      assert(resources.user instanceof Object);
      assert(resources.user.properties.id.example === 10001);
      assert(resources.user.properties.name.example === 'alice');
      assert(resources.user.links.length === 1);
      assert(resources.user.links[0] instanceof Link);
    });
  });

  describe('#resolveReference', () => {
    it('should return object for the specified path', () => {
      const result = visitor.resolveReference('#/definitions/user/definitions/id');
      assert(result === rawJsonSchema.definitions.user.definitions.id);
    });
  });

  describe('#shouldResolveReference', () => {
    it('should return true when schema has "$ref"', () => {
      const result = visitor.shouldResolveReference({ $ref: '#/definitions/user' });
      assert(result === true);
    });
    it('should return false when schema has not "$ref"', () => {
      const result = visitor.shouldResolveReference({ name: 'hoge' });
      assert(result === false);
    });
  });

  describe('#visitProperties', () => {
    it('should return the object that has resolved reference', () => {
      const result = visitor.visitProperties(rawJsonSchema.definitions.user.properties);
      assert(result.id === rawJsonSchema.definitions.user.definitions.id);
      assert(result.name === rawJsonSchema.definitions.user.definitions.name);
    });
  });

  describe('#visitLinks', () => {
    it('should return link lists', () => {
      const resource = rawJsonSchema.definitions.user;
      const result = visitor.visitLinks(resource.links, resource, '#/definitions/user/links');
      assert(result.length === 1);
      assert(result[0] instanceof Link);
      assert(result[0].getHref() === '/users');
    });
  });

  describe('#hasTargetSchema', () => {
    it('should return true when schema has "targetSchema"', () => {
      const result = visitor.hasTargetSchema({ targetSchema: {} });
      assert(result === true);
    });
    it('should return false when schema has not "targetSchema"', () => {
      const result = visitor.hasTargetSchema({ href: 'hoge' });
      assert(result === false);
    });
  });

});
