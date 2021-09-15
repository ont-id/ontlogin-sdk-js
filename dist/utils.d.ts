/**
 * Post request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param body Request body.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
export declare const postRequest: <T>(url: string, body: any, signal?: AbortSignal | undefined) => Promise<T>;
/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
export declare const getRequest: <T>(url: string, path: string, signal?: AbortSignal | undefined) => Promise<T>;
/**
 * Async wait some time.
 * @param time Second amount.
 */
export declare const wait: (time: number) => Promise<void>;
