import { Response } from 'got';

export interface ApigwResponse {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
  isBase64Encoded: boolean;
  rawBody?: any;
}

export function http2event<T extends Buffer | string>(httpRes: Response<T>): ApigwResponse {
  const headers = httpRes.headers;

  /** 格式化 Headers */
  Object.keys(headers).map((key) => {
    const v = headers[key];
    if (Array.isArray(v)) {
      if (key.toLowerCase() !== 'set-cookie') {
        headers[key] = v.join(',');
      }
    }
  });

  if (typeof httpRes.body === 'string') {
    return {
      statusCode: httpRes.statusCode,
      body: httpRes.body,
      headers: {},
      isBase64Encoded: false,
    };
  } else {
    /** Body 是 buffer 时进行 base64 编码 */
    return {
      statusCode: httpRes.statusCode,
      body: httpRes.body.toString('base64'),
      rawBody: httpRes.body.toString('utf-8'),
      headers: httpRes.headers as Record<string, string>,
      isBase64Encoded: true,
    };
  }
}
