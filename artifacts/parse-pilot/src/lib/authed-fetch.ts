import { setAuthTokenGetter } from "@workspace/api-client-react";

let _getToken: (() => Promise<string | null>) | null = null;

export function registerClerkTokenGetter(
  getter: (() => Promise<string | null>) | null,
): void {
  _getToken = getter;
  setAuthTokenGetter(getter);
}

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = _getToken ? await _getToken() : null;

  const headers = new Headers(init.headers);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
