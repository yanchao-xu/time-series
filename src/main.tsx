import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import type { MountParams, MountReturn } from '../icp-extension.types';

export default function mount<T>(
  element: HTMLElement,
  { params, formApi, messageApi, restApi, i18nApi, routerApi }: MountParams<T>,
): MountReturn<T> {
  const root = createRoot(element);
  root.render(<App />)

  return () => {
    root.unmount();
  };
}

// uncomment to provide mock REST API only for form designer preview
/*
export const mockRestApi = {
  get: async  () => {}
  put: async  () => {}
  post: async  () => {}
  delete: async  () => {}
}
*/
