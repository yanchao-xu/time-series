export interface I18nApi {
  // current language, e.g. zh-CN en-US ja-JP
  language: string;
  // translate func, re-export from i18n-next
  t(key: string, options?: { ns?: string }): string;
}

// popup message api, re-export from antd
export interface MessageApi {
  error(message: string): void;
  warning(message: string): void;
  success(message: string): void;
}

/*
  restful api client, re-export from axios with some interceptors.
  There is no need to add `Authorization: Bearer xxx` to each request header, nor is there any need to add `.then(res => res.data)` after each request response.
  When the request fails, the messageApi will be called internally to report an error to the user.
*/
export interface RestApi {
  get(url: string): Promise<any>;
  put(url: string, payload: Object): Promise<any>;
  post(url: string, payload: Object): Promise<any>;
  delete(url: string): Promise<any>;
}

// 定义 formApi 和 routerApi 的占位类型（如果需要更具体的类型，可以根据实际需求补充）
export interface FormApi {
  // get form data
  getData(): Record<string, any>;
  // set form data
  setData(data: Record<string, any>): void;
  // get field value
  getValue(fieldName: string): any;
  // set field value
  setValue(fieldName: string, value: any): void;
  // submit form
  submit(): Promise<any>;
  // cancel form
  cancel(): void;
  // `ready` event listener, will be called when form is ready
  on(type: 'ready', listener: () => void): void;
  // `fieldValueChange` event listener, will be called when field value is changed
  on(type: 'fieldValueChange', listener: (fieldName: string, newValue: any) => void): void;
}

export interface RouterApi {
  // the navigation function returned by `useNavigate()` of `react-router-dom`
  navigate(path: string): void;
}

export interface FieldApi<T> {
  // set field value
  setValue: (value: T) => void;
  // set field touched, which will trigger validation
  setTouched: () => void;
  // field id
  id: string;
  // field name
  name: string;
  // field default value
  defaultValue: T;
}

export type Params = Record<string, any>;

export type MountParams<T> = {
  // parameters passed from parent to this component
  params: Params;
  // Through the form api, you can access form data, listen to form events, and operate on the form
  formApi: FormApi;
  // Through the message api, you can display messages
  messageApi: MessageApi;
  // Through the rest api, you can make RESTful requests to the backend
  restApi: RestApi;
  // Through the i18n api, you can get the current language and make translations
  i18nApi: I18nApi;
  // Through the router api, you can navigate to other pages
  routerApi: RouterApi;
  // Through the field api, you can get field meta info and set the field value
  fieldApi: FieldApi<T>;
};

// The unmount function is called when the component is unmounted, and you can perform some cleanup operations here
export type UnmountFunction = () => void | Promise<void>;

export interface Handle<T> {
  // The alternative way to define the unmount function
  unmount?: UnmountFunction;
  // External method for updating field value (controlled component), if this extension acts as a field
  updateValue?(value: T): void;
  // External method for updating field parameters, used when parameters may change
  updateParams?(params: Params): void;
  // External method for validating field value, if this extension acts as a field. Throw an error to indicate validation error.
  validate?(value: T): boolean;
}

export type MountReturn<T> = UnmountFunction | Handle<T>;

// The mount function is called when the component is mounted, and you can perform some initialization operations here
export type mount<T> = (element: HTMLElement, params: MountParams<T>) => MountReturn<T>;
