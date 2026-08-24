/**
 * Growth FormAssist - Page Status
 *
 * Shared temporary notifications displayed directly on webpages.
 *
 * Inline styles are used deliberately so carrier webpages cannot
 * accidentally hide or restyle FormAssist feedback.
 */

type PageStatusState =
  | 'working'
  | 'success'
  | 'error';

/**
 * Display capture feedback.
 */
export function showCaptureStatus(
  message: string,
  state: PageStatusState,
): void {
  showPageStatus(
    '[data-formassist-capture-status]',
    message,
    state,
    'data-formassist-capture-status',
  );
}

/**
 * Display autofill feedback.
 */
export function showAutofillStatus(
  message: string,
  state: PageStatusState,
): void {
  showPageStatus(
    '[data-formassist-autofill-status]',
    message,
    state,
    'data-formassist-autofill-status',
  );
}

/**
 * Render one temporary webpage notification.
 */
function showPageStatus(
  selector: string,
  message: string,
  state: PageStatusState,
  dataAttribute: string,
): void {
  document
    .querySelector(selector)
    ?.remove();

  const status =
    document.createElement('div');

  status.setAttribute(
    dataAttribute,
    'true',
  );

  status.className =
    `formassist-page-status formassist-${state}`;

  status.textContent = message;

  status.style.position = 'fixed';
  status.style.top = '20px';
  status.style.right = '20px';
  status.style.zIndex = '2147483647';
  status.style.maxWidth = '420px';
  status.style.padding = '14px 18px';
  status.style.borderRadius = '8px';
  status.style.background = '#ffffff';
  status.style.border =
    '1px solid #d1d5db';
  status.style.boxShadow =
    '0 4px 16px rgba(0, 0, 0, 0.18)';
  status.style.fontFamily =
    'Arial, Helvetica, sans-serif';
  status.style.fontSize = '14px';
  status.style.fontWeight = '600';
  status.style.lineHeight = '1.4';
  status.style.color = '#111827';

  document.documentElement.appendChild(
    status,
  );

  if (state !== 'working') {
    window.setTimeout(() => {
      status.remove();
    }, 5000);
  }
}

