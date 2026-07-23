export type VariantStatus = "active" | "discontinued" | "upcoming";

export interface VariantColor {
    id: string;
    name: string;
    code: string;        // hex, maps to hex_code
    image?: string;      // maps to image_url
    price?: number;      // maps to price_delta
    type?: string;
    isAvailable?: boolean;
}

export interface Variant {
    id?: string;
    name: string;
    slug: string;
    model_id: string;
    trim?: string;
    launch_year?: number;
    production_status?: string;
    segment?: string;
    colors?: VariantColor[];
    status: VariantStatus;
    created_at?: string;
    created_by?: string;
    updated_by?: string;
    model?: any;
    _count?: any;
    updated_at?: string;
    is_deleted?: boolean;
}
