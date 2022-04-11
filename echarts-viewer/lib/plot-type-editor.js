import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'
import { ORIENTATION } from './ChartConstants.js'

class PlotTypeEditor extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            display: flex;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            justify-content: space-evenly;
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

        input-button {
            font-size: 25px;
            line-height: 25px;
            width: 1.5em;
            height: 1.5em;
            padding: 0;
        }
        `]
    }
    static get properties() {
        return {
            current: {
                type: String,
                reflect: true
            },
            options: {
                type: Array
            }
        };
    }
    constructor() {
        super()

        this.current = 'bar'
        this.options = []
        this.validTypes = ['bar', 'horizontal-bar', 'line', 'area', 'pie']
        this.viewer = null
    }
    render() {
        // I really don't like giving the whole viewer to the plot editor, but since we are now doing a 'full update' of the sidebar at some point,
        // the current property given gets updated and changed to 'line' in the area case. The alternative was to store a separate property in 
        // the series, which seems just as dirty.
        if (this.viewer != null) {
            this.current = `${this.viewer._getOrientation() == ORIENTATION.VERTICAL ? '' : 'horizontal-'}${this.viewer.options.series[0].type || "bar"}`

            // Special case: area is a 'filled' line type plot
            if (this.current == 'line' && this.viewer.options.series[0].areaStyle && this.viewer.options.series[0].areaStyle.opacity == 1) {
                this.current = 'area'
            }
        }

        return html`
            ${this.validTypes.includes('bar') ? html`<input-button @click="${e => this.handleClickButton("bar")}"><fa-icon g="solid" n="chart-bar" ?selected="${this.current == 'bar'}"></fa-icon></input-button>` : ``}
            ${this.validTypes.includes('horizontal-bar') ? html`<input-button @click="${e => this.handleClickButton("horizontal-bar", "bar", true)}"><fa-icon style="transform: scaleX(-1) rotate(-90deg)" g="solid" n="chart-bar" ?selected="${this.current == 'horizontal-bar'}"></fa-icon></input-button>` : ``}
            ${this.validTypes.includes('line') ? html`<input-button @click="${e => this.handleClickButton("line")}"><fa-icon g="solid" n="chart-line" ?selected="${this.current == 'line'}"></fa-icon></input-button>` : ``}
            ${this.validTypes.includes('area') ? html`<input-button @click="${e => this.handleClickButton("area", "line", false, true)}"><fa-icon g="solid" n="chart-area" ?selected="${this.current == 'area'}"></fa-icon></input-button>` : ``}
            ${this.validTypes.includes('pie') ? html`<input-button @click="${e => this.handleClickButton("pie")}"><fa-icon g="solid" n="chart-pie" ?selected="${this.current == 'pie'}"></fa-icon></input-button>` : ``}
        `
    }
    handleClickButton(type, plotType = type, horizontal = false, fillSeries = false) {
        if (type != this.current) {
            this.current = type

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    type: type,
                    plotType: plotType,
                    xAxisType: horizontal ? 'value' : 'category',
                    yAxisType: horizontal ? 'category' : 'value',
                    fill: fillSeries,
                    isHorizontal: horizontal
                }
            }));
        }
    }
}
customElements.define('plot-type-editor', PlotTypeEditor);