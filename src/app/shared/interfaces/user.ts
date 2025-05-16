export interface User {
    id: string;
    username: string;
    description?: string;
    avatarUrl?: string;
}


export interface SavedRouteInDb {
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

export interface LoadedRoute {
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