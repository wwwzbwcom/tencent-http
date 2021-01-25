import * as url from 'url';

type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'head'
  | 'delete'
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'
  | 'TRACE'
  | 'options'
  | 'trace';

export interface ApigwRequest {
  httpMethod: HttpMethod;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
  path: string;
  queryString: string;
}

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  body?: Buffer;
  headers: Record<string, string>;
}

function getEventBody(event: ApigwRequest) {
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
}

function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj));
}

function getPathWithQueryStringParams(event: ApigwRequest) {
  return url.format({ pathname: event.path, query: event.queryString });
}

export function event2http(event: ApigwRequest): HttpRequest {
  const headers = Object.assign({}, event.headers);

  // NOTE: API Gateway is not setting Content-Length header on requests even when they have a body
  let body = undefined;
  if (event.body && !headers['Content-Length']) {
    body = getEventBody(event);
    headers['Content-Length'] = `${Buffer.byteLength(body)}`;
  }

  const clonedEventWithoutBody = clone(event);
  delete clonedEventWithoutBody.body;

  return {
    method: event.httpMethod,
    path: getPathWithQueryStringParams(event),
    body,
    headers,
  };
}
