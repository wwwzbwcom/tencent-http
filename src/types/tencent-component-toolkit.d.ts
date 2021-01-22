declare module 'tencent-component-toolkit' {
  declare class Scf {
    constructor(credentials: any, curRegion?: string);
    async deploy(inputs: any);
    async remove(inputs: any);
  }

  class Apigw {
    constructor(credentials: any, curRegion?: string);
    async deploy(inputs: any);
    async remove(inputs: any);
  }

  class Cns {
    constructor(credentials: any, curRegion?: string);
    async deploy(inputs: any);
    async remove(inputs: any);
  }

  class Cos {
    constructor(credentials: any, curRegion?: string);
    async deploy(inputs: any);
    async getObjectUrl(inputs: any): Promise<string>;
  }
}

declare module 'tencent-component-toolkit/src/utils/error' {
  class ApiError {}

  class TypeError {
    constructor(...param: string[]);
  }
}
