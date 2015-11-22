import Link from './Link';

export default class Visitor {

  constructor(rootSchema) {
    this._rootSchema = rootSchema;
  }

  run() {
    const { properties: resources } = this._rootSchema;
    const path = '#/properties';
    return Object.keys(resources).reduce((result, resourceName) => {
      const resourcePath = `${path}/${resourceName}`;
      let resource = resources[resourceName];
      if (this.shouldResolveReference(resource)) {
        resource = resources[resourceName] = this.resolveReference(resource.$ref);
      }
      resource.properties = this.visitProperties(resource.properties || {});
      resource.links = this.visitLinks(resource.links || [], resource, `${resourcePath}/links`);
      result[resourceName] = resource;
      return result;
    }, {});
  }

  resolveReference(path) {
    return path.slice(2).split('/').reduce((current, node) => current[node], this._rootSchema);
  }

  shouldResolveReference(schema) {
    return schema.$ref !== undefined;
  }

  visitProperties(properties) {
    return Object.keys(properties).reduce((result, propertyName) => {
      let property = properties[propertyName];
      if (this.shouldResolveReference(property)) {
        property = properties[propertyName] = this.resolveReference(property.$ref);
      }
      result[propertyName] = property;
      return result;
    }, {});
  }

  visitLinks(links, resource, path) {
    return links.map((link, index) => {
      if (this.hasTargetSchema(link)) {
        link.targetSchema = this.visitTargetSchema(link.targetSchema, `${path}[${index}]/targetSchema`);
      }
      return new Link(link, resource);
    });
  }

  visitTargetSchema(schema, path) {
    const { properties, items } = schema;
    if (properties) {
      schema.properties = Object.keys(properties).reduce((result, key) => {
        result[key] = this.visitTargetSchema(properties[key], `${path}/properties/${key}`);
        return result;
      }, {});
    } else if (items) {
      schema.items = this.visitTargetSchema(schema.items, `${path}/items`);
    } else if (this.shouldResolveReference(schema)) {
      return this.resolveReference(schema.$ref);
    } else {
      console.log(`[WARNING] Invalid TargetSchema has been detected. at ${path}`);
      console.log(schema);
    }
    return schema;
  }

  hasTargetSchema(link) {
    return link.targetSchema !== undefined;
  }


}
