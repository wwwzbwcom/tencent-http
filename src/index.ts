import { CapiCredentials, RegionType } from 'tencent-component-toolkit/lib/modules/interface';
import { Component } from '@serverless/core';
import { Scf, Apigw, Cns, Cos } from 'tencent-component-toolkit';
import { ApiTypeError } from 'tencent-component-toolkit/src/utils/error';
import * as path from 'path';
import {
  DeployInputs,
  DeployScfOutputs,
  State,
  DeployOutputs,
  DeployApigwOutputs,
  DeployApigwInputsOneRegion,
  DeployScfInputsOneRegion,
} from './interface';
import { getDefaultProtocol, deepClone, getCodeZipPath } from './utils';
import { formatInputs } from './formatter';
import CONFIGS from './config';

export class ServerlessComponent extends Component<State> {
  getCredentials(): CapiCredentials {
    const { tmpSecrets } = this.credentials.tencent;

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new ApiTypeError(
        'CREDENTIAL',
        'Cannot get secretId/Key, your account could be sub-account and does not have the access to use SLS_QcsRole, please make sure the role exists first, then visit https://cloud.tencent.com/document/product/1154/43006, follow the instructions to bind the role to your account.'
      );
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token,
    };
  }

  getAppId() {
    return this.credentials.tencent.tmpSecrets.appId;
  }

  async deployFunctionOneRegion(
    inputs: DeployScfInputsOneRegion = {},
    curRegion: RegionType
  ) {
    const credentials = this.getCredentials();
    const outputs: DeployScfOutputs = {};

    const code = await this.uploadCodeToCos(inputs, curRegion);
    const scf = new Scf(credentials, curRegion);
    const tempInputs = {
      ...inputs,
      code,
    };
    const scfOutput = await scf.deploy(deepClone(tempInputs));
    outputs[curRegion] = {
      functionName: scfOutput.FunctionName,
      runtime: scfOutput.Runtime,
      namespace: scfOutput.Namespace,
    };

    this.state[curRegion] = {
      ...this.state[curRegion],
      ...outputs[curRegion],
    };

    // default version is $LATEST
    outputs[curRegion].lastVersion = scfOutput.LastVersion ?? this.state.lastVersion ?? '$LATEST';

    // default traffic is 1.0, it can also be 0, so we should compare to undefined
    outputs[curRegion].traffic = scfOutput.Traffic ?? this.state.traffic ?? 1;

    if (outputs[curRegion].traffic !== 1 && scfOutput.ConfigTrafficVersion) {
      outputs[curRegion].configTrafficVersion = scfOutput.ConfigTrafficVersion;
      this.state.configTrafficVersion = scfOutput.ConfigTrafficVersion;
    }

    this.state.lastVersion = outputs[curRegion].lastVersion;
    this.state.traffic = outputs[curRegion].traffic;

    return outputs;
  }

  async deployFunctionRegionList(
    inputs: DeployScfInputsOneRegion,
    regionList: string[]
  ) {
    const outputs: DeployScfOutputs = {};
    for (let i = 0; i < regionList.length; i++) {
      const curRegion = regionList[i];
      const regionOutputs = await this.deployFunctionOneRegion(inputs, curRegion);
      Object.assign(outputs, regionOutputs);
    }
    this.save();
    return outputs;
  }

  // try to add dns record
  async tryToAddDnsRecord(
    customDomains: { domainPrefix: string; subDomain: string; cname: string }[]
  ) {
    try {
      const credentials = this.getCredentials();
      const cns = new Cns(credentials);
      for (let i = 0; i < customDomains.length; i++) {
        const item = customDomains[i];
        if (item.domainPrefix) {
          await cns.deploy({
            domain: item.subDomain.replace(`${item.domainPrefix}.`, ''),
            records: [
              {
                subDomain: item.domainPrefix,
                recordType: 'CNAME',
                recordLine: '默认',
                value: item.cname,
                ttl: 600,
                mx: 10,
                status: 'enable',
              },
            ],
          });
        }
      }
    } catch (e) {
      console.warn('METHOD_tryToAddDnsRecord', e.message);
    }
  }

  async deployApigateway(
    inputs: DeployApigwInputsOneRegion,
    regionList: string[]
  ): Promise<DeployApigwOutputs> {
    const credentials = this.getCredentials();
    if (inputs.isDisabled) {
      return {};
    }

    const getServiceId = (region: string) => {
      console.log({ region, state: this.state });
      const regionState = this.state[region];
      return inputs.serviceId ?? regionState.serviceId;
    };

    const deployTasks: {}[] = [];
    const outputs: DeployApigwOutputs = {};

    regionList.forEach((curRegion) => {
      const apigwDeployer = async () => {
        const apigw = new Apigw(credentials, curRegion);

        const oldState = this.state[curRegion] ?? {};
        const apigwInputs = {
          ...inputs,
          oldState: {
            apiList: oldState.apiList || [],
            customDomains: oldState.customDomains || [],
          },
        };
        // different region deployment has different service id
        apigwInputs.serviceId = getServiceId(curRegion);
        const apigwOutput = await apigw.deploy(deepClone(apigwInputs));

        outputs[curRegion] = {
          serviceId: apigwOutput.serviceId,
          subDomain: apigwOutput.subDomain,
          environment: apigwOutput.environment,
          url: `${getDefaultProtocol(inputs.protocols)}://${apigwOutput.subDomain}/${
            apigwOutput.environment
          }${apigwInputs.endpoints[0].path}`,
        };

        if (apigwOutput.customDomains) {
          // TODO: need confirm add cns authentication
          // if (inputs.autoAddDnsRecord === true) {
          //   await this.tryToAddDnsRecord(credentials, {})
          // }
          outputs[curRegion].customDomains = apigwOutput.customDomains;
        }
        this.state[curRegion] = {
          ...this.state[curRegion],
          ...outputs[curRegion],
          apiList: apigwOutput.apiList,
          created: true,
        };
      };
      deployTasks.push(apigwDeployer());
    });

    await Promise.all(deployTasks);

    this.save();
    return outputs;
  }

  async deploy(inputs: DeployInputs) {
    console.log(`Deploying ${CONFIGS.component.fullname} App...`);

    // 对Inputs内容进行标准化
    const { regionList, functionConf, apigatewayConf } = await formatInputs(this.state, inputs);

    // 部署函数 + API网关
    const outputs: DeployOutputs = {};
    if (!functionConf?.code?.src) {
      outputs.templateUrl = CONFIGS.templateUrl;
    }

    let apigwOutputs;
    const functionOutputs = await this.deployFunctionRegionList(
      functionConf,
      regionList
    );

    // support apigatewayConf.isDisabled
    if (apigatewayConf?.isDisabled !== true) {
      apigwOutputs = await this.deployApigateway(apigatewayConf, regionList);
    } else {
      this.state.apigwDisabled = true;
    }

    // optimize outputs for one region
    if (regionList.length === 1) {
      const [oneRegion] = regionList;
      outputs.region = oneRegion;
      outputs.scf = functionOutputs[oneRegion];
      if (apigwOutputs) {
        outputs.apigw = apigwOutputs[oneRegion];
      }
    } else {
      outputs.scf = functionOutputs;
      if (apigwOutputs) {
        outputs.apigw = apigwOutputs;
      }
    }

    this.state.region = regionList[0];
    this.state.regionList = regionList;
    this.state.lambdaArn = functionConf.name;

    return outputs;
  }

  async remove() {
    console.log(`Removing ${CONFIGS.component.fullname} App...`);

    const { state } = this;
    const { regionList = [] } = state;

    const credentials = this.getCredentials();

    const removeHandlers = [];
    for (let i = 0; i < regionList.length; i++) {
      const curRegion = regionList[i];
      const curState = state[curRegion];
      const scf = new Scf(credentials, curRegion);
      const apigw = new Apigw(credentials, curRegion);
      const handler = async () => {
        // if disable apigw, no need to remove
        if (state.apigwDisabled !== true) {
          await apigw.remove({
            created: curState.created,
            environment: curState.environment,
            serviceId: curState.serviceId,
            apiList: curState.apiList,
            customDomains: curState.customDomains,
          });
        }
        await scf.remove({
          functionName: curState.functionName,
          namespace: curState.namespace,
        });
      };
      removeHandlers.push(handler());
    }

    await Promise.all(removeHandlers);

    if (this.state.cns) {
      const cns = new Cns(credentials);
      for (let i = 0; i < this.state.cns.length; i++) {
        await cns.remove({ records: this.state.cns[i].records });
      }
    }

    this.state = {};
  }

  async uploadCodeToCos(
    inputs: DeployScfInputsOneRegion,
    region: string
  ) {
    const state: {
      zipPath?: string;
    } = {};

    const appId = this.getAppId();
    const bucketName = inputs?.code?.bucket ?? `sls-cloudfunction-${region}-code`;
    const objectName =
      inputs?.code?.object ?? `${inputs.name}-${Math.floor(Date.now() / 1000)}.zip`;
    // if set bucket and object not pack code
    if (!inputs?.code?.bucket || !inputs.code.object) {
      const zipPath = await getCodeZipPath(inputs);
      console.log(`Code zip path ${zipPath}`);

      // save the zip path to state for lambda to use it
      state.zipPath = zipPath;

      const credentials = this.getCredentials();
      const cos = new Cos(credentials, region);

      if (!inputs?.code?.bucket) {
        // create default bucket
        await cos.deploy({
          bucket: bucketName + '-' + appId,
          force: true,
          lifecycle: [
            {
              status: 'Enabled',
              id: 'deleteObject',
              expiration: { days: '10' },
              abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
            },
          ],
        });
      }

      // upload code to cos
      if (!inputs?.code?.object) {
        console.log(`Getting cos upload url for bucket ${bucketName}`);
        const uploadUrl = await cos.getObjectUrl({
          bucket: bucketName + '-' + appId,
          object: objectName,
          method: 'PUT',
        });

        // if shims and sls sdk entries had been injected to zipPath, no need to injected again
        console.log(`Uploading code to bucket ${bucketName}`);
        if (this.codeInjected === true) {
          await this.uploadSourceZipToCOS(zipPath, uploadUrl, {}, {});
        } else {
          const slsSDKEntries = this.getSDKEntries('_shims/handler.handler');
          await this.uploadSourceZipToCOS(zipPath, uploadUrl, slsSDKEntries, {
            _shims: path.join(__dirname, '_shims'),
          });
          this.codeInjected = true;
        }
        console.log(`Upload ${objectName} to bucket ${bucketName} success`);
      }
    }

    // save bucket state
    this.state.bucket = bucketName;
    this.state.object = objectName;

    return {
      bucket: bucketName,
      object: objectName,
    };
  }
}
