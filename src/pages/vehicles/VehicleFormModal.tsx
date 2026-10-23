import React, { useEffect, useRef, useState } from "react";
import { Offcanvas, Button, Form, Row, Col, Badge, Spinner } from "react-bootstrap";
import {
    Vehicle, VehicleStatus,
    FuelType, Transmission, Drivetrain, ApiOwnership,
    VehicleSpecifications, VehiclePricing,
} from "./types/vehicle";
import { toast } from "react-toastify";
import { getAllBrands, getAllModels, getAllVariants } from "../../service/common.service";

interface DropdownItem { id?: string; name: string; }

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Vehicle) => void;
    initialData?: Vehicle | null;
    /** Edit mode only: save a single section independently. */
    onSectionSave?: (section: string, form: any) => Promise<{ ok: boolean; pricingId?: string }>;
}

// Section keys aligned 1:1 with the `steps` array below.
const SECTION_KEYS = [
    "basic", "performance", "battery", "dimensions",
    "safety", "features", "pricing", "ownership", "settings",
] as const;

const defaultForm: Vehicle = {
    name: "", slug: "", brand_id: "", model_id: "", variant_id: "",
    fuel_type: "", transmission: "", drivetrain: "", engine: "",
    api_ownership: { warranty: "", battery_warranty: "", service_interval: "", maintenance_cost: "", roadside_assist: false, service_centers: undefined },
    status: "active", featured: false, competitor_ids: [],
    specifications: {
        performance: { acceleration: "", topSpeed: "", power: "", torque: "", drivetrain: "", transmission: "", tractionControl: false, launchControl: false },
        battery: { capacity: "", type: "", voltage: "", range: "", rangeCity: "", rangeHighway: "", efficiency: "", charging: { ac: "", dc: "", time10to80: "", time0to100: "", connector: "", portLocation: "" } },
        dimensions: { length: "", width: "", height: "", wheelbase: "", groundClearance: "", weight: "", weightDistribution: "", turningRadius: "" },
        interior: { seating: "", seatingMaterial: "", upholstery: "", dashboard: "", infotainment: "", instrumentCluster: "", headroomFront: "", headroomRear: "", legroomFront: "", legroomRear: "", cargo: "", cargoMax: "" },
        safety: { rating: "", abs: false, esc: false, tcs: false, blindSpot: false, laneAssist: false, adaptiveCruise: false, parkingSensors: false, camera360: false, autonomousLevel: "" },
        wheels: { front: "", rear: "", type: "", spare: "", pressureMonitoring: false },
        features: { exterior: [], interior: [], comfort: [], entertainment: [], connectivity: [], convenience: [] },
    },
    colors: [],
    pricing: { basePrice: undefined, onRoadPrice: undefined, insurance: undefined, registration: undefined, tax: undefined, financing: { emi: "", downPayment: "", tenure: "", interest: undefined } },
    images: { exterior: [], interior: [], gallery: [], colors: [], details: [] },
    ratings: { overall: undefined, performance: undefined, comfort: undefined, features: undefined, safety: undefined, value: undefined, userRating: undefined, expertRating: undefined, reviewCount: 0 },
    timeline: [],
    ownership: { warranty: "", service: "", maintenance: "", batteryWarranty: "", roadside: false, serviceCenters: undefined },
};

const statusOptions: VehicleStatus[] = ["active", "discontinued", "upcoming"];
const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "EV", "Hybrid", "CNG", "PHEV"];
const TRANSMISSIONS: Transmission[] = ["Manual", "Automatic", "CVT", "AMT", "DCT"];
const DRIVETRAINS: Drivetrain[] = ["FWD", "RWD", "AWD", "4WD", "4x4"];

const statusBg = (s: string) => s === "active" ? "success" : s === "upcoming" ? "warning" : "danger";

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div style={{ borderLeft: "3px solid #0d6efd", paddingLeft: 12, marginBottom: 24 }}>
        <h5 style={{ fontWeight: 700, fontSize: 16, color: "#212529", marginBottom: 2 }}>{title}</h5>
        <p style={{ fontSize: 12, color: "#6c757d", marginBottom: 0 }}>{subtitle}</p>
    </div>
);

