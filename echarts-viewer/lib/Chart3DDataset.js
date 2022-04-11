import { ChartDataset } from "./ChartDataset.js";

export class Chart3DDataset extends ChartDataset {
    constructor(wsRequest) {
        super(wsRequest);

        this.datasetOption = false;
        this._sourceArray = true;
        this._supportedAttributes = ['data'];

        this._processedData = this._data;
        this.type = 'Chart3DDataset';
    }

    triggerEvent() {
        // Do nothing
        this.dispatchEvent(new CustomEvent("change", {
            detail: this._lastEventDetail
        }))
    }

    getExtraInfo({datasetIndex, seriesIndex, yIndex, dataIndex}) {
        const dataset = this.getData(datasetIndex)

        if (dataset && dataset.obHiddenSeries) {
            // Same columns for every series
            const extraColumns = dataset.obHiddenSeries

            return extraColumns.map(colIndex => dataset.source[seriesIndex][dataIndex][colIndex])
        }

        return ''
    }

    _processData() {
        // Do nothing
        this.triggerEvent()
    }

    _containsData() {
        return this.length && this.some(dataset => dataset.source.length);
    }

    is3DDataset() {
        return true;
    }
}


// Needed to avoid Illegal constructor
customElements.define('chart-3d-dataset', Chart3DDataset)