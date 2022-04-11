import { LitElement } from '../node_modules/lit/index.js';
import { LIMIT_OPTIONS, SORTING_OPTIONS_SINGLE, SORTING_OPTIONS_MULTI } from './ChartConstants.js'

const CACHE_KEY_HIDDEN_SERIES_MIN_INDEX = "hiddenSeriesMinIndex";

export class ChartDataset extends LitElement {
    static get properties() {
        return {
            // Even though these params are present on the ChartParams
            // class, we keep them as individual properties instead of storing
            // a reference to the params instance, as they are merely settings to
            // determine how the dataset must work, no matter how or where
            // are stored. Plus we have the added "benefit" to capture the modifications
            // via lit, or that was the beautiful theory.
            relativeValues: { type: Boolean },

            enableLimit: { type: Boolean },
            limitOption: { type: String },
            limitNumber: { type: Number },

            showOthers: { type: Boolean },

            enableBinning: { type: Boolean },
            binsNumber: { type: Number },
            enableAutomaticBinNumber: { type: Boolean },

            enableSorting: { type: String },
            sortingOption: { type: String },
            sortingAllowed: { type: Number },

            datasetOption: { type: Boolean }
        }
    }

    constructor(wsRequest) {
        super()

        // We keep a reference to the request but do not override the args callback
        // which will be associated to the viewer.
        // TODO: might not be needed if we delegate the update task to ChartViewer.js
        this.webSocketRequest = wsRequest

        this.relativeValues = false

        this.showOthers = false

        this.enableLimit = false
        this.limitOption = LIMIT_OPTIONS.ENTRY.name
        this.limitNumber = 30

        this.enableBinning = false
        this.enableAutomaticBinNumber = true
        this.binsNumber = 0

        this.enableSorting = false
        this.sortingOption = SORTING_OPTIONS_SINGLE.HIGHEST.name
        this.sortingAllowed = true

        this.datasetOption = true

        this._data = []
        this._processedData = []
        this._processedDataset = []
        this._sourceArray = false

        // Just a simple flag to avoid sorting it twice at -first- initialization time
        this._initSorted = false
        this._lastEventDetail = {}
        this._supportedAttributes = []

        this._cache = {}

        this.type = 'ChartDataset';
    }

    get length() {
        return this._data.length;
    }

    is3DDataset() {
        return false;
    }

    isOptionCompatible() {
        return this.datasetOption;
    }

    getSupportedAttributes() {
        return this._supportedAttributes;
    }

    getDataAttribute(datasetIndex, seriesIndex, attr) {
        let selDataset = this.getData(datasetIndex);

        // Graph dataset can only contain one series with a Json Object structure,
        // whereas 3d chart datasets have a multidimensional array, so they need
        // the series index to retrieve the data.
        let selectedKey = this._sourceArray ? seriesIndex : attr;

        if (selDataset) {
            if (selDataset.source && selectedKey in selDataset.source) {
                return selDataset.source[selectedKey]
            }
        }

        return []
    }

    getExtraInfo({datasetIndex, seriesIndex, yIndex, dataIndex}) {
        const dataset = this.getData(datasetIndex)

        if (dataset && dataset.obHiddenSeries) {
            const extraColumns = dataset.obHiddenSeries[yIndex - 1]

            return extraColumns.map(colIndex => dataset.source[dataIndex][colIndex])
        }

        return ''
    }

    getDatasetStats() {
        // Fill the cache only when dataset is available
        if (!('datasetStats' in this._cache) && this._processedDataset.length) {
            this._cache['datasetStats'] = this._processedDataset.map((dataset, index) => {
                let longest = '', min = Infinity, max = -Infinity;

                dataset.source.map(row => {
                    // Max character length (for left padding)
                    if (row[0].length > longest.length) {
                        longest = row[0]
                    }

                    // Min value (for axis)
                    if (row[1] < min) {
                        min = row[1]
                    }

                    // Max value (for axis)
                    if (row[1] > max) {
                        max = row[1]
                    }
                })

                return {
                    // Keep the longest
                    longest: longest,
                    minAxis: min,
                    maxAxis: max,
                    records: dataset.source.length
                }
            })
        }

        return this._cache['datasetStats']
    }

    clearCache() {
        this._cache = {}
    }


