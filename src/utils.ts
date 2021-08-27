// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const postRequest = async <T>(url: string, params: any): Promise<T> => {
  return fetch(url, {
    method: "post",
    body: JSON.stringify(params),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
};

export const getRequest = async <T>(url: string, path: string): Promise<T> => {
  return fetch(`${url}/${path}`).then((res) => res.json());
};

export const wait = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
