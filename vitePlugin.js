import { randomUUID } from 'crypto';

export default function vitePlugin() {
  const randomId = randomUUID().split('-')[0];
  const VAR_NAME = `_vite_plugin_fix_shadow_root_css_${randomId}`;
  process.env.VITE_PLUGIN_FIX_SHADOW_ROOT_CSS_PROPERTY = VAR_NAME;

  const viteShadowRootCssFixClause = `window.${VAR_NAME} ??= document.createElement('div');`;
  const viteBackendIntegrationReactFixClause = `
    import RefreshRuntime from '/@react-refresh';
    if (!window.__vite_plugin_react_preamble_installed__) {
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    }
  `;

  let hasReact = false;

  return {
    name: '@icp/vite:component-extension',
    apply: 'serve',
    enforce: 'post',
    configResolved(resolvedConfig) {
      const plugins = resolvedConfig.plugins;
      hasReact = plugins.some((p) => p.name.startsWith('vite:react'));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          res.writeHead(302, {
            location: '/entry.js',
            'Access-Control-Allow-Origin': '*'
          });
          res.end();
          return;
        }
        next();
      });
    },
    transform(code, id) {
      if (/vite(\/|\\)dist(\/|\\)client(\/|\\)client.mjs$/.test(id)) {
        return [
          hasReact && viteBackendIntegrationReactFixClause,
          viteShadowRootCssFixClause,
          code.replace(/document\.head/g, `window.${VAR_NAME}`),
        ]
          .filter(Boolean)
          .join('\n');
      }
      return code;
    },
  };
}
