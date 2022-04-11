import { LitElement, html, css } from '../node_modules/lit/index.js';
import {ifDefined} from '../node_modules/lit/directives/if-defined.js';
// import { ifDefined } from '../node_modules/lit-html/directives/if-defined.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import {live} from '../node_modules/lit-html/directives/live.js';

class InputText extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            position: relative;
            display: inline-block;
            box-sizing: border-box;
            height: 25px;
            width: 100px;
            background-color: var(--input-text-back-color);
            border: 1px solid var(--input-border-color);
            line-height: 100%;
        }
        input {
            background-color: inherit;
            font-size: inherit;
            font-family: inherit;
            display: block;
            box-sizing: border-box;
            margin: 0;
            padding: 1em;
            width: 100%;
            height: 100%;
            border: 0;
            outline: transparent solid 0px;
        }

        input[type=number] {
            padding: 0;
            text-align: center;
        }

        input[type=number]::-webkit-textfield-decoration-container {
            height: 100%;
        }

        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button {  
            height: 100% !important;
            opacity: 1 !important;
            border-radius: 0 !important;
        }

        input[type=range] {
            -webkit-appearance: none;
            background: transparent;
        }


        input[type=range]:disabled::-webkit-slider-thumb {
            background: var(--icon-disabled);
            border-color: rgb(214, 214, 214);
        }

        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            border: 1px solid #555;
            height: 18px;
            width: 8px;
            border-radius: 0;
            background: #3e7bf0;
            cursor: pointer;
            margin-top: -8px;
        }

        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: #3e7bf0;
            border-radius: 0;
            border: 0.2px solid #555;
        }

        input[type=range]:focus::-webkit-slider-runnable-track {
            background: #367ebd;
        }

        input[type=range]:disabled::-webkit-slider-runnable-track {
            background: var(--icon-disabled);
            border-color: rgb(214, 214, 214);
        }

        input.suffix {
            padding-right: 2em;
            //min-width: 10em;
        }

        input[type=range] {
            padding: 0;
        }

        span.suffix {
            position: absolute;
            top: 25%;
            right: 5px;
        }
        `]
    }
    render() {
        //return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        // return html`
        //     <input ?disabled="${this.disabled instanceof Function ? this.disabled() : this.disabled}" id="input" class="${ifDefined(this.suffix ? 'suffix' : undefined)}" @change="${this._handleInput}" step="${ifDefined(this.step)}" min="${ifDefined(this.min)}" max="${ifDefined(this.max)}" type="${this.type}" placeholder="${this.placeholder}" value="${this.value}" ?readonly="${this.readonly}">
        //     ${this.suffix ? html`<span class="suffix">${this.suffix}</span>` : ``}
        //     `
        return html`
            <input ?disabled="${this.disabled}" id="input" class="${ifDefined(this.suffix ? 'suffix' : undefined)}" @change="${this._handleInput}" step="${ifDefined(this.step)}" min="${ifDefined(this.min)}" max="${ifDefined(this.max)}" type="${this.type}" placeholder="${this.placeholder}" .value="${live(this.value)}" ?readonly="${this.readonly}">
            ${this.suffix ? html`<span class="suffix">${this.suffix}</span>` : ``}
            `
    }
    static get properties() {
        return {
            value: {
                type: String,
                reflect: true,
                value: '',
                // TODO: does this have any performance issues? We cannot modify the input (for example for ensuring the max value when changed)
                // Only the combination of 'hasChanged => true' and 'live' directive on value (in combination with property) seems to work.
                hasChanged: (value, oldValue) => true
            },
            type: {
                type: String,
                reflect: true
            },
            min: {
                type: Number,
                // reflect: true
            },
            max: {
                type: Number,
                //reflect: true
            },
            step: {
                type: Number
            },
            suffix: {
                type: String
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super();

        this.value = '';
        this.placeholder = '';
        this.type = 'text'
        this.readonly = false;
        this.min = undefined
        this.max = undefined
        this.suffix = null
        this.disabled = false
    }

    _handleInput(e) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: e.target.value
            }
        }));
    }
}
customElements.define('input-text', InputText);
