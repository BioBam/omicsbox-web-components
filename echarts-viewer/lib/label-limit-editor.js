import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'
// import {live} from '../node_modules/lit-html/directives/live.js';

const NUMBER_MAX_DIGITS = 10
const LABEL_MAX_CHARS = 200

class LabelLimitEditor extends LitElement {
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
            flex-wrap: wrap;
            --input-button-back-color: #fafafa;
            --input-border-color: #ccc;
            --input-button-back-hover-color: #ffffff;
            --input-button-back-active-color: #ccc;
            --icon-selected: #3e7bf0;
            --icon-selected-hover-color: #3e7bf0;
        }

        div {
            display: flex;
            width: 100%;
            align-items: center;
        }

        div+div {
            margin-top: 5px;
        }

        span {
            flex: 1 0 20%;
        }

        input-text {
            width: 65px;
        }
        `]
    }
    static get properties() {
        return {
            label: {
                type: String,
                reflect: true
            },
            axis: {
                type: Array
            },
            limitValue: {
                type: Array,
                hasChanged: (value, oldValue) => true 
            },
            scientificMode: {
                type: Array
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super()

        this.label = 'Label char limit'
        this.axis = []
        this.limitValue = []
        this.scientificMode = []
        this.disabled = false
    }

    _getAxisLabel(axisIndex) {
        let suffix = this.axis.length > 1 ? ` (${this.axis[axisIndex].position})` : ''
        let label = this.axis[axisIndex].type == 'category' ? 'Char limit' : (this.scientificMode[axisIndex] ? 'Significant digits' : 'Max dec. digits')

        return `${label}${suffix}`;
    }

    _getAxisMax(axisIndex) {
        return this.axis[axisIndex].type == 'category' ? LABEL_MAX_CHARS : NUMBER_MAX_DIGITS
    }

    render() {
        return this.axis.map((axis, index) => axis.axisLabel.show === false ? '' : html`
                <div>
                    <label>${this._getAxisLabel(index)}</label>
                    <span></span>
                    <input-button @click="${e => this.handleClickButton(index)}" class="${this.disabled || axis.type == 'category' ? 'disabled' : ''}"><fa-icon .enabled="${(!this.disabled) && axis.type != 'category'}" g="misc" n="scientific-notation" ?selected="${this.scientificMode[index]}"></fa-icon></input-button>
                    <input-text .index="${index}" .disabled="${this.disabled}" @change="${e => this.handleInputChange(index, e)}" .value="${this.limitValue[index]}" type="number" min="0" step="1" max="${this._getAxisMax(index)}"></input-text>
                </div>`)
    }

    handleClickButton(index) {
        if ((!this.disabled) && this.axis[index].type != 'category') {
            this.scientificMode[index] = !this.scientificMode[index]

            this.requestUpdate()

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    index: index,
                    value: this.scientificMode[index],
                    attribute: 'mode'
                }
            }));
        }
    }

    handleInputChange(index, e) {
        // The 'max' input property only has effect when using the spinner. We control it
        // here as well for manual entering with the keyboard.
        this.limitValue[index] = Math.min(e.detail.value, this._getAxisMax(index))

        // e.currentTarget.setAttribute('value', this.limitValue[index])

        e.currentTarget.value = this.limitValue[index]

        this.requestUpdate()

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                index: index,
                value: this.limitValue[index],
                attribute: 'limit'
            }
        }));
    }
}
customElements.define('label-limit-editor', LabelLimitEditor);