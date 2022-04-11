import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'

class GridEditor extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            display: flex;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            flex-wrap: wrap;
            --input-button-back-color: #fafafa;
            --input-border-color: #ccc;
            --input-button-back-hover-color: #ffffff;
            --input-button-back-active-color: #ccc;
            --icon-selected: #3e7bf0;
            --icon-selected-hover-color: #3e7bf0;
        }

        span {
            flex: 1 0 20%;
        }

        span.input-formatting {
            flex: 0 0 92px;
            display: inline-flex;
            justify-content: space-between;
        }
        `]
    }
    static get properties() {
        return {
            current: {
                type: String,
                reflect: true
            },
            options: {
                type: Array
            },
            is3dChart: {
                type: Boolean
            }
        };
    }
    constructor() {
        super()

        this.is3dChart = false
        this.options = {
            xAxis: {
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: 'solid'
                    }
                }
            },
            yAxis: {
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: 'solid'
                    }
                }
            },
            xAxis3D: {
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: 'solid'
                    }
                }
            },
            yAxis3D: {
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: 'solid'
                    }
                }
            },
            zAxis3D: {
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: 'solid'
                    }
                }
            }
        }
    }

    _getAxisName(axis) {
        return `${axis}${this.is3dChart ? '3D' : ''}`
    }

    _getOption(option) {
        return this.options[`${option}${this.is3dChart ? '3D' : ''}`]
    }

    render() {
        return html`
        <label>Grid options</label>
        <span></span>
        <span class="input-formatting">
            <input-button @click="${e => this.handleClickToggleButton("xAxis")}"><fa-icon style="transform: scaleX(-1) rotate(-90deg)" g="solid" n="bars" ?selected="${this._getOption('xAxis')[0].splitLine.show}"></fa-icon></input-button>
            <input-button @click="${e => this.handleClickToggleButton("yAxis")}"><fa-icon g="solid" n="bars" ?selected="${this._getOption('yAxis')[0].splitLine.show}"></fa-icon></input-button>
            <input-button @click="${e => this.handleClickStyleButton()}"><fa-icon g="solid" n="border-none" ?selected="${this._getOption('xAxis')[0].splitLine.lineStyle.type == 'dashed'}"></fa-icon></input-button>
        </span>
        `;
    }

    handleClickToggleButton(axisType) {
        let axisName = this._getAxisName(axisType);

        this.options[axisName][0].splitLine.show = ! this.options[axisName][0].splitLine.show;

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                axis: [axisName],
                state: this.options[axisName][0].splitLine.show
            }
        }));

        this.requestUpdate()
    }

    handleClickStyleButton() {
        let _xAxis = this._getAxisName('xAxis');
        let _yAxis = this._getAxisName('yAxis');

        this.options[_xAxis][0].splitLine.lineStyle.type = this.options[_xAxis][0].splitLine.lineStyle.type == 'solid' ? 'dashed' : 'solid';
        this.options[_yAxis][0].splitLine.lineStyle.type = this.options[_yAxis][0].splitLine.lineStyle.type == 'solid' ? 'dashed' : 'solid';

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                axis: [_xAxis, _yAxis],
                state: this.options[_xAxis][0].splitLine.lineStyle.type
            }
        }));

        this.requestUpdate()
    }
}
customElements.define('grid-editor', GridEditor);