import { ApigwResponse } from './http2event';
import * as path from 'path';
import got from 'got';
import * as childProcess from 'child_process';
import { ApigwEvent, mapApiGatewayEventToHttpRequest } from './event2http';

let hasInit = false;

exports.handler = async (event: ApigwEvent) => {
  const SLS_ENTRY_FILE = process.env.SLS_ENTRY_FILE;
  const entryFile = SLS_ENTRY_FILE ? path.join(__dirname, '..', SLS_ENTRY_FILE) : './sls.js';

  /** Start HTTP Server in Entry File */
  console.log(`entryFile: ${entryFile}`);
  /** Only create server once */
  if (!hasInit) {
    if (entryFile.endsWith('.js')) {
      require(entryFile);
    } else {
      console.log('Using binary entry');

      const p = childProcess.spawn(entryFile);
      p.stdout.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
      });
      p.stderr.on('data', (chunk) => {
        console.error(chunk.toString('utf-8'));
      });

      const delay = process.env.APP_INIT_DELAY;
      if (delay) {
        await new Promise((resolve, reject) => setTimeout(resolve, parseInt(delay, 10)));
      }
    }
    hasInit = true;
  }

  const APP_PORT = process.env.APP_PORT ?? '18888';

  const httpReq = mapApiGatewayEventToHttpRequest(event);

  try {
    const httpRes = await got(`http://localhost:${APP_PORT}`, {
      headers: httpReq.headers,
      method: httpReq.method,
      body: httpReq.body,
      path: httpReq.path,
      throwHttpErrors: false,
    });
    // console.log(httpRes);

    return new Promise<ApigwResponse>((resolve) => {
      resolve({
        body: httpRes.body,
        statusCode: httpRes.statusCode,
        headers: httpRes.headers as Record<string, string>,
        isBase64Encode: false,
      });
    });
  } catch (err) {
    console.log(err);
  }
};
