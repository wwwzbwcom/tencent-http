import * as url from 'url';

export interface ApigwEvent {
  httpMethod:
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
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
  path: string;
  queryString: string;
}

function getEventBody(event: ApigwEvent) {
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
}

function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj));
}

function getPathWithQueryStringParams(event: ApigwEvent) {
  return url.format({ pathname: event.path, query: event.queryString });
}

export function mapApiGatewayEventToHttpRequest(event: ApigwEvent) {
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
