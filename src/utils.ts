import { DeployScfInputsOneRegion } from './interface';
import * as download from 'download';
import { TypeError } from 'tencent-component-toolkit/src/utils/error';
import CONFIGS from './config';

/*
 * Generates a random id
 */
export const generateId = () => Math.random().toString(36).substring(6);

export function deepClone<T>(obj: T):T {
  return JSON.parse(JSON.stringify(obj));
}

export function getType<T>(obj: T): string {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function mergeJson<S, T>(sourceJson: S, targetJson: T): S & T {
  Object.entries(sourceJson).forEach(([key, val]) => {
    (targetJson as any)[key] = deepClone(val);
  });
  return targetJson as S & T;
}

export const capitalString = (str: string) => {
  if (str.length < 2) {
    return str.toUpperCase();
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
};

export const getDefaultProtocol = (protocols: ('http' | 'https')[]) => {
  return String(protocols).includes('https') ? 'https' : 'http';
};

export const getDefaultFunctionName = () => {
  return `${CONFIGS.component.name}_component_${generateId()}`;
};

export const getDefaultServiceName = () => {
  return 'serverless';
};

export const getDefaultServiceDescription = () => {
  return 'Created by Serverless Component';
};

export function validateTraffic(num: string | number) {
  if (getType(num) !== 'Number') {
    throw new TypeError(
      `PARAMETER_${CONFIGS.component.name.toUpperCase()}_TRAFFIC`,
      'traffic must be a number'
    );
  }
  if (num < 0 || num > 1) {
    throw new TypeError(
      `PARAMETER_${CONFIGS.component.name.toUpperCase()}_TRAFFIC`,
      'traffic must be a number between 0 and 1'
    );
  }
  return true;
}

export async function getCodeZipPath(inputs: DeployScfInputsOneRegion) {
  console.log(`Packaging ${CONFIGS.component.name} application...`);

  // unzip source zip file
  let zipPath;
  if (!inputs?.code?.src) {
    // add default template
    const downloadPath = `/tmp/${generateId()}`;
    const filename = 'template';

    console.log(`Installing Default ${CONFIGS.component.fullname} App...`);
    try {
      await download(CONFIGS.templateUrl, downloadPath, {
        filename: `${filename}.zip`,
      });
    } catch (e) {
      throw new TypeError(`DOWNLOAD_TEMPLATE`, 'Download default template failed.');
    }
    zipPath = `${downloadPath}/${filename}.zip`;
  } else {
    zipPath = inputs.code.src;
  }

  return zipPath;
}
