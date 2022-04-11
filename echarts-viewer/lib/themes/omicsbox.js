
// var contrastColor = '#808080';
var contrastColor = '#000';
// var contrastColor = '#000';
var backgroundColor = '#FFF';
var textColor = '#000000'
export var themeFontFamily = "'Roboto'";
export var overflowValue = 'break'
// var chosenFontFamily = "'monospace'";


export var axisCommon = function (chosenFontFamily = null) {
    if (!chosenFontFamily) {
        chosenFontFamily = themeFontFamily
    }

    return {
        nameTextStyle: {
            fontFamily: chosenFontFamily,
            fontWeight: 'normal',
            fontStyle: 'normal',
            fontSize: 14,
            color: contrastColor,
            width: null,
            overflow: overflowValue
        },
        axisLabel: {
            fontFamily: chosenFontFamily,
            fontWeight: 'normal',
            fontStyle: 'normal',
            fontSize: 12,
            formatter: "{value}",
            color: contrastColor,
            margin: 8
        },
        axisLine: {
            show: true,
            onZero: false,
            lineStyle: {
                color: contrastColor
            }
        },
        splitLine: {
            lineStyle: {
                color: '#C0C0C0'
            }
        },
        splitArea: {
            areaStyle: {
                color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
            }
        },
        minorSplitLine: {
            lineStyle: {
                color: '#C0C0C0'
            }
        },
        offset: 10
    };
};

var colorPalette = [
    "rgba(185,205,240,1)",
    "rgba(251,114,108,1)",
    "rgba(175,225,190,1)",
    "rgba(215,175,220,1)",
    "rgba(242,133,0,1)",
    "rgba(249,235,200,1)",
    "rgba(235,200,225,1)",
    "rgba(211,221,240,1)",
    "rgba(251,140,135,1)",
    "rgba(199,225,207,1)",
    "rgba(218,199,220,1)",
    "rgba(242,145,26,1)",
    "rgba(249,243,227,1)",
    "rgba(235,225,232,1)",
    "rgba(237,238,240,1)",
    "rgba(251,166,162,1)",
    "rgba(223,225,224,1)",
    "rgba(196,2,220,1)",
    "rgba(242,156,52,1)",
    "rgba(249,179,5,1)",
    "rgba(235,16,172,1)",
    "rgba(23,102,240,1)",
    "rgba(251,192,189,1)",
    "rgba(23,225,83,1)",
    "rgba(198,26,220,1)",
    "rgba(242,168,78,1)",
    "rgba(249,187,31,1)",
    "rgba(235,41,180,1)",
    "rgba(48,118,240,1)",
    "rgba(251,218,216,1)"
];