    setParam(key, value) {
        this.setParams({
            [key]: value
        })
    }

    setParams(keyValueMap) {
        console.log("SETTING DATASET PARAM", keyValueMap, "PROCESSING DATA")

        Object.keys(keyValueMap).forEach(key => {
            this[key] = keyValueMap[key]
        })

        this._processData()
    }

    getProcessedDataset() {
        return this._processedDataset
    }

    getData(index = null) {
        return index === null ? this._data : this._data[index]
    }

    setData(data) {
        this._data = data
    }

    _getHiddenSeriesMinIndex(datasetIndex = 0) {

        if (!(CACHE_KEY_HIDDEN_SERIES_MIN_INDEX in this._cache)) {
            this._cache[CACHE_KEY_HIDDEN_SERIES_MIN_INDEX] = [];

            this._data.map((dataset, index) => {
                if (dataset.obHiddenSeries) {
                    if (!(CACHE_KEY_HIDDEN_SERIES_MIN_INDEX in this._cache)) {
                        this._cache[CACHE_KEY_HIDDEN_SERIES_MIN_INDEX] = [];
                    }

                    this._cache[CACHE_KEY_HIDDEN_SERIES_MIN_INDEX][index] = dataset.obHiddenSeries.reduce((acc, seriesData) => Math.min(acc, ...seriesData), Infinity);
                }
            });
        }

        return this._cache[CACHE_KEY_HIDDEN_SERIES_MIN_INDEX]?.[datasetIndex];
    }

    touchData() {
        // this.webSocketRequest.sendJson({
        //     resource: 'data',
        //     jsonData: JSON.stringify(this._data)
        // });

        this.webSocketRequest.restRequest('data', 'POST', {jsonData: JSON.stringify(this._data)});
    }

    _getRawData() {
        if (this.relativeValues) {
            const totalCounter = this.getData(0).source.slice().reduce((acc, cur) => {
                // Exclude first column (key)
                return (acc.map((count, index) => count + cur[index + 1]))
            }, new Array(this.getData(0).dimensions.length - 1).fill(0))

            return this.getData(0).source.slice().map((rowData, rowIndex) => {
                return rowData.map((colValue, colIndex) => colIndex > 0 ? colValue * 100 / totalCounter[colIndex - 1] : colValue)
            })

        } else {
            return this.getData(0).source.slice()
        }
    }

    _getSourceData() {
        const rawData = this._getRawData()

        if (this.enableSorting && this.sortingAllowed) {
            // Get original data sorted
            let sortedData = this._getSortingCallbacks()[this.sortingOption](rawData)

            return sortedData
        } else {
            return rawData
        }
    }

    getDatasetNumber() {
        return this._data.length
    }

    processData(eventData = {}) {
        this._processData(eventData);
    }

