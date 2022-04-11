import { LitElement } from '../node_modules/lit/index.js';
import { omicsboxtheme, axisCommon, themeFontFamily, overflowValue } from './themes/omicsbox.js'
import { ORIENTATION, axisNamePadding, fontFactor, defaultLabelCharTruncating } from './ChartConstants.js'

export const topOffset = {
    [ORIENTATION.VERTICAL]: 30, //60
    [ORIENTATION.HORIZONTAL]: 30 // 80
}

export const rightOffset = {
    [ORIENTATION.VERTICAL]: 20,
    [ORIENTATION.HORIZONTAL]: 20
}

export const leftOffset = {
    [ORIENTATION.VERTICAL]: 20,
    [ORIENTATION.HORIZONTAL]: 20
}

export const bottomOffset = {
    [ORIENTATION.VERTICAL]: 20,
    [ORIENTATION.HORIZONTAL]: 20
}

export class ChartGrid extends LitElement {
    static get properties() {
        return {
            top: { type: Number },
            bottom: { type: Number },
            left: { type: Number },
            right: { type: Number },
            height: { type: Number },
            offsets: { type: Object }
        }
    }

    constructor(viewerContentRect, chartDataset, themeData, chartParams) {
        super();

        this.left = 0
        this.bottom = 0
        this.right = 0
        this.containLabel = true
        this.top = 0
        this.height = null
        this.offsets = {}
        this.orientation = ORIENTATION.VERTICAL
        this.chartOptions = null

        this.chartDataset = chartDataset
        this.themeData = themeData
        this.contentRect = viewerContentRect
        this.params = chartParams
        this._is3Dchart = chartDataset.is3DDataset();

        this._xAxis = !this._is3Dchart ? 'xAxis' : 'xAxis3D';
        this._yAxis = !this._is3Dchart ? 'yAxis' : 'yAxis3D';
        this._grid = !this._is3Dchart ? 'grid' : 'grid3D';

        this._gridNumber = null
    }

    is3Dchart() {
        return this._is3Dchart;
    }

    setOrientation(orientation) {
        this.orientation = orientation
    }

    setChartOptions(chartOptions) {
        this.chartOptions = chartOptions
    }

    addOffset(type, position, offset) {
        if (!(position in this.offsets)) {
            this.offsets[position] = {}
        }

        if (offset != 0) {
            this.offsets[position][type] = offset
        } else {
            delete this.offsets[position][type];
        }
    }

    removeOffset(type) {
        // Remove type from each position offset
        Object.keys(this.offsets).forEach(position => {
            delete this.offsets[type]
        })
    }

    getOffsetSum(position) {
        if (position in this.offsets) {
            return Object.values(this.offsets[position]).reduce((a, b) => a + b, 0)
        }

        return 0
    }

    _getUniqueGrids() {
        if (!this._uniqueGrids) {
            if (this.chartOptions != null) {
                this._uniqueGrids = [...new Set(this.chartOptions?.[this._xAxis]?.map(axis => axis.gridIndex))]
            } else {
                this._uniqueGrids = [0]
            }
        }

        return this._uniqueGrids
    }

    _getNumberOfGrids() {
        return this._getUniqueGrids().length
    }

    _hasMultipleAxis() {
        if (this._chartOptions != null) {
            return this._chartOptions[this._xAxis].length > 1 || this._chartOptions[this._yAxis].length > 1
        }

        return false
    }

    getGridOptions() {
        if (this._is3Dchart) {
            return this._get3dGridOptions();
        } else if (this._getNumberOfGrids() < 2) {
            return this._getOneGridOffsets();
        } else {
            return this._getMultipleGridOffsets();
        }
    }

    _get3dGridOptions() {
        return {
            [this._grid]: [{
                top: '-10%',
                bottom: 'auto',
                right: 'auto',
                left: 'auto',
                boxWidth: 90,
                boxHeight: 90,
                boxDepth: 90
            }]
        }
    }

    _getOneGridOffsets() {
        let commonOffset = this.themeData.categoryAxis.offset
        let offsetsData = {
            top: this.orientation == ORIENTATION.VERTICAL ? 0 : commonOffset,
            bottom: this.orientation == ORIENTATION.VERTICAL ? commonOffset : 0,
            left: commonOffset,
            right: this._hasMultipleAxis() ? commonOffset : 0
        }

        return {
            [this._grid]: [{
                top: topOffset[this.orientation] + offsetsData.top + this.getOffsetSum('top'),
                bottom: bottomOffset[this.orientation] + offsetsData.bottom + this.getOffsetSum('bottom'),
                right: rightOffset[this.orientation] + offsetsData.right + this.getOffsetSum('right'),
                left: leftOffset[this.orientation] + offsetsData.left + this.getOffsetSum('left'),
                containLabel: true
            }]
        }
    }

    _getResizeGridsInfo() {
        // TODO: take into account axis labels offsets
        const marginValue = 20
        const clientRect = this.contentRect
        const recordsStats = this.chartDataset.getDatasetStats()
        const calcTopOffset = topOffset[this.orientation] + this.getOffsetSum('top') + topOffset[this.orientation] / 2// Add extra offset (*2)
        // let clientRect = this.getBoundingClientRect()
        const availableHeight = (clientRect.height - calcTopOffset - (marginValue * this._getNumberOfGrids()))
        const totalRecords = recordsStats.reduce((acc, curr) => acc + curr.records, 0)
        const gridHeights = recordsStats.map(recordsStats => {
            return recordsStats.records / totalRecords * availableHeight
        })

        return {
            marginValue: marginValue,
            topOffset: calcTopOffset,
            availableHeight: availableHeight,
            gridHeights: gridHeights,
            clientRect: clientRect
        }
    }