const Divider = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
        <div style={{ height: 1, flex: 1, background: "#dee2e6" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</span>
        <div style={{ height: 1, flex: 1, background: "#dee2e6" }} />
    </div>
);

const VehicleFormModal: React.FC<Props> = ({ show, onHide, onSubmit, initialData, onSectionSave }) => {
    const [form, setForm] = useState<Vehicle>(defaultForm);
    const [activeSection, setActiveSection] = useState(0);
    const [brands, setBrands] = useState<DropdownItem[]>([]);
    const [models, setModels] = useState<DropdownItem[]>([]);
    const [variants, setVariants] = useState<DropdownItem[]>([]);

    // Per-section edit state (edit mode only)
    const isEdit = !!initialData;
    const [savingSection, setSavingSection] = useState<number | null>(null);
    const [pricingId, setPricingId] = useState<string | null>(null);
    const savedSnapshots = useRef<string[]>([]);   // JSON per section as last saved
    const [, bumpSnap] = useState(0);              // force re-render after ref update

    // Slice the form down to just the data a given section owns — used for
    // dirty-tracking (compare against the last-saved snapshot).
    const sliceForSection = (f: Vehicle, i: number): any => {
        const s: any = f.specifications || {};
        switch (i) {
            case 0: return { name: f.name, slug: f.slug, variant_id: f.variant_id, fuel_type: f.fuel_type, transmission: f.transmission, engine: f.engine, drivetrain: f.drivetrain };
            case 1: return s.performance ?? {};
            case 2: return s.battery ?? {};
            case 3: return { dimensions: s.dimensions ?? {}, interior: s.interior ?? {} };
            case 4: return { safety: s.safety ?? {}, wheels: s.wheels ?? {} };
            case 5: return s.features ?? {};
            case 6: return f.pricing ?? {};
            case 7: return f.api_ownership ?? {};
            case 8: return { status: f.status, featured: f.featured, competitor_ids: f.competitor_ids };
            default: return {};
        }
    };

    const isDirty = (i: number) => savedSnapshots.current[i] !== JSON.stringify(sliceForSection(form, i));

    const [featureInputs, setFeatureInputs] = useState<Record<string, string>>({ exterior: "", interior: "", comfort: "", entertainment: "", connectivity: "", convenience: "" });
    const [competitorInput, setCompetitorInput] = useState("");

    useEffect(() => {
        if (initialData) {
            const { id, created_at, updated_at, is_deleted, created_by, updated_by, brand, model, variant, _count, ownership, specs, pricing, gallery, reviews, ...clean } = initialData as any;

            const derived_brand_id = brand?.id || variant?.model?.brand?.id || variant?.model?.brand_id || (clean as any).brand_id || "";
            const derived_model_id = model?.id || variant?.model?.id || variant?.model_id || (clean as any).model_id || "";
            const derived_variant_id = variant?.id || (clean as any).variant_id || "";
            // featured + competitor_ids live on the parent Variant — load them so the
            // Settings section shows the real values and dirty-tracking is accurate.
            const derived_featured = (variant as any)?.featured ?? (clean as any).featured ?? false;
            const derived_competitor_ids = (variant as any)?.competitor_ids ?? (clean as any).competitor_ids ?? [];

            const api_ownership: ApiOwnership = ownership && typeof ownership === "object"
                ? {
                    warranty: ownership.warranty ?? "",
                    battery_warranty: ownership.battery_warranty ?? ownership.batteryWarranty ?? "",
                    service_interval: ownership.service_interval ?? ownership.service ?? "",
                    maintenance_cost: ownership.maintenance_cost ?? ownership.maintenance ?? "",
                    roadside_assist: ownership.roadside_assist ?? ownership.roadside ?? false,
                    service_centers: ownership.service_centers ?? ownership.serviceCenters,
                }
                : (defaultForm.api_ownership as ApiOwnership);

            // Map specs[0] (snake_case) → form.specifications (camelCase)
            const s = (specs || [])[0] || {};
            const specifications: VehicleSpecifications = {
                performance: {
                    acceleration: s.performance?.acceleration,
                    topSpeed: s.performance?.top_speed,
                    power: s.performance?.power,
                    torque: s.performance?.torque,
                    tractionControl: s.performance?.traction_control,
                    launchControl: s.performance?.launch_control,
                },
                battery: {
                    capacity: s.battery?.capacity,
                    type: s.battery?.type,
                    voltage: s.battery?.voltage,
                    range: s.battery?.range,
                    rangeCity: s.battery?.range_city,
                    rangeHighway: s.battery?.range_highway,
                    efficiency: s.battery?.efficiency,
                    charging: {
                        ac: s.battery?.charging?.ac,
                        dc: s.battery?.charging?.dc,
                        time10to80: s.battery?.charging?.time_10to80,
                        time0to100: s.battery?.charging?.time_0to100,
                        connector: s.battery?.charging?.connector_type,
                        portLocation: s.battery?.charging?.port_location,
                    },
                },
                dimensions: {
                    length: s.dimensions?.length,
                    width: s.dimensions?.width,
                    height: s.dimensions?.height,
                    wheelbase: s.dimensions?.wheelbase,
                    groundClearance: s.dimensions?.ground_clearance,
                    weight: s.dimensions?.kerb_weight,
                    weightDistribution: s.dimensions?.weight_distribution,
                    turningRadius: s.dimensions?.turning_radius,
                },
                interior: {
                    seating: s.interior?.seating != null ? String(s.interior.seating) : "",
                    seatingMaterial: s.interior?.seating_material,
                    upholstery: s.interior?.upholstery,
                    dashboard: s.interior?.dashboard,
                    infotainment: s.interior?.infotainment,
                    instrumentCluster: s.interior?.instrument_cluster,
                    headroomFront: s.interior?.headroom_front,
                    headroomRear: s.interior?.headroom_rear,
                    legroomFront: s.interior?.legroom_front,
                    legroomRear: s.interior?.legroom_rear,
                    cargo: s.interior?.cargo_volume || s.interior?.boot_space,
                    cargoMax: s.interior?.cargo_max,
                },
                safety: {
                    rating: s.safety?.ncap_rating,
                    airbags: s.safety?.airbags,
                    abs: s.safety?.abs,
                    esc: s.safety?.esc,
                    tcs: s.safety?.tcs,
                    blindSpot: s.safety?.blind_spot,
                    laneAssist: s.safety?.lane_assist,
                    adaptiveCruise: s.safety?.adaptive_cruise,
                    parkingSensors: s.safety?.parking_sensors != null ? !!s.safety.parking_sensors : false,
                    camera360: s.safety?.camera_360,
                    autonomousLevel: s.safety?.autonomous_level,
                },
                wheels: {
                    front: s.wheels?.front,
                    rear: s.wheels?.rear,
                    type: s.wheels?.wheel_type,
                    spare: s.wheels?.spare,
                    pressureMonitoring: s.wheels?.pressure_monitoring,
                },
                features: {
                    exterior: s.features?.exterior || [],
                    interior: s.features?.interior || [],
                    comfort: s.features?.comfort || [],
                    entertainment: s.features?.entertainment || [],
                    connectivity: s.features?.connectivity || [],
                    convenience: s.features?.convenience || [],
                },
            };

            // Map pricing[0] (snake_case) → form.pricing (camelCase)
            const p = (pricing || [])[0] || {};
            const vehiclePricing: VehiclePricing = {
                basePrice: p.ex_showroom_price ?? undefined,
                onRoadPrice: p.on_road_price ?? undefined,
                insurance: p.insurance ?? undefined,
                registration: p.registration ?? undefined,
                tax: p.tcs_tax ?? undefined,
                financing: p.financing ? {
                    emi: p.financing.emi,
                    downPayment: p.financing.down_payment,
                    tenure: p.financing.tenure,
                    interest: p.financing.interest,
                } : defaultForm.pricing!.financing,
            };

            const newForm: Vehicle = {
                ...defaultForm,
                ...clean,
                brand_id: derived_brand_id,
                model_id: derived_model_id,
                variant_id: derived_variant_id,
                featured: derived_featured,
                competitor_ids: derived_competitor_ids,
                api_ownership,
                specifications,
                pricing: vehiclePricing,
            };
            setForm(newForm);
            setActiveSection(0);
            // Snapshot each section so edits can be dirty-tracked per section.
            savedSnapshots.current = SECTION_KEYS.map((_, i) => JSON.stringify(sliceForSection(newForm, i)));
            setPricingId((pricing || [])[0]?.id ?? null);
            bumpSnap(v => v + 1);
        } else {
            setForm(defaultForm);
            setActiveSection(0);
            savedSnapshots.current = [];
            setPricingId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, show]);

    useEffect(() => {
        if (!show) return;
        getAllBrands({ offset: 0, limit: 100 })
            .then((res: any) => setBrands(res?.data?.data?.rows ?? res?.data?.data ?? []))
            .catch(() => toast.error("Failed to load brands"));
    }, [show]);

    useEffect(() => {
        if (!form.brand_id) { setModels([]); return; }
        getAllModels({ offset: 0, limit: 100, brand_id: form.brand_id })
            .then((res: any) => setModels(res?.data?.data?.rows ?? res?.data?.data ?? []))
            .catch(() => toast.error("Failed to load models"));
    }, [form.brand_id]);

    useEffect(() => {
        if (!form.model_id) { setVariants([]); return; }
        getAllVariants({ offset: 0, limit: 100, model_id: form.model_id })
            .then((res: any) => setVariants(res?.data?.data?.rows ?? res?.data?.data ?? []))
            .catch(() => toast.error("Failed to load variants"));
    }, [form.model_id]);

    const updateField = (key: keyof Vehicle, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const updateSpec = (section: string, key: string, value: any) =>
        setForm(prev => ({
            ...prev,
            specifications: { ...prev.specifications, [section]: { ...(prev.specifications as any)?.[section], [key]: value } },
        }));

    const updateCharging = (key: string, value: any) =>
        setForm(prev => ({
            ...prev,
            specifications: {
                ...prev.specifications,
                battery: { ...prev.specifications?.battery, charging: { ...prev.specifications?.battery?.charging, [key]: value } },
            },
        }));

    const updatePricing = (key: string, value: any) =>
        setForm(prev => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));

    const updateFinancing = (key: string, value: any) =>
        setForm(prev => ({ ...prev, pricing: { ...prev.pricing, financing: { ...prev.pricing?.financing, [key]: value } } }));

    const updateRatings = (key: string, value: any) =>
        setForm(prev => ({ ...prev, ratings: { ...prev.ratings, [key]: value } }));

    const addFeatureTag = (cat: string) => {
        const val = featureInputs[cat].trim();
        if (!val) return;
        setForm(prev => ({
            ...prev,
            specifications: {
                ...prev.specifications,
                features: { ...prev.specifications?.features, [cat]: [...((prev.specifications?.features as any)?.[cat] || []), val] },
            },
        }));
        setFeatureInputs(prev => ({ ...prev, [cat]: "" }));
    };

    const removeFeatureTag = (cat: string, idx: number) =>
        setForm(prev => ({
            ...prev,
            specifications: {
                ...prev.specifications,
                features: { ...prev.specifications?.features, [cat]: ((prev.specifications?.features as any)?.[cat] || []).filter((_: any, i: number) => i !== idx) },
            },
        }));

    const addCompetitor = () => {
        const val = competitorInput.trim();
        if (!val || (form.competitor_ids || []).includes(val)) return;
        setForm(prev => ({ ...prev, competitor_ids: [...(prev.competitor_ids || []), val] }));
        setCompetitorInput("");
    };

    const removeCompetitor = (idx: number) =>
        setForm(prev => ({ ...prev, competitor_ids: (prev.competitor_ids || []).filter((_, i) => i !== idx) }));

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-").trim();

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error("Vehicle name is required"); return; }
        if (!form.slug.trim()) { toast.error("Slug is required"); return; }
        if (!form.brand_id) { toast.error("Brand is required"); return; }
        if (!form.model_id) { toast.error("Model is required"); return; }
        if (!form.variant_id) { toast.error("Variant is required"); return; }
        if (!form.fuel_type) { toast.error("Fuel type is required"); return; }
        if (!form.transmission) { toast.error("Transmission is required"); return; }

        const payload: any = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            variant_id: form.variant_id,
            fuel_type: form.fuel_type,
            transmission: form.transmission,
            status: form.status,
        };
        if (form.engine && form.engine.trim()) payload.engine = form.engine.trim();
        if (form.drivetrain) payload.drivetrain = form.drivetrain;

        const own = form.api_ownership;
        if (own && (own.warranty || own.battery_warranty || own.service_interval || own.maintenance_cost || own.roadside_assist || own.service_centers != null)) {
            payload.ownership = {
                ...(own.warranty ? { warranty: own.warranty } : {}),
                ...(own.battery_warranty ? { battery_warranty: own.battery_warranty } : {}),
                ...(own.service_interval ? { service_interval: own.service_interval } : {}),
                ...(own.maintenance_cost ? { maintenance_cost: own.maintenance_cost } : {}),
                ...(own.roadside_assist != null ? { roadside_assist: !!own.roadside_assist } : {}),
                ...(own.service_centers != null ? { service_centers: own.service_centers } : {}),
            };
        }

        // Pass specs + pricing alongside core payload so parent can call separate APIs
        payload._specifications = form.specifications;
        payload._pricing = form.pricing;
        payload._specId = (initialData as any)?.specs?.[0]?.id ?? null;
        payload._pricingId = (initialData as any)?.pricing?.[0]?.id ?? null;

        onSubmit(payload);
    };

    // Edit mode: persist just the active section via its own API call.
    const handleSectionSave = async (i: number) => {
        if (!onSectionSave) return;
        setSavingSection(i);
        const res = await onSectionSave(SECTION_KEYS[i], { ...form, _pricingId: pricingId });
        setSavingSection(null);
        if (res?.ok) {
            if (res.pricingId) setPricingId(res.pricingId);
            savedSnapshots.current[i] = JSON.stringify(sliceForSection(form, i));
            bumpSnap(v => v + 1);
        }
    };

    const updateApiOwnership = (key: keyof ApiOwnership, value: any) =>
        setForm(prev => ({ ...prev, api_ownership: { ...(prev.api_ownership || {}), [key]: value } }));

    const fillDummyData = () => {
        setForm(prev => ({
            ...prev,
            name: prev.name || "Tesla Model 3 Long Range AWD 2024",
            slug: prev.slug || "tesla-model-3-long-range-awd-2024",
            fuel_type: "EV",
            transmission: "Automatic",
            drivetrain: "AWD",
            engine: "Dual Motor Electric",
            specifications: {
                performance: {
                    acceleration: "4.4s (0-100 km/h)", topSpeed: "201 km/h",
                    power: "366 hp", torque: "493 Nm",
                    drivetrain: "AWD", transmission: "Single-Speed Automatic",
                    tractionControl: true, launchControl: true,
                },
                battery: {
                    capacity: "75 kWh", type: "Lithium-Ion (NMC)", voltage: "350V",
                    range: "629 km (WLTP)", rangeCity: "710 km", rangeHighway: "560 km",
                    efficiency: "14.3 kWh/100km",
                    charging: {
                        ac: "11 kW (3-phase)", dc: "170 kW (Supercharger)",
                        time10to80: "25 min", time0to100: "8.5 hrs",
                        connector: "CCS2 / Type 2", portLocation: "Rear Left",
                    },
                },
                dimensions: {
                    length: "4720 mm", width: "1921 mm", height: "1441 mm",
                    wheelbase: "2875 mm", groundClearance: "140 mm",
                    weight: "1830 kg", weightDistribution: "47:53 (F:R)", turningRadius: "5.8 m",
                },
                interior: {
                    seating: "5", seatingMaterial: "Vegan Leather", upholstery: "White / Black",
                    dashboard: 'Minimalist 15.4"', infotainment: '15.4" Touchscreen',
                    instrumentCluster: "Digital",
                    headroomFront: "993 mm", headroomRear: "930 mm",
                    legroomFront: "1041 mm", legroomRear: "972 mm",
                    cargo: "594 L", cargoMax: "682 L",
                },
                safety: {
                    rating: "5-Star Euro NCAP 2022", airbags: 8, autonomousLevel: "Level 2",
                    abs: true, esc: true, tcs: true, blindSpot: true,
                    laneAssist: true, adaptiveCruise: true, parkingSensors: true, camera360: true,
                },
                wheels: {
                    front: "235/45 R18", rear: "255/45 R18",
                    type: "Aero Alloy", spare: "Tyre Repair Kit", pressureMonitoring: true,
                },
                features: {
                    exterior: ["Panoramic Sunroof", "LED Headlights", "Flush Door Handles", '20" Aero Wheels'],
                    interior: ['15.4" Touchscreen', "Heated Front Seats", "Premium Audio"],
                    comfort: ["Auto Climate Control", "Heated Steering Wheel", "Power Adjustable Seats"],
                    entertainment: ["Wireless Apple CarPlay", "Android Auto", "Premium Audio System"],
                    connectivity: ["OTA Updates", "WiFi Hotspot", "Bluetooth 5.0"],
                    convenience: ["Keyless Entry", "Auto Parking", "Dog Mode"],
                },
            },
            pricing: {
                basePrice: 4299000, onRoadPrice: 4799000,
                insurance: 180000, registration: 120000, tax: 0,
                financing: { emi: "₹84,500/month", downPayment: "₹860,000", tenure: "60 months", interest: 8.5 },
            },
            ratings: {
                overall: 4.5, performance: 4.6, comfort: 4.4,
                features: 4.8, safety: 4.9, value: 4.2,
                userRating: 4.3, expertRating: 4.6, reviewCount: 0,
            },
            status: "active",
            featured: true,
            api_ownership: {
                warranty: "4 years / 80,000 km",
                battery_warranty: "8 years / 160,000 km",
                service_interval: "Annual service recommended",
                maintenance_cost: "Low cost approx. ₹5,000/year",
                roadside_assist: true,
                service_centers: 15,
            },
        }));
        toast.info("Demo data filled — select Brand → Model → Variant to complete");
    };

    const steps = [
        { label: "Basic & Powertrain" },
        { label: "Performance" },
        { label: "Battery" },
        { label: "Dimensions" },
        { label: "Safety & Wheels" },
        { label: "Features" },
        { label: "Pricing" },
        { label: "Ownership" },
        { label: "Settings" },
    ];

    const specs = form.specifications || {};
    const perf: any = specs.performance || {};
    const batt: any = specs.battery || {};
    const chrg: any = batt.charging || {};
    const dims: any = specs.dimensions || {};
    const intr: any = specs.interior || {};
    const safe: any = specs.safety || {};
    const whls: any = specs.wheels || {};
    const feat: any = specs.features || {};

    const TagRow = ({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) => (
        <div className="d-flex flex-wrap gap-1 mt-2">
            {items.map((item, i) => (
                <Badge key={i} bg="secondary" className="d-flex align-items-center gap-1 fw-normal">
                    {item}
                    <i className="bi bi-x" style={{ cursor: "pointer" }} onClick={() => onRemove(i)} />
                </Badge>
            ))}
        </div>
    );

    return (
        <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: 860 }}>
            <Offcanvas.Header
                closeButton
                style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", background: "#fff", alignItems: "flex-start" }}
            >
                <div>
                    <Offcanvas.Title style={{ fontWeight: 700, fontSize: 17, color: "#212529" }}>
                        {initialData ? "Edit Vehicle" : "Add New Vehicle"}
                    </Offcanvas.Title>
                    <div style={{ fontSize: 12, color: "#6c757d", marginTop: 3 }}>
                        Step {activeSection + 1} of {steps.length} ·{" "}
                        <span style={{ color: "#0d6efd", fontWeight: 500 }}>{steps[activeSection]?.label}</span>
                    </div>
                </div>
            </Offcanvas.Header>

            <Offcanvas.Body
                className="p-0 d-flex flex-column"
                style={{ overflow: "hidden" }}
            >
                {/* Progress bar */}
                <div style={{ height: 3, background: "#e9ecef", flexShrink: 0 }}>
                    <div style={{
                        height: "100%",
                        width: `${((activeSection + 1) / steps.length) * 100}%`,
                        background: "linear-gradient(90deg, #0d6efd, #0a58ca)",
                        transition: "width 0.25s ease",
                        borderRadius: "0 2px 2px 0",
                    }} />
                </div>

                <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
                    {/* Sidebar */}
                    <div style={{
                        width: 195, flexShrink: 0,
                        borderRight: "1px solid #e9ecef",
                        background: "#fafafa",
                        overflowY: "auto",
                        padding: "14px 10px",
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#adb5bd", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, paddingLeft: 4 }}>
                            STEPS
                        </div>
                        {steps.map((step, i) => {
                            const isActive = activeSection === i;
                            const isDone = i < activeSection;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActiveSection(i)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 9,
                                        width: "100%", textAlign: "left", border: "none",
                                        padding: "7px 10px", borderRadius: 7, marginBottom: 3,
                                        background: isActive ? "rgba(13,110,253,0.08)" : "transparent",
                                        borderLeft: `2px solid ${isActive ? "#0d6efd" : "transparent"}`,
                                        cursor: "pointer",
                                        color: isActive ? "#0d6efd" : isDone ? "#198754" : "#6c757d",
                                        fontWeight: isActive ? 600 : 400,
                                        fontSize: 12.5,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <div style={{
                                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700,
                                        background: isActive ? "#0d6efd" : isDone ? "#198754" : "#e9ecef",
                                        color: (isActive || isDone) ? "#fff" : "#6c757d",
                                    }}>
                                        {isDone ? "✓" : i + 1}
                                    </div>
                                    <span style={{ flex: 1 }}>{step.label}</span>
                                    {isEdit && isDirty(i) && (
                                        <span title="Unsaved changes" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                        <Form>

                            {/* ── 0: Basic & Powertrain ── */}
                            {activeSection === 0 && (
                                <div>
                                    <SectionTitle title="Basic Information" subtitle="Vehicle identity and hierarchy" />
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Vehicle Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control value={form.name} onChange={e => { updateField("name", e.target.value); if (!form.slug) updateField("slug", generateSlug(e.target.value)); }} placeholder="e.g. Tesla Model 3 Long Range AWD 2024" />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Slug <span className="text-danger">*</span></Form.Label>
                                        <Form.Control value={form.slug} onChange={e => updateField("slug", e.target.value)} placeholder="tesla-model-3-long-range-awd-2024" />
                                        <Form.Text className="text-muted">URL-friendly identifier. Auto-filled from name.</Form.Text>
                                    </Form.Group>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Brand <span className="text-danger">*</span></Form.Label>
                                                <Form.Select value={form.brand_id} onChange={e => setForm(prev => ({ ...prev, brand_id: e.target.value, model_id: "", variant_id: "" }))}>
                                                    <option value="">Select brand</option>
                                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Model <span className="text-danger">*</span></Form.Label>
                                                <Form.Select value={form.model_id} disabled={!form.brand_id} onChange={e => setForm(prev => ({ ...prev, model_id: e.target.value, variant_id: "" }))}>
                                                    <option value="">{form.brand_id ? "Select model" : "Select brand first"}</option>
                                                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Variant <span className="text-danger">*</span></Form.Label>
                                                <Form.Select value={form.variant_id} disabled={!form.model_id} onChange={e => updateField("variant_id", e.target.value)}>
                                                    <option value="">{form.model_id ? "Select variant" : "Select model first"}</option>
                                                    {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Divider label="Powertrain" />
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Fuel Type <span className="text-danger">*</span></Form.Label>
                                                <Form.Select value={form.fuel_type || ""} onChange={e => updateField("fuel_type", e.target.value as FuelType)}>
                                                    <option value="">Select fuel type</option>
                                                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Transmission <span className="text-danger">*</span></Form.Label>
                                                <Form.Select value={form.transmission || ""} onChange={e => updateField("transmission", e.target.value as Transmission)}>
                                                    <option value="">Select transmission</option>
                                                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Drivetrain</Form.Label>
                                                <Form.Select value={form.drivetrain || ""} onChange={e => updateField("drivetrain", e.target.value as Drivetrain)}>
                                                    <option value="">Select drivetrain (optional)</option>
                                                    {DRIVETRAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Engine</Form.Label>
                                                <Form.Control value={form.engine || ""} onChange={e => updateField("engine", e.target.value)} placeholder='e.g. "1.5L VTVT" or "Single-Speed Automatic"' />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* ── 1: Performance ── */}
                            {activeSection === 1 && (
                                <div>
                                    <SectionTitle title="Performance Specs" subtitle="Power, speed, and drivetrain controls" />
                                    <Row>
                                        {[["acceleration", "Acceleration", "4.4s (0-100 km/h)"], ["topSpeed", "Top Speed", "201 km/h"], ["power", "Power", "366 hp"], ["torque", "Torque", "493 Nm"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={perf[k] || ""} onChange={e => updateSpec("performance", k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider label="Driver Aids" />
                                    <Row>
                                        <Col md={6}><Form.Check type="switch" id="tractionControl" label="Traction Control" checked={!!perf.tractionControl} onChange={e => updateSpec("performance", "tractionControl", e.target.checked)} className="mb-2" /></Col>
                                        <Col md={6}><Form.Check type="switch" id="launchControl" label="Launch Control" checked={!!perf.launchControl} onChange={e => updateSpec("performance", "launchControl", e.target.checked)} className="mb-2" /></Col>
                                    </Row>
                                </div>
                            )}

                            {/* ── 2: Battery ── */}
                            {activeSection === 2 && (
                                <div>
                                    <SectionTitle title="Battery Specs" subtitle="Pack, range, and charging capabilities" />
                                    <Row>
                                        {[["capacity", "Capacity", "75 kWh"], ["type", "Battery Type", "Lithium-Ion (NMC)"], ["voltage", "Voltage", "350V"], ["range", "Range (WLTP)", "629 km"], ["rangeCity", "City Range", "710 km"], ["rangeHighway", "Highway Range", "560 km"], ["efficiency", "Efficiency", "14.3 kWh/100km"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={batt[k] || ""} onChange={e => updateSpec("battery", k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider label="Charging" />
                                    <Row>
                                        {[["ac", "AC Charging", "11 kW (3-phase)"], ["dc", "DC Charging", "170 kW (Supercharger)"], ["time10to80", "10→80% Time", "25 min"], ["time0to100", "0→100% Time", "8.5 hrs"], ["connector", "Connector", "CCS2 / Type 2"], ["portLocation", "Port Location", "Rear Left"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={chrg[k] || ""} onChange={e => updateCharging(k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {/* ── 3: Dimensions & Interior ── */}
                            {activeSection === 3 && (
                                <div>
                                    <SectionTitle title="Dimensions" subtitle="Body size and weight measurements" />
                                    <Row>
                                        {[["length", "Length", "4720 mm"], ["width", "Width", "1921 mm"], ["height", "Height", "1441 mm"], ["wheelbase", "Wheelbase", "2875 mm"], ["groundClearance", "Ground Clearance", "140 mm"], ["weight", "Weight", "1830 kg"], ["weightDistribution", "Weight Distribution", "47:53 (F:R)"], ["turningRadius", "Turning Radius", "5.8 m"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={dims[k] || ""} onChange={e => updateSpec("dimensions", k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider label="Interior" />
                                    <Row>
                                        {[["seating", "Seating", "5"], ["seatingMaterial", "Seat Material", "Vegan Leather"], ["upholstery", "Upholstery", "White / Black"], ["dashboard", "Dashboard", "Minimalist 15.4\""], ["infotainment", "Infotainment", "15.4\" Touchscreen"], ["instrumentCluster", "Instrument Cluster", "Digital"], ["headroomFront", "Headroom Front", "993 mm"], ["headroomRear", "Headroom Rear", "930 mm"], ["legroomFront", "Legroom Front", "1041 mm"], ["legroomRear", "Legroom Rear", "972 mm"], ["cargo", "Cargo", "594 L"], ["cargoMax", "Cargo Max", "682 L"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={intr[k] || ""} onChange={e => updateSpec("interior", k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {/* ── 4: Safety & Wheels ── */}
                            {activeSection === 4 && (
                                <div>
                                    <SectionTitle title="Safety & Wheels" subtitle="NCAP ratings, active safety and tyre specs" />
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Safety Rating</Form.Label>
                                                <Form.Control value={safe.rating || ""} onChange={e => updateSpec("safety", "rating", e.target.value)} placeholder="5-Star Euro NCAP 2022" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Airbags</Form.Label>
                                                <Form.Control type="number" value={safe.airbags ?? ""} onChange={e => updateSpec("safety", "airbags", parseInt(e.target.value) || undefined)} placeholder="8" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Autonomous Level</Form.Label>
                                                <Form.Control value={safe.autonomousLevel || ""} onChange={e => updateSpec("safety", "autonomousLevel", e.target.value)} placeholder="Level 2" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Divider label="Active Safety Systems" />
                                    <Row>
                                        {[["abs", "ABS"], ["esc", "ESC"], ["tcs", "TCS"], ["blindSpot", "Blind Spot Monitor"], ["laneAssist", "Lane Assist"], ["adaptiveCruise", "Adaptive Cruise Control"], ["parkingSensors", "Parking Sensors"], ["camera360", "360° Camera"]].map(([k, label]) => (
                                            <Col md={6} key={k}>
                                                <Form.Check type="switch" id={`safe-${k}`} label={label} checked={!!safe[k]} onChange={e => updateSpec("safety", k, e.target.checked)} className="mb-3" />
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider label="Wheels & Tyres" />
                                    <Row>
                                        {[["front", "Front Tyre", "235/45 R18"], ["rear", "Rear Tyre", "255/45 R18"], ["type", "Wheel Type", "Aero Alloy"], ["spare", "Spare", "Tyre Repair Kit"]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={whls[k] || ""} onChange={e => updateSpec("wheels", k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={6}>
                                            <Form.Check type="switch" id="pressureMonitoring" label="Tyre Pressure Monitoring (TPMS)" checked={!!whls.pressureMonitoring} onChange={e => updateSpec("wheels", "pressureMonitoring", e.target.checked)} />
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* ── 5: Features ── */}
                            {activeSection === 5 && (
                                <div>
                                    <SectionTitle title="Features" subtitle="Add feature tags per category" />
                                    {(["exterior", "interior", "comfort", "entertainment", "connectivity", "convenience"] as const).map(cat => (
                                        <Form.Group className="mb-4" key={cat}>
                                            <Form.Label className="fw-semibold text-capitalize" style={{ fontSize: 13 }}>{cat}</Form.Label>
                                            <div className="d-flex gap-2">
                                                <Form.Control
                                                    size="sm"
                                                    value={featureInputs[cat]}
                                                    placeholder={`Add ${cat} feature and press Enter`}
                                                    onChange={e => setFeatureInputs(p => ({ ...p, [cat]: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeatureTag(cat); } }}
                                                />
                                                <Button size="sm" variant="outline-primary" onClick={() => addFeatureTag(cat)}>Add</Button>
                                            </div>
                                            <TagRow items={feat[cat] || []} onRemove={i => removeFeatureTag(cat, i)} />
                                        </Form.Group>
                                    ))}
                                </div>
                            )}

                            {/* ── 6: Pricing ── */}
                            {activeSection === 6 && (
                                <div>
                                    <SectionTitle title="Pricing" subtitle="Base price, on-road costs and financing" />
                                    <Row>
                                        {[["basePrice", "Base Price"], ["onRoadPrice", "On-Road Price"], ["insurance", "Insurance"], ["registration", "Registration"], ["tax", "Tax"]].map(([k, label]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label} (₹)</Form.Label>
                                                    <Form.Control type="number" value={(form.pricing as any)?.[k] ?? ""} onChange={e => updatePricing(k, parseFloat(e.target.value) || undefined)} placeholder="0" />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider label="Financing" />
                                    <Row>
                                        {[["emi", "EMI", "₹84,500/month"], ["downPayment", "Down Payment", "₹860,000"], ["tenure", "Tenure", "60 months"]].map(([k, label, ph]) => (
                                            <Col md={4} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={(form.pricing?.financing as any)?.[k] || ""} onChange={e => updateFinancing(k, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Interest Rate (%)</Form.Label>
                                                <Form.Control type="number" step="0.1" value={form.pricing?.financing?.interest ?? ""} onChange={e => updateFinancing("interest", parseFloat(e.target.value) || undefined)} placeholder="8.5" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* ── 7: Ownership ── */}
                            {activeSection === 7 && (
                                <div>
                                    <SectionTitle title="Ownership" subtitle="Warranty and service coverage" />
                                    <Row>
                                        {[["warranty", "Warranty", "4 years / 80,000 km"], ["battery_warranty", "Battery Warranty", "8 years / 160,000 km"], ["service_interval", "Service Interval", "Annual service recommended"], ["maintenance_cost", "Maintenance Cost", "Low cost..."]].map(([k, label, ph]) => (
                                            <Col md={6} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>{label}</Form.Label>
                                                    <Form.Control value={(form.api_ownership as any)?.[k] || ""} onChange={e => updateApiOwnership(k as keyof ApiOwnership, e.target.value)} placeholder={ph} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Service Centers</Form.Label>
                                                <Form.Control type="number" value={form.api_ownership?.service_centers ?? ""} onChange={e => updateApiOwnership("service_centers", parseInt(e.target.value) || undefined)} placeholder="8" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="d-flex align-items-center">
                                            <Form.Check type="switch" id="roadside_assist" label="Roadside Assistance" checked={!!form.api_ownership?.roadside_assist} onChange={e => updateApiOwnership("roadside_assist", e.target.checked)} />
                                        </Col>
                                    </Row>

                                    <div className="mt-3 p-3 rounded" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 12, color: "#0369a1" }}>
                                        <i className="bi bi-info-circle me-1" />
                                        Looking for the <strong>history timeline</strong>? It belongs to the <strong>Model</strong> — edit it in the Model form (Details step).
                                    </div>
                                </div>
                            )}

                            {/* ── 8: Settings ── */}
                            {activeSection === 8 && (
                                <div>
                                    <SectionTitle title="Settings" subtitle="Visibility, featured flag, ratings, and competitors" />
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Status</Form.Label>
                                        <div className="d-flex gap-3 mt-1">
                                            {statusOptions.map(s => (
                                                <Form.Check key={s} type="radio" id={`vhstatus-${s}`} name="vehicleStatus" checked={form.status === s} onChange={() => updateField("status", s)}
                                                    label={<Badge bg={statusBg(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>
                                    <Form.Check type="switch" id="featuredToggle" label="Featured Vehicle" checked={!!form.featured} onChange={e => updateField("featured", e.target.checked)} className="mb-4" />

                                    <Divider label="Ratings (0–5)" />
                                    <Row>
                                        {[["overall", "Overall"], ["performance", "Performance"], ["comfort", "Comfort"], ["features", "Features"], ["safety", "Safety"], ["value", "Value"], ["userRating", "User Rating"], ["expertRating", "Expert Rating"]].map(([k, label]) => (
                                            <Col md={3} key={k}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-semibold" style={{ fontSize: 12 }}>{label}</Form.Label>
                                                    <Form.Control type="number" size="sm" step="0.1" min="0" max="5" value={(form.ratings as any)?.[k] ?? ""} onChange={e => updateRatings(k, parseFloat(e.target.value) || undefined)} placeholder="4.5" />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>

                                    <Divider label="Competitor Vehicle IDs" />
                                    <div className="d-flex gap-2 mb-2">
                                        <Form.Control size="sm" value={competitorInput} placeholder="Paste vehicle ID…" onChange={e => setCompetitorInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }} />
                                        <Button size="sm" variant="outline-secondary" onClick={addCompetitor}>Add</Button>
                                    </div>
                                    <div className="d-flex flex-wrap gap-1">
                                        {(form.competitor_ids || []).map((cid, i) => (
                                            <Badge key={i} bg="secondary" className="d-flex align-items-center gap-1 fw-normal">
                                                {cid.slice(-10)}
                                                <i className="bi bi-x" style={{ cursor: "pointer" }} onClick={() => removeCompetitor(i)} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </Form>
                    </div>
                </div>
            </Offcanvas.Body>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e9ecef", background: "#fff", padding: "12px 20px", flexShrink: 0 }}>
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex gap-2">
                        {activeSection > 0 && (
                            <Button variant="outline-secondary" size="sm" onClick={() => setActiveSection(activeSection - 1)}>
                                <i className="bi bi-chevron-left me-1" />Back
                            </Button>
                        )}
                        {!isEdit && (
                            <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={fillDummyData}
                                title="Fill form with sample data for testing"
                                style={{ fontSize: 12 }}
                            >
                                <i className="bi bi-stars me-1" />Fill Demo
                            </Button>
                        )}
                    </div>
                    <span style={{ fontSize: 12, color: "#adb5bd", fontWeight: 500 }}>
                        {activeSection + 1} of {steps.length}
                    </span>
                    {isEdit ? (
                        <div className="d-flex gap-2 align-items-center">
                            {isDirty(activeSection) ? (
                                <span style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>
                                    <i className="bi bi-exclamation-circle me-1" />Unsaved
                                </span>
                            ) : (
                                <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>
                                    <i className="bi bi-check-circle me-1" />Saved
                                </span>
                            )}
                            <Button variant="outline-secondary" size="sm" onClick={onHide}>Close</Button>
                            {activeSection < steps.length - 1 && (
                                <Button variant="outline-primary" size="sm" onClick={() => setActiveSection(activeSection + 1)}>
                                    Next <i className="bi bi-chevron-right ms-1" />
                                </Button>
                            )}
                            <Button
                                variant={isDirty(activeSection) ? "success" : "outline-success"}
                                size="sm"
                                disabled={savingSection === activeSection || !isDirty(activeSection)}
                                onClick={() => handleSectionSave(activeSection)}
                                style={{ minWidth: 150 }}
                            >
                                {savingSection === activeSection ? (
                                    <><Spinner animation="border" size="sm" className="me-1" />Saving…</>
                                ) : (
                                    <><i className="bi bi-save me-1" />Save {steps[activeSection].label}</>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={onHide}>Cancel</Button>
                            {activeSection < steps.length - 1 ? (
                                <Button variant="primary" size="sm" onClick={() => setActiveSection(activeSection + 1)}>
                                    Continue <i className="bi bi-chevron-right ms-1" />
                                </Button>
                            ) : (
                                <Button variant="success" size="sm" onClick={handleSubmit}>
                                    <i className="bi bi-check2-circle me-1" />
                                    Create Vehicle
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Offcanvas>
    );
};

export default VehicleFormModal;
