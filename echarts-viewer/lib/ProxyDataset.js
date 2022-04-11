import { ChartDataset } from "./ChartDataset.js";
import { ChartGraphDataset } from "./ChartGraphDataset.js";
import { Chart3DDataset } from "./Chart3DDataset.js";
import { ChartAsymmetricDataset } from "./ChartAsymmetricDataset.js";

// Based on https://stackoverflow.com/questions/38364065/is-it-possible-to-change-a-proxys-target
export class ProxyDataset {
    static handler = {
        get(target, prop, receiver) {
            // Getter for static properties
            if (prop == 'properties') {
                return target.properties;
            }

            // Other values
            let targetValue = Reflect.get(target.content, prop);

            if (typeof (targetValue) == "function") {
                return targetValue.bind(target.content);
            }
            return targetValue;
        },
        set(target, prop, val, receiver) {
            // Update the dataset object.
            if (prop == 'dataset') {
                target.content = val;
            } else {
                return Reflect.set(target.content, prop, val, receiver);
            }
        }
    };

    static createProxy(wsRequest) {
        let container = { content: new ChartDataset(wsRequest), properties: ChartDataset.properties }

        return new Proxy(container, ProxyDataset.handler)
    }

    static createDatasetProxy(type, wsRequest) {
        let container = { content: ProxyDataset.createDataset(type, wsRequest), properties: ProxyDataset.getTypeProperties(type) }

        return new Proxy(container, ProxyDataset.handler)
    }

    static createDataset(type, wsRequest) {
        let proxyCreator = {
            'ChartDataset': ChartDataset,
            'ChartGraphDataset': ChartGraphDataset,
            'Chart3DDataset': Chart3DDataset,
            'ChartAsymmetricDataset': ChartAsymmetricDataset
        }

        return new proxyCreator[type](wsRequest)
    }

    static getTypeProperties(type) {
        let proxyProperties = {
            'ChartDataset': ChartDataset.properties,
            'ChartGraphDataset': ChartGraphDataset.properties,
            'Chart3DDataset': Chart3DDataset.properties,
            'ChartAsymmetricDataset': ChartAsymmetricDataset.properties
        }

        return proxyProperties[type];
    }
}