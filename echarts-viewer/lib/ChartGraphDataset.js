import { ChartDataset } from "./ChartDataset.js";

export class ChartGraphDataset extends ChartDataset {
    constructor(wsRequest) {
        super(wsRequest);

        this.datasetOption = false;
        this._supportedAttributes = ['nodes', 'edges']

        this._processedData = this._data

        this.type = 'ChartGraphDataset';
    }

    triggerEvent() {
        // Do nothing
        this.dispatchEvent(new CustomEvent("change", {
            detail: this._lastEventDetail
        }))
    }

    _processData() {
        // Do nothing
        this.triggerEvent()
    }

    _containsData() {
        return this.length && this.some(dataset => dataset.source.nodes.length)
    }
}


// Needed to avoid Illegal constructor
customElements.define('chart-graph-dataset', ChartGraphDataset)