import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
// import './input-checkbox.js';
// import './input-color-picker.js'
import './input-symbol-editor.js'
import '../node_modules/web-libraries/elements/input-button.js'

class InputSeries extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            display: flex;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            --input-button-back-color: #fafafa;
            --input-border-color: black;
            --input-button-back-hover-color: #ffffff;
            --input-button-back-active-color: black;
        }

        /*:host(:host:focus-within) input-button {
            visibility: visible;
        }*/

        input-button, input-symbol-editor {
            position: absolute;
            top: 0;
            height: 23px;
            visibility: hidden;
        }

        input-checkbox {
            --icon-color: #000;
            --icon-hover-color: #000;

            font-size: 23px;
            line-height: 23px;
        }

        #seriesinput {
            font-family: inherit;
            font-size: inherit;
            box-sizing: border-box;
            display: block;
            border: 1px solid #ccc;
            padding: 0px 4px;
            margin: 0;
            width: 100%;
            background-color: #fafafa;
            line-height: 21px;
            transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
        }

        fieldset {
            border: 0;
            margin: 0;
            padding: 0;
            display: inline;
            width: 100%;
        }

        fieldset:focus-within input-button, fieldset:focus-within input-symbol-editor {
            visibility: visible;
        }

        fieldset:focus-within {
            border: 2px red;
        }

        `]
    }
    static get properties() {
        return {
            name: {
                type: String,
                reflect: true
            },
            originalName: {
                type: String
            },
            enabled: {
                type: Boolean,
                reflect: true
            },
            selectColor: {
                type: Boolean
            },
            color: {
                type: String
            },
            id: {
                type: Number
            },
            symbol: {
                type: String
            },
            symbolSize: {
                type: Number
            }
        };
    }

    set name(value) {
        // Update only the first time
        if (this.originalName === null && value.length) {
            this.originalName = value
        }

        let oldValue = this._name;
        this._name = value;

        this.requestUpdate('name', oldValue);
    }

    get name() {
        return this._name;
    }

    constructor() {
        super()

        this._name = "Series name"
        this.originalName = null
        this.id = 0
        this.enabled = true
        this.color = ''
        this.selectColor = true
        this.symbol = null
        this.symbolSize = null

    }
    render() {
        //return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        return html`
            <input-checkbox ?checked="${this.enabled}" label="" @change="${this.handleCheckbox}"></input-checkbox>
            <input-color-picker color="${this.color}" @colorchange="${this.handleColorChange}" .label="${false}" .selectable="${this.selectColor}"></input-color-picker>
            <fieldset>
                <input id="seriesinput" type="text" value="${this.name}" @input="${this.handleInputChange}" @blur="${this.handleInputBlur}">
                ${this.symbol ? html`<input-symbol-editor .symbol="${this.symbol}" .symbolSize="${this.symbolSize}" @symbolchange="${this.handleSymbolChange}" @sizechange="${this.handleSymbolSizeChange}" style="right: 48px;"></input-symbol-editor>`: ``}
                <input-button @mousedown="${this.handleSaveClick}" style="right: 23px;"><fa-icon g="solid" n="check"></fa-icon></input-button>
                <input-button @mousedown="${this.handleCancelClick}" style="right: 0;"><fa-icon g="solid" n="times"></fa-icon></input-button>
            </fieldset>
        `
    }

    handleSymbolChange(e) {
        this.symbol = e.detail.symbol

        this.dispatchEvent(new CustomEvent('symbolchange', {
            detail: {
                property: 'symbol',
                value: this.symbol,
                id: this.id
            }
        }));
    }

    handleSymbolSizeChange(e) {
        this.symbolSize = e.detail.size

        this.dispatchEvent(new CustomEvent('symbolchange', {
            detail: {
                property: 'symbolSize',
                value: this.symbolSize,
                id: this.id
            }
        }));
    }

    handleColorChange(e) {
        this.color = e.detail.color

        this.dispatchEvent(new CustomEvent('colorchange', {
            detail: {
                color: this.color,
                id: this.id
            }
        }));
    }

    handleCheckbox(e) {
        this.enabled = e.detail.checked

        this.dispatchEvent(new CustomEvent('toggle', {
            detail: {
                enabled: this.enabled,
                id: this.id
            }
        }));
    }

    handleCancelClick(e) {
        this.dispatchEvent(new CustomEvent('cancel', {
            detail: {
                name: this.name,
                id: this.id
            }
        }));
    }

    handleSaveClick(e) {
        this.originalName = this.name

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                name: this.name,
                id: this.id
            }
        }));
    }

    handleInputBlur(e) {
        this.name = this.originalName
        e.target.value = this.originalName;
    }

    handleInputChange(e) {
        this.name = e.target.value
    }
}
customElements.define('input-series', InputSeries);