import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import Schema from './Schema';

export default class MockServe {

  constructor(options) {
    const { port, path } = options;
    this._path = path;
    this._port = port;
    this._app = express();
    this._app.use(bodyParser.json());
    this._app.use(bodyParser.urlencoded({ extended: true }));
    this._app.use(morgan('[:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'));
  }

  start() {
    const schema = Schema.load(require(this._path));
    const { resources } = schema;
    Object.keys(resources).forEach(name => {
      const resource = resources[name];
      resource.links.forEach((link, index) => {
        const method = link.getMethod().toLowerCase();
        try {
          link.getResponseBody();
        } catch(e) {
          throw new Error(`${e.message} at definitions.${name}.links[${index}]`);
        }
        if (this._app[method]) {
          this._app[method](link.getHref(), (req, res) => {
            res.set('Content-Type', link.getContentType());
            res.status(link.getResponseStatus()).send(link.getResponseBody());
          });
        } else {
          throw new Error('Not Support.');
        }
      });
    });
    this._app.listen(this._port);
    console.log(`Mock server started http://localhost:${this._port}`);
  }
}
