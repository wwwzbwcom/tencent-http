declare module 'tencent-component-toolkit' {
  declare class Scf {
    constructor(credentials: any, curRegion?: string);
    deploy(inputs: any);
    remove(inputs: any);
  }

  class Apigw {
    constructor(credentials: any, curRegion?: string);
    deploy(inputs: any);
    remove(inputs: any);
  }

  class Cns {
    constructor(credentials: any, curRegion?: string);
    deploy(inputs: any);
    remove(inputs: any);
  }

  class Cos {
    constructor(credentials: any, curRegion?: string);
    deploy(inputs: any);
    getObjectUrl(inputs: any): string;
  }
}

declare module 'tencent-component-toolkit/src/utils/error' {
  class ApiError {}

  class TypeError {
    constructor(...param: string[]);
  }
}
