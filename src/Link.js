export default class Link {

  constructor(link, parent) {
    this._rawLink = link;
    this._parent = parent;
  }

  getHref() {
    return this._rawLink.href.replace(/{(.+?)}/, (_, m) => {
      return ':' + decodeURIComponent(m).replace(/[()\s]/g, '').split('/').pop();
    });
  }

  getMethod() {
    return this._rawLink.method;
  }

  getContentType() {
    return this._rawLink.encType || 'application/json';
  }

  getTargetSchema() {
    return this._rawLink.targetSchema;
  }

  hasResponseBody() {
    return this._rawLink.mediaType !== 'null';
  }

  getResponseStatus() {
    if (this.getMethod() === 'POST') {
      return 201;
    } else if (this.hasResponseBody()) {
      return 200;
    } else {
      return 204;
    }
  }

  getResponseSchema() {
    return this.getTargetSchema() || this._parent;
  }

  hasListData() {
    return this._rawLink.rel === 'instances';
  }

  getResponseHash() {
    return Link.generateResponse(this.getResponseSchema().properties);
  }

  getResponseBody() {
    const result = this.hasListData() ? [this.getResponseHash()] : this.getResponseHash();
    return JSON.stringify(result);
  }

  static generateResponse(properties, path='.') {
    return Object.keys(properties).reduce((result, key) => {
      const value = properties[key];
      const { example, items, type } = value;
      const types = Array.isArray(type) ? type : [type];

      if (value.properties) {
        result[key] = this.generateResponse(value.properties, `${path}/${key}/properties`);
      } else if (example !== undefined) {
        result[key] = example;
      } else if (types.some(v => v === 'null')) {
        result[key] = null;
      } else if (types.some(v => v === 'array')) {
        if (items.example !== undefined) {
          result[key] = [items.example];
        } else {
          result[key] = [this.generateResponse(items.properties, `${path}/${key}/items/properties`)];
        }
      } else {
        throw new Error(`No example found for "${key}" at [${path}]`);
      }
      return result;
    }, {});
  }

}
