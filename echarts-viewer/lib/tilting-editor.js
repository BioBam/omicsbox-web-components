import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/elements/input-button.js'

class TiltingEditor extends LitElement {
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
            label: {
                type: String,
                reflect: true
            },
            options: {
                type: Object
            },
            disabled: {
                type: Boolean
            }
        };
    }
    constructor() {
        super()

        this.disabled = false
        this.options = [{axisLabel: {}}]
        this.label = ''
        this.posTransformations = {
            'left': 1,
            'right': -1,
            'top': 1,
            'bottom': 1
        }
        // this.options = []
        // this.rotation = ['none', '45deg', '90deg']
    }
    render() {
        // The rotation options are the same between different axis so we take the first one
        let rotationValue = Math.abs(this.options[0].axisLabel.rotate)

        return html`
            <label>${this.label}</label>
            <span></span>
            <span class="input-formatting">
                <input-button class="${this.disabled ? 'disabled' : ''}" @click="${e => this.handleClickButton(0)}"><fa-icon .enabled="${(!this.disabled)}" g="solid" n="grip-lines" ?selected="${rotationValue == 0}"></fa-icon></input-button>
                <input-button class="${this.disabled ? 'disabled' : ''}" @click="${e => this.handleClickButton(45)}"><fa-icon .enabled="${(!this.disabled)}" style="transform: scaleX(-1) rotate(45deg)" g="solid" n="grip-lines" ?selected="${rotationValue == 45}"></fa-icon></input-button>
                <input-button class="${this.disabled ? 'disabled' : ''}" @click="${e => this.handleClickButton(90)}"><fa-icon .enabled="${(!this.disabled)}" style="transform: scaleX(-1) rotate(90deg)" g="solid" n="grip-lines" ?selected="${rotationValue == 90}"></fa-icon></input-button>
            </span>
            `
    }
    handleClickButton(rotation) {
        let rotationValue = Math.abs(this.options[0].axisLabel.rotate)

        if (rotation != rotationValue) {
            // Apply rotation to all axis
            this.options.map(axis => {
                axis.axisLabel.rotate = rotation * this.posTransformations[axis.position]
            })

            this.requestUpdate()

            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    options: this.options,
                    property: "rotate",
                }
            }));
        }
    }
}
customElements.define('tilting-editor', TiltingEditor);