    _processData(eventData = { updateLabels: true }) {
        // Avoid processing empty datasets
        if (!this.getDatasetNumber()) {
            console.log("NO DATA")
            return;
        }

        // Reset event detail
        this._lastEventDetail = { eventData }
        this._initSorted = false

        if (this.getDatasetNumber() < 2 && this._containsData()) {

            const sourceData = this._getSourceData()

            // TODO: currently limit & binning are incompatible: if one is checked the other is not applied
            if (this.enableLimit) {
                // Grouping in others is directly related to the ordering section
                // TODO: this will only work for categorical axis 0 values
                var limitData = this._getLimitCallbacks()[this.limitOption](sourceData)
                var selectedData = limitData.selectedData

                if (this.showOthers) {
                    const remainingData = limitData.remainingData.reduce((acc, cur) => {
                        // Exclude first column (key)
                        return (acc.map((count, index) => count + cur[index + 1]))
                    }, new Array(this.getData(0).dimensions.length - 1).fill(0))

                    let othersEl = ['others', ...remainingData]

                    // TODO: what happens when there are negative numbers? (changed to !=)
                    if (remainingData.some(data => data != 0)) {
                        selectedData.push(othersEl)
                    }

                    // TODO: sortingAllowed no longer calls a method, so it must be defined at some point.
                    // Make sure that happens and it is properly updated
                    if (this.enableSorting && this.sortingAllowed) {
                        selectedData = this._getSortingCallbacks()[this.sortingOption](selectedData)
                    }

                    // Let the user decide with a checkbox?
                    let othersAtTheEnd = true

                    if (othersAtTheEnd) {
                        selectedData.push(selectedData.splice(selectedData.indexOf(othersEl), 1)[0]);
                    }
                }

                this._processedData = selectedData
            } else if (this.enableBinning) {
                let histogramData;
                if ((!this.enableAutomaticBinNumber) && this.binsNumber) {
                    histogramData = ecStat.histogram(sourceData, {
                        binsNumber: this.binsNumber,
                        dimensions: 0,
                        valueDimension: 1
                    });
                } else {
                    histogramData = ecStat.histogram(sourceData, {
                        dimensions: 0,
                        valueDimension: 1
                    });
                }

                let maxLabelLength = 0;

                // MeanOfV0V1, VCount, V0, V1, DisplayableName
                this._processedData = histogramData.data.map(binInfo => {
                    // Return the label as category value

                    maxLabelLength = Math.max(maxLabelLength, binInfo[4].length)

                    return [binInfo[4], binInfo[5]]
                })

                Object.assign(this._lastEventDetail, {
                    binData: true,
                    binsNumber: histogramData.data.length,
                    maxLabelLength: maxLabelLength
                })
            } else {
                // TODO: what happens when there are multiple datasets?
                this._processedData = sourceData
            }

            // TODO: make it compatible with multiple datasets
            this._processedDataset = [
                {
                    dimensions: this._data[0].dimensions,
                    source: this._processedData
                }
            ]

        } else {
            this._processedDataset = this._data
            this._processedData = null
        }

        this.clearCache()

        Object.assign(this._lastEventDetail, {
            data: this._processedData,
            dataset: this._processedDataset
        })

        this.triggerEvent()
    }

    triggerEvent() {
        this.dispatchEvent(new CustomEvent("change", {
            detail: this._lastEventDetail
        }))
    }

    _containsData() {
        return this.length && this.some(dataset => dataset.source.length)
    }

    _getSortingCallbacks() {

        const highestCallback = ((localData) => {
            let sortedData = localData.slice().sort((a, b) => {
                return b[1] - a[1]
            })
            return sortedData;
        }).bind(this);

        const lowestCallback = ((localData) => {
            let sortedData = localData.slice().sort((a, b) => {
                return a[1] - b[1]
            })

            return sortedData;
        }).bind(this);

        const highestCallbackMulti = ((localData) => {
            // We assume that all the rows in the dataset contain the same number of series.
            // Most of them may have empty values (null) but since we are applying the same division
            // to all of them, for sorting should be okay since we only need higher/lower than.
            let seriesLength = this.getSeries().length;
            let sliceEnd = this._getHiddenSeriesMinIndex(0);

            let sortedData = localData.slice().sort((a, b) => {
                return b.slice(1, sliceEnd).reduce((acc, cur) => (acc + cur)) / (seriesLength) - a.slice(1, sliceEnd).reduce((acc, cur) => (acc + cur)) / (seriesLength)
            })
            return sortedData;
        }).bind(this);


        const lowestCallbackMulti = ((localData) => {
            // We assume that all the rows in the dataset contain the same number of series.
            // Most of them may have empty values (null) but since we are applying the same division
            // to all of them, for sorting should be okay since we only need higher/lower than.
            let seriesLength = this.getSeries().length;
            let sliceEnd = this._getHiddenSeriesMinIndex(0);

            let sortedData = localData.slice().sort((a, b) => {
                return a.slice(1, sliceEnd).reduce((acc, cur) => (acc + cur)) / (seriesLength) - b.slice(1, sliceEnd).reduce((acc, cur) => (acc + cur)) / (seriesLength)
            })

            return sortedData;
        }).bind(this);


        /*
            These multiseries comparators do not take into account null values, extensively present when we have bar charts and others.
            They were adapted from omicsbox code. Usually this should not be a problem because ordering only makes sense with categoric x axis.
        */
        const differenceCallback = ((localData) => {
            let sliceEnd = this._getHiddenSeriesMinIndex(0);

            let sortedData = localData.slice().sort((a, b) => {
                let bDelta = b.slice(1, sliceEnd).reduce((acc, curr, index, array) => {
                    return (acc + array.slice(index).reduce((subacc, subcurr) => (subacc + Math.abs(curr - subcurr)), 0))
                }, 0)

                let aDelta = a.slice(1, sliceEnd).reduce((acc, curr, index, array) => {
                    return (acc + array.slice(index).reduce((subacc, subcurr) => (subacc + Math.abs(curr - subcurr)), 0))
                }, 0)

                return bDelta - aDelta
            }, 0)

            return sortedData;
        }).bind(this);

        const similarityCallback = ((localData) => {
            let sliceEnd = this._getHiddenSeriesMinIndex(0);

            let sortedData = localData.slice().sort((a, b) => {
                let bDelta = b.slice(1, sliceEnd).reduce((acc, curr, index, array) => {
                    return (acc + array.slice(index).reduce((subacc, subcurr) => (subacc + Math.abs(curr - subcurr)), 0))
                }, 0)

                let aDelta = a.slice(1, sliceEnd).reduce((acc, curr, index, array) => {
                    return (acc + array.slice(index).reduce((subacc, subcurr) => (subacc + Math.abs(curr - subcurr)), 0))
                }, 0)

                return aDelta - bDelta
            });

            return sortedData;
        }).bind(this);


        let selectOptions;

        if (this.getSeries().length < 2) {
            selectOptions = {
                [SORTING_OPTIONS_SINGLE.HIGHEST.name]: highestCallback,
                [SORTING_OPTIONS_SINGLE.LOWEST.name]: lowestCallback,
            }
        } else {
            selectOptions = {
                [SORTING_OPTIONS_MULTI.HIGHEST.name]: highestCallbackMulti,
                [SORTING_OPTIONS_MULTI.LOWEST.name]: lowestCallbackMulti,
                [SORTING_OPTIONS_MULTI.DIFFERENCE.name]: differenceCallback,
                [SORTING_OPTIONS_MULTI.SIMILARITY.name]: similarityCallback
            }
        }


        return selectOptions
    }

