import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';

class InputCheckbox extends LitElement {
    static get styles() {
        return [css`
        :host {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            user-select: none;
            line-height: 100%;
        }

        label {
            padding: 0 10px;
        }
        `]
    }
    render() {
        // return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        // return this.leftLabel ? html`${this.label ? html`<label>${this.label}</label>` : ``}<input type="checkbox" ?disabled="${this.disabled instanceof Function ? this.disabled() : this.disabled}" ?checked="${this.checked}" @click="${this._handleClick}"></input>` : html`<input type="checkbox" ?disabled="${this.disabled instanceof Function ? this.disabled() : this.disabled}" ?checked="${this.checked}" @click="${this._handleClick}"></input>${this.label ? html`<label>${this.label}</label>` : ``}`
        return this.leftLabel ? html`${this.label ? html`<label>${this.label}</label>` : ``}<input type="checkbox" ?disabled="${this.disabled}" ?checked="${this.checked}" @click="${this._handleClick}"></input>` : html`<input type="checkbox" ?disabled="${this.disabled}" ?checked="${this.checked}" @click="${this._handleClick}"></input>${this.label ? html`<label>${this.label}</label>` : ``}`

    }
    static get properties() {
        return {
            label: {
                type: String
            },
            checked: {
                type: Boolean,
                reflect: true
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super();
        //this.addEventListener('click', (e) => this._handleClick(e));
        this.checked = false
        this.label = null
        this.leftLabel = false
        this.disabled = false
    }
    _handleClick(e) {
        this.checked = !this.checked;

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                checked: this.checked
            }
        }));
    }
    /*_iconName(checked) {
        return checked
            ? 'check-square'
            : 'square';
    }*/

}
customElements.define('input-checkbox', InputCheckbox);
