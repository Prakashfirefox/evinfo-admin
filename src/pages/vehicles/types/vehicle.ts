export type VehicleStatus = "active" | "discontinued" | "upcoming";
export type FuelType = "Petrol" | "Diesel" | "EV" | "Hybrid" | "CNG" | "PHEV";
export type Transmission = "Manual" | "Automatic" | "CVT" | "AMT" | "DCT";
export type Drivetrain = "FWD" | "RWD" | "AWD" | "4WD" | "4x4";

// Matches the API's ownership object (sub_variant.validations.ts)
export interface ApiOwnership {
    warranty?: string;
    battery_warranty?: string;
    service_interval?: string;
    maintenance_cost?: string;
    roadside_assist?: boolean;
    service_centers?: number;
}

export interface ChargingSpecs {
    ac?: string;
    dc?: string;
    time10to80?: string;
    time0to100?: string;
    connector?: string;
    portLocation?: string;
}

export interface BatterySpecs {
    capacity?: string;
    type?: string;
    voltage?: string;
    range?: string;
    rangeCity?: string;
    rangeHighway?: string;
    efficiency?: string;
    charging?: ChargingSpecs;
}

export interface PerformanceSpecs {
    acceleration?: string;
    topSpeed?: string;
    power?: string;
    torque?: string;
    drivetrain?: string;
    transmission?: string;
    tractionControl?: boolean;
    launchControl?: boolean;
}

export interface DimensionSpecs {
    length?: string;
    width?: string;
    height?: string;
    wheelbase?: string;
    groundClearance?: string;
    weight?: string;
    weightDistribution?: string;
    turningRadius?: string;
}

export interface InteriorSpecs {
    seating?: string;
    seatingMaterial?: string;
    upholstery?: string;
    dashboard?: string;
    infotainment?: string;
    instrumentCluster?: string;
    headroomFront?: string;
    headroomRear?: string;
    legroomFront?: string;
    legroomRear?: string;
    cargo?: string;
    cargoMax?: string;
}

export interface SafetySpecs {
    rating?: string;
    airbags?: number;
    abs?: boolean;
    esc?: boolean;
    tcs?: boolean;
    blindSpot?: boolean;
    laneAssist?: boolean;
    adaptiveCruise?: boolean;
    parkingSensors?: boolean;
    camera360?: boolean;
    autonomousLevel?: string;
}

export interface WheelSpecs {
    front?: string;
    rear?: string;
    type?: string;
    spare?: string;
    pressureMonitoring?: boolean;
}

export interface FeatureSpecs {
    exterior?: string[];
    interior?: string[];
    comfort?: string[];
    entertainment?: string[];
    connectivity?: string[];
    convenience?: string[];
}

export interface VehicleSpecifications {
    performance?: PerformanceSpecs;
    battery?: BatterySpecs;
    dimensions?: DimensionSpecs;
    interior?: InteriorSpecs;
    safety?: SafetySpecs;
    wheels?: WheelSpecs;
    features?: FeatureSpecs;
}

export interface VehicleColor {
    id: string;
    name: string;
    code: string;
    image?: string;
    price?: number;
    type?: string;
    isAvailable?: boolean;
}

export interface FinancingInfo {
    emi?: string;
    downPayment?: string;
    tenure?: string;
    interest?: number;
}

export interface VehiclePricing {
    basePrice?: number;
    onRoadPrice?: number;
    insurance?: number;
    registration?: number;
    tax?: number;
    financing?: FinancingInfo;
}

export interface VehicleImages {
    exterior?: string[];
    interior?: string[];
    gallery?: string[];
    colors?: string[];
    details?: string[];
}

export interface VehicleRatings {
    overall?: number;
    performance?: number;
    comfort?: number;
    features?: number;
    safety?: number;
    value?: number;
    userRating?: number;
    expertRating?: number;
    reviewCount?: number;
}

export interface TimelineEvent {
    year: number;
    event: string;
    description?: string;
}

export interface OwnershipInfo {
    warranty?: string;
    service?: string;
    maintenance?: string;
    batteryWarranty?: string;
    roadside?: boolean;
    serviceCenters?: number;
}

export interface Vehicle {
    id?: string;
    name: string;
    slug: string;

    // Cascading parent IDs — only variant_id is sent to the API; brand_id/model_id are UI-only
    brand_id: string;
    model_id: string;
    variant_id: string;

    // Top-level powertrain fields — REQUIRED by the SubVariant API
    fuel_type: FuelType | "";
    transmission: Transmission | "";
    drivetrain?: Drivetrain | "";
    engine?: string;

    // After-sales info — uses the API's snake_case shape
    api_ownership?: ApiOwnership;

    status: VehicleStatus;
    featured?: boolean;
    view_count?: number;

    // Below: UI-only fields, kept for admin convenience but stripped before submit
    competitor_ids?: string[];
    specifications?: VehicleSpecifications;
    colors?: VehicleColor[];
    pricing?: VehiclePricing;
    images?: VehicleImages;
    ratings?: VehicleRatings;
    timeline?: TimelineEvent[];
    ownership?: OwnershipInfo;

    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
    created_by?: string;
    updated_by?: string;
    brand?: any;
    model?: any;
    variant?: any;
    _count?: any;
}
