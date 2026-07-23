export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
    id?: string;
    vehicle_id: string;
    user_id?: string;
    rating: number;
    title?: string;
    content?: string;
    pros?: string[];
    cons?: string[];
    status: ReviewStatus;
    helpful_count?: number;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
}
