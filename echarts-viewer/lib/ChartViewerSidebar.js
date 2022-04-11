import { LitElement, html, css } from '../node_modules/lit/index.js';
import { WebSidebar } from '../node_modules/web-libraries/sidebar/web-sidebar.js'
import { SettingsEditorMixin } from '../node_modules/web-libraries/echarts-editor/settingsEditor-mixin.js';
import { mix } from '../node_modules/mixwith/src/mixwith.js'
import { live } from '../node_modules/lit/directives/live.js';


import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/resources/utils.js'
import '../lib/theme-selector.js'
import '../lib/input-series.js'
import '../lib/input-formatting.js'
import '../lib/series-editor.js'
import '../lib/plot-type-editor.js'
import '../lib/grid-editor.js'
import '../lib/tilting-editor.js'
import '../node_modules/web-libraries/elements/select-down.js'
import '../lib/label-limit-editor.js'
import '../lib/axis-interval-editor.js'
import '../node_modules/web-libraries/sidebar/font-editor.js'

import { SIDEBAR_MODULES, CUSTOM_SIDEBAR_BLOCKS, ORIENTATION, LIMIT_OPTIONS, SORTING_OPTIONS_MULTI, SORTING_OPTIONS_SINGLE, LABEL_FORMATTER } from './ChartConstants.js'

const LIMIT_OPTIONS_ALIAS = {
    ABSOLUTE_VALUE: {
        name: "absolute_value",
        title: "Absolute value"
    },
    ENTRY: LIMIT_OPTIONS.ENTRY
}

const LIMIT_VALUE_OPTIONS_ALIAS = {
    LOWER: {
        name: "lower",
        title: "Lower Than"
    },
    HIGHER: {
        name: "higher",
        title: "Higher Than"
    }
}

export class ChartViewerSidebar extends mix(WebSidebar).with(SettingsEditorMixin) {

    constructor(chartEl, defaultModules) {
        super(chartEl)

        this.viewer = chartEl
        this.modules = defaultModules;
    }

    static getSidebarBlocks() {
        return CUSTOM_SIDEBAR_BLOCKS;
    }

    init({ viewer = null, modules = null } = {}) {
        // If we have X_FORMATTING option available, add the label formatting also (if not there)
        // This needs to be here because postGlobalTransformation would only be applied to new objects.
        let customOptions = { viewer, modules }

        if (viewer != null && modules != null) {
            let correctedModules = modules.slice();

            if (correctedModules.includes(SIDEBAR_MODULES.FORMATTING_XAXIS_LABELS) && !correctedModules.includes(SIDEBAR_MODULES.LABEL_FORMATTING)) {
                correctedModules.push(SIDEBAR_MODULES.LABEL_FORMATTING);
            }

            customOptions.modules = correctedModules
        }

        super.init(customOptions)
    }

