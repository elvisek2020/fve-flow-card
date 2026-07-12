export interface ConfirmDialogOptions {
  title: string;
  message: string;
  /** Text potvrzovacího tlačítka, např. "Vypnout". */
  confirmLabel: string;
  /** Barva akcentu — rám dialogu a potvrzovací tlačítko. */
  accent?: string;
}

const DIALOG_TAG = 'fve-flow-confirm-dialog';

/** Malý potvrzovací modal ve stejném glassmorphism stylu jako 48h grafy. */
class FveFlowConfirmDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private _resolve?: (confirmed: boolean) => void;
  private _confirmed = false;

  public constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host {
          --dialog-accent: #ffb74d;
          color: var(--primary-text-color, #e6f4fa);
          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
        }
        dialog {
          width: min(420px, calc(100vw - 32px));
          padding: 0;
          overflow: hidden;
          color: inherit;
          background:
            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 45%),
            rgba(7, 16, 25, 0.98);
          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);
          border-radius: 18px;
          box-shadow: 0 0 28px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 20px 64px rgba(0, 0, 0, 0.55);
        }
        dialog::backdrop {
          background: rgba(0, 7, 13, 0.76);
          backdrop-filter: blur(5px);
        }
        .body {
          padding: 22px 22px 18px;
        }
        h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px;
          font-size: 16px;
          font-weight: 650;
          letter-spacing: 0.02em;
        }
        h2::before {
          content: '';
          width: 9px;
          height: 9px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--dialog-accent);
          box-shadow: 0 0 10px var(--dialog-accent);
        }
        p {
          margin: 0;
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.68));
          font-size: 14px;
          line-height: 1.5;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 0 22px 20px;
        }
        button {
          padding: 9px 18px;
          font: inherit;
          font-size: 13.5px;
          font-weight: 650;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 10px;
        }
        .cancel {
          color: var(--secondary-text-color, #a8bbc6);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .cancel:hover,
        .cancel:focus-visible {
          color: var(--primary-text-color, #fff);
          outline: 1px solid rgba(255, 255, 255, 0.3);
        }
        .confirm {
          color: #0a0f16;
          background: var(--dialog-accent);
          border: 1px solid var(--dialog-accent);
          box-shadow: 0 0 14px color-mix(in srgb, var(--dialog-accent) 45%, transparent);
        }
        .confirm:hover,
        .confirm:focus-visible {
          filter: brightness(1.12);
          outline: none;
        }
      </style>
      <dialog aria-labelledby="confirm-title">
        <div class="body">
          <h2 id="confirm-title"></h2>
          <p></p>
        </div>
        <div class="actions">
          <button type="button" class="cancel">Zrušit</button>
          <button type="button" class="confirm"></button>
        </div>
      </dialog>
    `;

    this._dialog = root.querySelector('dialog')!;
    root.querySelector('.cancel')!.addEventListener('click', () => this._dialog.close());
    root.querySelector('.confirm')!.addEventListener('click', () => {
      this._confirmed = true;
      this._dialog.close();
    });
    this._dialog.addEventListener('click', (event) => {
      if (event.target === this._dialog) this._dialog.close();
    });
    this._dialog.addEventListener('close', () => {
      this._resolve?.(this._confirmed);
      this.remove();
    });
  }

  public show(options: ConfirmDialogOptions): Promise<boolean> {
    const root = this.shadowRoot!;
    root.querySelector('h2')!.textContent = options.title;
    root.querySelector('p')!.textContent = options.message;
    root.querySelector('.confirm')!.textContent = options.confirmLabel;
    if (options.accent) this.style.setProperty('--dialog-accent', options.accent);
    this._dialog.showModal();
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }
}

if (!customElements.get(DIALOG_TAG)) {
  customElements.define(DIALOG_TAG, FveFlowConfirmDialog);
}

/** Otevře potvrzovací dialog; vrátí true po potvrzení, false po zrušení. */
export function openConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const dialog = document.createElement(DIALOG_TAG) as FveFlowConfirmDialog;
  document.body.append(dialog);
  return dialog.show(options);
}
