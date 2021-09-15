/**
 * Post request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param body Request body.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
export const postRequest = async <T>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  body: any,
  signal?: AbortSignal
): Promise<T> => {
  return fetch(url, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
  }).then((res) => res.json());
};

/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
export const getRequest = async <T>(
  url: string,
  path: string,
  signal?: AbortSignal
): Promise<T> => {
  return fetch(`${url}/${path}`, { signal }).then((res) => res.json());
};

/**
 * Async wait some time.
 * @param time Second amount.
 */
export const wait = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
