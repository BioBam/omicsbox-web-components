import { LitElement, html, css } from '../node_modules/lit/index.js';

class InputColorPicker extends LitElement {
    static get styles() {
        return [css `
            :host {
                display: block;
                box-sizing: border-box;
                position: relative;
                margin: 0;
            }

            #colorinput {
                font-family: inherit;
                font-size: inherit;
                box-sizing: border-box;
                display: block;
                float: left;
                border: 1px solid #ccc;
                padding: 0px 4px;
                margin: 0;
                width: calc(100% - 21px);
                background-color: #fafafa;
                line-height: 21px;
                transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
            }

            #colorinput:focus,
            #colorbox:focus {
                outline: 0;
            }

            #colorinput:focus {
                border-color: #66afe9;
                box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, .6);
            }

            #colorbox {
                box-sizing: border-box;
                float: left;
                cursor: pointer;
                padding: 0;
                height: 23px;
                width: 21px;
                border: 1px solid #bbb;
                border-right-width: 0;
            }

            #colorbox:focus + input + div#colorlist {
                visibility: visible;
                opacity: 1;
            }

            div#colorlist {
                box-sizing: border-box;
                position: fixed;
                z-index: 1000000;
                visibility: hidden;
                opacity: 0;
                padding: 5px;
                /* width: 230px; */
                width: 298px;
                margin: 0;
                top: 0px;
                left: 0px;
                border: 1px solid #ccc;
                background: white;
                list-style: none;
                text-transform: none;
                transition: opacity 0.1s, visibility 0.1s;
                box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.2);
            }

            div#colorlist > div {
                box-sizing: border-box;
                display: block;
                float: left;
                width: 15px;
                height: 15px;
                margin: 0px;
                border: 1px solid #ffffff;
                background-color: rgba(255, 0, 0, 1.0);
            }

            div#colorlist > div:hover {
                cursor: pointer;
                border: 1px solid #000000;
            }
        `]
    }
    render() {
        return html `
            <div title="${this.ctitle}" tabindex="0" id="colorbox" @focus="${this.handleColorBoxClick}" style="${this.computeColorStyle(this.color)}"></div>
            <input id="colorinput" type="${this.label ? `text` : `hidden`}" value="${this.color}" @keypress="${this.handleKeyPress}">
            ${this.selectable ? html`
            <div id="colorlist">
                ${this.colors.map((c) => html`
                    <div data-color="${c}" @mousedown="${this.handleColorClick}" style="${this.computeColorStyle(c)}"></div>
                `)}
            </div>` : ``}
        `
    }
    static get properties() {
        return {
            preset: {
                type: String
            },
            colors: {
                type: Array
            },
            color: {
                type: String,
                reflect: true
            },
            ctitle: {
                type: String
            },
            label: {
                type: Boolean,
            },
            selectable: {
                type: Boolean
            }
        };
    }
    constructor() {
        super();
        this.preset = 'default'
        this.colors = this.computeColors()
        this.color = ''
        this.ctitle = ''
        this.label = true
        this.selectable = true
    }
    firstUpdated() {
        this._updatePosition();
    }
    _updatePosition() {
        if (this.selectable) {
            let colorlist = this.renderRoot.querySelector('#colorlist')
            var boxRect = this.getBoundingClientRect();
            var listRect = colorlist.getBoundingClientRect();
            var leftDiff = listRect.width - (window.innerWidth - boxRect.left);
            var botDiff = listRect.height - (window.innerHeight - boxRect.bottom);
            if (leftDiff > 0) {
                colorlist.style.left = (boxRect.left - listRect.width + 20) + 'px';
            } else {
                colorlist.style.left = (boxRect.left) + 'px';
            }
            if (botDiff > 0) {
                colorlist.style.top = (boxRect.top - listRect.height) + "px";
            } else {
                colorlist.style.top = (boxRect.top + 25) + "px";
            }
        }
    }
    handleColorClick(e) {
        this.color = e.currentTarget.dataset.color;
        this.dispatchEvent(new CustomEvent('colorchange', { bubbles: true, composed: true, detail: { color: this.color } }));
    }
    handleKeyPress(e) {
        if (e.keyCode == 13) {
            this.color = e.currentTarget.value
            this.dispatchEvent(new CustomEvent('colorchange', { bubbles: true, composed: true, detail: { color: this.color } }));
        }
    }
    handleColorBoxClick(e) {
        this._updatePosition();
    }
    computeColorStyle(color) {
        let style;
        if (this.selectable) {
            style = 'background-color:' + color;
        } else {
            // style = 'cursor: not-allowed; background: repeating-linear-gradient(135deg, #fafafa, #fafafa 1px, #ccc 1px, #ccc 2px);';
            //style = 'cursor: not-allowed; background: linear-gradient(135deg, #fafafa 25%, #cccccc 25%, #cccccc 50%, #fafafa 50%, #fafafa 75%, #cccccc 75%, #cccccc 100%);background-size: 5.66px 5.66px; ';
            style = 'display: none'
        }

        return style;
    }
    computeColors(preset) {
        // return this._generateColors(preset);
        return this._getColors();
    }
    _getColors() {
        return [
            // "#f44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
            // "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#9E9E9E", "#607D8B",

            "#ffebee", "#FCE4EC", "#F3E5F5", "#EDE7F6", "#E8EAF6", "#E3F2FD", "#E1F5FE", "#E0F7FA", "#E0F2F1", "#E8F5E9",
            "#F1F8E9", "#F9FBE7", "#FFFDE7", "#FFF8E1", "#FFF3E0", "#FBE9E7", "#EFEBE9", "#FAFAFA", "#ECEFF1",

            "#ffcdd2", "#F8BBD0", "#E1BEE7", "#D1C4E9", "#C5CAE9", "#BBDEFB", "#B3E5FC", "#B2EBF2", "#B2DFDB", "#C8E6C9",
            "#DCEDC8", "#F0F4C3", "#FFF9C4", "#FFECB3", "#FFE0B2", "#FFCCBC", "#D7CCC8", "#F5F5F5", "#CFD8DC",
            "#ef9a9a", "#F48FB1", "#CE93D8", "#B39DDB", "#9FA8DA", "#90CAF9", "#81D4FA", "#80DEEA", "#80CBC4", "#A5D6A7",
            "#C5E1A5", "#E6EE9C", "#FFF59D", "#FFE082", "#FFCC80", "#FFAB91", "#BCAAA4", "#EEEEEE", "#B0BEC5",
            "#e57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB", "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
            "#AED581", "#DCE775", "#FFF176", "#FFD54F", "#FFB74D", "#FF8A65", "#A1887F", "#E0E0E0", "#90A4AE",
            "#ef5350", "#EC407A", "#AB47BC", "#7E57C2", "#5C6BC0", "#42A5F5", "#29B6F6", "#26C6DA", "#26A69A", "#66BB6A",
            "#9CCC65", "#D4E157", "#FFEE58", "#FFCA28", "#FFA726", "#FF7043", "#8D6E63", "#BDBDBD", "#78909C",
            "#f44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
            "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#9E9E9E", "#607D8B",
            "#e53935", "#D81B60", "#8E24AA", "#5E35B1", "#3949AB", "#1E88E5", "#039BE5", "#00ACC1", "#00897B", "#43A047",
            "#7CB342", "#C0CA33", "#FDD835", "#FFB300", "#FB8C00", "#F4511E", "#6D4C41", "#757575", "#546E7A",
            "#d32f2f", "#C2185B", "#7B1FA2", "#512DA8", "#303F9F", "#1976D2", "#0288D1", "#0097A7", "#00796B", "#388E3C",
            "#689F38", "#AFB42B", "#FBC02D", "#FFA000", "#F57C00", "#E64A19", "#5D4037", "#616161", "#455A64",
            "#c62828", "#AD1457", "#6A1B9A", "#4527A0", "#283593", "#1565C0", "#0277BD", "#00838F", "#00695C", "#2E7D32",
            "#558B2F", "#9E9D24", "#F9A825", "#FF8F00", "#EF6C00", "#D84315", "#4E342E", "#424242", "#37474F",
            "#b71c1c", "#880E4F", "#4A148C", "#311B92", "#1A237E", "#0D47A1", "#01579B", "#006064", "#004D40", "#1B5E20",
            "#33691E", "#827717", "#F57F17", "#FF6F00", "#E65100", "#BF360C", "#3E2723", "#212121", "#263238",

            // "#ff8a80", "#FF80AB", "#EA80FC", "#B388FF", "#8C9EFF", "#82B1FF", "#80D8FF", "#84FFFF", "#A7FFEB", "#B9F6CA",
            // "#CCFF90", "#F4FF81", "#FFFF8D", "#FFE57F", "#FFD180", "#FF9E80",
            //
            // "#ff5252", "#FF4081", "#E040FB", "#7C4DFF", "#536DFE", "#448AFF", "#40C4FF", "#18FFFF", "#64FFDA", "#69F0AE",
            // "#B2FF59", "#EEFF41", "#FFFF00", "#FFD740", "#FFAB40", "#FF6E40",
            //
            // "#ff1744", "#F50057", "#D500F9", "#651FFF", "#3D5AFE", "#2979FF", "#00B0FF", "#00E5FF", "#1DE9B6", "#00E676",
            // "#76FF03", "#C6FF00", "#FFEA00", "#FFC400", "#FF9100", "#FF3D00",
            // "#d50000", "#C51162", "#AA00FF", "#6200EA", "#304FFE", "#2962FF", "#0091EA", "#00B8D4", "#00BFA5", "#00C853",
            // "#64DD17", "#AEEA00", "#FFD600", "#FFAB00", "#FF6D00", "#DD2C00"
        ]
    }
    _generateColors(preset) {
        var presetPalettes = {
            'default': {
                'saturation': [70.0, 100.0, 'rows'],
                'hue': [0.0, 300.0, 'cols'],
                'value': [40.0, 98.0, 'rows']
            },
            'warm': {
                'saturation': [70.0, 100.0, 'rows'],
                'hue': [0.0, 60.0, 'cols'],
                'value': [40.0, 98.0, 'rows']
            },
            'cool': {
                'saturation': [70.0, 100.0, 'rows'],
                'hue': [150.0, 280.0, 'cols'],
                'value': [40.0, 98.0, 'rows']
            },
            'moody': {
                'saturation': [80.0, 12.0, 'rows'],
                'hue': [0.0, 300.0, 'cols'],
                'value': [30.0, 70.0, 'rows']
            },
            'primary': {
                'saturation': [100.0, 100.0, 'rows'],
                'hue': [0.0, 300.0, 'cols'],
                'value': [50.0, 98.0, 'rows']
            },
            'pastel': {
                'saturation': [50.0, 90.0, 'rows'],
                'hue': [0.0, 300.0, 'cols'],
                'value': [70.0, 98.0, 'rows']
            }
        };
        var hslToRgb = function(h, s, l) {
            var r, g, b;

            // normalize hue orientation b/w 0 and 360 degrees
            h = h % 360;
            if (h < 0)
                h += 360;
            h = ~~h / 360;

            if (s < 0)
                s = 0;
            else if (s > 100)
                s = 100;
            s = ~~s / 100;

            if (l < 0)
                l = 0;
            else if (l > 100)
                l = 100;
            l = ~~l / 100;

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                var q = l < 0.5 ?
                    l * (1 + s) :
                    l + s - l * s;
                var p = 2 * l - q;
                r = hueToRgb(p, q, h + 1 / 3);
                g = hueToRgb(p, q, h);
                b = hueToRgb(p, q, h - 1 / 3);
            }

            return [~~(r * 255), ~~(g * 255), ~~(b * 255)];
        };

