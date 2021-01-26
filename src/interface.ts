export type DeployScfInputs = DeployScfInputsOneRegion & Record<string, DeployScfInputsOneRegion>;

export interface DeployScfInputsOneRegion {
  code?: { bucket?: string; object?: string; src?: string };
  name?: string;

  role?: string;
  serviceId?: string;
  handler?: string;
  runtime?: string;
  namespace?: string;
  description?: string;

  environment?: {
    variables?: Record<string, string>;
  };

  lastVersion?: string;

  layers?: [];
  cfs?: [];
  timeout?: number;
  traffic?: number;
  memorySize?: number;
  tags?: {}[];
  needSetTraffic?: boolean | string;
  vpcConfig?: string;
}

export interface DeployScfOutputs {
  [region: string]: {
    configTrafficVersion?: string;
    lastVersion?: string;
    functionName: string;
    runtime: string;
    namespace: string;
    traffic?: number;
  };
}

export type DeployApigwInputs = DeployApigwInputsOneRegion &
  Record<string, DeployApigwInputsOneRegion>;

export interface DeployApigwInputsOneRegion {
  oldState?: any;

  isDisabled?: boolean;
  serviceId?: string;

  serviceDesc?: string;
  serviceName?: string;

  environment?: 'prepub' | 'release' | 'test';
  customDomains?: string[];

  path?: string;
  enableCORS?: boolean;

  serviceTimeout?: number;
  apiName?: string;

  protocols: ('http' | 'https')[];
  endpoints: {
    path?: string;
    enableCORS?: boolean;
    serviceTimeout?: number;
    method?: string;
    apiName?: string;

    function?: {
      isIntegratedResponse?: boolean;
      functionName: string;
      functionNamespace: string;
      functionQualifier: string;
    };

    usagePlan?: {
      usagePlanId: string;
      usagePlanName: string;
      usagePlanDesc: string;
      maxRequestNum: number;
    };

    auth?: {
      secretName?: string;
      secretIds?: string;
    };
  }[];
  autoAddDnsRecord: boolean;

  function?: {
    functionQualifier: string;
  };

  usagePlan?: {
    usagePlanId: string;
    usagePlanName: string;
    usagePlanDesc: string;
    maxRequestNum: number;
  };

  auth?: {
    secretName?: string;
    secretIds?: string;
  };
}

export type DeployApigwOutputs = {
  customDomains?: string[];
} & Record<
  string,
  {
    serviceId: string;
    subDomain: string;
    environment: 'prepub' | 'test' | 'release';
    url: string;
    customDomains?: string[];
  }
>;

export type DeployInputs = DeployInputsOneRegion & Record<string, DeployInputsOneRegion>;

export interface DeployInputsOneRegion {
  entryFile: string;
  port: string;

  serviceId?: string;
  functionConf?: DeployScfInputsOneRegion;
  apigatewayConf?: DeployApigwInputsOneRegion;

  serviceName?: string;

  region?: string | string[];
  src?: string;
  role?: string;
  handler?: string;
  runtime?: string;
  namespace?: string;
  srcOriginal?: {
    bucket: string;
    object: string;
  };
  functionName?: string;
  description?: string;
  publish?: string;
  traffic?: number;
  tags?: number;
  layers?: string[];
}

export type DeployOutputs = {
  templateUrl?: string;
  region?: string;
  scf?: DeployScfOutputs[string] | DeployScfOutputs;
  apigw?: DeployApigwOutputs[string] | DeployApigwOutputs;
} & Record<string, DeployOutputsOneRegion>;

export interface DeployOutputsOneRegion {
  templateUrl?: string;
  region?: string;
  scf?: DeployScfOutputs;
  apigw?: DeployApigwOutputs;
}

export type State = {
  region?: string;
  regionList?: string[];
  lambdaArn?: string;

  configTrafficVersion?: string;
  lastVersion?: string;
  traffic?: number;
  apigwDisabled?: boolean;
  cns?: {
    records: string[];
  }[];
  bucket?: string;
  object?: string;
} & Record<string, StateOneRegion>;

export interface StateOneRegion {
  functionName?: string;
  runtime?: string;
  namespace?: string;
  environment: 'prepub' | 'test' | 'release';

  created: boolean;
  serviceId: string;

  apiList: DeployApigwOutputs[];
  customDomains: string[];
}
