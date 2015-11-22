import Visitor from './Visitor';

export default class Schema {

  constructor(resoruces) {
    this.resources = resoruces;
  }

  static load(rawData) {
    return new Schema(new Visitor(rawData).run());
  }

}
