import { LitElement, html, css } from '../node_modules/lit/index.js';
import '../node_modules/web-libraries/sidebar/input-text.js'


class InputSymbolEditor extends LitElement {
    static get styles() {
        return [css`
            :host {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                position: relative;
                box-sizing: border-box;
                cursor: pointer;
                user-select: none;
            }

            /* input-button does not seems to support slots,
            rather than modify it (it is used in every place) we create
            our own custom version here */
            div.input-button {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                position: relative;
                box-sizing: border-box;
                cursor: pointer;
                user-select: none;
                background-color: var(--input-button-back-color);
                border: 1px solid var(--input-border-color);
                height: 23px;
                width: 23px;
                line-height:100%;
                /*padding: 0 0.5em;*/
                transition: background-color 0.15s;
                overflow: hidden;
           }

            input-button {
                height: 23px;
                width: 23px;
                padding: 0;
            }

            #symbolbox:focus {
                outline: 0;
            }

            #symbolbox {
                box-sizing: border-box;
                float: left;
                cursor: pointer;
                padding: 0;
            }

            #symbolbox:focus + div#symbollist {
                display: block;
                opacity: 1;
            }

            div#symbollist {
                box-sizing: border-box;
                position: fixed;
                z-index: 1000000;
                display: none;
                opacity: 0;
                padding: 5px;
                width: 200px;
                margin: 0;
                top: 0px;
                left: 0px;
                background: white;
                list-style: none;
                text-transform: none;
                transition: opacity 0.1s, visibility 0.1s;
                box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.2);
                padding: 5px;
            }

            div#symbollist > input-button {
                width: 20px;
                height: 20px;
            }

            div#symbollist > div:first {
                box-sizing: border-box;
                display: flex;
                width: 100%;
                margin: 0px;
                justify-content: space-around;
                align-items: center;
                flex-wrap: wrap;
            }

            span.rect {
                width: 16px;
                height: 16px;
                background-color: black;
            }

            span.roundRect {
                width: 16px;
                height: 16px;
                background-color: black;
                border-radius: 35%; 
            }

            span.triangle {
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 16px solid #000;
            }

            span.diamond {
                width: 16px;
                height: 16px;
                background-color: black;
                transform: rotate(-45deg);
            }

            span.none {
                line-height: 16px;
                width: 16px;
                height: 16px;
                text-align: center;
                margin: 0 auto;
            }

            span.unicode {
                width: 16px;
                height: 16px;
            }

            span.unicodeTriangle:before {
                content: '△';
                width: 16px;
                height: 16px
            }

            span.text {
                font-size: 23px;
                color: black;
            }

            span.arrow:before {
                content: '⮝'
            }

            /*span.triangle:before {
                content: '▲'
            }*/

        `]
    }
    render() {
        return html`
            <div class="input-button" tabindex="0" id="symbolbox" @focus="${this.handleSymbolBoxClick}" @mousedown="${this.handleSymbolBoxClick}">${this.symbolTable[this.symbol].icon}</div>
            ${this.selectable ? html`
            <div id="symbollist">
                <div>
                ${Object.keys(this.symbolTable).map(symbolId => html`
                    <div class="input-button" @mousedown="${e => this.handleSymbolClick(symbolId)}">${this.symbolTable[symbolId].icon}</div>
                `)}
                </div>
            </div>` : ``}
        `
    }
    static get properties() {
        return {
            symbol: {
                type: String,
                reflect: true
            },
            symbolSize: {
                type: Number,
                reflect: true
            },
            selectable: {
                type: Boolean
            }
        };
    }
    constructor() {
        super();
        this.selectable = true
        this.symbolTable = this._getSymbols()
        this.symbol = null
        this.symbolSize = null
    }

    firstUpdated() {
        this._updatePosition();
    }

    _updatePosition() {
        if (this.selectable) {
            let symbollist = this.renderRoot.querySelector('#symbollist')
            var boxRect = this.getBoundingClientRect();
            var listRect = symbollist.getBoundingClientRect();
            var leftDiff = listRect.width - (window.innerWidth - boxRect.left);
            var botDiff = listRect.height - (window.innerHeight - boxRect.bottom);
            if (leftDiff > 0) {
                symbollist.style.left = (boxRect.left - listRect.width + 20) + 'px';
            } else {
                symbollist.style.left = (boxRect.left) + 'px';
            }
            if (botDiff > 0) {
                symbollist.style.top = (boxRect.top - listRect.height) + "px";
            } else {
                symbollist.style.top = (boxRect.top + 25) + "px";
            }
        }
    }

    // handleSymbolSizeChange(e) {
    //     this.dispatchEvent(new CustomEvent('symbolchange', { bubbles: true, composed: true, detail: { symbolSize: this.symbolSize } }));
    // }


    handleSymbolClick(symbolId) {
        this.symbol = symbolId;
        this.dispatchEvent(new CustomEvent('symbolchange', { bubbles: true, composed: true, detail: { symbol: this.symbol } }));
    }

    handleSymbolBoxClick(e) {
        this._updatePosition();
    }

    _getSymbols() {
        return {
            'circle': {
                name: 'Circle',
                //icon: '○'
                icon: html`<span style="width: 16px; height: 16px; border-radius: 50%; background-color: black"></span>`
            },
            'rect': {
                name: 'Rect',
                // icon: '□'
                icon: html`<span class="rect"></span>`
            },
            'roundRect': {
                name: 'Round Rect',
                // icon: '▢'
                icon: html`<span class="roundRect"></span>`
            },
            'triangle': {
                name: 'Triangle',
                // icon: '△',
                icon: html`<span class="triangle"></span>`
            },
            'diamond': {
                name: 'Diamond',
                // icon: '◇'
                icon: html`<span class="diamond"></span>`
            },
            'arrow': {
                name: 'Arrow',
                // icon: '⮝'
                icon: html`<span class="text arrow"></span>`
            },
            'none': {
                name: 'None',
                // icon: '--'
                icon: html`<span class="text">--</span>`
            },

        }
    }
}

customElements.define('input-symbol-editor', InputSymbolEditor);
