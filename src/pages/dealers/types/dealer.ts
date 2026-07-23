export type DealerStatus = "active" | "inactive" | "closed";
export type DealerService =
    | "sales" | "service" | "parts" | "financing" | "insurance"
    | "test-drive" | "home-delivery" | "charging-installation"
    | "maintenance" | "repair" | "body-shop" | "rental";

export interface Dealer {
    id?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;
    brands?: string[];
    services?: string[];
    rating?: number;
    status: DealerStatus;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
}