    _getLimitCallbacks() {
        const recordNumberCallback = ((sourceData) => {
            return {
                selectedData: sourceData.slice(0, this.limitNumber),
                remainingData: sourceData.slice(this.limitNumber)
            }

        }).bind(this)

        const recordValueLowerCallback = ((sourceData) => {
            let selectedData = []
            let remainingData = []

            sourceData.map(row => {
                // Exclude the first value (x-axis)
                if (row.slice(1).every(value => value < this.limitNumber)) {
                    selectedData.push(row)
                } else {
                    remainingData.push(row)
                }
            })

            return {
                selectedData: selectedData,
                remainingData: remainingData
            }
        }).bind(this)

        const recordValueHigherCallback = ((sourceData) => {
            let selectedData = []
            let remainingData = []

            sourceData.map(row => {
                // Exclude the first value (x-axis)
                if (row.slice(1).every(value => value > this.limitNumber)) {
                    selectedData.push(row)
                } else {
                    remainingData.push(row)
                }
            })

            return {
                selectedData: selectedData,
                remainingData: remainingData
            }
        }).bind(this)

        // We store the selected limit in the saved params, and that is the key to link to the proper callback.
        // Since that very same key is the one used in the dropdown and we may want to change it one day, we
        // enforce a 'fixed' key so that old charts do not stop working and avoid using key aliases.
        return {
            [LIMIT_OPTIONS.ENTRY.name]: recordNumberCallback,
            [LIMIT_OPTIONS.VALUE_LOWER.name]: recordValueLowerCallback,
            [LIMIT_OPTIONS.VALUE_HIGHER.name]: recordValueHigherCallback
        }
    }

    map(cb) {
        return this._data.map(cb)
    }

    some(cb) {
        return this._data.some(cb)
    }

    sortByValue() {
        if (!this._initSorted) {
            this.getData(0).source.sort((a, b) => a[0] - b[0])
            this._processData()
            this.touchData()

            // Avoid sorting it twice
            this._initSorted = true
        }
    }

    getSeries(index = 0) {
        return this._data[index]?.dimensions.slice(1, this._getHiddenSeriesMinIndex(index));
    }
}

// Needed to avoid Illegal constructor
customElements.define('chart-dataset', ChartDataset)