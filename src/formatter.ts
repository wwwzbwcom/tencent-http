import {
  DeployInputs,
  DeployScfInputs,
  DeployApigwInputs,
  State,
  DeployScfInputsOneRegion,
  DeployApigwInputsOneRegion,
} from './interface';
import CONFIGS from './config';
import {
  getDefaultFunctionName,
  validateTraffic,
  getDefaultServiceName,
  getDefaultServiceDescription,
} from './utils';

export const formatInputs = (state: State, inputs: Partial<DeployInputs> = {}) => {
  // 对function inputs进行标准化
  const tempFunctionConf: DeployScfInputsOneRegion =
    inputs.functionConf ?? inputs.functionConfig ?? ({} as any);
  const fromClientRemark = `tencent-${CONFIGS.component.name}`;
  const regionList = (typeof inputs.region === 'string' ? [inputs.region] : inputs.region) ?? [
    'ap-guangzhou',
  ];

  // chenck state function name
  const stateFunctionName = state[regionList[0]]?.functionName;

  const functionConfOneRegion: DeployScfInputsOneRegion = Object.assign(tempFunctionConf, {
    code: {
      src: inputs.src,
      bucket: inputs?.srcOriginal?.bucket,
      object: inputs?.srcOriginal?.object,
    },
    name: inputs.functionName ?? stateFunctionName ?? getDefaultFunctionName(),
    region: regionList,
    role: tempFunctionConf.role ?? inputs.role ?? '',
    handler: tempFunctionConf.handler ?? inputs.handler ?? CONFIGS.handler,
    runtime: tempFunctionConf.runtime ?? inputs.runtime ?? CONFIGS.runtime,
    namespace:
      tempFunctionConf.namespace ??
      tempFunctionConf.namespace ??
      inputs.namespace ??
      CONFIGS.namespace,
    description: tempFunctionConf.description ?? inputs.description ?? CONFIGS.description,
    fromClientRemark,
    layers: tempFunctionConf.layers ?? tempFunctionConf.layers ?? inputs.layers ?? [],
    cfs: tempFunctionConf.cfs ?? tempFunctionConf.cfs ?? [],
    publish: inputs.publish,
    traffic: inputs.traffic,
    lastVersion: state.lastVersion,
    timeout: tempFunctionConf.timeout ? tempFunctionConf.timeout : CONFIGS.timeout,
    memorySize: tempFunctionConf.memorySize ? tempFunctionConf.memorySize : CONFIGS.memorySize,
    tags: tempFunctionConf.tags ?? inputs.tags ?? null,
  });

  // validate traffic
  if (inputs.traffic !== undefined) {
    validateTraffic(inputs.traffic);
  }
  functionConfOneRegion.needSetTraffic =
    inputs.traffic !== undefined && functionConfOneRegion.lastVersion;

  if (tempFunctionConf.environment) {
    functionConfOneRegion.environment = tempFunctionConf.environment;
    functionConfOneRegion.environment.variables = functionConfOneRegion.environment.variables || {};
    functionConfOneRegion.environment.variables.SERVERLESS = '1';
    functionConfOneRegion.environment.variables.SLS_PORT = inputs.port ?? CONFIGS.defaultPort;
    functionConfOneRegion.environment.variables.SLS_ENTRY_FILE =
      inputs.entryFile || CONFIGS.defaultEntryFile;
  } else {
    functionConfOneRegion.environment = {
      variables: {
        SERVERLESS: '1',
        SLS_ENTRY_FILE: inputs.entryFile || CONFIGS.defaultEntryFile,
      },
    };
  }

  if (tempFunctionConf.vpcConfig) {
    functionConfOneRegion.vpcConfig = tempFunctionConf.vpcConfig;
  }

  // 对apigw inputs进行标准化
  const tempApigwConf: DeployApigwInputsOneRegion =
    inputs.apigatewayConf ?? inputs.apigwConfig ?? ({} as any);
  const apigatewayConfOneRegion = Object.assign(tempApigwConf, {
    serviceId: inputs.serviceId || tempApigwConf.serviceId,
    region: regionList,
    isDisabled: tempApigwConf.isDisabled === true,
    fromClientRemark: fromClientRemark,
    serviceName: inputs.serviceName ?? tempApigwConf.serviceName ?? getDefaultServiceName(),
    serviceDesc: tempApigwConf.serviceDesc || getDefaultServiceDescription(),
    protocols: tempApigwConf.protocols || ['http'],
    environment: tempApigwConf.environment ? tempApigwConf.environment : 'release',
    customDomains: tempApigwConf.customDomains || [],
  });

  if (!apigatewayConfOneRegion.endpoints) {
    apigatewayConfOneRegion.endpoints = [
      {
        path: tempApigwConf.path || '/',
        enableCORS: tempApigwConf.enableCORS,
        serviceTimeout: tempApigwConf.serviceTimeout,
        method: 'ANY',
        apiName: tempApigwConf.apiName || 'index',
        function: {
          isIntegratedResponse: true,
          functionName: functionConfOneRegion.name!,
          functionNamespace: functionConfOneRegion.namespace!,
          functionQualifier:
            (tempApigwConf.function && tempApigwConf.function.functionQualifier) || '$LATEST',
        },
      },
    ];
  }
  if (tempApigwConf.usagePlan) {
    apigatewayConfOneRegion.endpoints[0].usagePlan = {
      usagePlanId: tempApigwConf.usagePlan.usagePlanId,
      usagePlanName: tempApigwConf.usagePlan.usagePlanName,
      usagePlanDesc: tempApigwConf.usagePlan.usagePlanDesc,
      maxRequestNum: tempApigwConf.usagePlan.maxRequestNum,
    };
  }
  if (tempApigwConf.auth) {
    apigatewayConfOneRegion.endpoints[0].auth = {
      secretName: tempApigwConf.auth.secretName,
      secretIds: tempApigwConf.auth.secretIds,
    };
  }

  const functionConf: DeployScfInputs = { ...functionConfOneRegion } as any;
  const apigatewayConf: DeployApigwInputs = { ...apigatewayConfOneRegion } as any;

  regionList.forEach((curRegion) => {
    const curRegionConf = inputs[curRegion];
    if (curRegionConf && curRegionConf.functionConf) {
      functionConf[curRegion] = curRegionConf.functionConf;
    }
    if (curRegionConf && curRegionConf.apigatewayConf) {
      apigatewayConf[curRegion] = curRegionConf.apigatewayConf;
      const regionState = state[curRegion];
      apigatewayConf[curRegion].serviceId = regionState.serviceId;
    }
  });

  return {
    regionList,
    functionConf: functionConfOneRegion,
    apigatewayConf,
  };
};
