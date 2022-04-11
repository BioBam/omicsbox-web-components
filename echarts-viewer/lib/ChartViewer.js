import { LitElement, html, css } from '../node_modules/lit/index.js';
import ResizeObserver from '../node_modules/resize-observer-polyfill/dist/ResizeObserver.es.js';

import { getBatikSVG } from './getBatikSVG.js';
import { omicsboxtheme, axisCommon, themeFontFamily, overflowValue } from './themes/omicsbox.js'
import '../node_modules/merge/merge.js'

import { SIDEBAR_MODULES, LABEL_FORMATTER, ORIENTATION, GROUP_OTHERS_COLOR, legendHeight, visualMapWidth, axisNamePadding, defaultLabelCharTruncating, OB_DATASET_KEYWORD } from './ChartConstants.js'
import { ChartParams } from './ChartParams.js';
import { ChartGrid, bottomOffset, leftOffset, rightOffset, topOffset } from './ChartGrid.js';
import { ProxyDataset } from './ProxyDataset.js';

import { WebPartMixin } from '../node_modules/web-libraries/sidebar/webPart-mixin.js'
import { EchartsEditorMixin } from '../node_modules/web-libraries/echarts-editor/echartsEditor-mixin.js';
import { mix } from '../node_modules/mixwith/src/mixwith.js'

const _isString = (value) => { return (typeof value === 'string' || value instanceof String) }

const RESIZE_EVENT_TIMEOUT_MS = 250;

export class ChartViewer extends mix(LitElement).with(WebPartMixin, EchartsEditorMixin) {
    static get styles() {
        return [css`
        :host {
            display: block;
            position: relative;
            box-sizing: border-box;
            width:100%;
            height: 100%;
            min-height:100vh;
        }
        /*:host * {
            box-sizing: border-box;
            position: relative;
        }*/

        #chart_container {
            height: 100%;
            /*width: 100%;*/
        }

        #svg_renderer {
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            visibility: hidden;
            position: absolute;
            z-index: -1;
        }

        #no_data {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 30px;
            font-weight: bold;
        }

        chart-editor {
            z-index: 100;
        }

        .tooltip {
            color: #333;
        }
        .loader {
            font-size: 10px;
            margin: 50px auto;
            text-indent: -9999em;
            width: 10em;
            height: 10em;
            border-radius: 50%;
            background: #000000;
            background: -moz-linear-gradient(left, #000000 10%, rgba(0,0,0, 0) 42%);
            background: -webkit-linear-gradient(left, #000000 10%, rgba(0,0,0, 0) 42%);
            background: -o-linear-gradient(left, #000000 10%, rgba(0,0,0, 0) 42%);
            background: -ms-linear-gradient(left, #000000 10%, rgba(0,0,0, 0) 42%);
            background: linear-gradient(to right, #000000 10%, rgba(0,0,0, 0) 42%);
            position: relative;
            -webkit-animation: load3 1.4s infinite linear;
            animation: load3 1.4s infinite linear;
            -webkit-transform: translateZ(0);
            -ms-transform: translateZ(0);
            transform: translateZ(0);
            position: fixed;
            top: 50%;
            left: calc(50% - 150px);
            margin-left: -5em;
            margin-top: -5em;
            z-index: 999;
          }
          .loader:before {
            width: 50%;
            height: 50%;
            background: #000000;
            border-radius: 100% 0 0 0;
            position: absolute;
            top: 0;
            left: 0;
            content: '';
          }
          .loader:after {
            background: #fff;
            width: 75%;
            height: 75%;
            border-radius: 50%;
            content: '';
            margin: auto;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
          }
          @-webkit-keyframes load3 {
            0% {
              -webkit-transform: rotate(0deg);
              transform: rotate(0deg);
            }
            100% {
              -webkit-transform: rotate(360deg);
              transform: rotate(360deg);
            }
          }
          @keyframes load3 {
            0% {
              -webkit-transform: rotate(0deg);
              transform: rotate(0deg);
            }
            100% {
              -webkit-transform: rotate(360deg);
              transform: rotate(360deg);
            }
          }
          
        `]
    }
    static get properties() {
        return {
            sidebarSections: { type: Object },
            // loading: { type: Boolean },
        }
    }

    constructor() {
        super()

        this.chart = null

        // TODO: change to an event, like we do now with updateOptions. 
        // Might be too slow?
        this.resizeCallback = null

        this.trialMode = false

        this.theme = 'omicsbox'

        this.renderer = 'canvas'
        // this.renderer = 'svg'

        this.colorData = omicsboxtheme().color

        this.loading = true

        this.sidebarSections = {}

        this.colorCounter = 0

        this.predefinedSidebarModules = {}

        this.cache = {}

        this.themeData = omicsboxtheme()

        this.chartSidebar = null

        this.chartReady = false

        this.contentRect = {
            width: null,
            height: null,
            offsetHeight: null,
            offsetWidth: null
        }

        this.options = null

        this.params = null;

        // The reference this.data should not change. However, at the point
        // of creation, we do not know the type of dataset, we create it later.
        this.data = null;

        this.processedData = this.data

        // At this point maybe we should just link the grid to the viewer and interrogate it instead,
        // there are too many dependencies because of the multiple grids support.
        this.grid = null;

        // An external (non shadow) DOM element is required in order for the 3D controls to work.
        this.echarts_div = window.document.querySelector('#echarts_container');

        echarts.registerTheme('omicsbox', this.themeData)
    }

    connectedCallback() {
        super.connectedCallback();

        this.setWebsocketRequest(this.wsRequest);
    }

    render() {
        return this._containsData() || this.loading ? html`
        <slot>No slot assigned</slot>
        <div id="svg_renderer"></div>
        ${this.loading ? html`<div class="loader">Loading...</div>` : ``}
        ${this.getEditors()}` : html`<div id="no_data">No data available.</div>`
    }

    init() {
        // Update the content rect
        this.contentRect.width = this.getBoundingClientRect().width
        this.contentRect.height = this.getBoundingClientRect().height
        this.contentRect.offsetHeight = this.offsetHeight
        this.contentRect.offsetWidth = this.offsetWidth

        // Set the handlers. No need to use connectedCallback as they are no 
        // DOM elements.
        this.params.addEventListener("change", (e) => this._paramsUpdatedCallback(e))
        this.data.addEventListener("change", (e) => this._dataUpdatedCallback(e))
        this.addEventListener("obUpdatedOptions", (e) => this.grid.setChartOptions(this.options))

        // Initialize only when the DOM element is available
        if (this._containsData()) {
            // Note: the clip layout has problems with at least one chart type (multiple grids horizontal bars)
            //this._registerLayouts()
            this._createChart()
            this._configureObserver()
        }

        this.loading = false;

        this.requestUpdate();
    }

    // _registerLayouts() {
    //     if (this.params.options.series.some(series => series.type == 'bar')) {
    //         echarts.registerLayout(this._barClipLayout);
    //     }
    // }


    // firstUpdated(changedProperties) {
    //     // Wait until the DOM element is available for the chart. If firstUpdate is called before
    //     // Deprecated due to the new required slot system.
    //     //this.init()
    // }

    // getParam(key, defaultValue) {
    //     return key in this._params ? this._params[key] : defaultValue
    // }

    getColor() {
        if (this.colorCounter == this.colorData.length) {
            this.colorCounter = 0

            return this.colorData[this.colorCounter]
        } else {
            let idx = this.colorCounter
            this.colorCounter++

            return this.colorData[idx]
        }
    }

    initializeParams() {
        if (!this.wsRequest)
            throw new Error("'wsRequest' is required to initialize the params.");

        this.params = new ChartParams(this.wsRequest);
    }

    initializeDataset(datasetType) {
        if (!datasetType || !this.wsRequest)
            throw new Error("'datasetType' and 'wsRequest' are required to initialize the dataset.");

        this.data = ProxyDataset.createDatasetProxy(datasetType, this.wsRequest);

        // Non-proxy version
        // this.data = ProxyDataset.createDataset(datasetType, this.wsRequest);
        this.processedData = this.data
    }

    initializeGrid() {
        if (!this.data || !this.params)
            throw new Error("Params and dataset must me initialized before the grid.");

        this.grid = new ChartGrid(this.contentRect, this.data, this.themeData, this.params)
    }

    setTrialMode(mode) {
        this.trialMode = mode
    }

