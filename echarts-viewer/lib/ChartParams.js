import { LitElement } from '../node_modules/lit/index.js';
import { LIMIT_OPTIONS, SORTING_OPTIONS_SINGLE, VIEWER_VERSION, ORIENTATION, OB_DATASET_KEYWORD } from './ChartConstants.js'
import { omicsboxtheme, axisCommon, themeFontFamily, overflowValue } from './themes/omicsbox.js'
import '../node_modules/merge/merge.js'

// This is a debug setting used to restore the original params
// and test the 'specific transformation' that only applies
// in the very first load and modifies the parameters.
const RESET_PARAMS = false

// The chart params can be modified in many places, but we do not
// need to update the object every time. Instead we rely on a timeout
// to limit the communication with the Java object.
const SAVING_TIMEOUT = 250

export class ChartParams extends LitElement {

    static get properties() {
        return {
            viewerVersion: { type: Number },
            aliases: { type: Object },
            options: { type: Object },
            defaultSidebarOptions: { type: Array },
            defaultParams: { type: String },
            omicsBox: { type: Object }
        };
    }

    // Helper for retrieving OmicsBox specific params
    getParam(param) {
        return this.omicsBox[param]
    }

    getSidebarModules() {
        return this.defaultSidebarOptions;
    }

    // Helper for setting OmicsBox specific params
    setParam(param, value) {
        if (this.omicsBox[param] != value) {
            this.omicsBox[param] = value

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    param: param,
                    value: value
                }
            }))

            this.touchParams()
        }
    }

    touchParams() {
        // Lit does not detect mutation in object/arrays, and we do not want
        // to override the value as we keep references all over the place (used
        // by echarts, for instance)
        clearTimeout(this._updateTimeout)

        this._updateTimeout = setTimeout(() => {
            console.log("TIMEOUT: STORING PARAMS 1")
            let paramsToStore = this.getJsonParams()

            console.log("TIMEOUT: STORING PARAMS 2")

            // this.webSocketRequest.sendJson({
            //     resource: 'params',
            //     jsonParams: paramsToStore,
            // });
            this.webSocketRequest.restRequest('params', 'POST', {jsonParams: paramsToStore});
        }, SAVING_TIMEOUT);

        console.log("TOUCH PARAMS")
    }

    constructor(wsRequest) {
        super();

        // We keep a reference to the request but do not override the args callback
        // which will be associated to the viewer.
        // TODO: might not be needed if we delegate the update task to ChartViewer.js
        this.webSocketRequest = wsRequest

        this._updateTimeout = null

        this.viewerVersion = VIEWER_VERSION;
        this.aliases = {}
        this.options = {}
        this.defaultSidebarOptions = []
        this.defaultParams = null

        this.omicsBox = {
            // Sorting options
            enableSorting: false,
            sortingOption: SORTING_OPTIONS_SINGLE.HIGHEST.name,

            // Limit options
            enableLimit: false,
            limitOption: LIMIT_OPTIONS.ENTRY.name,
            limitNumber: 30,
            showOthers: false,
            enableLabels: true,
            enableBinning: false,
            enableAutomaticBinNumber: true,
            enableZoomSlider: false,
            binsNumber: 0,
            gridExtraOffsets: {},

            // Relative values
            relativeValues: false,

            // Orientation
            orientation: ORIENTATION.VERTICAL,

            // Font family
            fontFamily: themeFontFamily,

            // Axis labels truncating
            labelTruncating: {
                x: [],
                y: [],
                z: []
            },

            labelScientificMode: {
                x: [],
                y: [],
                z: []
            },

            // Series editor: store the original series information
            seriesInfo: [],

            forceGlobalUpdateOptions: false
        }
    }

    getJsonParams() {
        let jsonParams = {
            omicsBox: this.omicsBox,
            options: Object.assign({}, this.options),
            aliases: this.aliases,
            viewerVersion: this.viewerVersion,
            defaultParams: this.defaultParams,
            defaultSidebarOptions: this.defaultSidebarOptions
        }

        // Remove dataset (if any)
        delete jsonParams.options.dataset

        const _restoreDataOrigin = (series) => {
            // The '_data' attribute is set when making the swap in ChartViewer
            if (series._data == OB_DATASET_KEYWORD) {
                return Object.assign({}, series, {
                    data: OB_DATASET_KEYWORD
                });
            }

            return series;
        };

        // Some charts do not support dataset option and need
        // a need some processing step to move from our custom
        // dataset to 'data' property, using the special keyword
        // _obDataset. Here we traverse the series list replacing the 
        // data with its original value.
        if ('series' in jsonParams.options) {
            // Make sure we are returning a copy of the objects without modifying the old ones
            jsonParams.options.series = jsonParams.options.series.map(_restoreDataOrigin);
        }

        // Do the same with the copy 'seriesInfo'
        if ('seriesInfo' in jsonParams.omicsBox) {
            jsonParams.omicsBox.seriesInfo = jsonParams.omicsBox.seriesInfo.map(seriesData => {
                return Object.assign({}, seriesData, { data: _restoreDataOrigin(seriesData.data) });
            });
        }

        return JSON.stringify(jsonParams)
    }

    loadJsonParams(jsonParams) {
        // merge.recursive does not seem to work well modifying the
        // object 'in place'. Besides, overriding by key seems more
        // robust.
        const _mergeRecursiveParams = (params) => {
            Object.keys(params).forEach(key => {
                // Only user merge.recursive with objects different than null
                this[key] = Array.isArray(params[key]) || typeof params[key] !== 'object' || params[key] == null ? params[key] : merge.recursive(false, this[key], params[key])
            })
        }

        if (jsonParams != null) {
            // Object.assign(this.params, jsonParams)
            if (RESET_PARAMS && jsonParams.defaultParams) {
                // merge.recursive(false, this, JSON.parse(jsonParams.defaultParams))
                _mergeRecursiveParams(JSON.parse(jsonParams.defaultParams))

                this.defaultParams = jsonParams.defaultParams
            } else {
                // merge.recursive(false, this, jsonParams)
                _mergeRecursiveParams(jsonParams)

                // Keep the original jsonParams only
                if (!this.defaultParams) {
                    this.defaultParams = JSON.stringify(jsonParams)
                }
            }
        }
    }

    performUpdate(changedProperties) {
        // No need to wait until updatedCompleted promise as this is not rendered.
        console.log("EVENT - UPDATED CHART PARAMS", changedProperties)
        this.dispatchEvent(new CustomEvent("change", { detail: { changedProperties: changedProperties }, bubbles: false, composed: false }));
    }
}

// Needed to avoid Illegal constructor
customElements.define('chart-params', ChartParams)