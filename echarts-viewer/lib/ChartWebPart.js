import { html, LitElement } from "../node_modules/lit/index.js";
import { WebViewerMixin } from "../node_modules/web-libraries/sidebar/webViewer-mixin.js";
import "./ChartViewer.js";
import "./ChartViewerSidebar.js";
import { WebSocketRequest } from "./websocket-request.js";

// We need to make a global reference to this function to make it
// compatible with old viewers that still use echarts 4 with
// individual modules. Once all of them transition to the new echarts 5,
// we can safely remove this by changing the mixins.
window.parsePlainText = echarts.format.parsePlainText;

export class ChartWebPart extends WebViewerMixin(LitElement) {
  constructor(wsRequest, jsonMsg) {
    super();

    var uri = URI();
    var modelId = uri.segment(0);
    var host = uri.domain() == "" ? uri.hostname() : uri.domain();

    // if (isNaN(parseInt(modelId))) {
    //   console.log(
    //     "No model ID found for: ws://" + host + ":" + uri.port() + "/model/"
    //   );
    // } else {
    // var wsURL = 'ws://' + host + ':' + uri.port() + '/model/' + modelId

    /*
                TODO: the idea is to initialize the websockerrequest via postMessage, if required.
                This is hardcoded for now for quick testing, and the URL should point to our local
                server containing the mockup json data.
            */
    let wsUrl = "https://d2crafnhauomq1.cloudfront.net/rest_data";

    this.webSocketRequest = new WebSocketRequest({
      url: wsUrl,
      serverCallback: (msg) => {
        console.log("Default WS callback.");
      },
    });
    // }
  }

  renderSidebarEl() {
    return html`<chart-viewer-sidebar></chart-viewer-sidebar>`;
  }

  renderWebpartEl() {
    // For some reason echarts gl cannot handle some events when it is rendered inside a shadow DOM,
    // and inserting it like "light DOM" does not work either.
    // The only way that seems to solve the issue is to create the element in the root (html) and
    // perform a "reflected light DOM" using slots, which, for some reason, do not have methods
    // to "programatically" manage them, other than events and change slot names, so we had to redo
    // everything to be able to use these cute but sometimes horrible semantic templates.
    return html`<chart-viewer .wsRequest="${this.webSocketRequest}"
      ><slot></slot
    ></chart-viewer>`;
  }

  firstUpdated() {
    this.webpartEl = this.shadowRoot.querySelector("chart-viewer");
    this.sidebarEl = this.shadowRoot.querySelector("chart-viewer-sidebar");

    // Connect listeners
    this.setWebpartEl(this.webpartEl);
    this.setSidebarEl(this.sidebarEl);

    // 'Templates' call the elements constructor without arguments, so to keep
    // compatibility with the old system and make it work with the forced 'slot'
    // way because of echarts gl, we need to initialize the sidebar at this point.
    let viewerReadyCB = () => {
      this.sidebarEl.init({
        viewer: this.webpartEl,
        modules: this.webpartEl.params.getSidebarModules(),
      });

      this.webpartEl.removeEventListener("ready", viewerReadyCB);
    };

    // The async petition of 'info' by the viewer is called in the
    // connectedCallback step, which is followed by this firstUpdated.
    // Presumably the call will be put in the macrotask queue, whereas this
    // and the event handlers should be at the microtask, so should be
    // set BEFORE the info petition is sent to the server.
    this.webpartEl.addEventListener("ready", viewerReadyCB);
  }

  render() {
    return this.renderWebPart();
  }
}

customElements.define("chart-web-part", ChartWebPart);
