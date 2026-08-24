/**
 * Growth FormAssist - Popup
 *
 * The popup provides quick operational controls for the VA.
 *
 * The popup does not inspect webpage DOM directly. It communicates
 * through the background service worker for scanning and capture storage.
 */

/**
 * Growth FormAssist - Popup
 *
 * The popup provides quick operational controls for the VA.
 *
 * The popup does not inspect webpage DOM directly. It communicates
 * through the background service worker for scanning and capture storage.
 */

import './style.css';
import './capture-ui.css';
import './autofill-ui.css';

import type {
  ScanResponse,
} from '../../src/messaging/messages';

import {
  renderScanResponse,
  setScanningState,
  showScanError,
  type ScanUiElements,
} from './scan-ui';

import {
  renderCapturedTemplates,
  type CaptureUiElements,
} from './capture-ui';

import {
  initializeAutofillUi,
} from './autofill-ui';

/**
 * Render the FormAssist popup structure.
 */
document.querySelector<HTMLDivElement>(
  '#app',
)!.innerHTML = `
  <main class="formassist-popup">
    <header class="popup-header">
      <div class="brand-mark">G</div>
      <div>
        <h1>Growth FormAssist</h1>
        <p>Faster. Accurate. Quote-ready.</p>
      </div>
    </header>

    <section class="scan-section">
      <button
        id="scan-page"
        class="primary-button"
        type="button"
      >
        Scan Current Page
      </button>

      <div
        id="status"
        class="status"
        aria-live="polite"
      >
        Ready to scan.
      </div>
    </section>

    <section
      id="autofill-section"
      class="autofill-section"
    >
      <div class="autofill-header">
        <h2>Autofill</h2>
        <p>Use a saved form on this page</p>
      </div>

      <select
        id="autofill-template"
        class="autofill-select"
      >
        <option value="">
          Select a saved capture
        </option>
      </select>

      <button
        id="autofill-button"
        class="autofill-button"
        type="button"
        disabled
      >
        Autofill Current Page
      </button>

      <div
        id="autofill-status"
        class="autofill-status"
        aria-live="polite"
      ></div>
    </section>

    <section
      id="results"
      class="results-section"
      hidden
    >
      <div class="results-header">
        <h2>Detected Fields</h2>
        <span
          id="field-count"
          class="field-count"
        >
          0
        </span>
      </div>

      <div
        id="field-list"
        class="field-list"
      ></div>
    </section>

    <section
      id="saved-captures"
      class="saved-captures-section"
      hidden
    >
      <div class="saved-captures-header">
        <div>
          <h2>Saved Captures</h2>
          <p>Forms available for future use</p>
        </div>

        <button
          id="refresh-captures"
          class="icon-button"
          type="button"
          title="Refresh saved captures"
          aria-label="Refresh saved captures"
        >
          ↻
        </button>
      </div>

      <div
        id="capture-status"
        class="capture-status"
        aria-live="polite"
      ></div>

      <div
        id="capture-list"
        class="capture-list"
      ></div>
    </section>

    <footer class="popup-footer">
      <span>Internal Growth.insure tool</span>
    </footer>
  </main>
`;

/**
 * Resolve the scan UI elements.
 */
const scanUi: ScanUiElements = {
  scanButton:
    document.querySelector<HTMLButtonElement>(
      '#scan-page',
    )!,

  statusElement:
    document.querySelector<HTMLDivElement>(
      '#status',
    )!,

  resultsSection:
    document.querySelector<HTMLElement>(
      '#results',
    )!,

  fieldCountElement:
    document.querySelector<HTMLSpanElement>(
      '#field-count',
    )!,

  fieldListElement:
    document.querySelector<HTMLDivElement>(
      '#field-list',
    )!,
};

/**
 * Resolve the saved-capture UI elements.
 */
const captureUi: CaptureUiElements = {
  section:
    document.querySelector<HTMLElement>(
      '#saved-captures',
    )!,

  list:
    document.querySelector<HTMLDivElement>(
      '#capture-list',
    )!,

  status:
    document.querySelector<HTMLDivElement>(
      '#capture-status',
    )!,
};

/**
 * Request a fresh field scan.
 */
scanUi.scanButton.addEventListener(
  'click',
  async () => {
    setScanningState(
      true,
      scanUi,
    );

    try {
      const response =
        (await browser.runtime.sendMessage({
          type:
            'FORMASSIST_SCAN_ACTIVE_TAB',
        })) as ScanResponse;

      if (!response.success) {
        showScanError(
          response.error,
          scanUi,
        );
        return;
      }

      renderScanResponse(
        response,
        scanUi,
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Growth FormAssist] Popup scan failed:',
          error,
        );
      }

      showScanError(
        'FormAssist could not communicate with the extension. Try closing and reopening the popup.',
        scanUi,
      );
    } finally {
      setScanningState(
        false,
        scanUi,
      );
    }
  },
);

/**
 * Load saved captures.
 */
async function loadSavedCaptures():
  Promise<void> {
  captureUi.status.className =
    'capture-status loading';

  captureUi.status.textContent =
    'Loading saved captures...';

  try {
    const response =
      await browser.runtime.sendMessage({
        type:
          'FORMASSIST_GET_CAPTURED_TEMPLATES',
      });

    renderCapturedTemplates(
      response,
      captureUi,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Unable to load saved captures:',
        error,
      );
    }

    renderCapturedTemplates(
      {
        success: false,
        error:
          'FormAssist could not load saved captures.',
      },
      captureUi,
    );
  }
}

/**
 * Refresh saved captures and the autofill selector together.
 */
document
  .querySelector<HTMLButtonElement>(
    '#refresh-captures',
  )!
  .addEventListener(
    'click',
    () => {
      void loadSavedCaptures();
      void initializeAutofillUi();
    },
  );

/**
 * Reload both interfaces after returning from capture details.
 */
captureUi.list.addEventListener(
  'formassist:capture-back',
  () => {
    void loadSavedCaptures();
    void initializeAutofillUi();
  },
);

/**
 * Initialize saved captures and autofill.
 */
void loadSavedCaptures();
void initializeAutofillUi();
