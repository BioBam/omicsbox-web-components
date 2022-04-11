import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'

class InputFormatting extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            display: flex;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            --input-button-back-color: #fafafa;
            --input-border-color: #ccc;
            --input-button-back-hover-color: #ffffff;
            --input-button-back-active-color: #ccc;
            --icon-selected: #3e7bf0;
            --icon-selected-hover-color: #3e7bf0;
        }

        span {
            flex: 1 0 20%;
        }

        input-text {
            width: 40px;
        }
        `]
    }
    static get properties() {
        return {
            label: {
                type: String,
                reflect: true
            },
            options: {
                type: Object
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super()

        this.label = ''
        // this.options = {
        //     fontStyle: 'normal',
        //     fontWeight: 'normal',
        //     fontSize: 12,
        // }
        this.options = {}
        this.disabled = false

        // this.allowedOptions = Object.keys(this.options)
    }
    render() {
        //return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        return html`
            <label>${this.label}</label>
            <span></span>
            <input-button class="${this.disabled ? 'disabled' : ''}" @click="${this.handleBoldClick}"><fa-icon .enabled="${(!this.disabled)}" g="solid" n="bold" ?selected="${this.options.fontWeight == 'bold'}"></fa-icon></input-button>
            <input-button class="${this.disabled ? 'disabled' : ''}" @click="${this.handleStyleClick}"><fa-icon .enabled="${(!this.disabled)}" g="solid" n="italic" ?selected="${this.options.fontStyle == 'italic'}"></fa-icon></input-button>
            <input-text .disabled="${this.disabled}" type="number" @change="${this.handleInputChange}" value="${this.options.fontSize}" min="10" max="100"></input-text>
        `
    }

    handleSaveClick(e) {
        /*this.dispatchEvent(new CustomEvent('change', {
            detail: {
                name: this.name
            }
        }));*/
    }

    handleInputChange(e) {
        this.options.fontSize = e.detail.value

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                options: this.options,
                property: "fontSize",
            }
        }));
    }

    handleBoldClick(e) {
        this.options.fontWeight = (this.options.fontWeight || 'normal') == 'bold' ? 'normal' : 'bold'
        this.requestUpdate()

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                options: this.options,
                property: "fontWeight",
            }
        }));
    }

    handleStyleClick(e) {
        this.options.fontStyle = (this.options.fontStyle || 'normal') == 'italic' ? 'normal' : 'italic'
        this.requestUpdate()

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                options: this.options,
                property: "fontStyle",
            }
        }));
    }
}
customElements.define('input-formatting', InputFormatting);