    initializeModules() {
        super.initializeModules()

        // We are at a point were each module has enough "specific" logic that does
        // not make sense to categorize them like checkbox options, numeric options
        // like we do in Dot Plot viewer, and also the elements aren't big enough
        // to make it a custom widget worth it.
        const predefinedSidebarModules = {
            // GRAPHICAL SETTINGS: general
            [SIDEBAR_MODULES.FONT_FAMILY_OPTIONS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => html`<div class="flex jc-sb ai-center" style="width: 100%;">
                    <label>Font family</label>
                    <font-editor .selectedFont="${this.viewer.params.omicsBox.fontFamily}"
    @change="${e => this.viewer._updateFontFamilyOptions(e)}"></font-editor>
                </div>`,
                order: 0,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_TITLE]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => html`<input-formatting label="Title" .options="${this.viewer.options.title.textStyle}"
    @change="${e => this.handleFormattingChange(e, "title", "textStyle")}"></input-formatting>`,
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.GRID_EDITOR]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasXAxis() && this.viewer.hasYAxis() ? html`<grid-editor .is3dChart="${this.viewer.is3DChart()}" .originalData="${null}" .options="${this.viewer.options}"  @change="${e => e.detail.axis.map(axis => this.viewer._updateAxisGridOptions(axis))}"></grid-editor>` : null,
                order: 2,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.SYMBOL_SIZE_EDITOR]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => html`
                <div class="flex jc-sb ai-center" style="width: 100%;">
                    <label>Symbol size</label>
                    <input-text class="updateAfterPlotChange inputWidth" .disabled="${!this.viewer.hasSymbols()}" @change="${e => { this.handleSymbolSizeChange(e) }}" value="${this.viewer.getSymbolSize()}" type="range" min="1" max="50" step="1"></input-text>
                </div>`,
                order: 3,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.ZOOM_OPTIONS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => !this.viewer.hasZoomSliderAvailable() ? null : html`
                <div class="flex jc-sb ai-center" style="width: 100%;">
                    <label>Enable zoom sliders</label>
                    <input-checkbox class="updateAfterPlotChange" .disabled="${this.viewer.options.series.some(series => series.type == 'pie')}" .checked="${this.viewer.params.omicsBox.enableZoomSlider}" @change="${e => { this.handleZoomCheckboxChange(e) }}" style="background-color: none;" label=""></input-checkbox>
                </div>`,
                order: 4,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.LABEL_EDITOR]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => html`
                <div class="flex jc-sb ai-center" style="width: 100%;">
                    <label>Enable floating labels</label>
                    <input-checkbox .checked="${this.viewer.params.omicsBox.enableLabels}" @change="${e => { this.handleLabelCheckboxChange(e) }}" style="background-color: none;" label=""></input-checkbox>
                </div>`,
                order: 5,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            [SIDEBAR_MODULES.LABEL_FORMATTING]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                // NOTE: this is designed to work only with pie chart objects, that currently only accept one series.
                element: () => html`<input-formatting .disabled="${this.viewer.hasVisibleAxis()}" label="Pie Chart Labels" .options="${this.viewer.options.series[0].label}"
    @change="${e => this.viewer._updateOptions('series')}"></input-formatting>`,
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.GENERAL_OPTIONS
            },

            // GRAPHICAL SETTINGS: x-axis
            [SIDEBAR_MODULES.FORMATTING_XAXIS_TITLE]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasXAxis() ? this.viewer.options[this.viewer.getAxisOption('xAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Title${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.nameTextStyle}" 
    @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('xAxis'), 'nameTextStyle', index)}"></input-formatting>`) : null,
                order: 0,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.XAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_XAXIS_LABELS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasXAxis() ? this.viewer.options[this.viewer.getAxisOption('xAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Labels${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.axisLabel}"
    @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('xAxis'), 'axisLabel', index)}"></input-formatting>`) : null,
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.XAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_XAXIS_ROTATION]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.getUniqueGridsNumber() > 1 || !this.viewer.hasXAxis() || this.viewer.is3DChart() ? null : html`<tilting-editor .disabled="${!this.viewer.hasVisibleAxis()}" label="Rotation" .options="${this.viewer.options[this.viewer.getAxisOption('xAxis')]}"
    @change="${e => this.viewer._updateOptions(this.viewer.getAxisOption('xAxis'))}"></tilting-editor>`,
                order: 5,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.XAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_XAXIS_LIMIT]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasXAxis() ? html`<label-limit-editor .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => this.viewer._updateOptions(this.viewer.getAxisOption('xAxis'))}" .axis="${this.viewer.options[this.viewer.getAxisOption('xAxis')]}" .limitValue="${this.viewer.params.omicsBox.labelTruncating.x}" .scientificMode="${this.viewer.params.omicsBox.labelScientificMode.x}"></label-limit-editor>` : null,
                order: 3,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.XAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_XAXIS_INTERVAL]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasXAxis() ? html`<axis-interval-editor .customAliases="${this.viewer.hasXTicksAliases()}" .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => { this.handleAxisInterval(this.viewer.getAxisOption('xAxis'), e); }}" .axis="${this.viewer.options[this.viewer.getAxisOption('xAxis')]}"></axis-interval-editor>` : null,
                order: 4,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.XAXIS_OPTIONS
            },

            // GRAPHICAL SETTINGS: y-axis
            [SIDEBAR_MODULES.FORMATTING_YAXIS_TITLE]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasYAxis() ? this.viewer.options[this.viewer.getAxisOption('yAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Title${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.nameTextStyle}"
    @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('yAxis'), 'nameTextStyle', index)}"></input-formatting>`) : null,
                order: 0,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.YAXIS_OPTIONS

            },

            [SIDEBAR_MODULES.FORMATTING_YAXIS_LABELS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasYAxis() ? this.viewer.options[this.viewer.getAxisOption('yAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Labels${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.axisLabel}"
    @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('yAxis'), 'axisLabel', index)}"></input-formatting>`) : null,
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.YAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_YAXIS_ROTATION]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.getUniqueGridsNumber() > 1 || !this.viewer.hasYAxis() || this.viewer.is3DChart() ? null : html`<tilting-editor .disabled="${!this.viewer.hasVisibleAxis()}" label="Rotation" .options="${this.viewer.options[this.viewer.getAxisOption('yAxis')]}"
    @change="${e => this.viewer._updateOptions(this.viewer.getAxisOption('yAxis'))}"></tilting-editor>`,
                order: 5,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.YAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_YAXIS_LIMIT]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasYAxis() ? html`<label-limit-editor .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => this.viewer._updateOptions(this.viewer.getAxisOption('yAxis'))}" .axis="${this.viewer.options[this.viewer.getAxisOption('yAxis')]}" .limitValue="${this.viewer.params.omicsBox.labelTruncating.y}" .scientificMode="${this.viewer.params.omicsBox.labelScientificMode.y}"></label-limit-editor>` : null,
                order: 3,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.YAXIS_OPTIONS
            },


            [SIDEBAR_MODULES.FORMATTING_YAXIS_INTERVAL]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasYAxis() ? html`<axis-interval-editor .customAliases="${this.viewer.hasYTicksAliases()}" .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => { this.handleAxisInterval(this.viewer.getAxisOption('yAxis'), e); }}" .axis="${this.viewer.options[this.viewer.getAxisOption('yAxis')]}"></axis-interval-editor>` : null,
                order: 4,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.YAXIS_OPTIONS
            },

            // GRAPHICAL SETTINGS: z-axis
            [SIDEBAR_MODULES.FORMATTING_ZAXIS_TITLE]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasZAxis() ? this.viewer.options[this.viewer.getAxisOption('zAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Title${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.nameTextStyle}"
                @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('zAxis'), 'nameTextStyle', index)}"></input-formatting>`) : null,
                order: 0,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.ZAXIS_OPTIONS

            },

            [SIDEBAR_MODULES.FORMATTING_ZAXIS_LABELS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasZAxis() ? this.viewer.options[this.viewer.getAxisOption('zAxis')].map((axis, index, allAxis) => html`<input-formatting .disabled="${!this.viewer.hasVisibleAxis()}" label="Labels${allAxis.length > 1 ? ` (${index})` : ''}" .options="${axis.axisLabel}"
                @change="${e => this.handleFormattingChange(e, this.viewer.getAxisOption('zAxis'), 'axisLabel', index)}"></input-formatting>`) : null,
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.ZAXIS_OPTIONS
            },

            [SIDEBAR_MODULES.FORMATTING_ZAXIS_LIMIT]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasZAxis() ? html`<label-limit-editor .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => this.viewer._updateOptions(this.viewer.getAxisOption('zAxis'))}" .axis="${this.viewer.options[this.viewer.getAxisOption('zAxis')]}" .limitValue="${this.viewer.params.omicsBox.labelTruncating.z}" .scientificMode="${this.viewer.params.omicsBox.labelScientificMode.z}"></label-limit-editor>` : null,
                order: 3,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.ZAXIS_OPTIONS
            },


            [SIDEBAR_MODULES.FORMATTING_ZAXIS_INTERVAL]: {
                block: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS,
                element: () => this.viewer.hasZAxis() ? html`<axis-interval-editor .customAliases="${this.viewer.hasZTicksAliases()}" .disabled="${!this.viewer.hasVisibleAxis()}" @change="${e => { this.handleAxisInterval(this.viewer.getAxisOption('zAxis'), e); }}" .axis="${this.viewer.options[this.viewer.getAxisOption('zAxis')]}"></axis-interval-editor>` : null,
                order: 4,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.FONT_SETTINGS.FIELDSETS.ZAXIS_OPTIONS
            },

            // PLOT MODULES
            [SIDEBAR_MODULES.PLOT_EDITOR]: {
                block: CUSTOM_SIDEBAR_BLOCKS.PLOT,
                element: () => this._getValidPlotTypes().length > 1 ? html`<plot-type-editor .viewer="${this.viewer}" @change="${e => this.handlePlotType(e)}" .validTypes="${this._getValidPlotTypes()}"></plot-type-editor>` : null
            },

            // SERIES MODULES
            [SIDEBAR_MODULES.SERIES_EDITOR]: {
                block: CUSTOM_SIDEBAR_BLOCKS.SERIES,
                element: () => html`<series-editor .originalData="${this.viewer.params.omicsBox.seriesInfo}" .chartData="${this.viewer.options.series}" .aliases="${this.viewer._getAliases('series')}"
    .selectColor="${true}" .selectSymbol="${true}" @change="${e => {this.viewer._updateOptions(this.viewer.options, true); this.viewer.updateSeriesCallbacks();}}"></series-editor>`
            },

            // ADJUSTMENTS MODULES
            [SIDEBAR_MODULES.SORTING_OPTIONS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS,
                element: () => this.viewer.hasSortingAllowed() ? html`
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Enable sorting</label>
                        <input-checkbox .checked="${this.viewer.params.omicsBox.enableSorting}" @change="${e => { this.handleSortingCheckboxChange(e) }}" style="background-color: none;" label=""></input-checkbox>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;">
                        <label>Sort by</label>
                        <select-down class="inputWidth" id="_sb_sorting_options" .enabled="${this.viewer.params.omicsBox.enableSorting}" .options="${Object.values(this._getSortingOptions())}" @select="${e => { this.handleSelectSortingChange(e) }}" .selectedOption="${this._getSelectionByName(this._getSortingOptions(), this.viewer.params.omicsBox.sortingOption)}"></select-down>
                    </div>` : null,
                initCallback: () => {
                    // this.viewer.params.omicsBox.enableSorting = true
                },
                order: 1,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS.FIELDSETS.SORTING_OPTIONS
            },

            [SIDEBAR_MODULES.LIMIT_OPTIONS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS,
                element: () => this.viewer.params.omicsBox.enableLimit ? html`
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Filter method:</label><select-down class="inputWidth" style="width: 140px" id="_sb_limit_options" .enabled="${this.viewer.params.omicsBox.enableLimit}" .options="${this._getLimitOptions()}" @select="${e => { this.handleSelectLimitChange(e) }}" .selectedOption="${this._getLimitSelection()}"></select-down>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Show only:</label><select-down class="inputWidth" style="width: 140px" .enabled="${this.viewer.params.omicsBox.enableLimit && this._hasValueLimitAvailable()}" .options="${this._getValueLimitOptions()}" @select="${e => { this.handleSelectValueLimitChange(e) }}" .selectedOption="${this._getValueLimitSelection()}"></select-down>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Threshold</label>
                        <input-checkbox .checked="${this.viewer.params.omicsBox.enableLimit}" @change="${e => { this.handleDatasetSetting(e, 'enableLimit') }}" style="background-color: none;display: none;" label=""></input-checkbox>
                        <input-text @change="${e => { this.handleDatasetSetting(e, 'limitNumber') }}" value="${this.viewer.params.omicsBox.limitNumber}" .disabled="${!this.viewer.params.omicsBox.enableLimit}" type="number" min="1" step="1" style="width: 70px"></input-text>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;">
                        <label>Show others:</label><input-checkbox @change="${e => { this.handleDatasetSetting(e, 'showOthers') }}" .checked="${this.viewer.params.omicsBox.showOthers}"  .disabled="${!this.viewer.params.omicsBox.enableLimit}" style="background-color: none" label=""></input-checkbox>
                    </div>
                    ` : null,
                initCallback: () => {
                    // this.viewer.params.omicsBox.enableLimit = true
                    if (this.viewer.params.omicsBox.limitOption == LIMIT_OPTIONS.ENTRY.name) {
                        // this.viewer.params.omicsBox.limitNumber = Math.min(this.viewer.getDatasetDims().rows, this.viewer.params.omicsBox.limitNumber)
                        this.viewer.params.setParam('limitNumber', Math.min(this.viewer.getDatasetDims().rows, this.viewer.params.omicsBox.limitNumber))
                    }

                    // We store a temporary variable in this object to combine the two select-boxes in a cleaner way (the alternative was to use
                    // querySelector)
                    this._filterMethodOption = this._getLimitSelection()
                    this._valueLimitOption = this._getValueLimitSelection()

                    // this.viewer.params.omicsBox.showOthers = true
                },
                order: 0,
                subBlock: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS.FIELDSETS.LIMIT_OPTIONS
            },

            [SIDEBAR_MODULES.BINNING_OPTIONS]: {
                block: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS,
                element: () => html`
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Enable binning</label>
                        <input-checkbox .disabled="${this.viewer.params.omicsBox.enableLimit}" .checked="${this.viewer.params.omicsBox.enableBinning}" @change="${e => { this.handleBinningCheckboxChange(e) }}" style="background-color: none;" label=""></input-checkbox>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;margin-bottom: 5px;">
                        <label>Automatic Bin Size</label>
                        <input-checkbox .disabled="${this.viewer.params.omicsBox.enableLimit || !this.viewer.params.omicsBox.enableBinning}" .checked="${this.viewer.params.omicsBox.enableAutomaticBinNumber}" @change="${e => { this.handleDatasetSetting(e, 'enableAutomaticBinNumber') }}" style="background-color: none;" label=""></input-checkbox>
                    </div>
                    <div class="flex jc-sb ai-center" style="width: 100%;">
                        <label>Bin Size</label>
                        <input-text class="inputWidth" style="direction: rtl" .disabled="${this.viewer.params.omicsBox.enableLimit || this.viewer.params.omicsBox.enableAutomaticBinNumber || !this.viewer.params.omicsBox.enableBinning}" @change="${e => { this.handleDatasetSetting(e, 'binsNumber') }}" value="${this.viewer.params.omicsBox.binsNumber}" type="range" min="1" max="${Math.min(this.viewer.data.getData(0).source.length, 50)}" step="1" title="This is a reference number, the final number of bins will be adjusted based on readability."></input-text>
                    </div>
                    `,
                initCallback: () => {
                    // this.viewer.params.omicsBox.enableLimit = true
                    // console.log("Adjusting bin number to dataset length")
                    // this.viewer.params.omicsBox.binsNumber = Math.min(this.viewer.options.dataset[0].source.length, this.viewer.params.omicsBox.binsNumber)
                    // this.viewer.params.omicsBox.showOthers = true
                },
                order: 2
            },

            // [SIDEBAR_MODULES.PERCENTAGE_EDITOR]: {
            //     block: CUSTOM_SIDEBAR_BLOCKS.ADJUSTMENTS,
            //     element: () => html`
            //         <div class="flex jc-sb ai-center" style="width: 100%;">
            //             <label>Display relative values</label>
            //             <input-checkbox .checked="${this.viewer.params.omicsBox.relativeValues}" @change="${e => { this.handleRelativeValuesCheckboxChange(e) }}" label=""></input-checkbox>
            //         </div>
            //         `,
            //     initCallback: () => {
            //         // this.viewer.params.omicsBox.relativeValues = false
            //         this.viewer.params.setParam('relativeValues', false)
            //     },
            //     order: 1
            // },
        }

        this.modules.forEach(key => this.registerSidebarElement(key, predefinedSidebarModules[key]))
    }

    handleThemeChange(e) {
        if (this.viewer.theme != e.detail.theme) {
            this.viewer.theme = e.detail.theme
            this.viewer.chart.dispose()
            this.viewer._createChart(true)
        }
    }

    handleSortingCheckboxChange(e) {
        this.viewer.params.setParam('enableSorting', e.detail.checked)

        this.requestUpdate();

        this.viewer._updateParams()
    }

    handleSelectSortingChange(e) {
        if (this.viewer.params.omicsBox.sortingOption != e.detail.name) {

            this.viewer.params.setParam('sortingOption', e.detail.name)

            this.viewer._updateParams()
        }
    }

    handleLabelCheckboxChange(e) {
        this.viewer.params.setParam('enableLabels', e.detail.checked);

        this.viewer.updateSeriesCallbacks();

        this.viewer._updateParams();
    }

    _enableZoomSliders(enable) {
        // Detect if we have changed the status of the sliders before modifying the grids.
        let sliderHeight = 40
        let currentOffset = this.viewer.grid.getGridOptions()['grid'][0]

        this.viewer.options.dataZoom.filter(zoomElement => zoomElement.type == 'slider').map(zoomElement => {
            zoomElement.show = enable

            // Adjust the right position to take into account other elements like visual maps
            if (zoomElement.right) {
                zoomElement.right = currentOffset.right// - sliderHeight
            }
        })

        // Change the grid dimensions
        this.viewer.grid.addOffset('zoomSlider', 'bottom', sliderHeight * (enable ? 1 : 0))
        this.viewer.grid.addOffset('zoomSlider', 'right', sliderHeight * (enable ? 1 : 0))

        // Adjust first grid
        this.viewer._updateGridOptions()

        this.viewer._updateOptions('dataZoom')
    }

    handleSymbolSizeChange(e) {
        let symbolSize = parseInt(e.detail.value)

        this.viewer.options.series.map(series => {
            if (series.symbol && series._obEditable !== false) {
                series.symbolSize = symbolSize
            }
        })

        this.viewer._updateOptions('series', false, true)
    }

    handleZoomCheckboxChange(e) {
        this.viewer.params.setParam('enableZoomSlider', e.detail.checked)

        this._enableZoomSliders(e.detail.checked)

        // Data Zoom seems to overwrite old options with new objects to the references kept
        // at creation time are no longer valid, we need to recreate the elements pointing to the new ones.
        this.requestUpdate()
    }

    handleDatasetSetting(e, key) {
        this.viewer.params.setParam(key, 'checked' in e.detail ? e.detail.checked : e.detail.value);

        this.requestUpdate();
    }


    handleBinningCheckboxChange(e) {
        this.handleDatasetSetting(e, 'enableBinning');

        // TODO: should we detect the property change in the viewer in the first place?
        if (!e.detail.checked) {
            this.viewer._restoreOriginalAxisTypes()
        }
    }

    handleRelativeValuesCheckboxChange(e) {
        this.viewer.params.setParam('relativeValues', e.detail.checked)
    }

    handlePlotType(e) {
        let enableZoomSliders = this.viewer.params.omicsBox.enableZoomSlider

        this.viewer.options.series.forEach(series => {
            series.type = e.detail.plotType
            // series._obType = e.detail.type

            if (series.type == 'line') {
                series.areaStyle = { opacity: e.detail.fill ? 1 : 0 }
            }

            if (series.type == 'pie') {
                // TODO: which value should we use?
                if (this.viewer._getOrientation() == ORIENTATION.HORIZONTAL) {
                    series.encode = Object.assign(series.encode, { value: series.encode.x, itemName: series.encode.y })
                } else {
                    series.encode = Object.assign(series.encode, { value: series.encode.y, itemName: series.encode.x })
                }

                // Save a copy of the original style
                // Leave blank to force echarts to autocolor it
                series._orgItemStyle = series.itemStyle //Object.assign({}, series.itemStyle)
                series.itemStyle = {}

                // Hide the axis
                this.viewer.options.xAxis[series.xAxisIndex].show = false
                this.viewer.options.yAxis[series.yAxisIndex].show = false

                enableZoomSliders = false

                // This will override whatever previous formatter the label has, we store our original just in case.
                series.label = Object.assign({ formatter: LABEL_FORMATTER.PIE_CB, _pieOrgFormatter: series.label ? series.label._orgFormatter : undefined }, series.label || {})
                series._obPieLabel = true

                this.viewer._restoreSeriesCallbacks(series, series._index)
            } else {
                if (series._orgItemStyle) {
                    series.itemStyle = series._orgItemStyle
                }

                if (series._obPieLabel) {
                    delete series._obPieLabel

                    // Only delete formatter if it is the forced one
                    delete series.label.formatter

                    // Calling restoreSeriesCallbacks after assigning our pie formatter will assign a fake orgFormatter.
                    delete series.label._orgFormatter

                    // If we had a previous formatter, restore it
                    if (series.label._pieOrgFormatter) {
                        series.label._orgFormatter = series.label._pieOrgFormatter
                    }

                    delete series.label._pieOrgFormatter

                    series.label.show = false

                    this.viewer._restoreSeriesCallbacks(series, series._index)
                }

                this.viewer.options.xAxis[series.xAxisIndex].show = true
                this.viewer.options.yAxis[series.yAxisIndex].show = true
            }
        })

        // Switch the x/y values
        const hasChanged = this.viewer.setOrientation(e.detail.isHorizontal ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL, this.viewer.options)

        // If orientation has changed, reprocess dataset (different sorting)
        if (hasChanged) {
            this.viewer.data.processData({
                updateLabels: false
            });
        }

        // Enable zoom sliders (AFTER setting new orientation)
        this._enableZoomSliders(enableZoomSliders)

        // Avoid hiding ticks in category axis
        if (this.viewer.options.yAxis.type == "category") {
            this.viewer.options.yAxis.axisLabel = Object.assign(this.viewer.options.yAxis.axisLabel || {}, { interval: 0 })
        }

        if (this.viewer.options.xAxis.type == "category") {
            this.viewer.options.xAxis.axisLabel = Object.assign(this.viewer.options.xAxis.axisLabel || {}, { interval: 0 })
        }

        this.viewer._updateOptions(this.viewer.options);

        // Replace the axis char/digits limits 
        // This should be called AFTER rendering the new plot, otherwise we will be looking
        // at the old axis information. And yes, this implies we would have to  'update' again the
        // plot after rendering.
        if (e.detail.plotType != 'pie') {
            this.viewer._setLabelTruncatingOptions(true);
        }

        // Ideally we shoult let lit-element to observe property changes and automatically update components.
        // Unfortunately we are working with multilevel objects and lit element cannot detect changes
        // made on a property basis (ie. object.property = 'newvalue').
        //
        // Since each module modifies individual properties at different levels, it seems unreasonable
        // to watch all of them. We update only 'on request'
        this.requestUpdate()
    }

    handleAxisInterval(axis, e) {
        this.viewer._updateOptions(axis)

        // TODO: check if updateOptions waits until the chart has been rendered
        if (e.detail.attribute == 'splitNumber') {
            this.viewer._setLabelTruncatingOptions(true, [axis])
        }
    }

    _getValidPlotTypes() {
        let plotTypes = []

        if (this.modules.includes(SIDEBAR_MODULES.PLOT_EDITOR_BARS)) {
            plotTypes.push('bar', 'horizontal-bar')
        }

        // Allow only lines in non-category options
        if (!this.viewer.hasCategoryColors() && this.modules.includes(SIDEBAR_MODULES.PLOT_EDITOR_LINES)) {
            plotTypes.push('line', 'area')
        }

        if (this.viewer.options.series.length == 1 && this.modules.includes(SIDEBAR_MODULES.PLOT_EDITOR_PIE)) {
            plotTypes.push('pie')
        }

        // Remove invalid plot types (horizontal and pie)
        if (this.viewer.hasBothValueOrgAxis()) {
            plotTypes = plotTypes.filter(type => type != 'pie' && type != 'horizontal-bar')
        }

        return plotTypes
    }

    _getSelectionByName(pool, entryName) {
        return Object.values(pool).find(entry => entry.name == entryName) || Object.values(pool)[0]
    }

    _hasValueLimitAvailable() {
        const currentMethod = this._getSelectionByName(LIMIT_OPTIONS, this.viewer.params.omicsBox.limitOption)

        return [LIMIT_OPTIONS.VALUE_HIGHER.name, LIMIT_OPTIONS.VALUE_LOWER.name].includes(currentMethod.name)
    }

    _getLimitOptions() {
        // Originally Object.values(LIMIT_OPTIONS);
        // These are 'dummy' limit options that are only used here. All this crap will be moved
        // to a different class/file once we have time to refactor.
        return [
            LIMIT_OPTIONS_ALIAS.ABSOLUTE_VALUE,
            LIMIT_OPTIONS_ALIAS.ENTRY
        ]
    }

    _getLimitSelection() {
        if (!this._filterMethodOption) {
            let realLimitOption = this._getSelectionByName(LIMIT_OPTIONS, this.viewer.params.omicsBox.limitOption)

            // TODO: move this to a translation table
            switch (realLimitOption.name) {
                case LIMIT_OPTIONS.ENTRY.name:
                    return LIMIT_OPTIONS_ALIAS.ENTRY;
                    break;
                case LIMIT_OPTIONS.VALUE_HIGHER.name:
                case LIMIT_OPTIONS.VALUE_LOWER.name:
                    return LIMIT_OPTIONS_ALIAS.ABSOLUTE_VALUE;
                    break;
                default:
                    // By default we return the ENTRY
                    return LIMIT_OPTIONS_ALIAS.ENTRY
            }
        }

        return this._filterMethodOption
    }

    _getValueLimitSelection() {
        if (!this._valueLimitOption) {
            let realLimitOption = this._getSelectionByName(LIMIT_OPTIONS, this.viewer.params.omicsBox.limitOption)

            // TODO: move this to a translation table
            switch (realLimitOption.name) {
                case LIMIT_OPTIONS.VALUE_HIGHER.name:
                    return LIMIT_VALUE_OPTIONS_ALIAS.HIGHER;
                    break;
                case LIMIT_OPTIONS.VALUE_LOWER.name:
                    return LIMIT_VALUE_OPTIONS_ALIAS.LOWER;
                    break;
                default:
                    // By default we return the LOWER_VALUE
                    return LIMIT_VALUE_OPTIONS_ALIAS.LOWER
            }
        }

        return this._valueLimitOption
    }

    _getValueLimitOptions() {
        return [LIMIT_VALUE_OPTIONS_ALIAS.LOWER, LIMIT_VALUE_OPTIONS_ALIAS.HIGHER]
    }

    _getSortingOptions() {
        // TODO: should we consider the dummy series also?
        return this.viewer.options.series.length == 1 ? SORTING_OPTIONS_SINGLE : SORTING_OPTIONS_MULTI;
    }

    handleSelectLimitChange(e) {
        // If we have selected 'Absolute value', then the real limit
        // option is 'value_lower' or 'value_higher', depending on the
        // other select
        let realOptionName = e.detail.name

        // Polymer usually links a form element to a variable/property, we
        // emulate that with some temp variables that are initialized
        // at the 'limit widget' init callback.
        this._filterMethodOption = this._getSelectionByName(LIMIT_OPTIONS_ALIAS, e.detail.name)

        // TODO: this will change once we have 'relative values' as well.
        // In fact, all of this should be moved to a new widget that handles
        // all its logic.
        if (e.detail.name == LIMIT_OPTIONS_ALIAS.ABSOLUTE_VALUE.name) {
            let valueSelection = this._getValueLimitSelection()

            switch (valueSelection.name) {
                case LIMIT_VALUE_OPTIONS_ALIAS.HIGHER.name:
                    realOptionName = LIMIT_OPTIONS.VALUE_HIGHER.name;
                    break;
                case LIMIT_VALUE_OPTIONS_ALIAS.LOWER.name:
                    realOptionName = LIMIT_OPTIONS.VALUE_LOWER.name;
                    break;
            }

            console.log("ABSOLUTE VALUE SELECTION", e.detail.name, realOptionName)
        }

        if (this.viewer.params.omicsBox.limitOption != realOptionName) {
            this.viewer.params.setParam('limitOption', realOptionName)

            this.viewer._updateParams()
            this.requestUpdate()
        }
    }

    handleSelectValueLimitChange(e) {
        let realOptionName = e.detail.name
        let filterSelection = this._getLimitSelection()

        // Polymer usually links a form element to a variable/property, we
        // emulate that with some temp variables that are initialized
        // at the 'limit widget' init callback.
        this._valueLimitOption = this._getSelectionByName(LIMIT_VALUE_OPTIONS_ALIAS, e.detail.name)

        // Only available for absolute value
        if (filterSelection.name == LIMIT_OPTIONS_ALIAS.ABSOLUTE_VALUE.name) {
            switch (e.detail.name) {
                case LIMIT_VALUE_OPTIONS_ALIAS.HIGHER.name:
                    realOptionName = LIMIT_OPTIONS.VALUE_HIGHER.name;
                    break;

                case LIMIT_VALUE_OPTIONS_ALIAS.LOWER.name:
                    realOptionName = LIMIT_OPTIONS.VALUE_LOWER.name;
                    break;
            }

            console.log("LIMIT ABSOLUTE VALUE SELECTION", e.detail.name, realOptionName)
        } else {
            console.log("OPTION NOT SUPPORTED", filterSelection)
        }

        if (this.viewer.params.omicsBox.limitOption != realOptionName) {
            this.viewer.params.setParam('limitOption', realOptionName)

            this.viewer._updateParams()
            this.requestUpdate()
        }
    }

    handleFormattingChange(e, option, optionAttribute, optionIndex = 0) {
        const updateGridAttributes = ['nameTextStyle', 'textStyle'];
        const keyData = {
            text: option == 'title' ? 'text' : 'name',
            style: optionAttribute,
        };

        const hasGrid = updateGridAttributes.includes(optionAttribute);
        const gridData = hasGrid ? this.getGridInfoFromOptions({
            options: e.detail.options,
            keys: Object.assign({ component: option }, keyData),
            chart: this.viewer.getChart()
        }) : {};

        const customEventData = this.createSettingsChangeEvent(Object.assign({
            component: option,
            componentIndex: optionIndex,
            property: optionAttribute,
            options: e.detail.options,
        }, hasGrid ? { grid: gridData.grid } : {}));

        this.viewer.dispatchEvent(customEventData);
    }
}

customElements.define('chart-viewer-sidebar', ChartViewerSidebar)