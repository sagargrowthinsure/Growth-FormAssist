import { defineConfig } from 'wxt';

/**
 * Growth FormAssist
 *
 * Global browser-extension configuration.
 *
 * WXT generates the final browser-specific manifest from this
 * configuration. We intentionally keep permissions limited to
 * functionality that is required by the current application stage.
 */
export default defineConfig({
  manifest: {
    name: 'Growth FormAssist',
    short_name: 'FormAssist',
    description:
      'Internal Growth.insure tool that helps VAs fill insurance forms faster and more accurately.',
    permissions: ['storage'],
  },
});

