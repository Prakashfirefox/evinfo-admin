// src/pages/banners/types/banner.ts
export interface Banner {
    id?: number;
    title: string;
    slug: string;
    image_url: string;
    redirect_url: string;
    position: BannerPosition;
    priority: number;
    start_date: string;
    end_date: string;
    status: BannerStatus;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    is_deleted?: boolean;
}

export type BannerPosition = 
    | 'HOME_TOP' 
    | 'HOME_MIDDLE' 
    | 'HOME_BOTTOM' 
    | 'CATEGORY_TOP' 
    | 'PRODUCT_DETAIL'
    | 'CHECKOUT_TOP'
    | 'POPUP';

export type BannerStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

export interface BannerResponse {
    status: boolean;
    data: {
        data: Banner[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            page: number;
        };
    };
    message: string;
}