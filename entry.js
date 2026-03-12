import 'vite/modulepreload-polyfill';
import mount from './src/main';
export * from './src/main';

function fixViteShadowRootCss(element) {
  if (import.meta.env.DEV) {
    const VAR_NAME = import.meta.env.VITE_PLUGIN_FIX_SHADOW_ROOT_CSS_PROPERTY;
    if (element.getRootNode() !== window[VAR_NAME].getRootNode()) {
      let rootNode = element.getRootNode();
      if (rootNode === document) rootNode = document.head;
      rootNode.appendChild(window[VAR_NAME]);
    }
  }
}

export default (element, ...args) => {
  fixViteShadowRootCss(element);
  return mount(element, ...args);
};
