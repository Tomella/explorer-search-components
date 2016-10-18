declare module Searches {

    export interface ISearchMapService {
        goTo(polygon: GeoJSON.Polygon): void;
    }

    export interface ISearchPerformed {
        from: string;
        type: string;
        name: any;
        pan(): void;
        url?: string;
        data?: GeoJSON.Feature;
        show?: boolean;
        polygon?: GeoJSON.Polygon;
    }

}
