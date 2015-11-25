import assert from 'power-assert';
import Link from '../src/Link.js';

describe('Link', () => {

  let resource;
  let link;
  let targetSchema;

  beforeEach(() => {
    resource = {
      type: 'object',
      properties: {
        id: {
          example: 10001,
          type: 'number'
        },
        name: {
          example: 'alice',
          type: 'string'
        }
      }
    };
    /**
     * response should to be
     * ----------------------------------
     * {
     *   "names": ["alice"]
     * }
     * ----------------------------------
     */
    targetSchema = {
      properties: {
        names: {
          items: resource.properties.name,
          type: 'array'
        }
      },
      type: 'object'
    };
    link = new Link({
      href: '/users',
      method: 'GET',
      targetSchema
    }, resource);
  });

  describe('#getHref', () => {
    it('should return href', () => {
      assert(link.getHref() === '/users');
    });
    it('should return converted href when it has replacement params', () => {
      const link = new Link({
        href: '/users/{(%23%2Fdefinitions%2Fuser%2Fdefinitions%2Fid)}',
        method: 'GET'
      }, resource);
      assert(link.getHref() === '/users/:id');
    });
  });

  describe('#getMethod', () => {
    it('should return method', () => {
      assert(link.getMethod() === 'GET');
    });
  });

  describe('#getContentType', () => {
    it('should return "application/json" when the encType is not present', () => {
      assert(link.getContentType() === 'application/json');
    });
    it('should return encType', () => {
      const link = new Link({
        href: '/users',
        method: 'GET',
        encType: 'text/plain'
      }, resource);
      assert(link.getContentType() === 'text/plain');
    });
  });

  describe('#getTargetSchema', () => {
    it('should return targetSchema', () => {
      assert(link.getTargetSchema() === targetSchema);
    });
  });

  describe('#hasResponseBody', () => {
    it('should return true when mediaType is not null', () => {
      assert(link.hasResponseBody() === true);
    });
    it('should return false when mediaType is null', () => {
      const link = new Link({
        href: '/users/:id',
        method: 'DELETE',
        mediaType: 'null'
      }, resource);
      assert(link.hasResponseBody() === false);
    });
  });

  describe('#getResponseStatus', () => {
    it('should return 201 when method is POST', () => {
      const link = new Link({
        href: '/users',
        method: 'POST'
      }, resource);
      assert(link.getResponseStatus() === 201);
    });
    it('should return 200 when method is not POST', () => {
      assert(link.getResponseStatus() === 200);
    });
    it('should return 204 when method is not POST and mediaType is null', () => {
      const link = new Link({
        href: '/users/:id',
        method: 'DELETE',
        mediaType: 'null'
      }, resource);
      assert(link.getResponseStatus() === 204);
    });
  });

  describe('#getResponseSchema', () => {
    it('should return target schema when link has targetSchema', () => {
      assert(link.getResponseSchema() === targetSchema);
    });
    it('should return parent schema when link has not targetSchema', () => {
      const link = new Link({
        href: '/users',
        method: 'GET'
      }, resource);
      assert(link.getResponseSchema() === resource);
    });
  });

  describe('#hasListData', () => {
    it('should return true when rel is "instances"', () => {
      const link = new Link({
        href: '/users',
        method: 'GET',
        rel: 'instances'
      }, resource);
      assert(link.hasListData() === true);
    });
    it('should return false when rel is not "instances"', () => {
      assert(link.hasListData() === false);
    });
  });

  describe('#getResponseHash', () => {
    it('should return hashed response', () => {
      const result = link.getResponseHash();
      assert(result.names[0] === 'alice');
    });
  });

  describe('#getResponseBody', () => {
    it('should return stringified response', () => {
      const result = link.getResponseBody();
      assert(result === '{"names":["alice"]}');
    });
  });

  describe('#generateResponse', () => {
    it('should return response object', () => {
      const result = Link.generateResponse(resource.properties);
      /**
       * expects
       * {
       *   "id": 10001,
       *   "name": "alice"
       * }
       */
      assert(result.id === 10001);
      assert(result.name === 'alice');
    });
    it('should return response object when properties include items', () => {
      const result = Link.generateResponse({
        users: {
          items: resource,
          type: 'array'
        }
      });
      /**
       * expects
       * {
       *   "users": [
       *     {
       *       "id": 10001,
       *       "name": "alice"
       *     }
       *   ]
       * }
       */
      assert(result.users[0].id === 10001);
      assert(result.users[0].name === 'alice');
    });
    it('should return response object when properties include nested properties', () => {
      const result = Link.generateResponse({
        user: {
          properties: {
            name: {
              example: 'hoge',
              type: 'string'
            }
          },
          type: 'object'
        }
      });
      /**
       * expects
       * {
       *   "user": {
       *     "name": "hoge"
       *   }
       * }
       */
      assert(result.user.name === 'hoge');
    });
    it('should return response object when properties include "null" type', () => {
      const result = Link.generateResponse({
        group: {
          type: ['string', 'null']
        }
      });
      /**
       * expects
       * {
       *   "group": null
       * }
       */
      assert(result.group === null);
    });
    it('should return response object when properties include nested properties and items', () => {
      const result = Link.generateResponse({
        user: {
          properties: {
            names: {
              items: {
                example: 'hoge',
                type: 'string'
              },
              type: 'array'
            }
          },
          type: 'object'
        }
      });
      /**
       * expects
       * {
       *   "user": {
       *     "names": ["hoge"]
       *   }
       * }
       */
      assert(result.user.names[0] === 'hoge');
    });
    it('should throw error when property has not example', () => {
      let result;
      try {
        Link.generateResponse({
          user: {
            properties: {
              name: {
                // none example property
                type: 'string'
              }
            },
            type: 'object'
          }
        });
      } catch(e) {
        result = e.message;
      }
      assert(result === 'No example found for "name"');
    });
  });
});
