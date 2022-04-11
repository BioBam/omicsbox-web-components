export function getBatikSVG(chartObject, hasLegend = false) {
    // let svgData = chartObject.getZr().painter.getSvgDom().parentElement.innerHTML;
    let svgNode = chartObject.getZr().painter.getSvgDom().cloneNode(true);
    let rgbaRegex = /rgba\((.*),([0-9]+)\)/;
    let rgbaAttributes = ['fill', 'stroke']

    // Needed for graphic element
    svgNode.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink")

    svgNode.querySelectorAll('*').forEach(function (svgEl) {
        // Error: The attribute "stroke-dasharray" represents an invalid CSS value ("")
        if (svgEl.hasAttribute("stroke-dasharray") && svgEl.getAttribute("stroke-dasharray") == "") {
            svgEl.removeAttribute("stroke-dasharray")
        }

        if (svgEl.nodeName == 'text' && svgEl.hasAttribute("stroke")) {
            // Remove stroke from text elements
            svgEl.removeAttribute("stroke");
        }

        // Error: The attribute "fill" represents an invalid CSS value ("rgba(230,57,0,1)").
        rgbaAttributes.map(attr => {
            if (svgEl.hasAttribute(attr)) {
                let fillParams = svgEl.getAttribute(attr).match(rgbaRegex)

                if (fillParams != null) {
                    // Replace with rgb(X,X,X) and fill-opacity
                    svgEl.setAttribute(attr, `rgb(${fillParams[1]})`);

                    // if (!svgEl.hasAttribute("fill-opacity")) {
                    svgEl.setAttribute(`${attr}-opacity`, fillParams[2]);
                    // }
                }
            }
        })

        // Error: The attribute "fill-opacity" represents an invalid CSS value ("undefined").
        if (svgEl.getAttribute("fill-opacity") == "undefined") {
            svgEl.removeAttribute("fill-opacity");
        }

        // Remove "clip-path" from text elements (scrolled legend text does not show)
        // if (svgEl.tagName == "text" && svgEl.hasAttribute("clip-path")) {
        //     svgEl.removeAttribute("clip-path")
        // }
    });

    if (hasLegend) {
        const textEls = svgNode.querySelectorAll('text')
        const totalHeight = parseFloat(svgNode.getAttribute('height'))

        textEls.forEach(textEl => {
            let currentTransform = textEl.getAttribute("transform")
            let paramsMatch = /matrix\(.*,([\-0-9\.]+),([\-0-9\.]+)\)/gm.exec(currentTransform);

            // We have no way to differentiate the text elements from the legend from others aside from 
            // assuming that the legend will always be on the bottom part of the chart.
            if (paramsMatch != null) {
                let yTransform = parseFloat(paramsMatch[2])

                if (yTransform > totalHeight - 25) {
                    let textTspan = textEl.children[0] || textEl
                    let currentCoordinateY = parseInt(textTspan.getAttribute('y')),
                        currentCoordinateX = parseInt(textTspan.getAttribute('x'))

                    textTspan.setAttribute('y', currentCoordinateY + 4)
                }
            }
        })
    }

    return svgNode.outerHTML;
}