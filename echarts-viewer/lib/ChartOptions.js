import { ORIENTATION } from './ChartConstants.js'
import '../node_modules/merge/merge.js'

const dataZoomFilterMode = 'none'

function typeOf(input) {
    return ({}).toString.call(input).slice(8, -1).toLowerCase();
}

// At the moment this chart is not used. Maybe it would be a good idea to split the ChartViewer into more classes,
// with this one being one of them. In a second round of refactoring, perhaps.
export class ChartOptions  {

    static get properties() {
        return {
            animation: { type: Boolean },
            legend: { type: Object },
            xAxis: { type: Array },
            yAxis: { type: Array },
            grid: { type: Array },
            tooltip: { type: Object },
            dataZoom: { type: Array },
            series: { type: Array },
            dataset: { type: Array },
            title: { type: Object }
        }
    }

    constructor(chartViewer) {
        // super();

        // Private non-property values
        this._viewer = chartViewer
        this._params = chartViewer.params
        this._data = chartViewer.data

        // Public defined properties
        this.animation =  false
        this.dataset =  this._data.map(d => ({ dimensions: d.dimensions, source: d.source.slice() }))
        this.title = {
            left: 'center',
            triggerEvent: true,
            top: 10
        }
        this.legend = {
            top: 'bottom',
            type: 'scroll'
            //selectedMode: false,
            // lineNumber: this.params.lineNumber,
            // scrollDataIndex: this.params.scrollDataIndex
        }

        this.xAxis = []
        this.yAxis = []
        this.grid = [{
            containLabel: true
        }]
        this.tooltip = {

            formatter: function (params, ticket, callback) {
                let xValue, yValue
                if (params.encode.x && params.encode.y) {
                    if (this._viewer._getOrientation() == ORIENTATION.HORIZONTAL) {
                        xValue = params.value[params.encode.y[0]]
                        yValue = params.value[params.encode.x[0]]
                    } else {
                        xValue = params.value[params.encode.x[0]]
                        yValue = params.value[params.encode.y[0]]
                    }
                } else {
                    xValue = params.data[0]
                    yValue = params.data[1]
                }
                if (xValue.length) {
                    return this.series.length > 1 ? `<div class="tooltip">
                    <h4 style="margin-top: 0;">${params.seriesName}</h4>
                    <span>${xValue}: ${yValue}</span>
                    </div>` : `<b>${params.data[0]}</b>: ${params.data[1]}`;
                } else {
                    return this.series.length > 1 ? `<div class="tooltip">
                    <h4 style="margin-top: 0;">${params.seriesName}</h4>
                    <span>${yValue}</span>
                    </div>` : `${params.data[1]}`;
                }


            }.bind(this)
        }
        this.dataZoom = [
            {
                type: 'slider',
                show: this._params.omicsBox.enableZoomSlider,
                xAxisIndex: [0],
                bottom: 15,
                filterMode: dataZoomFilterMode,
                // disabled: this.hasMultipleAxis(this.params.options)
                disabled: !this._viewer.hasZoomSliderAvailable()
                // start: 1,
                // end: 35
            },
            {
                type: 'slider',
                show: this._params.omicsBox.enableZoomSlider,
                yAxisIndex: [0],
                right: 15,
                filterMode: dataZoomFilterMode,
                // disabled: this.hasMultipleAxis(this.params.options)
                disabled: !this._viewer.hasZoomSliderAvailable()
                // start: 29,
                // end: 36
            },
            {
                type: 'inside',
                xAxisIndex: [0],
                filterMode: dataZoomFilterMode,
                // disabled: !this.hasSidebarOption(SIDEBAR_MODULES.ZOOM_OPTIONS) || this.hasMultipleAxis(this.params.options)
                disabled: !this._viewer.hasZoomAvailable()
                // start: 1,
                // end: 35
            },
            {
                type: 'inside',
                yAxisIndex: [0],
                filterMode: dataZoomFilterMode,
                // disabled: !this.hasSidebarOption(SIDEBAR_MODULES.ZOOM_OPTIONS) || this.hasMultipleAxis(this.params.options)
                disabled: !this._viewer.hasZoomAvailable()
                // start: 29,
                // end: 36
            }
        ]
        this.series = []

        // Merge recursive
        Object.keys(this._params.options).map(key => {
            if (typeOf(this[key]) !== 'object') {
                this[key] = this._params.options[key]
            } else {
                this[key] = merge.recursive(true, this[key], this._params.options[key])
            }
        })

        // We need to store the seriesInfo in a different object, or else the "_updateParams"
        // will override it. Restore the series options based on the 'enabled' setting
        this.series = this._params.omicsBox.seriesInfo.filter(seriesConfig => seriesConfig.enabled).map(seriesConfig => seriesConfig.data)
    }
}

// Needed to avoid Illegal constructor
// customElements.define('chart-options', ChartOptions);