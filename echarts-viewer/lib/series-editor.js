import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'
import './input-series.js'

class SeriesEditor extends LitElement {
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
        }
        `]
    }
    static get properties() {
        return {
            label: {
                type: String,
                reflect: true
            },
            chartData: {
                type: Array
            },
            originalData: {
                type: Array
            },
            selectColor: {
                type: Boolean
            }
        };
    }
    set chartData(value) {
        // Update only the first time
        // if (this.originalData === null && value.length) {
        //     this.originalData = Array.from(value)
        // }
        let oldValue = this._chartData;
        this._chartData = value;

        this.requestUpdate('chartData', oldValue);
    }

    get chartData() {
        return this._chartData;
    }

    constructor() {
        super();

        this._chartData = []
        this.originalData = []
        this.selectColor = true
        this.aliases = {}
        this.chartData = []

    }
    render() {
        return html`${this.originalData.filter(series => !(series._obEditable)).map(this._renderInput.bind(this))}`
    }

    _renderInput(dataValue, index) {
        let seriesName = this._getValue(dataValue.data);
        let seriesColor = this._getColor(dataValue.data);
        let seriesAlias = this.aliases[seriesName] || seriesName;
        // let seriesEnabled = this.chartData.some(series => {
        //     return ('name' in series ? series.name == seriesName : series.indexOf(seriesName) != -1)
        // })
        let seriesEnabled = dataValue.enabled
        let seriesSymbol = this._getSymbol(dataValue.data);
        let seriesSymbolSize = this._getSymbolSize(dataValue.data);

        return html`<input-series 
            name="${seriesAlias}" 
            color="${seriesColor}"
            .selectColor="${this.selectColor}"
            .id="${index}"
            .symbol="${seriesSymbol}"
            .symbolSize="${seriesSymbolSize}"
            .enabled="${seriesEnabled}"
            @toggle="${this.handleToggle}"
            @change="${this.handleChange}"
            @colorchange="${this.handleColorChange}"
            @symbolchange="${this.handleSymbolChange}"></input-series>`
    }

    _getValue(dataValue) {
        return dataValue.value ? dataValue.value : (dataValue.name ? dataValue.name : dataValue);
    }

    _getColor(dataValue) {
        return dataValue.color ? dataValue.color : (dataValue.itemStyle ? dataValue.itemStyle.color : null);
    }

    _getSymbol(dataValue) {
        // Strict comparison
        return dataValue.showSymbol !== false ? dataValue.symbol : null;
    }

    _getSymbolSize(dataValue) {
        return dataValue.symbolSize;
    }

    handleChange(e) {
        // if (this._chartData[e.detail.id].value) {
        //     this._chartData[e.detail.id].value = e.detail.name
        // } else {
        //     this._chartData[e.detail.id] = e.detail.name
        // }
        let originalKey = this._getValue(this.originalData[e.detail.id].data)

        this.aliases[originalKey] = e.detail.name

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                type: 'change',
                detail: e.detail,
                chartData: this.chartData
            }
        }));
    }

    handleSymbolChange(e) {
        if (e.detail.id in this.chartData) {
            if (typeof this.chartData[e.detail.id] !== "string" || !(this.chartData[e.detail.id] instanceof String)) {
                this.chartData[e.detail.id][e.detail.property] = e.detail.value
            }

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    type: 'symbol',
                    detail: e.detail,
                    chartData: this.chartData
                }
            }));
        }
    }

    handleColorChange(e) {
        // TODO: check why sometimes a double event is dispatched from the input color
        if (e.detail.id in this.chartData) {
            if (typeof this.chartData[e.detail.id] !== "string" || !(this.chartData[e.detail.id] instanceof String)) {
                if (!this.chartData[e.detail.id].itemStyle) {
                    this.chartData[e.detail.id].itemStyle = {}
                }

                // Line color inside lineStyle
                if (this.chartData[e.detail.id].type == 'line') {

                    if (!this.chartData[e.detail.id].lineStyle) {
                        this.chartData[e.detail.id].lineStyle = {}
                    }

                    this.chartData[e.detail.id].lineStyle.color = e.detail.color

                    // Area style if it is present
                    if (this.chartData[e.detail.id].areaStyle) {
                        this.chartData[e.detail.id].areaStyle.color = e.detail.color
                    }
                }

                this.chartData[e.detail.id].itemStyle.color = e.detail.color

                // "_obCustomBorderColor" will only exists (and be true) when the original series had both itemStyle and borderColor
                // and the two of them were different. 
                if ('borderColor' in this.chartData[e.detail.id].itemStyle && ! this.chartData[e.detail.id]._obCustomBorderColor) {
                    this.chartData[e.detail.id].itemStyle.borderColor = e.detail.color
                }
            }

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    type: 'color',
                    detail: e.detail,
                    chartData: this.chartData
                }
            }));
        }
    }

    handleToggle(e) {
        if (e.detail.enabled) {
            this._chartData.splice(e.detail.id, 0, this.originalData[e.detail.id].data)
        } else {
            this._chartData.splice(this._chartData.indexOf(this.originalData[e.detail.id].data), 1)
        }

        this.originalData[e.detail.id].enabled = e.detail.enabled

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                type: 'toggle',
                detail: e.detail,
                chartData: this.chartData
            }
        }));
    }

}
customElements.define('series-editor', SeriesEditor);