export var omicsboxtheme = function (chosenFontFamily = null) {

    if (!chosenFontFamily) {
        chosenFontFamily = themeFontFamily
    }

    let theme = {
        // darkMode: true,
        animation: false,
        color: colorPalette,
        backgroundColor: backgroundColor,
        axisPointer: {
            lineStyle: {
                color: '#817f91'
            },
            crossStyle: {
                color: '#817f91'
            },
            label: {
                // TODO Contrast of label backgorundColor
                color: '#fff'
            }
        },
        legend: {
            textStyle: {
                color: contrastColor,
                fontFamily: chosenFontFamily,
            }
        },
        grid: {
            containLabel: true
        },
        textStyle: {
            color: contrastColor
        },
        title: {
            textStyle: {
                color: '#000000',
                fontFamily: chosenFontFamily,
                fontWeight: 'bold',
                fontStyle: 'normal',
                fontSize: 20,
                width: null,
                overflow: overflowValue

            },
            subtextStyle: {
                color: '#808080',
                fontFamily: chosenFontFamily,
                fontStyle: 'normal',
                fontWeight: 'normal',
                fontSize: 12,
                width: null,
                overflow: overflowValue
            }
        },
        toolbox: {
            iconStyle: {
                borderColor: contrastColor
            }
        },
        tooltip: {
            show: true,
            padding: 5,
            borderWidth: 1,
            backgroundColor: '#fafafa',
            borderColor: 'rgb(85,85,85)',
            transitionDuration: 0,
            extraCssText: 'border-radius: 0px;',
            textStyle: {
                color: '#333'
            }
        },
        dataZoom: {
            borderColor: '#3e7bf0', //'#71708A',
            textStyle: {
                color: contrastColor
            },
            brushStyle: {
                color: 'rgba(135,163,206,0.3)'
            },
            handleStyle: {
                color: '#353450',
                borderColor: '#C5CBE3'
            },
            moveHandleStyle: {
                color: '#B0B6C3',
                opacity: 0.3
            },
            fillerColor: 'rgba(135,163,206,0.2)',
            emphasis: {
                handleStyle: {
                    borderColor: '#91B7F2',
                    color: '#4D587D'
                },
                moveHandleStyle: {
                    color: '#636D9A',
                    opacity: 0.7
                }
            },
            dataBackground: {
                lineStyle: {
                    color: '#3e7bf0', //'#71708A',
                    width: 1
                },
                areaStyle: {
                    color: '#3e7bf0', //'#71708A'
                }
            },
            selectedDataBackground: {
                lineStyle: {
                    color: '#87A3CE'
                },
                areaStyle: {
                    color: '#87A3CE'
                }
            }
        },
        visualMap: {
            textStyle: {
                color: contrastColor
            },
            right: 0,
            left: 'auto',
            top: 0,
            bottom: 'auto',
            padding: [50, 20, 20, 50]
        },
        timeline: {
            lineStyle: {
                color: contrastColor
            },
            label: {
                color: contrastColor
            },
            controlStyle: {
                color: contrastColor,
                borderColor: contrastColor
            }
        },
        calendar: {
            itemStyle: {
                color: backgroundColor
            },
            dayLabel: {
                color: contrastColor
            },
            monthLabel: {
                color: contrastColor
            },
            yearLabel: {
                color: contrastColor
            }
        },
        timeAxis: axisCommon(chosenFontFamily),
        logAxis: axisCommon(chosenFontFamily),
        valueAxis: axisCommon(chosenFontFamily),
        categoryAxis: axisCommon(chosenFontFamily),
        pie: {
            label: {
                fontFamily: chosenFontFamily,
                fontWeight: 'normal',
                fontStyle: 'normal',
                fontSize: 12
            }
        },
        bar: {
            itemStyle: {
                border: 0.5,
                borderColor: '#C0C0C0'
            },
            // progressive: 0
        },
        line: {
            symbol: 'circle',
            connectNulls: true,
            // progressive: 0
        },
        graph: {
            color: colorPalette,
            roam: true,
            draggable: true
        },
        gauge: {
            title: {
                color: contrastColor
            }
        },
        boxplot: {
            // Boxplot ugly in FASTQ sequence quality plot
            //boxWidth: [100, 100],
            itemStyle: {
                borderWidth: 1,
                borderColor: '#000'
            },
            progressive: 0,
            boxWidth: [1, 100]
        },
        candlestick: {
            itemStyle: {
                color: '#FD1050',
                color0: '#0CF49B',
                borderColor: '#FD1050',
                borderColor0: '#0CF49B'
            }
        },
        scatter: {
            label: {
                fontFamily: chosenFontFamily,
                color: '#000000',
                position: 'top',
                distance: 2
            },
            itemStyle: {
                opacity: 1,
                borderWidth: 0
            },
            symbolSize: 5,
            // progressive: 0
        },
        grid3D: {
            viewControl: {
                projection: 'perspective',
                rotateMouseButton: 'left',
                panMouseButton: 'middle',
                rotateSensitivity: 1
            }
        }
    }

    theme.categoryAxis.splitLine.show = false;

    return theme
};

