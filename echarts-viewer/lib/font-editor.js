import { LitElement, html, css } from '../node_modules/lit/index.js';
// import { ifDefined } from '../node_modules/lit-html/directives/if-defined.js';
import '../node_modules/web-libraries/resources/icons/fa-icon.js';
import '../node_modules/web-libraries/resources/utils.js'
import '../node_modules/web-libraries/elements/select-down.js'

class FontEditor extends LitElement {
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
            --input-button-back-color: #fafafa;
            --input-border-color: #ccc;
            --input-button-back-hover-color: #ffffff;
            --input-button-back-active-color: #ccc;
            --icon-selected: #3e7bf0;
            --icon-selected-hover-color: #3e7bf0;
        }
        .inputWidth {
            width: var(--input-width);
        }

        select-down {
            height: 23px;
        }
        `]
    }
    render() {

        return html`
            <label>${this.label}</label>
            <span></span>
            <select-down class="inputWidth" .options="${this.availableFonts}" @select="${e => { this.handleFontFamilyChange(e) }}" .selectedOption="${this._getSelectedOption()}"></select-down>`
    }

    static get properties() {
        return {
            label: {
                type: String,
                reflect: true
            },
            selectedFont: {
                type: Object
            }
        };
    }

    constructor() {
        super();

        this.label = ''

        this.availableFonts = [
            {
                name: `'Arial'`,
                title: html`<span style="font-family: 'Arial'">Arial</span>`
            },
            {
                name: `'Roboto'`,
                title: html`<span style="font-family: 'Roboto'">Roboto</span>`
            },
            {
                name: `'Roboto Mono'`,
                title: html`<span style="font-family: 'Roboto Mono'">Roboto Mono</span>`
            },
            {
                name: `'Noto Sans'`,
                title: html`<span style="font-family: 'Noto Sans'">Noto Sans</span>`
            }
        ]

        this.selectedFont = this.availableFonts[0]
    }

    _getSelectedOption() {
        if (utils.isString(this.selectedFont)) {
            return this.availableFonts.find(font => font.name == this.selectedFont)
        } 

        return this.selectedFont
    }

    handleFontFamilyChange(e) {
        console.log("CHANGE", e)

        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: e.detail.name
            }
        }));
    }
}
customElements.define('font-editor', FontEditor);
