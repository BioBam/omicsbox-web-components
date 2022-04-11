export const VIEWER_VERSION = 2

export const GROUP_OTHERS_COLOR = '#DBDBDB'
export const legendHeight = 20
export const visualMapWidth = 100
export const fontFactor = 1.07
export const axisNamePadding = 11
export const defaultLabelCharTruncating = 30

export const OB_DATASET_KEYWORD = '_obDataset';

export const ORIENTATION = {
    VERTICAL: 1,
    HORIZONTAL: 2
}

export const SIDEBAR_MODULES = {
    FORMATTING_TITLE: 1,
    FORMATTING_YAXIS_TITLE: 2,
    FORMATTING_XAXIS_TITLE: 3,
    FORMATTING_YAXIS_LABELS: 4,
    FORMATTING_XAXIS_LABELS: 5,
    PLOT_EDITOR: 6,
    SERIES_EDITOR: 7,
    SORTING_OPTIONS: 8,
    LIMIT_OPTIONS: 9,
    GRID_EDITOR: 10,
    PERCENTAGE_EDITOR: 11,
    PLOT_EDITOR_BARS: 12,
    PLOT_EDITOR_LINES: 13,
    PLOT_EDITOR_PIE: 14,
    LABEL_EDITOR: 15,
    FORMATTING_XAXIS_INTERVAL: 16,
    FORMATTING_YAXIS_INTERVAL: 17,
    FORMATTING_XAXIS_ROTATION: 18,
    FORMATTING_YAXIS_ROTATION: 19,
    FORMATTING_XAXIS_LIMIT: 20,
    FORMATTING_YAXIS_LIMIT: 21,
    BINNING_OPTIONS: 22,
    ZOOM_OPTIONS: 23,
    FONT_FAMILY_OPTIONS: 24,
    SYMBOL_SIZE_EDITOR: 25,
    LABEL_FORMATTING: 26,
    // New z-axis
    FORMATTING_ZAXIS_TITLE: 27,
    FORMATTING_ZAXIS_LABELS: 28,
    FORMATTING_ZAXIS_INTERVAL: 29,
    FORMATTING_ZAXIS_ROTATION: 30,
    FORMATTING_ZAXIS_LIMIT: 31
}

export const CUSTOM_SIDEBAR_BLOCKS = {
    ADJUSTMENTS: {
        order: 0,
        name: "Adjustments",
        visible: true,
        FIELDSETS: {
            LIMIT_OPTIONS: {
                order: 0,
                name: "Filtering Options"
            },
            SORTING_OPTIONS: {
                order: 1,
                name: "Sorting Options"
            }
        }
    },

    PLOT: {
        order: 1,
        name: "Plot",
        visible: true
    },

    SERIES: {
        order: 2,
        name: "Series",
        visible: true
    },

    FONT_SETTINGS: {
        order: 3,
        name: "Font & Graphical Settings",
        visible: true,
        FIELDSETS: {
            GENERAL_OPTIONS: {
                order: 0,
                name: "General Options"
            },
            XAXIS_OPTIONS: {
                order: 1,
                name: "X-Axis Options"
            },
            YAXIS_OPTIONS: {
                order: 2,
                name: "Y-Axis Options"
            },
            ZAXIS_OPTIONS: {
                order: 3,
                name: "Z-Axis Options"
            }
        }
    }
}

export const LIMIT_OPTIONS = {
    ENTRY: {
        name: "entry",
        title: "Number of entries"
    },
    VALUE_LOWER: {
        name: "value_lower",
        title: "Lower than"
    },
    VALUE_HIGHER: {
        name: "value_higher",
        title: "Higher than"
    }
}

export const SORTING_OPTIONS_SINGLE = {
    HIGHEST: {
        name: "highest",
        title: "Highest"
    },
    LOWEST: {
        name: "lowest",
        title: "Lowest"
    }
}

export const SORTING_OPTIONS_MULTI = {
    HIGHEST: {
        name: "highest",
        title: "Highest"
    },
    LOWEST: {
        name: "lowest",
        title: "Lowest"
    },
    DIFFERENCE: {
        name: "difference",
        title: "Difference"
    },
    SIMILARITY: {
        name: "similarity",
        title: "Similarity"
    }
}

const decimalFormatter = new Intl.NumberFormat('en-GB', { style: 'decimal', notation: 'standard', maximumFractionDigits: 2 });


export const LABEL_FORMATTER = {
    PIE: '${x} : ${y} (${d}%)',
    // This is needed to force rounding of decimal places, see issue #1349
    PIE_CB: (params) => {
        return `${params.value[0]} : ${decimalFormatter.format(params.value[1])} (${params.percent}%)`;
    }
}


