import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'
import '../node_modules/web-libraries/sidebar/input-text.js'

class SpinButton extends LitElement {
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
        }

        span {
            flex: 1 0 20%;
        }

        input-text, input-button {
            width: 30px;
            color: #555;
        }

        input-text {
            border: 1px solid rgba(0, 0, 0, 0.2);
            background-color: #fff;
            font: 11px sans-serif;
            margin-right: 5px;
        }

        input-button {
            box-shadow: 2px 2px 3px 0px rgba(125, 125, 125, 0.25);
            border: 1px solid #ddd;
            background-color: #fafafa;
            font-size: 17px;
            transition: background-color 0.15s;
            margin-right: 4px;
        }

        input-button:hover {
            background-color: #ffffff;
            box-shadow: 2px 2px 3px 0px rgba(125, 125, 125, 0.5);
        }

        input-button:active {
            background-color: #f5f5f5;
        }
        
        `]
    }
    render() {
        //return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        return html`
            <label>${this.label}</label>
            <span></span>
            <input-text></input-text>
            <input-button @click="${this._handleSumClick}">+</input-button>
            <input-button @click="${this._handleRestClick}">-</input-button>
        `
    }
    static get properties() {
        return {
            label: {
                type: String
            },
            checked: {
                type: Boolean
            }
        };
    }
    constructor() {
        super();
        //this.addEventListener('click', (e) => this._handleClick(e));
        this.checked = false
        this.label = 'label'
    }

    _handleSumClick(e) {
        console.log("SUM CLICK")
    }

    _handleRestClick(e) {
        console.log("REST CLICK")
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
customElements.define('spin-button', SpinButton);
