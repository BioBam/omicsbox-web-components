import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'
import '../node_modules/web-libraries/elements/select-down.js'
import '../node_modules/web-libraries/sidebar/input-text.js'
import { ifDefined } from '../node_modules/lit-html/directives/if-defined.js';

class AxisIntervalEditor extends LitElement {
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

        .inputWidth {
            width: var(--input-width);
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
                type: Array,
                hasChanged: (value, oldValue) => true 
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super()

        this.maxValue = 100
        this.label = 'Label interval'
        this.axis = []
        this.disabled = false
        this.customAliases = false
        this.categoryOptions = {
            'Show all': 0,
            'Adaptative': null
        }
    }

    _getAxisLabel(axisIndex) {
        let suffix = this.axis.length > 1 ? ` (${this.axis[axisIndex].position})` : ''

        return `${this.label}${suffix}`;
    }

    _getSelectedCategory(axisIndex) {
        return Object.keys(this.categoryOptions).find(key => {
            // Assume that if no option has been set, 'show all' is the default.
            // TODO: Seems like 'null' values are not stored in the chart
            return ('interval' in this.axis[axisIndex].axisLabel ? this.axis[axisIndex].axisLabel.interval : 0) == this.categoryOptions[key]
        })
    }

    render() {
        return this.axis.map((axis, index) => axis.axisLabel.show === false ? '' : html`
                <div>
                    <label>${this._getAxisLabel(index)}</label>
                    <span></span>
                    ${axis.type == 'category' ?
                html`<select-down class="inputWidth" .options="${Object.keys(this.categoryOptions)}" .selectedOption="${{ title: this._getSelectedCategory(index) }}" .enabled="${!this.disabled}" @select="${e => this.handleSelectChange(index, e)}"></select-down>` :
                html`<input-text class="inputWidth" .disabled="${this.disabled || this.customAliases}" @change="${e => this.handleInputChange(index, e)}" value="${axis.splitNumber}" type="range" min="1" step="1" max="${ifDefined(this.maxValue || 100)}" title="This is a reference number, the final number of intervals will be adjusted based on readability."></input-text>`}
                </div>`)
    }

    handleSelectChange(index, e) {
        if ('axisLabel' in this.axis[index]) {
            console.log("AXIS CHANGE", e)

            if (this.axis[index].axisLabel.interval != this.categoryOptions[e.detail]) {

                this.axis[index].axisLabel.interval = this.categoryOptions[e.detail]

                this.dispatchEvent(new CustomEvent('change', {
                    detail: {
                        index: index,
                        value: this.axis[index].interval,
                        attribute: 'interval'
                    }
                }));
            }
        } else {
            console.log("NO AXIS LABEL: fix this")
        }
    }

    handleInputChange(index, e) {
        this.axis[index].splitNumber = e.detail.value

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                index: index,
                value: this.axis[index].splitNumber,
                attribute: 'splitNumber'
            }
        }));
    }
}
customElements.define('axis-interval-editor', AxisIntervalEditor);