export declare const postRequest: <T>(url: string, params: any) => Promise<T>;
export declare const getRequest: <T>(url: string, path: string) => Promise<T>;
export declare const wait: (time: number) => Promise<void>;
