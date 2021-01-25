import { http2event, ApigwResponse } from './http2event';
import * as path from 'path';
import got from 'got';
import * as childProcess from 'child_process';
import { ApigwRequest, event2http } from './event2http';
import { serializeError } from 'serialize-error';

let hasInit = false;
let port: string;

async function init() {
  if (hasInit) return;

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
        await new Promise((resolve) => setTimeout(resolve, parseInt(delay, 10)));
      }
    }

    port = process.env.APP_PORT ?? '18888';

    hasInit = true;
  }
}

exports.handler = async (event: ApigwRequest): Promise<ApigwResponse> => {
  init();

  const httpReq = event2http(event);

  try {
    const httpRes = await got(`http://localhost:${port}`, {
      headers: httpReq.headers,
      method: httpReq.method,
      body: httpReq.body,
      path: httpReq.path,
      throwHttpErrors: false,
      responseType: 'buffer',
    });

    return http2event(httpRes);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 502,
      body: serializeError(err),
      headers: {},
      isBase64Encoded: false,
    };
  }
};
