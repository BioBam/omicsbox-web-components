import { LitElement, html, css } from '../node_modules/lit/index.js';
// import './fa-icon.js';

class ThemeSelector extends LitElement {
    static get styles() {
        return [css`
        
        :host {
            display: flex;
            position: relative;
            box-sizing: border-box;
            cursor: pointer;
            justify-content: space-around;
            align-items: center;
            width: 100%;
        }

        div {
            width: 30px;
            height: 30px;
            line-height: 30px;
            color: transparent;
            /*margin: 0 15px;*/
            box-sizing: border-box;
        }

        div span {
            visibility: hidden;
            position: absolute;
            width: 50px;
            transform: translateX(-10px);
            text-align: center;
            font-size: 13px;
        }

        div:hover span {
            color: #555;
            /*border: 1px solid #555;*/
            background-color: rgba(255, 255, 255, 0.4);
            /*text-shadow: 2px 2px #ffffff;*/
            font-weight: bold;
            visibility: visible;

            /*-webkit-text-fill-color: #555;
            -webkit-text-stroke-width: 1px;
            -webkit-text-stroke-color: white;*/
        }

        .default {
            background: linear-gradient(135deg, #de7e7b 0%, #c23531 50%, #2f4554 51%, #547b95 100%);
        }

        .light {
            background: linear-gradient(135deg, #8dcaea 0%, #37A2DA 50%, #ffd85c 51%, #fff0c2 100%);
        }

        .dark {
            background: linear-gradient(135deg, #f0bcb9 0%, #dd6b66 50%, #759aa0 51%, #b1c6ca 100%);
        }
        `]
    }
    constructor() {
        super()
    }
    render() {
        //return html`<fa-icon g="regular" n="${this.checked ? `check-square` : `square`}" @click="${this._handleClick}"></fa-icon> ${this.label}`
        return html`
            <div class="default" @click="${this.handleThemeClick}"><span>Default</span></div>
            <div class="light"  @click="${this.handleThemeClick}"><span>Light</span></div>
            <div class="dark" @click="${this.handleThemeClick}"><span>Dark</span></div>
        `
    }

    handleThemeClick(e) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                theme: e.path[1].getAttribute('class') || "default"
            }
        }));
    }
}
customElements.define('theme-selector', ThemeSelector);