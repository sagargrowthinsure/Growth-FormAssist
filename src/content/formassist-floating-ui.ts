/**
 * Growth FormAssist - Floating Page UI
 *
 * Provides the primary FormAssist launcher directly inside
 * the carrier webpage.
 *
 * The UI is isolated inside a Shadow DOM so carrier CSS and
 * JavaScript cannot accidentally style or manipulate it.
 */

const HOST_ID =
  'growth-formassist-host';

export interface FormAssistScanField {
  index: number;
  label: string;
  fieldType: string;
  value: string;
  checked: boolean | null;
  id: string;
  name: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  options: number;
  carrierLabel: string;
  coverageCode: string;
}

export interface FormAssistScanResult {
  carrierName: string;
  fieldCount: number;
  fields: FormAssistScanField[];
}

export interface FormAssistFloatingUi {
  destroy(): void;

  showScanResult(
    result: FormAssistScanResult,
  ): void;

  showStatus(
    message: string,
  ): void;
}

export interface FormAssistFloatingUiOptions {
  onScan: () =>
    FormAssistScanResult |
    Promise<FormAssistScanResult>;
}

export function mountFormAssistFloatingUi(
  root: Document,
  options: FormAssistFloatingUiOptions,
): FormAssistFloatingUi {
  const existing =
    root.getElementById(HOST_ID);

  if (existing) {
    return {
      destroy(): void {
        existing.remove();
      },

      showScanResult(
        _result: FormAssistScanResult,
      ): void {},

      showStatus(
        _message: string,
      ): void {},
    };
  }

  const host =
    root.createElement('div');

  host.id =
    HOST_ID;

  const shadow =
    host.attachShadow({
      mode: 'closed',
    });

  const style =
    root.createElement('style');

  style.textContent = `
    :host {
      all: initial;
    }

    .formassist-launcher {
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 2147483647;

      width: 48px;
      height: 48px;

      border: 0;
      border-radius: 50%;

      background: #2563eb;
      color: #ffffff;

      display: flex;
      align-items: center;
      justify-content: center;

      cursor: pointer;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 13px;
      font-weight: 700;

      box-shadow:
        0 4px 14px
        rgba(0, 0, 0, 0.25);
    }

    .formassist-launcher:hover {
      transform: scale(1.06);
    }

    .formassist-panel {
      position: fixed;
      right: 20px;
      bottom: 84px;
      z-index: 2147483647;

      width: 720px;
      max-width: calc(100vw - 40px);

      max-height: calc(100vh - 110px);

      background: #ffffff;
      color: #111827;

      border:
        1px solid
        #d1d5db;

      border-radius: 12px;

      box-shadow:
        0 12px 36px
        rgba(0, 0, 0, 0.22);

      overflow: hidden;

      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    .formassist-panel[hidden] {
      display: none;
    }

    .formassist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 14px 16px;

      background: #f8fafc;

      border-bottom:
        1px solid
        #e5e7eb;
    }

    .formassist-title {
      margin: 0;

      font-size: 15px;
      line-height: 20px;
      font-weight: 700;
    }

    .formassist-subtitle {
      margin-top: 2px;

      color: #6b7280;

      font-size: 11px;
      line-height: 16px;
    }

    .formassist-close {
      width: 30px;
      height: 30px;

      border: 0;
      border-radius: 6px;

      background: transparent;
      color: #6b7280;

      cursor: pointer;

      font-size: 20px;
      line-height: 1;
    }

    .formassist-close:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .formassist-body {
      padding: 16px;
      overflow: auto;
      max-height: calc(100vh - 180px);
    }

    .formassist-status {
      margin: 0;

      color: #4b5563;

      font-size: 13px;
      line-height: 19px;
    }

    .formassist-carrier {
      margin-top: 12px;
      padding: 10px 12px;

      border-radius: 8px;

      background: #eff6ff;
      color: #1e40af;

      font-size: 12px;
      line-height: 18px;
      font-weight: 600;
    }

    .formassist-table-wrap {
      margin-top: 14px;

      border:
        1px solid
        #e5e7eb;

      border-radius: 8px;

      overflow: auto;

      max-height: 480px;
    }

    .formassist-table {
      width: 100%;
      border-collapse: collapse;

      font-size: 11px;
    }

    .formassist-table th {
      position: sticky;
      top: 0;
      z-index: 1;

      padding: 8px;

      background: #f3f4f6;

      border-bottom:
        1px solid
        #d1d5db;

      text-align: left;

      font-weight: 700;
      white-space: nowrap;
    }

    .formassist-table td {
      padding: 7px 8px;

      border-bottom:
        1px solid
        #f0f0f0;

      vertical-align: top;
    }

    .formassist-table tr:last-child td {
      border-bottom: 0;
    }

    .formassist-index {
      color: #6b7280;
      text-align: right;
    }

    .formassist-field-label {
      font-weight: 600;
      min-width: 150px;
    }

    .formassist-value {
      max-width: 180px;
      word-break: break-word;
    }

    .formassist-muted {
      color: #9ca3af;
    }

    .formassist-actions {
      display: flex;
      gap: 8px;

      margin-top: 16px;
    }

    .formassist-button {
      flex: 1;

      min-height: 36px;

      border: 1px solid #d1d5db;
      border-radius: 7px;

      background: #ffffff;
      color: #374151;

      cursor: pointer;

      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
    }

    .formassist-button:hover {
      background: #f9fafb;
    }

    .formassist-button-primary {
      border-color: #2563eb;
      background: #2563eb;
      color: #ffffff;
    }

    .formassist-button-primary:hover {
      background: #1d4ed8;
    }
  `;

  const launcher =
    root.createElement('button');

  launcher.type =
    'button';

  launcher.className =
    'formassist-launcher';

  launcher.title =
    'Open Growth FormAssist';

  launcher.setAttribute(
    'aria-label',
    'Open Growth FormAssist',
  );

  launcher.setAttribute(
    'aria-expanded',
    'false',
  );

  launcher.textContent =
    'GF';

  const panel =
    root.createElement('section');

  panel.className =
    'formassist-panel';

  panel.hidden =
    true;

  panel.setAttribute(
    'aria-label',
    'Growth FormAssist',
  );

  const header =
    root.createElement('div');

  header.className =
    'formassist-header';

  const headingContainer =
    root.createElement('div');

  const title =
    root.createElement('div');

  title.className =
    'formassist-title';

  title.textContent =
    'Growth FormAssist';

  const subtitle =
    root.createElement('div');

  subtitle.className =
    'formassist-subtitle';

  subtitle.textContent =
    'Carrier page assistant';

  headingContainer.append(
    title,
    subtitle,
  );

  const closeButton =
    root.createElement('button');

  closeButton.type =
    'button';

  closeButton.className =
    'formassist-close';

  closeButton.title =
    'Close FormAssist';

  closeButton.setAttribute(
    'aria-label',
    'Close FormAssist',
  );

  closeButton.textContent =
    '×';

  header.append(
    headingContainer,
    closeButton,
  );

  const body =
    root.createElement('div');

  body.className =
    'formassist-body';

  const status =
    root.createElement('p');

  status.className =
    'formassist-status';

  status.textContent =
    'FormAssist is ready on this page.';

  const carrier =
    root.createElement('div');

  carrier.className =
    'formassist-carrier';

  carrier.textContent =
    'Carrier has not been scanned yet.';

  const tableWrap =
    root.createElement('div');

  tableWrap.className =
    'formassist-table-wrap';

  tableWrap.hidden =
    true;

  const table =
    root.createElement('table');

  table.className =
    'formassist-table';

  tableWrap.append(
    table,
  );

  const actions =
    root.createElement('div');

  actions.className =
    'formassist-actions';

  const scanButton =
    root.createElement('button');

  scanButton.type =
    'button';

  scanButton.className =
    'formassist-button formassist-button-primary';

  scanButton.textContent =
    'Scan Page';

  const closePanelButton =
    root.createElement('button');

  closePanelButton.type =
    'button';

  closePanelButton.className =
    'formassist-button';

  closePanelButton.textContent =
    'Close';

  actions.append(
    scanButton,
    closePanelButton,
  );

  body.append(
    status,
    carrier,
    tableWrap,
    actions,
  );

  panel.append(
    header,
    body,
  );

  shadow.append(
    style,
    launcher,
    panel,
  );

  root.documentElement.appendChild(
    host,
  );

  const openPanel =
    (): void => {
      panel.hidden =
        false;

      launcher.setAttribute(
        'aria-expanded',
        'true',
      );
    };

  const closePanel =
    (): void => {
      panel.hidden =
        true;

      launcher.setAttribute(
        'aria-expanded',
        'false',
      );
    };

  const showStatus =
    (message: string): void => {
      status.textContent =
        message;
    };

  const createCell =
    (
      value: string,
      className?: string,
    ): HTMLTableCellElement => {
      const cell =
        root.createElement('td');

      if (className) {
        cell.className =
          className;
      }

      cell.textContent =
        value;

      return cell;
    };

  const showScanResult =
    (
      result: FormAssistScanResult,
    ): void => {
      status.textContent =
        'Page scan completed.';

      carrier.textContent =
        `${result.carrierName} · ` +
        `${result.fieldCount} detected fields`;

      table.replaceChildren();

      const head =
        root.createElement('thead');

      const headerRow =
        root.createElement('tr');

      [
        '#',
        'Field',
        'Type',
        'Current Value',
        'Carrier Label',
        'Coverage Code',
        'ID / Name',
      ].forEach(
        (text) => {
          const cell =
            root.createElement('th');

          cell.textContent =
            text;

          headerRow.append(
            cell,
          );
        },
      );

      head.append(
        headerRow,
      );

      const body =
        root.createElement('tbody');

      result.fields.forEach(
        (field) => {
          const row =
            root.createElement('tr');

          row.append(
            createCell(
              String(
                field.index + 1,
              ),
              'formassist-index',
            ),
          );

          row.append(
            createCell(
              field.label ||
                '(no label)',
              'formassist-field-label',
            ),
          );

          row.append(
            createCell(
              field.fieldType,
            ),
          );

          const currentValue =
            field.checked !== null
              ? field.checked
                ? 'Checked'
                : 'Unchecked'
              : field.value ||
                '(empty)';

          row.append(
            createCell(
              currentValue,
              'formassist-value',
            ),
          );

          row.append(
            createCell(
              field.carrierLabel ||
                '—',
            ),
          );

          row.append(
            createCell(
              field.coverageCode ||
                '—',
            ),
          );

          row.append(
            createCell(
              field.id ||
                field.name ||
                '—',
              'formassist-value',
            ),
          );

          body.append(
            row,
          );
        },
      );

      table.append(
        head,
        body,
      );

      tableWrap.hidden =
        false;
    };

  launcher.addEventListener(
    'click',
    () => {
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    },
  );

  closeButton.addEventListener(
    'click',
    closePanel,
  );

  closePanelButton.addEventListener(
    'click',
    closePanel,
  );

  scanButton.addEventListener(
    'click',
    () => {
      showStatus(
        'Scanning page...',
      );

      tableWrap.hidden =
        true;

      scanButton.disabled =
        true;

      Promise.resolve(
        options.onScan(),
      )
        .then(
          (result) => {
            showScanResult(
              result,
            );
          },
        )
        .catch(
          (error: unknown) => {
            if (
              import.meta.env.DEV
            ) {
              console.error(
                '[Growth FormAssist] Page scan failed:',
                error,
              );
            }

            showStatus(
              'Page scan failed. Please try again.',
            );

            carrier.textContent =
              'Unable to inspect this page.';
          },
        )
        .finally(
          () => {
            scanButton.disabled =
              false;
          },
        );
    },
  );

  return {
    destroy(): void {
      host.remove();
    },

    showScanResult,

    showStatus,
  };
}

