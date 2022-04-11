import { ChartDataset } from "./ChartDataset.js";

export class ChartAsymmetricDataset extends ChartDataset {
    constructor(wsRequest) {
        super(wsRequest);

        this.datasetOption = false;
        this._sourceArray = true;
        this._supportedAttributes = ['data'];

        this._processedData = this._data;
        this.type = 'ChartAsymmetricDataset';
    }

    triggerEvent() {
        // Do nothing
        this.dispatchEvent(new CustomEvent("change", {
            detail: this._lastEventDetail
        }))
    }

    getExtraInfo({ datasetIndex, seriesIndex, yIndex, dataIndex }) {
        return ''
    }

    getDataAttribute(datasetIndex, seriesIndex, attr) {
        let selDataset = this.getData(datasetIndex);

        // Ignore the series index and return the whole dataset
        // as required by weird cases like boxplots (one series
        // but multiple plots)
        if (selDataset && selDataset.source) {
            return selDataset.source
        }

        return []
    }

    _processData() {
        // Do nothing
        this.triggerEvent()
    }

    _containsData() {
        return this.length && this.some(dataset => dataset.source.length);
    }

    is3DDataset() {
        return false;
    }
}


// Needed to avoid Illegal constructor
customElements.define('chart-asymmetric-dataset', ChartAsymmetricDataset)