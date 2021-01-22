export interface ApigwResponse {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
  isBase64Encode: boolean;
}

export interface Resolver {
  succeed(res: {
    response: {
      body: string;
      statusCode: number;
      headers: Record<string, string | string[]>;
    };
  }): void;
}

export function forwardResponseToApiGateway(res: {
  body: Buffer | string;
  statusCode: number;
  headers: Record<string, string | string[]>;
}) {
  const { headers, statusCode } = res;
  if (headers['transfer-encoding'] === 'chunked') {
    delete headers['transfer-encoding'];
  }

  Object.keys(headers).forEach((headerKey) => {
    const headerVal = headers[headerKey];
    if (Array.isArray(headerVal)) {
      if (headerKey.toLowerCase() !== 'set-cookie') {
        headers[headerKey] = headerVal.join(',');
      }
    }
  });

  // const contentType = getContentType({ contentTypeHeader: headers['content-type'] as string })
  // const isBase64Encoded = isContentTypeBinaryMimeType({ contentType, binaryMimeTypes:server._binaryTypes })
  // body = body.toString(isBase64Encoded ? 'base64' : 'utf8')
  const body = res.body.toString('base64');
  return { statusCode, body, headers, isBase64Encoded: false };
}

export function forwardConnectionErrorResponseToApiGateway(error: any) {
  console.log('ERROR: tencent-serverless-http connection error');
  console.error(error);
  const errorResponse = {
    statusCode: 502, // "DNS resolution, TCP level errors, or actual HTTP parse errors" - https://nodejs.org/api/http.html#http_http_request_options_callback
    body: '',
    headers: {},
  };

  return errorResponse;
}

export function forwardLibraryErrorResponseToApiGateway(error: any) {
  console.log('ERROR: tencent-serverless-http error');
  console.error(error);
  const errorResponse = {
    statusCode: 500,
    body: '',
    headers: {},
  };

  return errorResponse;
}
