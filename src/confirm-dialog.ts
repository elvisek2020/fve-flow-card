export interface ConfirmDialogOptions {
  title: string;
  message: string;
  /** Text potvrzovacího tlačítka, např. "Vypnout". */
  confirmLabel: string;
  /** Barva akcentu — rám dialogu a potvrzovací tlačítko. */
  accent?: string;
  /** Druhá volba vedle potvrzení (např. „Jen v nízkém tarifu“). */
  secondaryLabel?: string;
  /** Výběr hodnoty nad tlačítky (např. cíl nabití 50 / 80 / 100 %). */
  values?: Array<{ value: number; label: string; disabled?: boolean; title?: string }>;
  /** Předvybraná hodnota z `values`. */
  value?: number;
  /** Text dialogu podle vybrané hodnoty (jinak `message`). */
  describe?: (value: number) => string;
}

export type DialogChoice = 'primary' | 'secondary' | null;

export interface DialogResult {
  choice: DialogChoice;
  /** Vybraná hodnota z `values` (undefined bez výběru). */
  value?: number;
}

const DIALOG_TAG = 'fve-flow-confirm-dialog';

/** Malý potvrzovací modal ve stejném glassmorphism stylu jako 48h grafy. */
class FveFlowConfirmDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private _resolve?: (result: DialogResult) => void;
  private _choice: DialogChoice = null;
  private _value?: number;
  private _options?: ConfirmDialogOptions;

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
          /* Celé pixely: výška okna i poloha tlačítek bez zlomků pixelu. */
          line-height: 22px;
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
        /* Výběr hodnoty jako segmenty, celé pixely jako u tlačítek. */
        .values {
          display: flex;
          gap: 8px;
          margin: 0 0 14px;
        }
        .values[hidden] {
          display: none;
        }
        .values button {
          flex: 1 1 0;
          min-width: 0;
          color: var(--secondary-text-color, #a8bbc6);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .values button:hover:not(:disabled),
        .values button:focus-visible {
          color: var(--primary-text-color, #fff);
          border-color: color-mix(in srgb, var(--dialog-accent) 70%, transparent);
          outline: none;
        }
        .values button[aria-checked='true'] {
          color: #0a0f16;
          background: var(--dialog-accent);
          border-color: var(--dialog-accent);
        }
        .values button:disabled {
          cursor: default;
          opacity: 0.35;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 0 22px 20px;
        }
        button {
          /* Pevná výška v celých pixelech: s výškou z písma (13,5 px → 35,6 px) padl
             spodní okraj na iPadu a při škálování 125 % mezi pixely a skoro zmizel. */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          height: 36px;
          padding: 0 18px;
          font: inherit;
          font-size: 13.5px;
          line-height: 1;
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
        .secondary {
          color: var(--dialog-accent);
          background: color-mix(in srgb, var(--dialog-accent) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--dialog-accent) 55%, transparent);
        }
        .secondary[hidden] {
          display: none;
        }
        /* Zvýraznění jen barvami, ne přes filter: filter kreslí tlačítko do vlastní
           vrstvy a když dialog stojí na půl pixelu, ořízne spodní řádek okraje. */
        .secondary:hover,
        .secondary:focus-visible {
          color: color-mix(in srgb, var(--dialog-accent) 80%, #fff);
          background: color-mix(in srgb, var(--dialog-accent) 18%, transparent);
          border-color: color-mix(in srgb, var(--dialog-accent) 85%, transparent);
          outline: none;
        }
        .confirm {
          color: #0a0f16;
          background: var(--dialog-accent);
          border: 1px solid var(--dialog-accent);
          box-shadow: 0 0 14px color-mix(in srgb, var(--dialog-accent) 45%, transparent);
        }
        .confirm:hover,
        .confirm:focus-visible {
          background: color-mix(in srgb, var(--dialog-accent) 85%, #fff);
          border-color: color-mix(in srgb, var(--dialog-accent) 85%, #fff);
          outline: none;
        }
      </style>
      <dialog aria-labelledby="confirm-title">
        <div class="body">
          <h2 id="confirm-title"></h2>
          <div class="values" role="radiogroup" hidden></div>
          <p></p>
        </div>
        <div class="actions">
          <button type="button" class="cancel">Zrušit</button>
          <button type="button" class="secondary" hidden></button>
          <button type="button" class="confirm"></button>
        </div>
      </dialog>
    `;

    this._dialog = root.querySelector('dialog')!;
    root.querySelector('.cancel')!.addEventListener('click', () => this._dialog.close());
    root.querySelector('.confirm')!.addEventListener('click', () => {
      this._choice = 'primary';
      this._dialog.close();
    });
    root.querySelector('.secondary')!.addEventListener('click', () => {
      this._choice = 'secondary';
      this._dialog.close();
    });
    this._dialog.addEventListener('click', (event) => {
      if (event.target === this._dialog) this._dialog.close();
    });
    this._dialog.addEventListener('close', () => {
      this._resolve?.({ choice: this._choice, value: this._value });
      this.remove();
    });
  }

  public show(options: ConfirmDialogOptions): Promise<DialogResult> {
    const root = this.shadowRoot!;
    this._options = options;
    root.querySelector('h2')!.textContent = options.title;
    root.querySelector('.confirm')!.textContent = options.confirmLabel;
    const secondary = root.querySelector<HTMLButtonElement>('.secondary')!;
    secondary.hidden = !options.secondaryLabel;
    secondary.textContent = options.secondaryLabel ?? '';
    if (options.accent) this.style.setProperty('--dialog-accent', options.accent);
    const values = root.querySelector<HTMLDivElement>('.values')!;
    const list = options.values ?? [];
    values.hidden = !list.length;
    values.replaceChildren(
      ...list.map((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.dataset.value = String(v.value);
        b.textContent = v.label;
        b.disabled = !!v.disabled;
        if (v.title) b.title = v.title;
        b.addEventListener('click', () => this._select(v.value));
        return b;
      }),
    );
    const enabled = list.filter((v) => !v.disabled);
    const initial = enabled.find((v) => v.value === options.value) ?? enabled[enabled.length - 1];
    this._value = initial?.value;
    this._select(this._value);
    this._dialog.showModal();
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  /** Vybere hodnotu: zvýrazní segment, přepíše text a bez hodnoty zakáže potvrzení. */
  private _select(value: number | undefined): void {
    const root = this.shadowRoot!;
    const o = this._options;
    this._value = value;
    for (const b of root.querySelectorAll<HTMLButtonElement>('.values button')) {
      b.setAttribute('aria-checked', String(b.dataset.value === String(value)));
    }
    root.querySelector('p')!.textContent = value != null && o?.describe ? o.describe(value) : o?.message ?? '';
    const missing = !!o?.values?.length && value == null;
    for (const b of root.querySelectorAll<HTMLButtonElement>('.confirm, .secondary')) b.disabled = missing;
  }
}

if (!customElements.get(DIALOG_TAG)) {
  customElements.define(DIALOG_TAG, FveFlowConfirmDialog);
}

/** Otevře dialog s volbou a případným výběrem hodnoty (`values`). */
export function openValueDialog(options: ConfirmDialogOptions): Promise<DialogResult> {
  const dialog = document.createElement(DIALOG_TAG) as FveFlowConfirmDialog;
  document.body.append(dialog);
  return dialog.show(options);
}

/** Otevře dialog s volbou; vrátí 'primary', 'secondary' nebo null (zrušeno). */
export async function openChoiceDialog(options: ConfirmDialogOptions): Promise<DialogChoice> {
  return (await openValueDialog(options)).choice;
}

/** Otevře potvrzovací dialog; vrátí true po potvrzení, false po zrušení. */
export async function openConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return (await openChoiceDialog(options)) === 'primary';
}
