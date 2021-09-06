/**
 * Post request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param params Request body.
 * @return Promise response.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const postRequest = async <T>(url: string, body: any): Promise<T> => {
  return fetch(url, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
};

/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @return Promise response.
 */
export const getRequest = async <T>(url: string, path: string): Promise<T> => {
  return fetch(`${url}/${path}`).then((res) => res.json());
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