        var hueToRgb = function(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        var colors = [];
        var settings = presetPalettes[preset];
        settings.rows = 6;
        settings.cols = 12;
        var getComponent = function(component, col, row) {
            var axis = settings[component][2];
            var current = (axis == 'cols') ? col : row;
            var step = (settings[component][1] - settings[component][0]) / settings[axis];
            return parseInt((current * step) + settings[component][0]);
        }
        for (var r = 0; r < settings['rows']; r++) {
            for (var c = 0; c < settings['cols']; c++) {
                var h = getComponent('hue', c, r);
                var s = getComponent('saturation', c, r);
                var v = getComponent('value', c, r);
                var asRGB = hslToRgb(h, s, v);
                var redAsHex = asRGB[0].toString(16);
                var greenAsHex = asRGB[1].toString(16);
                var blueAsHex = asRGB[2].toString(16);
                var rgb = '#' +
                    ((redAsHex.length == 1 ? '0' : '') + redAsHex) +
                    ((greenAsHex.length == 1 ? '0' : '') + greenAsHex) +
                    ((blueAsHex.length == 1 ? '0' : '') + blueAsHex);
                colors.push(rgb);
            }
        }
        var n = settings['cols'];
        var interval = 255 / n;
        for (var r = n; r > 0; r--) {
            var hex = Math.ceil(r * interval).toString(16);
            var rgb = '#' +
                ((hex.length == 1 ? '0' : '') + hex) +
                ((hex.length == 1 ? '0' : '') + hex) +
                ((hex.length == 1 ? '0' : '') + hex);
            colors.push(rgb);
        }
        return colors;
    }

}
customElements.define('input-color-picker', InputColorPicker);