    setOrientation(orientation, context) {
        if (this.params.omicsBox.orientation != orientation) {
            this.params.omicsBox.orientation = orientation

            context.series.map(series => {
                let yProperty = series.encode.y

                series.encode.y = series.encode.x
                series.encode.x = yProperty
            })

            // Swap label truncating options
            const xLabelOptions = this.params.omicsBox.labelTruncating.x
            const xLabelModeOptions = this.params.omicsBox.labelScientificMode.x

            this.params.omicsBox.labelTruncating.x = this.params.omicsBox.labelTruncating.y
            this.params.omicsBox.labelScientificMode.x = this.params.omicsBox.labelScientificMode.y
            this.params.omicsBox.labelTruncating.y = xLabelOptions
            this.params.omicsBox.labelScientificMode.y = xLabelModeOptions

            // Change all axis
            for (let i = 0; i < context.xAxis.length; i++) {
                let xAxisName = context.xAxis[i].name
                let xAxisType = context.xAxis[i].type
                let yAxisType = context.yAxis[i].type
                let xAxisOrgType = context.xAxis[i]._obOriginalType
                let yAxisOrgType = context.yAxis[i]._obOriginalType

                if (orientation == ORIENTATION.VERTICAL) {
                    context.xAxis[i] = Object.assign(context.xAxis[i] || {}, { position: 'bottom', type: yAxisType, name: context.yAxis[i].name, _obOriginalType: yAxisOrgType })
                    context.yAxis[i] = Object.assign(context.yAxis[i] || {}, { type: xAxisType, inverse: false, name: xAxisName, _obOriginalType: xAxisOrgType })

                    let newHeight;
                    if (context.xAxis[i].name.length && context.xAxis[i].nameTextStyle && 'fontSize' in context.xAxis[i].nameTextStyle) {
                        let axisLines = echarts.format.parsePlainText(context.xAxis[i].name.length, {
                            font: `${context.xAxis[i].nameTextStyle.fontStyle} ${context.xAxis[i].nameTextStyle.fontWeight} ${context.xAxis[i].nameTextStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                            overflow: overflowValue,
                            width: this._getChartNameStyleWidth()
                        })
                        newHeight = axisLines.height
                    } else {
                        newHeight = 0
                    }

                    // If no style has been defined it means we are in the specific transformation step that will take care of the offsets.
                    this.grid.addOffset('xAxis', 'bottom', newHeight + axisNamePadding)
                    this.grid.addOffset('xAxis', 'top', 0)
                } else {
                    context.xAxis[i] = Object.assign(context.xAxis[i] || {}, { position: 'top', type: yAxisType, name: context.yAxis[i].name, _obOriginalType: yAxisOrgType })
                    context.yAxis[i] = Object.assign(context.yAxis[i] || {}, { type: xAxisType, inverse: true, name: xAxisName, _obOriginalType: xAxisOrgType })

                    let newHeight;
                    if (context.xAxis[i].name.length && context.xAxis[i].nameTextStyle && 'fontSize' in context.xAxis[i].nameTextStyle) {
                        let axisLines = echarts.format.parsePlainText(context.xAxis[i].name.length, {
                            font: `${context.xAxis[i].nameTextStyle.fontStyle} ${context.xAxis[i].nameTextStyle.fontWeight} ${context.xAxis[i].nameTextStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                            overflow: overflowValue,
                            width: this._getChartNameStyleWidth()
                        })
                        newHeight = axisLines.height
                    } else {
                        newHeight = 0
                    }

                    // If no style has been defined it means we are in the specific transformation step that will take care of the offsets.
                    this.grid.addOffset('xAxis', 'top', newHeight + axisNamePadding)
                    this.grid.addOffset('xAxis', 'bottom', 0)
                }

                if (context.yAxis[i].type == "category") {
                    context.yAxis[i].axisLabel = Object.assign(context.yAxis[i].axisLabel || {}, { interval: 0 })
                } else {
                    context.yAxis[i].axisLabel = Object.assign(context.yAxis[i].axisLabel || {}, { interval: null })
                }

                if (context.xAxis[i].type == "category") {
                    context.xAxis[i].axisLabel = Object.assign(context.xAxis[i].axisLabel || {}, { interval: 0 })
                } else if (context.xAxis[i].axisLabel) {
                    context.xAxis[i].axisLabel = Object.assign(context.xAxis[i].axisLabel || {}, { interval: null })
                }
            }

            // this.dispatchEvent(new CustomEvent('changeOrientation', { detail: { orientation: orientation, context: context } }))
            this.grid.setOrientation(orientation)

            // Adjust first grid
            this._updateGridOptions()

            return true;
        }

        return false;
    }

    getAxisOption(option) {
        return `${option}${this.is3DChart() ? '3D' : ''}`
    }

    _getXAxisType() {
        return this.params.options.xAxis ? this.params.options.xAxis.type || 'category' : 'category';
    }

    _getYAxisType() {
        return this.params.options.yAxis ? this.params.options.yAxis.type || 'value' : 'value';
    }

    _getOrientation() {
        return this.params ? (this.params.omicsBox || {}).orientation : ORIENTATION.VERTICAL;
    }

    _getExtraInfo({seriesIndex, yIndex, dataIndex, datasetIndex = 0} = {}) {
        // TODO: should we use the dataIndex param instead?
        return this.data.getExtraInfo({
            datasetIndex: datasetIndex || 0, //this.options.series[seriesIndex].datasetIndex || 0,
            seriesIndex,
            yIndex,
            dataIndex
        });
    }

    _restoreOriginalAxisTypes() {
        console.log("RESTORING ORIGINAL AXIS")
        this.options.yAxis?.map((axis, index) => {
            axis.type = axis._obOriginalType
        })

        this.options.xAxis?.map((axis, index) => {
            axis.type = axis._obOriginalType
        })
    }

    _replaceVars(formatter, seriesVars) {
        // Currently we are supporting both extraInfo and extra (when we have a dataset and give a map in the tooltip parameters) but the latter could be
        // unnecessary so we may want to remove it in the future.

        // Replace 'extraInfo' with 'extraInfo[0]'
        return new Function("return `" + formatter.replace(/\${extraInfo}/g, '${extraInfo[0]}').replace(/\${/g, '${this.').replace(/extra\[(.*?)\]/g, "extra[this.$1]") + "`;").call(seriesVars);
    }

    _dataUpdatedCallback(e) {
        console.log("DATA UPDATED", e)
        // Avoid callback with empty event
        if (e.detail.data) {
            // When the dataset has provided binData, we need to update the axis properties
            if (e.detail.binData) {
                if (this._getOrientation() == ORIENTATION.VERTICAL) {
                    this.options.xAxis[0].type = 'category'
                    this.options.yAxis[0].type = 'value'

                    this.params.omicsBox.labelTruncating.x[0] = e.detail.maxLabelLength
                    // this.params.omicsBox.labelTruncating.y[0] = 0

                    this.options.xAxis[0].axisLabel = Object.assign(this.options.xAxis[0].axisLabel || {}, { rotate: 45 })
                } else {
                    this.options.yAxis[0].type = 'category'
                    this.options.xAxis[0].type = 'value'

                    this.params.omicsBox.labelTruncating.y[0] = e.detail.maxLabelLength
                    // this.params.omicsBox.labelTruncating.x[0] = 0

                    this.options.xAxis[0].axisLabel = Object.assign(this.options.xAxis[0].axisLabel || {}, { rotate: 0 })
                }

                if (!this.params.omicsBox.binsNumber && e.detail.binsNumber != undefined) {
                    this.params.setParam('binsNumber', e.detail.binsNumber)
                }
            } else {
                // TODO: should we do this even if binning is not available in the first place?
                this._restoreOriginalAxisTypes()
            }

            this.options.dataset[0].source = e.detail.data

            // If we do not want to force the label truncating autodetection, then force the update of axis options.
            let keepLabels = !e.detail.binData

            // This is a bit of a hack. In the plot editor, changing the type to pie removes the axis and sets vertical
            // orientation; when changing to an horizontal bar, the orientation & data is reprocessed, thus calling 
            // this method BEFORE echarts update, overriding the truncate limits with erroneous values. We do not need
            // to call this method simply changing the plot type.
            if (e.detail.eventData.updateLabels) {
                this._setLabelTruncatingOptions(keepLabels, ['xAxis', 'yAxis'], !keepLabels)
            }
        } else if (e.detail.dataset) {
            this.options.dataset = e.detail.dataset
        }

        this._updateOptions('dataset', false, false)
    }

    _paramsUpdatedCallback(e) {
        let key = e.detail.param
        let value = e.detail.value

        // If the param is related to dataset, transfer the new value
        if (key in this.data.properties) {
            this.data.setParam(key, value)
        }
    }

    // TODO: remove these
    _setCache(key, data) {
        if (typeof data === 'object' && data !== null) {
            if (!(key in this.cache)) {
                this.cache[key] = {}
            }

            // Make this so we 
            Object.assign(this.cache[key], data)
        } else {
            this.cache[key] = data
        }
    }

    _getCache(key) {
        return this.cache[key]
    }

    getRangeValue(value) {
        let cachedValues = this._getCache("datasetRanges")
        let rangeValue = cachedValues ? cachedValues[value] : null

        return rangeValue && (rangeValue != +Infinity && rangeValue != -Infinity) ? rangeValue : null
    }

    getXAxisMaxRange() {
        let rangeValue = this._getOrientation() == ORIENTATION.VERTICAL ? 'xMax' : 'yMax'

        return this.getRangeValue(rangeValue)
    }

    getYAxisMaxRange() {
        let rangeValue = this._getOrientation() == ORIENTATION.VERTICAL ? 'yMax' : 'xMax'

        return this.getRangeValue(rangeValue)
    }

    _getCSVData() {
        let originalParams = JSON.parse(this.params.defaultParams)

        return JSON.stringify({
            xAxis: originalParams.options[this.getAxisOption('xAxis')].map(axis => axis.name),
            yAxis: originalParams.options[this.getAxisOption('yAxis')].map(axis => axis.name),
            zAxis: this.is3DChart() ? originalParams.options[this.getAxisOption('zAxis')].map(axis => axis.name) : null,
            datasetType: this.data.type,
            series: originalParams.options.series.map(series => series.name)
        })
    }

    _getPNGData() {
        return this.chart.getDataURL({
            type: 'png',
            pixelRatio: 1
        })
    }

    _getSVGData() {
        const svgPromise = new Promise((resolve, reject) => {
            if (this.is3DChart()) {
                // Send null data because 3D charts are SVG incompatible
                resolve(null);
            } else if (this.renderer != 'svg') {
                let hiddenNode = this.shadowRoot.querySelector("#svg_renderer");
                let svgChart = echarts.init(hiddenNode, this.theme, { renderer: 'svg' });

                // The watermark is not properly centered in the first render, so we need to
                // manually place it in the chart.

                // let svgOptions = Object.assign({}, this.options)

                // Some plots with custom itemStyles per point (like boxplot) fail when setting
                // individual options and we need to use the full set of options (hence the 
                // forceGlobalUpdateOptions). When creating the SVG chart we seem to have the
                // opposite problem, so we make use of that setting to pass only our "own"
                // options instead of cloning the whole chart.
                let svgOptions = Object.assign({}, this.params.omicsBox.forceGlobalUpdateOptions ? this.options : this.chart.getOption())

                // In this context SVG renderer seems to fail with "series.large=true". We 
                // disable this param.
                svgOptions.series = svgOptions.series.map(series => {
                    return Object.assign({}, series, { large: false })
                })

                svgChart.on('finished', function () {
                    console.log("SVG CHART FINISHED")
                    let svgData = getBatikSVG(svgChart, this.options.legend.show || false)

                    svgChart.dispose();

                    resolve(svgData)

                    svgChart.setOption({})
                }.bind(this));

                svgChart.setOption(svgOptions);
            } else {
                let svgData = getBatikSVG(this.chart, this.options.legend.show || false);

                resolve(svgData)
            }
        });

        return svgPromise;
    }

    _restoreSeriesCallbacks(series, index) {
        // Currently for 'custom' type series we need to restore the callbacks
        if (series.originalType == 'error-bar') {
            this.options.series[index].tooltip = {
                formatter: (params) => {
                    return `<ul>
                        <li>Avg: ${params.data[1]}</li>
                        <li>Min: ${params.data[2]}</li>
                        <li>Max: ${params.data[3]}</li>
                        </ul>
                    `
                }
            }

            this.options.series[index].renderItem = (params, api) => {
                var xValue = api.value(0);
                var highPoint = api.coord([xValue, api.value(3)]);
                var lowPoint = api.coord([xValue, api.value(2)]);
                var halfWidth = api.size([1, 0])[0] * 0.1;
                var style = {
                    stroke: api.visual('color'),
                    fill: null
                };
                var dottedStyle = {
                    stroke: api.visual('color'),
                    fill: null,
                    lineDash: [3, 3]
                }

                return {
                    type: 'group',
                    children: [{
                        type: 'line',
                        shape: {
                            x1: highPoint[0] - halfWidth, y1: highPoint[1],
                            x2: highPoint[0] + halfWidth, y2: highPoint[1]
                        },
                        style: style
                    }, {
                        type: 'line',
                        shape: {
                            x1: highPoint[0], y1: highPoint[1],
                            x2: lowPoint[0], y2: lowPoint[1]
                        },
                        style: dottedStyle
                    }, {
                        type: 'line',
                        shape: {
                            x1: lowPoint[0] - halfWidth, y1: lowPoint[1],
                            x2: lowPoint[0] + halfWidth, y2: lowPoint[1]
                        },
                        style: style
                    }]
                };
            }
        } else if (series.originalType == 'markline') {
            this.options.series[index].renderItem = () => { }
        } else if (series.type == 'boxplot') {
            this.options.series[index].tooltip = {
                formatter: function (param) {
                    let source = param.data.value ? param.data.value : param.data
                    return [
                        'Name: ' + param.name,
                        'upper: ' + source[5],
                        'Q3: ' + source[4],
                        'median: ' + source[3],
                        'Q1: ' + source[2],
                        'lower: ' + source[1]
                    ].join('<br/>');
                }
            }
        } else if (series.tooltip && (series.tooltip.formatter || series.tooltip._orgFormatter)) {
            // const tooltipFormatter = _isString(series.tooltip.formatter) ? series.tooltip.formatter : (series.tooltip.formatter || ((params, ticket, callback) => '')).bind(this)
            // Save the original string formatter (if any) to be restored after updating the viewer
            let tooltipFormatter;
            if (series.tooltip._orgFormatter) {
                tooltipFormatter = series.tooltip._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(series.tooltip.formatter)) {
                    series.tooltip._orgFormatter = series.tooltip.formatter
                }

                tooltipFormatter = _isString(series.tooltip.formatter) ? series.tooltip.formatter : (series.tooltip.formatter || ((params, ticket, callback) => '')).bind(this)
            }
            const extraLabels = JSON.parse(this.options.series[index].tooltip.obExtraLabels || '{}')

            this.options.series[index].tooltip.formatter = function (params, ticket, callback) {
                let aliasValue = (this.params.aliases.series && this.params.aliases.series[params.seriesName]) ? this.params.aliases.series[params.seriesName] : params.seriesName;

                if (_isString(tooltipFormatter)) {
                    const x = params.value[params.encode.x[0]], y = params.value[params.encode.y[0]], z = params.value[params.encode.z?.[0]];
                    const templateVars = {
                        seriesName: aliasValue,
                        extraInfo: this._getExtraInfo({seriesIndex: series._index, yIndex: params.encode.y[0], dataIndex: params.dataIndex, datasetIndex: series.datasetIndex}),
                        x: x,
                        y: y,
                        z: z,
                        xy: `${x}_${y}`,
                        extra: extraLabels
                    }

                    return this._replaceVars(tooltipFormatter, Object.assign({}, params, templateVars))
                } else {
                    return tooltipFormatter(Object.assign({}, params, { seriesName: aliasValue }), ticket, callback)
                }
            }.bind(this)
        }

        // TODO: this is getting pretty dirty, we need to refactor this sh** ASAP
        if (series._obPieLabel) {
            series.label = Object.assign(series.label || {}, { formatter: LABEL_FORMATTER.PIE_CB })
        }

        if (series.label && (series.label.formatter || series.label._orgFormatter)) {
            // const labelFormatter = _isString(series.label.formatter) ? series.label.formatter : (series.label.formatter || ((params, ticket, callback) => '')).bind(this)
            // Save the original string formatter (if any) to be restored after updating the viewer
            if (this.params.omicsBox.enableLabels) {
                let labelFormatter;
                if (series.label._orgFormatter) {
                    labelFormatter = series.label._orgFormatter
                } else {
                    // Only keep original reference to formatter in case of strings
                    if (_isString(series.label.formatter)) {
                        series.label._orgFormatter = series.label.formatter
                    }

                    labelFormatter = _isString(series.label.formatter) ? series.label.formatter : (series.label.formatter || ((params, ticket, callback) => '')).bind(this)
                }
                const extraLabels = JSON.parse(this.options.series[index].label.obExtraLabels || '{}')
                this.options.series[index].label.show = true
                this.options.series[index].label.formatter = function (params, ticket, callback) {
                    let aliasValue = (this.params.aliases.series && this.params.aliases.series[params.seriesName]) ? this.params.aliases.series[params.seriesName] : params.seriesName;

                    if (_isString(labelFormatter)) {
                        // For pie charts 'encode.y' might not exist
                        const valueEncode = params.encode.y ? params.encode.y[0] : params.encode.value[0]
                        const x = params.value[params.encode.x[0]], y = params.value[valueEncode], z = params.value[params.encode.z?.[0]];
                        const templateVars = {
                            seriesName: aliasValue,
                            extraInfo: this._getExtraInfo({seriesIndex: series._index, yIndex: valueEncode, dataIndex: params.dataIndex, datasetIndex: series.datasetIndex}),
                            x: x,
                            y: y,
                            z: z,
                            xy: `${x}_${y}`,
                            extra: extraLabels,
                            // Percentage (only for pie)
                            d: params.percent || 0
                        }

                        return this._replaceVars(labelFormatter, Object.assign({}, params, templateVars))
                    } else {
                        return labelFormatter(Object.assign({}, params, { seriesName: aliasValue }), ticket, callback)
                    }
                }.bind(this)
            } else {
                this.options.series[index].label.show = false
            }
        }

        // Some types of graphs require individual data because they do not support 'dataset' option.
        // However, in omicsbox we still keep separate the data in a customized container, and we point
        // to that container using the reserved keyword "_obDataset". Here we restore the reference to the
        // appropiate data at loading time.
        // TODO: what will happen after loading, will the series.attr be _obDataset still?
        this.data.getSupportedAttributes().filter(attr => attr in series && series[attr] == OB_DATASET_KEYWORD).forEach(attr => {
            console.log("SERIES DATA", series)
            series[attr] = this.data.getDataAttribute(series.datasetIndex || 0, series._index, attr);

            // Keep a copy of the origin of the attr. Dataset references should be remove from 'storing params'.
            series[`_${attr}`] = OB_DATASET_KEYWORD;
        })
    }

    is3DChart() {
        return this.data.is3DDataset();
    }

    _checkOptions() {
        // Add watermark for trial mode
        if (this.trialMode) {
            this.options.graphic = [{
                type: 'image',
                left: 'center',
                top: 'middle',
                // rotation: 45,
                z: 0,
                silent: true,
                style: {
                    // Image 609x609 px
                    image: "./media/watermark_omicsbox.png",
                    // IMPORTANT: set the dimensions, otherwise it will not be centered on the first render
                    width: 609,
                    height: 609
                }
            }]
        } else {
            // We need to remove the graphic options in case the chart was saved using a trial subscription.
            // TODO: if we want to use graphics in the future we might need to rethink this.
            delete this.options.graphic
        }

        // Adjust the grid number
        // NOTE: as of today, the index should be the same between grid and axis, we make
        // that assumption from here on forward.
        const uniqueGrids = [...new Set(this._getXAxisOptions().map(axis => axis.gridIndex))]

        // TODO: change this to look for the number of grids present instead of relying in the previous system.
        if (uniqueGrids.length > 1) {
            this.refreshGridOptions()

            this.addEventListener('obUpdatedOptions', (ev) => {
                const triggeringOptions = ['yAxis', 'xAxis']
                console.log("MULTIPLE RECEIVED EVENT", ev)

                // When we have updated only ONE option and is an axis, update the multiple grid options
                if (ev.detail.options.length == 1 && triggeringOptions.includes(ev.detail.options[0])) {
                    this.refreshGridOptions()
                    // this._updateMultipleGridOptions(this.getBoundingClientRect(), true)
                }
            })
        }

        let nameTextStyleWidth = this._getChartNameStyleWidth()
        let nameTextStyleHeight = this._getChartNameStyleHeight()
        let themeAxisOptions = axisCommon(this.params.fontFamily)

        const titleDefaultOptions = {
            fontWeight: this.themeData.title.textStyle.fontWeight,
            fontStyle: this.themeData.title.textStyle.fontStyle,
            fontSize: this.themeData.title.textStyle.fontSize,
            width: nameTextStyleWidth
        }

        if (!('title' in this.options)) {
            this.options.title = {}
        }

        this.options.title.textStyle = { ...titleDefaultOptions, ...this.options.title.textStyle || {} }
        this.options.title.subtextStyle = { ...this.options.title.subtextStyle || {}, ...{ width: nameTextStyleWidth } }

        const xAxisOptions = {
            triggerEvent: true,
            nameTextStyle: {
                fontWeight: themeAxisOptions.nameTextStyle.fontWeight,
                fontStyle: themeAxisOptions.nameTextStyle.fontStyle,
                fontSize: themeAxisOptions.nameTextStyle.fontSize,
                width: nameTextStyleWidth
            },
            axisLabel: {
                rotate: 0,
                fontWeight: themeAxisOptions.axisLabel.fontWeight,
                fontStyle: themeAxisOptions.axisLabel.fontStyle,
                fontSize: themeAxisOptions.axisLabel.fontSize,
                formatter: "{value}"
            },
            nameLocation: 'middle',
            nameGap: 15,
            splitLine: {
                show: false,
                lineStyle: {
                    type: 'solid'
                }
            },
            splitNumber: 5,
            position: 'bottom'
        }

        const yAxisOptions = {
            triggerEvent: true,
            nameLocation: 'middle',
            nameGap: 10,
            nameTextStyle: {
                fontWeight: themeAxisOptions.nameTextStyle.fontWeight,
                fontStyle: themeAxisOptions.nameTextStyle.fontStyle,
                fontSize: themeAxisOptions.nameTextStyle.fontSize,
                width: nameTextStyleHeight
            },
            axisLabel: {
                rotate: 0,
                fontWeight: themeAxisOptions.axisLabel.fontWeight,
                fontStyle: themeAxisOptions.axisLabel.fontStyle,
                fontSize: themeAxisOptions.axisLabel.fontSize,
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'solid'
                }
            },
            splitNumber: 5,
            position: 'left'
        }

        if (!('xAxis' in this.options) && !this.is3DChart()) {
            this.options.xAxis = [{}]
        }

        // Real option names based on conventional or 3D chart
        const _xAxis = this.getAxisOption('xAxis');
        const _yAxis = this.getAxisOption('yAxis');
        const _zAxis = this.getAxisOption('zAxis');
        const _grid = this.getAxisOption('grid');

        this.options[_xAxis]?.map((axis, index) => {
            // this.options.xAxis[index].axisLabel = { ...axisDefaultOptions, ...axis.axisLabel || {} }
            // this.options.xAxis[index].nameTextStyle = { ...nameAxisDefaultOptions, ...axis.nameTextStyle || {} }
            const axisIndex = index

            // Update bottom grid margin based on the name value
            // TODO: grid inside options, will this be merged?
            if (!axis.name.length) {
                this.options[_grid][axis.gridIndex].bottom = bottomOffset[ORIENTATION.HORIZONTAL]
            }

            console.log("MERGE xaxis", axis, xAxisOptions)
            this.options[_xAxis][index] = merge.recursive(true, xAxisOptions, axis)

            if (this.options[_xAxis][index].type == "category") {
                this.options[_xAxis][index].axisLabel.interval = 0
                // this.options.xAxis[index].axisLabel.rotate = this.options.xAxis[index].axisLabel.rotate || 45
            } else {
                // delete this.options.xAxis[index].axisLabel.interval
                this.options[_xAxis][index].axisLabel.interval = null
            }

            // Save the original string formatter (if any) to be restored after updating the viewer
            let xaxisFormatter;
            if (this.options[_xAxis][index].axisLabel._orgFormatter) {
                xaxisFormatter = this.options[_xAxis][index].axisLabel._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options[_xAxis][index].axisLabel.formatter)) {
                    this.options[_xAxis][index].axisLabel._orgFormatter = this.options[_xAxis][index].axisLabel.formatter
                }

                xaxisFormatter = this.options[_xAxis][index].axisLabel.formatter || ((value, index) => value)
            }

            this.options[_xAxis][index].axisLabel.formatter = function (value, index) {
                var aliasValue = (this.params.aliases.xAxis && this.params.aliases.xAxis[value]) ? this.params.aliases.xAxis[value] : value;
                const charLimit = this.params.omicsBox.labelTruncating.x[axisIndex]

                if (this.options[_xAxis][axisIndex].type == 'category') {
                    if (aliasValue.length > charLimit) {
                        aliasValue = aliasValue.substring(0, charLimit) + (charLimit > 0 ? '…' : '');
                    }
                } else if (charLimit == 0 || !this.params.omicsBox.labelScientificMode.x[axisIndex]) {
                    // Using en_IN returns weird formatting: 15,00,000 instead of 1,500,000
                    aliasValue = new Intl.NumberFormat('en-GB', { style: 'decimal', notation: 'standard', maximumFractionDigits: Math.min(charLimit || 0, 15) }).format(+aliasValue); //(+aliasValue).toFixed(charLimit)
                } else {
                    aliasValue = new Intl.NumberFormat('en-IN', { notation: 'scientific', maximumSignificantDigits: charLimit }).format(aliasValue)
                }

                return typeof xaxisFormatter === "function" ? xaxisFormatter(aliasValue, index) : xaxisFormatter.replace("{value}", aliasValue);
            }.bind(this)
        })

        if (!('yAxis' in this.options) && !this.is3DChart()) {
            this.options.yAxis = [{}]
        }

        this.options[_yAxis]?.map((axis, index) => {
            // this.options.yAxis[index].axisLabel = { ...axisDefaultOptions, ...axis.axisLabel || {} }
            // this.options.yAxis[index].nameTextStyle = { ...nameAxisDefaultOptions, ...axis.nameTextStyle || {} }
            const axisIndex = index

            this.options[_yAxis][index] = merge.recursive(true, yAxisOptions, axis)

            if (this.options[_yAxis][index].type == "category") {
                this.options[_yAxis][index].axisLabel.interval = 0
            } else {
                // delete this.options.yAxis[index].axisLabel.interval
                this.options[_yAxis][index].axisLabel.interval = null
            }

            // Rotate text for right axis
            if (this.options[_yAxis][index].position == "right") {
                this.options[_yAxis][index].nameRotate = -90
            }

            // Save the original string formatter (if any) to be restored after updating the viewer
            let yaxisFormatter;
            if (this.options[_yAxis][index].axisLabel._orgFormatter) {
                yaxisFormatter = this.options[_yAxis][index].axisLabel._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options[_yAxis][index].axisLabel.formatter)) {
                    this.options[_yAxis][index].axisLabel._orgFormatter = this.options[_yAxis][index].axisLabel.formatter
                }

                yaxisFormatter = this.options[_yAxis][index].axisLabel.formatter || ((value, index) => value)
            }

            this.options[_yAxis][index].axisLabel.formatter = function (value, index) {
                var aliasValue = (this.params.aliases.yAxis && this.params.aliases.yAxis[value]) ? this.params.aliases.yAxis[value] : value;
                const charLimit = this.params.omicsBox.labelTruncating.y[axisIndex]

                if (this.options[_yAxis][axisIndex].type == 'category') {
                    if (aliasValue.length > charLimit) {
                        aliasValue = aliasValue.substring(0, charLimit) + (charLimit > 0 ? '…' : '');
                    }
                } else if (charLimit == 0 || !this.params.omicsBox.labelScientificMode.y[axisIndex]) {
                    aliasValue = new Intl.NumberFormat('en-GB', { style: 'decimal', notation: 'standard', maximumFractionDigits: Math.min(charLimit || 0, 15) }).format(+aliasValue); //(+aliasValue).toFixed(charLimit)
                } else {
                    aliasValue = new Intl.NumberFormat('en-IN', { notation: 'scientific', maximumSignificantDigits: charLimit }).format(aliasValue)
                }

                return typeof yaxisFormatter === "function" ? yaxisFormatter(aliasValue, index) : yaxisFormatter.replace("{value}", aliasValue);
            }.bind(this)
        })


        this.options[_zAxis]?.map((axis, index) => {
            // this.options.yAxis[index].axisLabel = { ...axisDefaultOptions, ...axis.axisLabel || {} }
            // this.options.yAxis[index].nameTextStyle = { ...nameAxisDefaultOptions, ...axis.nameTextStyle || {} }
            const axisIndex = index

            this.options[_zAxis][index] = merge.recursive(true, yAxisOptions, axis)

            if (this.options[_zAxis][index].type == "category") {
                this.options[_zAxis][index].axisLabel.interval = 0
            } else {
                this.options[_zAxis][index].axisLabel.interval = null
            }

            // Rotate text for right axis
            if (this.options[_zAxis][index].position == "right") {
                this.options[_zAxis][index].nameRotate = -90
            }

            // Save the original string formatter (if any) to be restored after updating the viewer
            let zaxisFormatter;
            if (this.options[_zAxis][index].axisLabel._orgFormatter) {
                zaxisFormatter = this.options[_zAxis][index].axisLabel._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options[_zAxis][index].axisLabel.formatter)) {
                    this.options[_zAxis][index].axisLabel._orgFormatter = this.options[_zAxis][index].axisLabel.formatter
                }

                zaxisFormatter = this.options[_zAxis][index].axisLabel.formatter || ((value, index) => value)
            }

            this.options[_zAxis][index].axisLabel.formatter = function (value, index) {
                var aliasValue = (this.params.aliases.zAxis && this.params.aliases.zAxis[value]) ? this.params.aliases.zAxis[value] : value;
                const charLimit = this.params.omicsBox.labelTruncating.z[axisIndex]

                if (this.options[_zAxis][axisIndex].type == 'category') {
                    if (aliasValue.length > charLimit) {
                        aliasValue = aliasValue.substring(0, charLimit) + (charLimit > 0 ? '…' : '');
                    }
                } else if (charLimit == 0 || !this.params.omicsBox.labelScientificMode.z[axisIndex]) {
                    aliasValue = new Intl.NumberFormat('en-GB', { style: 'decimal', notation: 'standard', maximumFractionDigits: Math.min(charLimit || 0, 15) }).format(+aliasValue); //(+aliasValue).toFixed(charLimit)
                } else {
                    aliasValue = new Intl.NumberFormat('en-IN', { notation: 'scientific', maximumSignificantDigits: charLimit }).format(aliasValue)
                }

                return typeof zaxisFormatter === "function" ? zaxisFormatter(aliasValue, index) : zaxisFormatter.replace("{value}", aliasValue);
            }.bind(this)
        })

        if ('tooltip' in this.options) {
            // const tooltipFormatter = _isString(this.options.tooltip.formatter) ? this.options.tooltip.formatter : (this.options.tooltip.formatter || ((params, ticket, callback) => '')).bind(this)
            // Save the original string formatter (if any) to be restored after updating the viewer
            let tooltipFormatter;
            if (this.options.tooltip._orgFormatter) {
                tooltipFormatter = this.options.tooltip._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options.tooltip.formatter)) {
                    this.options.tooltip._orgFormatter = this.options.tooltip.formatter
                }

                tooltipFormatter = _isString(this.options.tooltip.formatter) ? this.options.tooltip.formatter : (this.options.tooltip.formatter || ((params, ticket, callback) => '')).bind(this)
            }
            const extraLabels = JSON.parse(this.options.tooltip.obExtraLabels || '{}')

            this.options.tooltip.formatter = function (params, ticket, callback) {
                const aliasValue = (this.params.aliases.series && this.params.aliases.series[params.seriesName]) ? this.params.aliases.series[params.seriesName] : params.seriesName;

                if (_isString(tooltipFormatter)) {
                    const x = params.value[params.encode.x[0]], y = params.value[params.encode.y[0]], z = params.value[params.encode.z?.[0]];
                    const series = this.options.series[params.seriesIndex];
                    const templateVars = {
                        seriesName: aliasValue,
                        extraInfo: this._getExtraInfo({seriesIndex: series._index, yIndex: params.encode.y[0], dataIndex: params.dataIndex, datasetIndex: series.datasetIndex}),
                        x: x,
                        y: y,
                        z: z,
                        xy: `${x}_${y}`,
                        extra: extraLabels
                    }

                    return this._replaceVars(tooltipFormatter, Object.assign({}, params, templateVars))
                } else {
                    return tooltipFormatter(Object.assign({}, params, { seriesName: aliasValue }), ticket, callback)
                }
            }.bind(this)
        }

        if ('label' in this.options) {
            // const labelFormatter = _isString(this.options.label.formatter) ? this.options.label.formatter : (this.options.label.formatter || ((params, ticket, callback) => '')).bind(this)
            // Save the original string formatter (if any) to be restored after updating the viewer
            let labelFormatter;
            if (this.options.label._orgFormatter) {
                labelFormatter = this.options.label._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options.label.formatter)) {
                    this.options.label._orgFormatter = this.options.label.formatter
                }

                labelFormatter = _isString(this.options.label.formatter) ? this.options.label.formatter : (this.options.label.formatter || ((params, ticket, callback) => '')).bind(this)
            }
            const extraLabels = JSON.parse(this.options.label.obExtraLabels || '{}')

            this.options.label.formatter = function (params, ticket, callback) {
                const aliasValue = (this.params.aliases.series && this.params.aliases.series[params.seriesName]) ? this.params.aliases.series[params.seriesName] : params.seriesName;

                if (_isString(labelFormatter)) {
                    const x = params.value[params.encode.x[0]], y = params.value[params.encode.y[0]], z = params.value[params.encode.z?.[0]];
                    const series = this.options.series[params.seriesIndex];
                    const templateVars = {
                        seriesName: aliasValue,
                        extraInfo: this._getExtraInfo({seriesIndex: series._index, yIndex: params.encode.y[0], dataIndex: params.dataIndex, datasetIndex: series.datasetIndex}),
                        x: x,
                        y: y,
                        z: z,
                        xy: `${x}_${y}`,
                        extra: extraLabels
                    }

                    return this._replaceVars(labelFormatter, Object.assign({}, params, templateVars))
                } else {
                    return labelFormatter(Object.assign({}, params, { seriesName: aliasValue }), ticket, callback)
                }
            }.bind(this)
        }

        if ('legend' in this.options) {
            // const legendFormatter = this.options.legend.formatter || ((value) => value)
            // Save the original string formatter (if any) to be restored after updating the viewer
            let legendFormatter;
            if (this.options.legend._orgFormatter) {
                legendFormatter = this.options.legend._orgFormatter
            } else {
                // Only keep original reference to formatter in case of strings
                if (_isString(this.options.legend.formatter)) {
                    this.options.legend._orgFormatter = this.options.legend.formatter
                }

                legendFormatter = this.options.legend.formatter || ((value) => value)
            }

            this.options.legend.formatter = function (value) {
                const aliasValue = (this.params.aliases.series && this.params.aliases.series[value]) ? this.params.aliases.series[value] : value;

                return typeof legendFormatter === "function" ? legendFormatter(aliasValue) : legendFormatter.replace("{value}", aliasValue);
            }.bind(this)


            // Assign data to legend to skip dummy series
            const _updateLegendData = () => {
                return this.options.series.filter(series => !series.name.startsWith("dummy")).map(series => series.name)
            }

            this.options.legend.data = _updateLegendData()

            this.addEventListener('obUpdatedOptions', (ev) => {
                // Update legend data when changing series options
                if (ev.detail.options && ev.detail.options.includes("series")) {
                    this.options.legend.data = _updateLegendData()
                }
            })
        }

        // Apply custom renderer to error bar or other special series (boxplot)
        this.options.series.map((series, index) => {
            // Apply custom renderer to error bar or other special series (boxplot)
            this._restoreSeriesCallbacks(series, index);

            // We need to ensure a label property
            series.label = Object.assign({
                fontWeight: this.themeData.pie.label.fontWeight,
                fontStyle: this.themeData.pie.label.fontStyle,
                fontSize: this.themeData.pie.label.fontSize,
            }, series.label || {})
        })

        // Custom labels & ticks.
        // Echarts 5.0.0 does not support declaring 'data' axis parameter for axis types other than 'category'.
        // Our modified echarts version includes this pull request: https://github.com/apache/echarts/pull/13636
        // That mod allow us to use the alias system. We may need to revisit this in the future once they add
        // official support to that feature (coming in 5.2.0)
        //
        // UPDATE: they have pushed the version, coming in 5.X.X
        //
        // TODO: this is a very experimental feature (used only once) that might have some incompatibilities 
        // with char/digit number and so on. For now those elements will be disabled if aliases are found
        if (this.params.omicsBox.aliases && this.params.omicsBox.aliases.yTick) {

            Object.keys(this.params.omicsBox.aliases.yTick).forEach(axisIndex => {
                let customTicks = Object.keys(this.params.omicsBox.aliases.yTick[axisIndex])

                if (this.options.yAxis[axisIndex].type == 'value') {
                    customTicks = customTicks.map(parseFloat)
                }

                this.options.yAxis[axisIndex].axisLabel = Object.assign(this.options.yAxis[axisIndex].axisLabel || {}, {
                    customValues: customTicks,
                    formatter: (value, ticket, callback) => {
                        return this.params.omicsBox.aliases.yTick[axisIndex][value.toString()]
                    }
                })
                this.options.yAxis[axisIndex].axisTick = Object.assign(this.options.yAxis[axisIndex].axisTick || {}, { alignWithLabel: true, customValues: customTicks })
            })
        }

        console.log("OPTIONS ", this.options)
    }

    _getAliases(type) {
        if (!(type in this.params.aliases)) {
            this.params.aliases[type] = {}
        }

        return this.params.aliases[type]
    }

    /*
        Postprocessing method is called after setting/checking options but before passing the options
        to echarts.
    */
    _postProcessing() {
        // Add the grid offsets based on the options and maximum widths. This will modify both
        // the grid object and the options in place.
        this._adjustChartMargins(this.options);

        // Propagate the grid options 
        Object.assign(this.options, this.getMergedGridOptions());
    }

    _createChart(keepOptions = false) {
        this.chart = echarts.init(this.echarts_div, this.theme, { renderer: this.renderer });

        /*
            17/02/22: there seems to be a bug in the echarts library used, in which the _scheduler.unfinished value
            is perpetually true (unless we interact with the chart) so the finished event is never triggered

            zr.animation.isFinished() && !ecIns[PENDING_UPDATE] && !ecIns._scheduler.unfinished && !ecIns._pendingActions.length)

            The rendered event is triggered once for each frame, so we set a timeout: if no new rendered events are triggered in 700 ms,
            we asume that it has finished. Obviously this needs to be removed once the bug is fixed by echarts.
        */
        const _readyEvent = () => {
            // this.webSocketRequest.sendJson({
            //     resource: 'ready'
            // })

            this.webSocketRequest.restRequest('ready', 'GET');
        }

        this.chart.on('rendered', () => {
            clearTimeout(this._renderedTimeout);

            this._renderedTimeout = setTimeout(() => {
                this.chart.off('rendered');
                this.chart.off('finished');

                _readyEvent();
            }, 700)
        })

        // Wait until first 'finished' event, otherwise progressive charts will not be fully rendered.
        // Despite the rendered event
        this.chart.one('finished', () => {
            this.chart.off('rendered');
            clearTimeout(this._renderedTimeout);

            _readyEvent();
        })

        // this.chart.setOption({})

        if (!keepOptions) {
            // Avoid adding extra event listeners when recreating the chart with font changes
            this.addEventListener('settingsChange', (e) => {
                let params = e.detail;

                console.log("SETTINGS CHANGE", e, this.options);

                this.closeEditors();

                this._updateOptions(params.component, false);

                // Apply a correction by line number
                if (params.grid) {
                    // Avoid adding axisNamePadding when the margin is 0
                    this.grid.addOffset(params.component, params.grid.position, params.grid.margin ? params.grid.margin + axisNamePadding : 0);

                    this._updateGridOptions();
                }
            })

            this._setOptions()
            this._checkOptions()
            this._postProcessing()
            // this._processDataset()
        }

        this.chartReady = true;
        this.chart.setOption(this.options, true);

        this.chart.on('datazoom', this._axisRangeChanged.bind(this))
        this.chart.on('legendselectchanged', this._axisRangeChanged.bind(this))

        this.setEditorHandlers({
            chart: this.chart,
            options: this.options
        });

        this.postChartReady()
    }

    _axisRangeChanged(e) {
        console.log("AXIS RANGE CHANGED", e)
        this._setLabelTruncatingOptions(true)
    }

    _updateParams() {
        this.params.touchParams()
    }

    _updateData() {
        // this.webSocketRequest.sendJson({
        //     resource: 'data',
        //     jsonData: JSON.stringify(this.data)
        // });

        this.webSocketRequest.restRequest('data', 'POST', {jsonData: JSON.stringify(this.data)});
    }

    _getChartNameStyleWidth() {
        // return this.offsetWidth > 0 ? (this.offsetWidth - axisNamePadding) : (window.innerWidth - this.sidebarWidth - axisNamePadding)
        return this.offsetWidth > 0 ? (this.offsetWidth - axisNamePadding) : (window.innerWidth - axisNamePadding)
    }

    _getChartNameStyleHeight() {
        return this.offsetHeight > 0 ? (this.offsetHeight - axisNamePadding) : (window.innerHeight - axisNamePadding)
    }

    _updateAxisGridOptions(key) {
        // Propagate the styling options from the first axis to the others
        const changedStyle = this.options[key][0].splitLine

        this.options[key].map((axis, index) => {
            this.options[key][index].splitLine = changedStyle
        })

        this._updateOptions(key, false)
    }

    _updateGridOptions(updateChart = true, entry = this.getBoundingClientRect()) {
        if (this.options) {
            this.refreshGridOptions()
        }
    }

    _registerTheme(fontFamily) {
        this.themeData = omicsboxtheme(fontFamily);

        // Patch to update grid: do we need an event only for this? Don' think so...
        if (this.grid) {
            this.grid.themeData = this.themeData;
        }

        echarts.registerTheme('omicsbox', this.themeData);
    }

    _updateFontFamilyOptions(e) {
        this.params.setParam('fontFamily', e.detail.value);

        this._registerTheme(e.detail.value);

        echarts.dispose(this.chart);

        // Keep current options
        this._createChart(true);
        // this._configureObserver();
    }

    _updateOptions(key = null, notMerge = false, storeInParams = true) {
        let selOptions;
        if (key !== null) {
            selOptions = (typeof key === 'string' || key instanceof String) ? {
                [key]: this.options[key]
            } : key
        } else {
            selOptions = {}
        }

        // Dispatch a new event when modifying options. In some cases (multiple grids) we
        // want to listen to this.
        this.dispatchEvent(new CustomEvent('obUpdatedOptions', { detail: { options: Object.keys(selOptions) } }))

        // For some reason echarts seems to override custom series itemStyle (ie. boxplots)
        // so we need to update the whole set of options.
        if (this.params.omicsBox.forceGlobalUpdateOptions) {
            selOptions = Object.assign(this.params.options, selOptions);
        }

        if (storeInParams) {
            Object.assign(this.params.options, selOptions);

            this._updateParams();
        }

        if (this.chart && this.chartReady) {
            this.chart.setOption(selOptions, notMerge);
        }
        console.log("UPDATE OPTIONS", selOptions, this.options)
        this.closeEditors();
    }

    _updateChart() {
        this._setOptions()
        this._checkOptions()
        this._postProcessing()

        this.chart.setOption(this.options, true);

        this._updateParams();
    }

    _adjustChartMargins(options, maxWidth = this._getChartNameStyleWidth(), maxHeight = this._getChartNameStyleHeight()) {
        let defaultXAxisStyle = this.themeData.categoryAxis.nameTextStyle
        let defaultYAxisStyle = defaultXAxisStyle

        // We do it separately because some axis might not contain text
        if (options.title.text.length) {
            let titleStyle = options.title.textStyle ? options.title.textStyle : this.themeData.title.textStyle
            let titleLines = echarts.format.parsePlainText(options.title.text, {
                font: `${titleStyle.fontStyle} ${titleStyle.fontWeight} ${titleStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxWidth
            })

            if (options.title.textStyle) {
                options.title.textStyle.width = maxWidth
            }

            this.grid.addOffset('title', 'top', titleLines.height + axisNamePadding)
        } else {
            this.grid.addOffset('title', 'top', 0)
        }

        if (options.title.subtext && options.title.subtext.length) {
            let subtitleStyle = options.title.subtextStyle ? options.title.subtextStyle : this.themeData.title.subtextStyle
            let subtitleLines = echarts.format.parsePlainText(options.title.subtext, {
                font: `${subtitleStyle.fontStyle} ${subtitleStyle.fontWeight} ${subtitleStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxWidth
            })

            if (options.title.subtextStyle) {
                options.title.subtextStyle.width = maxWidth
            }

            this.grid.addOffset('subtitle', 'top', subtitleLines.height)
        } else {
            this.grid.addOffset('subtitle', 'top', 0)
        }

        const xAxisBottom = options.xAxis?.find(axis => axis.name.length && axis.position == 'bottom')
        if (xAxisBottom) {
            // Take the first
            let axisFontStyle = xAxisBottom.nameTextStyle ? xAxisBottom.nameTextStyle : defaultXAxisStyle

            let xAxisBottomLines = echarts.format.parsePlainText(xAxisBottom.name, {
                font: `${axisFontStyle.fontStyle} ${axisFontStyle.fontWeight} ${axisFontStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxWidth
            })

            if (xAxisBottom.nameTextStyle) {
                xAxisBottom.nameTextStyle.width = maxWidth
            }

            this.grid.addOffset('xAxis', 'bottom', xAxisBottomLines.height + axisNamePadding)
        } else {
            this.grid.addOffset('xAxis', 'bottom', 0)
        }

        const xAxisTop = options.xAxis?.find(axis => axis.name.length && axis.position == 'top')
        if (xAxisTop) {
            let axisFontStyle = xAxisTop.nameTextStyle ? xAxisTop.nameTextStyle : defaultYAxisStyle

            let xAxisTopLines = echarts.format.parsePlainText(xAxisTop.name, {
                font: `${axisFontStyle.fontStyle} ${axisFontStyle.fontWeight} ${axisFontStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxWidth
            })

            if (xAxisTop.nameTextStyle) {
                xAxisTop.nameTextStyle.width = maxWidth
            }

            this.grid.addOffset('xAxis', 'top', xAxisTopLines.height + axisNamePadding)
        } else {
            this.grid.addOffset('xAxis', 'top', 0)
        }

        const yAxisLeft = options.yAxis?.find(axis => axis.name.length && axis.position == 'left')
        if (yAxisLeft) {
            let axisFontStyle = yAxisLeft.nameTextStyle ? yAxisLeft.nameTextStyle : defaultYAxisStyle

            let yAxisLeftLines = echarts.format.parsePlainText(yAxisLeft.name, {
                font: `${axisFontStyle.fontStyle} ${axisFontStyle.fontWeight} ${axisFontStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxHeight
            })

            if (yAxisLeft.nameTextStyle) {
                yAxisLeft.nameTextStyle.width = maxHeight
            }

            this.grid.addOffset('yAxis', 'left', yAxisLeftLines.height + axisNamePadding)
        } else {
            this.grid.addOffset('yAxis', 'left', 0)
        }

        const yAxisRight = options.yAxis?.find(axis => axis.name.length && axis.position == 'right')
        if (yAxisRight) {
            let axisFontStyle = yAxisRight.nameTextStyle ? yAxisRight.nameTextStyle : defaultXAxisStyle

            let yAxisRightLines = echarts.format.parsePlainText(yAxisRight.name, {
                font: `${axisFontStyle.fontStyle} ${axisFontStyle.fontWeight} ${axisFontStyle.fontSize}px ${this.params.omicsBox.fontFamily}`,
                overflow: overflowValue,
                width: maxHeight
            })

            if (yAxisRight.nameTextStyle) {
                yAxisRight.nameTextStyle.width = maxHeight
            }

            this.grid.addOffset('yAxis', 'right', yAxisRightLines.height + axisNamePadding)
        } else {
            this.grid.addOffset('yAxis', 'right', 0)
        }

        // Visual Maps
        if (options.visualMap.some(vsmap => vsmap.show)) {
            this.grid.addOffset('visualMap', 'right', visualMapWidth)
        }

        // Legend
        if ('legend' in options && options.legend.show) {
            this.grid.addOffset('legend', 'bottom', legendHeight + axisNamePadding)
        }
    }

    _defaultResizeCB(entries) {
        for (const entry of this._lastResizeEntries) {
            console.log("Resize detected on: ", this, Math.floor(Date.now() / 1000), entry)

            if (this._resizeProcess) {
                console.log("Resizing stopped: in the middle of a previous rendering.");
                // Call again the resizing method to match the latest entry.
                clearTimeout(this._resizeTimer);

                this._resizeTimer = setTimeout(() => this._defaultResizeCB, RESIZE_EVENT_TIMEOUT_MS);

                return;
            }

            this._resizeProcess = true;

            // Avoid resizing/repainting with false resizing events (ie. switching tabs)
            // TODO: jxBrowser seems to trigger the resize event two times. The first one when activating the tab, 
            // sends one entry with the total dimensions. Then, after 'rendering' again, it sends another one with different
            // dimensions, probably because showing the scrollbar readjust the 'rendered window content'
            if (entry.contentRect.width != this.contentRect.width || entry.contentRect.height != this.contentRect.height) {

                // Store the new dimensions (without changing the reference of the original object)
                this.contentRect.width = entry.contentRect.width
                this.contentRect.height = entry.contentRect.height
                this.contentRect.offsetHeight = this.offsetHeight
                this.contentRect.offsetWidth = this.offsetWidth

                // We need to adjust the 'width' max number dinamically, as echarts
                // does not allow to set percentages as of 5.0.0
                // this._setNameLabelWidths(this.options, entry.contentRect.width - this.sidebarWidth - axisNamePadding, entry.contentRect.height - this.sidebarWidth - axisNamePadding)
                this._adjustChartMargins(this.options, entry.contentRect.width - axisNamePadding, entry.contentRect.height - axisNamePadding);

                this._updateOptions(Object.assign({ title: this.options.title }, this.getMergedGridOptions()), false, false);

                this.chart.resize();

                if (this.resizeCallback) {
                    this.resizeCallback(entry.contentRect)
                }
            } else {
                console.log("Skipping resize: same dimensions")
            }

            this._resizeProcess = false;
        }
    }

    _configureObserver() {
        // If there is a previous ResizeObserver, disconnect it
        if (this._ro) {
            this._ro.disconnect();
        }

        this._ro = new ResizeObserver((entries, observer) => {
            // Clear old timeout
            clearTimeout(this._resizeTimer)

            // Close editors before the timeout
            this.closeEditors();

            this._lastResizeEntries = entries;

            // Set a new timeout
            this._resizeTimer = setTimeout(() => this._defaultResizeCB(), RESIZE_EVENT_TIMEOUT_MS);
        })

        this._ro.observe(this);
    }

    _wsServerCallback(msg) {
        console.log("SERVER CALLBACK ", msg)

        const _getMsgOptions = function (msg) {
            let options = {}

            if ('filepath' in msg) {
                options.filepath = msg.filepath
            }

            if ('userselected' in msg) {
                options.userselected = msg.userselected
            }

            return options
        }

        switch (msg.action) {
            case 'getPDF':
                // this._getSVGData().then((svgData) => this.webSocketRequest.sendJson(Object.assign({
                //     resource: 'dataPDF', //msg.action.replace('get', 'data'),
                //     dataSVG: svgData
                // }, _getMsgOptions(msg))));
                this._getSVGData().then((svgData) => this.webSocketRequest.restRequest('dataPDF', 'POST', Object.assign({
                    dataSVG: svgData
                }, _getMsgOptions(msg))));
                break;
            case 'getPNG':
                // this.webSocketRequest.sendJson(Object.assign({
                //     resource: 'dataPNG',
                //     dataPNG: this._getPNGData()
                // }, _getMsgOptions(msg)))

                this.webSocketRequest.restRequest('dataPNG', 'POST', Object.assign({
                    dataPNG: this._getPNGData()
                }, _getMsgOptions(msg)))
                break;

            case 'getCSV':
                // this.webSocketRequest.sendJson(Object.assign({
                //     resource: 'dataCSV',
                //     dataCSV: this._getCSVData()
                // }, _getMsgOptions(msg)))
                this.webSocketRequest.restRequest('dataCSV', 'POST', Object.assign({
                    dataCSV: this._getCSVData()
                }, _getMsgOptions(msg)))
                break;
            default:
            //console.log("Invalid message action.", msg);
        }
    }

    _setOptions() {
        const dataZoomFilterMode = 'none'

        // IMPORTANT: these default options will be overriden by the ones given in this.params.options
        // and will not keep the structure, that means that every key will be completely replaced by
        // another and not 'property-merged' (ie: empty grid will be put in place of the default)
        this.options = {
            animation: false,
            title: {
                left: 'center',
                triggerEvent: true,
                top: 10
            },
            legend: {
                top: 'bottom',
                type: 'scroll'
                //selectedMode: false,
                // lineNumber: this.params.lineNumber,
                // scrollDataIndex: this.params.scrollDataIndex
            },
            tooltip: {

                formatter: function (params, ticket, callback) {
                    let xValue, yValue
                    if (Array.isArray(params.data)) {
                        if (params.encode.x && params.encode.y) {
                            if (this._getOrientation() == ORIENTATION.HORIZONTAL) {
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
                            return this.params.options.series.length > 1 ? `<div class="tooltip">
                        <h4 style="margin-top: 0;">${params.seriesName}</h4>
                        <span>${xValue}: ${yValue}</span>
                        </div>` : `<b>${params.data[0]}</b>: ${params.data[1]}`;
                        } else {
                            return this.params.options.series.length > 1 ? `<div class="tooltip">
                        <h4 style="margin-top: 0;">${params.seriesName}</h4>
                        <span>${yValue}</span>
                        </div>` : `${params.data[1]}`;
                        }
                    } else {
                        return this.params.options.series.length > 1 ? `<div class="tooltip">
                        <h4 style="margin-top: 0;">${params.seriesName}</h4>
                        <span>${params.name}</span>
                        </div>` : `${params.name}`;
                    }
                }.bind(this)
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: this.params.omicsBox.enableZoomSlider,
                    xAxisIndex: [0],
                    bottom: 15,
                    filterMode: dataZoomFilterMode,
                    // disabled: this.hasMultipleAxis(this.params.options)
                    disabled: !this.hasZoomSliderAvailable()
                    // start: 1,
                    // end: 35
                },
                {
                    type: 'slider',
                    show: this.params.omicsBox.enableZoomSlider,
                    yAxisIndex: [0],
                    right: 15,
                    filterMode: dataZoomFilterMode,
                    // disabled: this.hasMultipleAxis(this.params.options)
                    disabled: !this.hasZoomSliderAvailable()
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    filterMode: dataZoomFilterMode,
                    // disabled: !this.hasSidebarOption(SIDEBAR_MODULES.ZOOM_OPTIONS) || this.hasMultipleAxis(this.params.options)
                    disabled: !this.hasZoomAvailable()
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    filterMode: dataZoomFilterMode,
                    // disabled: !this.hasSidebarOption(SIDEBAR_MODULES.ZOOM_OPTIONS) || this.hasMultipleAxis(this.params.options)
                    disabled: !this.hasZoomAvailable()
                }
            ]
        };


        // Add only dataset when it is compatible
        if (this.data.isOptionCompatible()) {
            this.options.dataset = this.data.map(d => ({ dimensions: d.dimensions, source: d.source.slice() }))
        }

        this.options = merge.recursive(false, this.options, this.params.options)

        // Trigger the last event to take into account binning changes
        this.data.triggerEvent()

        // We need to store the seriesInfo in a different object, or else the "_updateParams"
        // will override it. Restore the series options based on the 'enabled' setting
        this.options.series = this.params.omicsBox.seriesInfo.filter(seriesConfig => seriesConfig.enabled).map(seriesConfig => seriesConfig.data)

        // The original chart might contain an empty grid (just to indicate the number) but
        // also the params may have been changed by sidebar options. To keep the modified/saved
        // params at the time we offer a default and viable config set, we merge the keys between the two
        // after everything else.

        this.grid.setChartOptions(this.options)

        // TODO: only available for one grid.
        const gridOptions = this.grid.getGridOptions()

        if (gridOptions && !this.is3DChart()) {
            // TODO: getGridOptions now correctly returns the options even for multiple grids, but since there is 
            // only ONE chart that uses it (GO distribution by level) we prefer to avoid the risk.
            this.options.grid[0] = Object.assign(gridOptions['grid'][0], this.options.grid[0])
        }

        console.log(this.options, this.params.options)

        // If we have X_FORMATTING option available, add the label formatting also (if not there)
        // This needs to be here because postGlobalTransformation would only be applied to new objects.
        if (this.hasSidebarOption(SIDEBAR_MODULES.FORMATTING_XAXIS_LABELS) && !this.hasSidebarOption(SIDEBAR_MODULES.LABEL_FORMATTING)) {
            this.params.defaultSidebarOptions.push(SIDEBAR_MODULES.LABEL_FORMATTING);
        }
    }

    setWebsocketRequest(wsRequest) {
        this.webSocketRequest = wsRequest;

        // Replace the old callback with the new one.
        wsRequest.args.serverCallback = this._wsServerCallback.bind(this)

        // this.webSocketRequest.sendJson({
        this.webSocketRequest.restRequest('info', 'GET', null, jsonMsg => {
            /*
                - msg params:
                - msg.jsonData
                - msg.jsonParams
                - msg.pluginInfo 
                - msg.jsonTrialMode
            */
            let jsonData = JSON.parse(jsonMsg.jsonData);
            let jsonParams = JSON.parse(jsonMsg.jsonParams);
            let datasetType = jsonData[0].obType || 'ChartDataset';

            // Dynamic load of echarts-gl script.
            // Until we keep up with the latest releases, there is a bug in echarts-gl that we
            // can't solve in the minified version, so we need to load a big .js file of 2.4MB.
            // Since there is only ONE chart that needs it, we try to avoid it whenever possible.
            let scriptPromise = new Promise(function (resolve, reject) {

                if (datasetType == 'Chart3DDataset') {
                    let echartsGlScript = document.createElement('script');
                    echartsGlScript.src = './node_modules/web-libraries/echarts/dist/echarts-gl.min.js';

                    echartsGlScript.onload = () => resolve();
                    echartsGlScript.onerror = () => reject(new Error(`Script load error for 'echarts-gl.min.js'`));

                    window.document.head.append(echartsGlScript);
                } else {
                    resolve()
                }
            });

            scriptPromise.then(() => {
                this.initializeParams();
                this.initializeDataset(datasetType);
                this.initializeGrid();

                // TODO: should we move this to the constructor?
                this.setTrialMode('jsonTrialMode' in jsonMsg ? jsonMsg.jsonTrialMode : true);
                this.setJsonInfo(jsonData, jsonParams);

                this.init();
            })
        });
    }

    setJsonInfo(jsonData, jsonParams) {
        this._setJsonData(jsonData);
        this._setJsonParams(jsonParams);
    }

    _setJsonData(jsonData) {
        this.data.setData(jsonData);
    }

    _containsData() {
        // return this.data.length && this.data.some(dataset => dataset.source.length)
        return this.data?._containsData();
    }

    _setJsonParams(jsonParams) {
        if (jsonParams != null) {
            this.params.loadJsonParams(jsonParams)

            // Transfer settings to ChartDataset
            let datasetSettings = Object.keys(this.data.properties).filter(key => key in this.params.omicsBox).reduce((acc, setting) => {
                acc[setting] = this.params.omicsBox[setting]

                return acc
            }, {})

            console.log("DATASET SETTINGS", datasetSettings)

            this.data.setParams(datasetSettings)

            this.data.sortingAllowed = this.hasSortingAllowed()

            if (!this.params.omicsBox.specificTransformed && this._containsData()) {
                this._setSpecificSettings()
            }

            // Update theme data based on settings
            this._registerTheme(this.params.getParam('fontFamily'));
        }
    }

    _barClipLayout(ec) {
        ec.eachSeries(seriesComponent => {

            var data = seriesComponent.getData();

            data.each(idx => {

                var layout = data.getItemLayout(idx);

                if (layout) {

                    // var rect = seriesComponent.coordinateSystem.grid.getRect();
                    var rect = seriesComponent.coordinateSystem.master.getRect();

                    if (layout.x < rect.x) {
                        layout.width = layout.width - (rect.x - layout.x);
                        layout.x = rect.x;
                    }

                    if (layout.x + layout.width > rect.x + rect.width) {
                        layout.width = rect.x + rect.width - layout.x;
                    }

                    if (layout.width < 0) layout.width = 0;

                    if (layout.y > rect.y + rect.height) {
                        layout.height = layout.height - (rect.y + rect.height - layout.y);
                        layout.y = rect.y + rect.height;
                    }

                    var absY = (rect.y + rect.height) - layout.y;

                    if (absY + Math.abs(layout.height) + 65 > rect.y + rect.height) {
                        layout.height = -(rect.y + rect.height - 65 - absY);
                    }

                    if (layout.height > 0) layout.height = 0;

                }
            });
        });
    }

    _setSpecificSettings() {
        // Current version of echarts does not support dataset for all plot types.
        // Also, some specific plot types (but common enough to be here in the generic
        // viewer) might need special data transformations (ie. boxplot). We fix
        // those special cases here thus leaving the same param/data structure in the
        // java object.
        const typeTransformations = {
            'boxplot': (selectedSeries) => {
                // TODO: add support for multiple datasets
                this.data.map((dataset, dataIndex) => {
                    const arraySeriesData = this._getDatasetByRowSeries(dataset)
                    const seriesNames = dataset.dimensions.slice(1)
                    const seriesInfo = arraySeriesData[0]
                    const boxPlotData = echarts.dataTool.prepareBoxplotData(arraySeriesData.slice(1));
                    const styledBoxData = boxPlotData.boxData.map((seriesData, index) => ({
                        value: seriesData,
                        itemStyle: this.params.options.series[index].itemStyle || {}
                    }));

                    const boxplotSeries = [
                        {
                            type: 'boxplot',
                            data: styledBoxData,
                            name: 'boxplotData',
                            // boxWidth: [1, 100]

                        },
                        {
                            name: 'outliers',
                            type: 'scatter',
                            data: boxPlotData.outliers,
                            itemStyle: {
                                color: 'transparent',
                                borderWidth: 1,
                                borderColor: 'black'
                            }
                        }
                    ]

                    this.params.options.series = boxplotSeries;
                    this.params.options.xAxis[dataIndex].data = seriesNames;
                    this.params.options.yAxis[dataIndex].boundaryGap = ['5%', '5%'];
                    this.params.options.yAxis[dataIndex].splitLine = { show: false }
                    this.params.options.xAxis[dataIndex].axisLine = { onZero: false }
                    this.params.options.legend = { show: false }
                })

                this.params.omicsBox.forceGlobalUpdateOptions = true
            },

            'boxplot-trimmed': (selectedSeries) => {
                // Echarts 5.2 does not support (according to the tests and documentation) the
                // 'datasetIndex' parameter for boxplot series. In one of the examples is used
                // in combination with transforms, something we do not currently support as we
                // already do them here.
                //
                // The cleanest way to give the new BoxPlotData info with outliers at the time
                // we keep 2D matrix structure was the use of multiple datasets and make it work
                // by passing them using the supported 'data' parameter.
                let dataIndex = 0;

                this.params.options.xAxis[dataIndex].data = this.data.getData(0).source.map(boxplot => boxplot.name);
                this.params.options.yAxis[dataIndex].boundaryGap = ['5%', '5%'];
                this.params.options.yAxis[dataIndex].splitLine = { show: false }
                this.params.options.xAxis[dataIndex].axisLine = { onZero: false }
                this.params.options.legend = { show: false }
            },

            'processed-boxplot': (selectedSeries) => {
                if (selectedSeries.length > 5) {
                    log.error("Incorrect number of selected series for processed boxplot, there must be 5");
                } else {
                    const boxplotSeries = { type: 'boxplot', name: 'boxplotdata' }
                    let datasetIndex, yAxis, xAxis, itemStyle

                    selectedSeries.map(series => {
                        // series.data = this.data[ser]
                        console.log("PROCESSED BOXPLOT REMOVING", series, this.params.options.series)
                        this.params.options.series.splice(this.params.options.series.indexOf(series), 1)
                        datasetIndex = series.datasetIndex
                        yAxis = series.yAxisIndex
                        xAxis = series.xAxisIndex
                        itemStyle = series.itemStyle
                    })

                    // Remove 
                    const xAxisLabels = []

                    boxplotSeries.data = this.data.getData(datasetIndex).source.map(row => {
                        xAxisLabels.push(row[0])

                        return row.slice(1)
                    })
                    boxplotSeries.xAxisIndex = xAxis
                    boxplotSeries.yAxisIndex = yAxis
                    boxplotSeries.itemStyle = itemStyle
                    boxplotSeries.itemStyle.borderColor = '#000';
                    // boxplotSeries.boxWidth = [1, 100]

                    this.params.options.xAxis[xAxis].data = xAxisLabels

                    this.params.options.series.unshift(boxplotSeries)

                    console.log("PROCESSED BOXPLOT ADDED", this.params.options.series)
                }
            },

            'scatter': (selectedSeries) => {
                // Scatter Plot optimization
                this.params.options.series.map(series => {
                    series.large = !('visualMap' in this.params.options && this.params.options.visualMap.length);
                    series.largeThreshold = 2000;

                    // There is a bug in which under certain screen sizes, some
                    // points are not painted. It is an echarts bug that also
                    // happens on a simple example script using the original lib version.
                    //
                    // Seems like adding a boundary on the max side "solves" the issue, at 
                    // the expense of adding an empty space, which will be larger with 
                    // lower splitInterval numbers.
                    this.params.options.yAxis[series.yAxisIndex].boundaryGap = ['0%', '0.01%']
                })
            },

            'histogram': (selectedSeries) => {
                // TODO: add support for multiple datasets
                const arraySeriesData = this._getDatasetByRowSeries(this.data.getData(0))
                const histogramSeries = arraySeriesData.map((seriesData, index) => {
                    return {
                        type: 'bar',
                        itemStyle: this.params.options.series[index].itemStyle || {},
                        data: ecStat.histogram(seriesData)
                    }
                })

                this.params.options.series = histogramSeries
            },

            'horizontal-bar': (selectedSeries) => {
                this.setOrientation(ORIENTATION.HORIZONTAL, this.params.options)
            },

            'horizontal-stacked-bar': (selectedSeries) => {
                this.setOrientation(ORIENTATION.HORIZONTAL, this.params.options)
            },

            'pie': (selectedSeries) => {
                console.log(this.params.options)
                // Important: pie chart needs 'value' attribute in encode. We leave is as 0
                this.params.options.series.map(series => {
                    series.encode = Object.assign(series.encode || {}, { value: 1, itemName: 0 })
                    series.center = ['50%', '50%']
                    series.radius = '70%'

                    // Echarts seems to automatically guess the 'label' type based on the first records.
                    // To force the pie label we need to specify a label formatter since there are no axis.
                    // However, we do not want to override user-given labels, nor we want to extend this
                    // behaviour to other plots, hence the need to tag the series as "plot label setting"
                    if (!series.label) {
                        // series.label = { formatter: '${x} (${d}%)' }
                        series.label = { formatter: LABEL_FORMATTER.PIE }
                        series._obPieLabel = true
                    }
                })

                this.params.options.xAxis.map((xAxisData, index) => {
                    this.params.options.xAxis[index] = Object.assign(this.params.options.xAxis[index] || {}, { show: false })
                })

                this.params.options.yAxis.map((yAxisData, index) => {
                    this.params.options.yAxis[index] = Object.assign(this.params.options.yAxis[index] || {}, { show: false })
                })

                // Always add 'other' group color to visual map
                // TODO: apply this on a more general site?
                if ('visualMap' in this.params.options && this.params.options.visualMap.length) {
                    let categoryColorVSMap = this.params.options.visualMap[0]
                    let colorInfo = categoryColorVSMap.inRange.color

                    if (!('others' in colorInfo)) {
                        categoryColorVSMap.categories.push('others')
                        colorInfo['others'] = GROUP_OTHERS_COLOR
                    }
                }
            },


            'area': (selectedSeries) => {
                // Needs to be ordered
                if (this.data.length == 1 && this.params.options.xAxis[0].type == 'value') {
                    // this.data.getData(0).source.sort((a, b) => a[0] - b[0])
                    // console.log("SORTED AREA", this.data)
                    // this._updateData()
                    this.data.sortByValue()
                }

                this.params.options.series.map((series, index) => {
                    this.params.options.series[index].areaStyle = Object.assign(this.params.options.series[index].areaStyle || {}, { opacity: 1 })
                    this.params.options.series[index].lineStyle = Object.assign(this.params.options.series[index].lineStyle || {}, { opacity: 0, color: this.params.options.series[index].areaStyle.color })
                    this.params.options.series[index].itemStyle = Object.assign(this.params.options.series[index].itemStyle || {}, { opacity: 0, color: this.params.options.series[index].areaStyle.color })
                })
            },

            'line': (selectedSeries) => {
                // Needs to be ordered
                if (this.data.length == 1 && this.params.options.xAxis[0].type == 'value') {
                    this.data.sortByValue()
                }
            }
        }

        let preGlobalTransformation = () => {
            // Store the original axis types (binning changes them)
            // NOTE: we do this in pre global transformation to have the info in setOrientation
            this.params.options?.yAxis?.map((axis, index) => {
                axis._obOriginalType = axis.type
            })

            this.params.options?.xAxis?.map((axis, index) => {
                axis._obOriginalType = axis.type
            })
        };

        let postGlobalTransformation = () => {
            // Do not override legend settings
            if (this.params.options.series.length == 1 && !this.params.options.legend) {
                // Always disable legend with one series
                this.params.options.legend = Object.assign(this.params.options.legend || {}, { show: false })
            }

            let gridNumber = this.getUniqueGridsNumber()

            // Populate label truncating settings (depends on the number of axis)
            this.params.options.xAxis?.map((axis, index) => {
                // Adjust rotate value for x Axis: 45 degrees if category NOT numeric
                if (gridNumber == 1) {
                    this.params.options.xAxis[index].axisLabel = Object.assign({ rotate: (axis.type == 'category' ? 45 : 0) }, this.params.options.xAxis[index].axisLabel || {})
                }
            })

            // Create dummy series to store marklines and markareas with different styles
            // In echarts you can define as many marklines/markareas as you want in ONE series, but
            // all of them with the same itemstyle, so multiple color backgrounds will not work.
            const _addDummySeries = (name, zIndex, tooltipFormatter, silent = false) => {
                const seriesObject = { type: 'custom', originalType: 'markline', name: `dummy_${name}`, tooltip: { formatter: tooltipFormatter }, renderItem: () => { }, silent: silent, z: zIndex, legendHoverLink: false, _obEditable: false }

                this.params.options.series.push(seriesObject)

                return seriesObject
            }

            if ('markLine' in this.params.omicsBox) {
                const markLineTooltipFormatter = (data) => {
                    return `${data.name} (${data.xAxis || data.yAxis})`
                }

                this.params.omicsBox.markLine.map((info, index) => {
                    const newSeries = _addDummySeries(`markline${index}`, 2, markLineTooltipFormatter(info))

                    newSeries.markLine = {
                        symbol: ['none', 'none'],
                        label: { show: false },
                        data: [info],
                        silent: true
                    }
                })
            }

            if ('markArea' in this.params.omicsBox) {
                this.params.omicsBox.markArea.map((info, index) => {
                    const newSeries = _addDummySeries(`markArea${index}`, 1, null, true)

                    console.log("MARK AREA", info)
                    newSeries.markArea = info
                    newSeries.markArea.label = { show: false }
                })
            }

            // Disable legend for more than one grid
            this.params.options.legend = Object.assign({ show: this.params.options.series.length > 1 }, this.params.options.legend || {})

            if (this.params.options.grid?.length > 1) {
                this.params.options.legend.show = false
            }

            let xAxisDefaultPosition = this._getOrientation() == ORIENTATION.VERTICAL ? 'bottom' : 'top'

            // Assign a default position
            this.params.options.xAxis?.map(axis => {
                if (!axis.position) {
                    axis.position = xAxisDefaultPosition
                }
            })

            this.params.options.yAxis?.map(axis => {
                if (!axis.position) {
                    axis.position = 'left'
                }
            })

            // Check if we have provided a custom border color and it is different from the itemStyle
            // We cannot compare it in real time because after saving the object we would not have the
            // original color anymore (unless we reset the params)
            this.params.options.series.map((series, index) => {

                // Store the property only when itemStyle.color exists
                if (series.itemStyle && series.itemStyle.color && 'borderColor' in series.itemStyle && series.itemStyle.color != series.itemStyle.borderColor) {
                    series._obCustomBorderColor = true
                }
            })

            // Store the original series as omicsBox params. In succesive loadings
            // the options series will be restored from here
            this.params.omicsBox.seriesInfo = this.params.options.series.map((series, index) => {
                series._index = index

                return { index: index, enabled: true, data: series }
            })

            // Sort data if the possibility of changing the chart to a line-type is there
            if (this.hasSidebarOption(SIDEBAR_MODULES.PLOT_EDITOR_LINES) && this.params.options.xAxis[0].type == 'value') {
                this.data.sortByValue()
            }
        }

        preGlobalTransformation();

        const uniqueTypes = new Set(this.params.options.series.map(series => series.originalType))

        if (uniqueTypes.size > 1) {
            console.log("Multiple series types encountered in received params. Specific transformations are EXPERIMENTAL in this case, or they might be already transformed.", uniqueTypes)
        }

        uniqueTypes.forEach(plotType => {
            if (plotType in typeTransformations) {
                const selectedSeries = this.params.options.series.filter(series => series.originalType == plotType)

                typeTransformations[plotType](selectedSeries);
            }
        })

        postGlobalTransformation();

        this.params.omicsBox.specificTransformed = true;

        this._updateParams()
    }

    _getDatasetByRowSeries(orgDataset) {
        // Original dataset format:
        // { dimensions: [keyValue, seriesName, series2Name, ...], source: [[xValue, yValueSeries1, yValueSeries2, ...]]}
        const processedData = orgDataset.dimensions.map((dimName, dimIndex) => {
            return (orgDataset.source.map(row => row[dimIndex]))
        })

        return processedData
    }

    hasZoomAvailable() {
        const invalidTypes = ['boxplot']

        const seriesInvalid = (this.options || this.params.options)['series'].some(series => invalidTypes.includes(series.type))

        return !this.is3DChart() && !seriesInvalid && this.hasSidebarOption(SIDEBAR_MODULES.ZOOM_OPTIONS) && !this.hasMultipleAxis(this.params.options)
    }

    hasZoomSliderAvailable() {
        return this.hasZoomAvailable()
    }

    hasSortingAllowed() {
        // Line charts with non-categoric 'x' values need to be sorted because line points are linked
        // in the order they are in the dataset, not by value. Enabling sorting in a line chart with that
        // axis will show a weird chart.
        return !(this.params?.options?.xAxis?.[0]?.type == 'value' && this.params.options?.series?.some(series => series.type == 'line'))
    }

    hasCategoryColors() {
        let vsMap = this.options.visualMap.length ? this.options.visualMap[0] : {}

        // Assume that if we have ONE series and the first visual map is an object, it has categories.
        // TODO: make it safe with multiple visual maps
        return this.options.series.length == 1 && vsMap.inRange && !Array.isArray(vsMap.inRange.color)
    }

    hasVisibleAxis() {
        return !this.options.series.some(series => series.type == 'pie')
    }

    hasXAxis() {
        return this.options.xAxis?.length || this.options.xAxis3D?.length;
    }

    hasYAxis() {
        return this.options.yAxis?.length || this.options.yAxis3D?.length;
    }

    hasZAxis() {
        return this.options.zAxis3D?.length;
    }

    hasSidebarOption(optionValue) {
        return this.params.defaultSidebarOptions.includes(optionValue);
    }

    hasSymbols() {
        // Check showSymbol with triple '===' because an undefined showSymbol is a good showSymbol
        return this.options.series.some(series => series.symbol && series._obEditable !== false && series.showSymbol !== false)
    }

    hasMultipleAxis(sourceOptions = this.options) {
        return sourceOptions.xAxis?.length > 1 || sourceOptions.yAxis?.length > 1
    }

    hasYTicksAliases() {
        return this.params.omicsBox.aliases && this.params.omicsBox.aliases.yTick
    }

    hasXTicksAliases() {
        return this.params.omicsBox.aliases && this.params.omicsBox.aliases.xTick
    }

    hasZTicksAliases() {
        return this.params.omicsBox.aliases && this.params.omicsBox.aliases.zTick
    }

    hasBothValueOrgAxis() {
        return this.options.xAxis.some(axis => axis._obOriginalType == 'value') && this.options.yAxis.some(axis => axis._obOriginalType == 'value')
    }

    getUniqueGridsNumber() {
        return [...new Set(this._getXAxisOptions().map(axis => axis.gridIndex))].length
    }

    getSymbolSize() {
        // Assume that every series with symbols has the same size.
        let firstSeries = this.options.series.find(series => series.symbol && series._obEditable !== false)

        return firstSeries ? firstSeries.symbolSize || 1 : 0
    }

    getDatasetDims() {
        // Retrieve ORIGINAL dataset dims
        return {
            rows: this.data.getData(0).source.length,
            cols: (this.data.getData(0).source[0] || []).length
        }
    }

    _getXAxisOptions() {
        return this.params.options.xAxis || this.params.options.xAxis3D;
    }

    _getYAxisOptions() {
        return this.params.options.yAxis || this.params.options.yAxis3D;
    }

    _getEchartsCoordinateSystem() {
        if (this.chart) {
            let coordManager = this.chart._coordSysMgr ? this.chart._coordSysMgr.getCoordinateSystems() : []

            return coordManager.length ? coordManager[0] : null
        }

        return null
    }

    _getEchartAxisComponent(axisName, index) {
        let coordSystem = this._getEchartsCoordinateSystem()

        return coordSystem ? coordSystem.getAxis(axisName, index) : null
    }

    getEchartsAxisInterval(axisName, index) {
        let axisComp = this._getEchartAxisComponent(axisName, index)

        return axisComp && axisComp.scale && axisComp.scale._interval ? axisComp.scale._interval : null
    }

    _setLabelTruncatingOptions(force = false, validAxis = ['xAxis', 'yAxis'], updateOnly = false) {
        // Populate labeltruncanting settings (depends on the number of axis)
        if (validAxis.includes('xAxis')) {
            if (force || !this.params.omicsBox.labelTruncating.x.length) {
                this.options[this.getAxisOption('xAxis')].map((axis, index) => {
                    let xAxisInterval = this.getEchartsAxisInterval('x', index)
                    let xAxisDigits = null
                    if (xAxisInterval != null) {
                        xAxisDigits = xAxisInterval.toString().indexOf(".") != -1 ? xAxisInterval.toString().slice(xAxisInterval.toString().indexOf(".")).length - 1 : 0
                    }

                    // For category indexes try to reuse the previous value (even in force mode)
                    this.params.omicsBox.labelTruncating.x[index] = xAxisDigits != null ? xAxisDigits : (this.params.omicsBox.labelTruncating.x[index] || defaultLabelCharTruncating)
                    this.params.omicsBox.labelScientificMode.x[index] = false //(axis.type != 'category' && )
                })
            }
        }

        if (validAxis.includes('yAxis')) {
            if (force || !this.params.omicsBox.labelTruncating.y.length) {
                this.options[this.getAxisOption('yAxis')].map((axis, index) => {
                    let yAxisInterval = this.getEchartsAxisInterval('y', index)
                    let yAxisDigits = null
                    if (yAxisInterval != null) {
                        yAxisDigits = yAxisInterval.toString().indexOf(".") != -1 ? yAxisInterval.toString().slice(yAxisInterval.toString().indexOf(".")).length - 1 : 0
                    }

                    // For category indexes try to reuse the previous value (even in force mode)
                    this.params.omicsBox.labelTruncating.y[index] = yAxisDigits != null ? yAxisDigits : (this.params.omicsBox.labelTruncating.y[index] || defaultLabelCharTruncating)
                    this.params.omicsBox.labelScientificMode.y[index] = false // (axis.type != 'category')
                })
            }
        }

        // Update options to refresh the renderers.
        // In some cases we might want to keep our current label truncating settings (binning label length) but force
        // the update of the axis.
        if (force || updateOnly) {
            let updateOptions = validAxis.reduce((acc, curr) => {
                acc[curr] = this.options[curr]

                return acc
            }, {})

            this._updateOptions(updateOptions, false, false)
        }
    }

    postChartReady() {
        if (!this.is3DChart()) {
            this._setLabelTruncatingOptions(false)
        }

        // This is KEY to communicate with the sidebar. See related mixin docs in web-libraries.
        this.ready();
    }

    getMergedGridOptions() {
        // Make sure to update the options
        this.grid.setChartOptions(this.options)

        const gridOptions = this.grid.getGridOptions()

        if (gridOptions) {

            // In order to avoid changing the object, we manually iterate over the keys
            const mergedGridOptions = Object.keys(gridOptions).reduce((acc, key) => {
                acc[key] = []

                gridOptions[key].map((indexOptions, index) => {
                    acc[key][index] = Object.assign(this.options[key][index], indexOptions || {})
                })

                return acc
            }, {})

            return mergedGridOptions
        }

        return {}
    }

    refreshGridOptions() {
        this._updateOptions(this.getMergedGridOptions())
    }

    getChart() {
        return this.chart;
    }

    updateSeriesCallbacks() {
        // Apply over the current and unfiltered series
        this.options.series.map((series, index) => this._restoreSeriesCallbacks(series, index));
        // this.params.omicsBox.seriesInfo.map((series, index) => this._restoreSeriesCallbacks(series.data, series.index));

        this._updateOptions('series', false, true);
    }
}

customElements.define('chart-viewer', ChartViewer)