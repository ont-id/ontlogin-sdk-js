/**
 * post request in json
 * @desc a simple wrapper of fetch
 * @param url request url
 * @param params request body
 * @returns response
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
 * get request in json
 * @desc a simple wrapper of fetch
 * @param url request url
 * @param path request path i.e. 'id' or 'news/id'
 * @returns response
 */
export const getRequest = async <T>(url: string, path: string): Promise<T> => {
  return fetch(`${url}/${path}`).then((res) => res.json());
};

/**
 * async wait some time
 * @param time second amount
 * @returns void
 */
export const wait = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
