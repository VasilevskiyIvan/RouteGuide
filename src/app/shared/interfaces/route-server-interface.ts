export interface SaveRoute {
    id?: string;
    userId: string;
    createdAt: Date;

    startAddress: string;
    endAddress: string;
    mode: string;

    routesJson: string | null;
    waypointsJson: string | null;

    duration?: number;
    distance?: number;
}

export interface LoadRoute {
    id?: string;
    userId: string;
    createdAt: Date;

    startAddress: string;
    endAddress: string;
    mode: string;

    routes: any[] | null;
    waypoints: any[] | null;

    duration?: number;
    distance?: number;
}