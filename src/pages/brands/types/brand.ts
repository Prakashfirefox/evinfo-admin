export type BrandStatus = "active" | "inactive" | "archived";

export interface Brand {
    id?: string;
    name: string;
    slug: string;
    logo?: string;
    country?: string;
    founded?: number;
    description?: string;
    website?: string;
    status: BrandStatus;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
    created_by?:string;
    updated_by?: string;
    _count?: string;
}
