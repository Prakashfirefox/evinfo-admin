export type VehicleModelStatus = "active" | "discontinued" | "upcoming";

export interface ModelTimelineEvent {
    year: number;
    event: string;
    description?: string;
}

export interface VehicleModel {
    id?: string;
    name: string;
    slug: string;
    brand_id: string;
    generation?: string;
    body_type?: string;
    production_years?: string;
    platform?: string;
    timeline?: ModelTimelineEvent[];
    status: VehicleModelStatus;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
    bodyType?:string;
    productionYears?: string;
    created_by?: string;
    updated_by?: string;
    brand? : any;
    _count?: any;
}