    _getChartNameStyleHeight() {
        return this.contentRect.offsetHeight > 0 ? (this.contentRect.offsetHeight - axisNamePadding) : (window.innerHeight - axisNamePadding)
    }

    _getMultipleGridOffsets(entry, updateOptions = true) {
        const uniqueGrids = this._getUniqueGrids()
        // Adjust the right padding to make space for visible VisualMaps (always on the right)
        let rightPadding = this.getOffsetSum('right')

        // TODO: this assumes there is only one series per dataset, with the first value being
        // the category and the second the value.
        if (this.orientation == ORIENTATION.HORIZONTAL) {
            const datasetStats = this.chartDataset.getDatasetStats()

            let chartOptions = null

            // Apply only when we have proper dataset stats. 
            if (datasetStats) {
                // Dynamic multiple grids must have containLabel=false to be aligned. This has the effect
                // of having to specify a manual nameGap to avoid intersecting axis label with title.
                // As the rotation of labels could difficult this calculation, be hide the controls when
                // multiple grids are present.
                const marginLabel = axisCommon().axisLabel.margin
                const gridInfo = this._getResizeGridsInfo()

                // Retrieve trimmed values for 
                const longestTrimmedText = datasetStats.map((stats, index) => {
                    let currentDatasetLimit = this.params.omicsBox.labelTruncating.y[index] == undefined ? defaultLabelCharTruncating : this.params.omicsBox.labelTruncating.y[index]

                    if (currentDatasetLimit != undefined && stats.longest.length > currentDatasetLimit) {
                        return stats.longest.substring(0, currentDatasetLimit) + (currentDatasetLimit > 0 ? '…' : '');
                    }

                    return stats.longest
                }).sort((a, b) => b.length - a.length)[0]

                // Use the first Y axis (all should be the same)
                const commonAxisOptions = axisCommon().axisLabel
                const axisLabelOptions = Object.assign({}, axisCommon().axisLabel, this.chartOptions.yAxis[0].axisLabel)
                const axisNameOptions = Object.assign({}, axisCommon().nameTextStyle, this.chartOptions.yAxis[0].nameTextStyle)

                // Calculate longest axis label value (trimmed)
                const longestTextGeom = echarts.format.parsePlainText(longestTrimmedText, {
                    font: `${axisLabelOptions.fontStyle} ${axisLabelOptions.fontWeight} ${axisLabelOptions.fontSize}px ${this.themeData.categoryAxis.axisLabel.fontFamily}`,
                    //overflow: overflowValue,
                    //width: this._getChartNameStyleWidth()
                })

                // Calculate the height of each axis name
                const longestAxisName = this.chartOptions.yAxis.map((axis) => axis.name).sort((a, b) => b.length - a.length)[0]

                const longestAxisNameGeom = echarts.format.parsePlainText(longestAxisName, {
                    font: `${axisNameOptions.fontStyle} ${axisNameOptions.fontWeight} ${axisNameOptions.fontSize}px ${this.themeData.categoryAxis.axisLabel.fontFamily}`,
                    overflow: overflowValue,
                    width: this._getChartNameStyleHeight()
                })

                const leftOffset = longestTextGeom.width + commonAxisOptions.margin + longestAxisNameGeom.height + gridInfo.marginValue * 2
                const commonMin = Math.min(...datasetStats.map(stats => stats.minAxis), 0)
                const commonMax = Math.max(...datasetStats.map(stats => stats.maxAxis))

                chartOptions = {
                    xAxis: [],
                    yAxis: [],
                    grid: []
                }

                uniqueGrids.forEach(gridIndex => {
                    // Set xAxis
                    chartOptions.xAxis[gridIndex] = {
                        min: commonMin,
                        max: (commonMax >= 100 ? (Math.ceil(commonMax / 100) * 100) : (Math.ceil(commonMax / 10) * 10)),
                        axisLabel: { show: gridIndex < 1 },
                        name: gridIndex < 1 ? this.chartOptions.xAxis[gridIndex].name : '',
                        nameGap: ((!this.chartOptions.xAxis[gridIndex].axisLabel) || this.chartOptions.xAxis[gridIndex].axisLabel.show !== false) ? (this.chartOptions.xAxis[gridIndex].axisLabel || axisCommon().axisLabel).fontSize * fontFactor + marginLabel : 0
                    }

                    // Set yAxis
                    chartOptions.yAxis[gridIndex] = {
                        nameGap: longestTextGeom.width + commonAxisOptions.margin + (gridInfo.marginValue / 2)
                    }

                    // Grid
                    chartOptions.grid[gridIndex] = {
                        left: leftOffset,
                        bottom: 60,
                        right: rightPadding,
                        containLabel: false,
                        top: gridInfo.topOffset + (gridIndex > 0 ? gridInfo.gridHeights.slice(0, gridIndex).reduce((acc, curr) => acc + curr, 0) + gridInfo.marginValue * gridIndex : 0),
                        height: gridInfo.gridHeights[gridIndex]
                    }
                })

                return chartOptions
            }
        } else {
            console.error("VERTICAL ORIENTATION WITH MULTIPLE DATASETS NOT IMPLEMENTED.")
        }
    }
}

// Needed to avoid Illegal constructor
customElements.define('chart-grid', ChartGrid)