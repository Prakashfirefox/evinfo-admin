import React, { useEffect, useMemo, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import VehicleFormModal from "./VehicleFormModal";
import { Vehicle } from "./types/vehicle";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, updateVehicleStatus,
    getAllBrands, getAllModels, getAllVariants, updateVariant,
    upsertSpecifications, createPricing, updatePricing,
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

type BrandLite = { id: string; name: string };
type ModelLite = { id: string; name: string; brand_id?: string };
type VariantLite = { id: string; name: string; model_id?: string };

// ── Shared camelCase(form) → snake_case(API) mappers ───────────────────────────
// Used by both the single-shot create flow and the per-section edit saves so the
// two paths can never drift apart.
export const buildSpecPayload = (subVariantId: string, spec: any) => ({
    sub_variant_id: subVariantId,
    performance: {
        acceleration: spec?.performance?.acceleration || undefined,
        top_speed: spec?.performance?.topSpeed || undefined,
        power: spec?.performance?.power || undefined,
        torque: spec?.performance?.torque || undefined,
        traction_control: spec?.performance?.tractionControl,
        launch_control: spec?.performance?.launchControl,
    },
    battery: {
        capacity: spec?.battery?.capacity || undefined,
        type: spec?.battery?.type || undefined,
        voltage: spec?.battery?.voltage || undefined,
        range: spec?.battery?.range || undefined,
        range_city: spec?.battery?.rangeCity || undefined,
        range_highway: spec?.battery?.rangeHighway || undefined,
        efficiency: spec?.battery?.efficiency || undefined,
        charging: {
            ac: spec?.battery?.charging?.ac || undefined,
            dc: spec?.battery?.charging?.dc || undefined,
            time_10to80: spec?.battery?.charging?.time10to80 || undefined,
            time_0to100: spec?.battery?.charging?.time0to100 || undefined,
            connector_type: spec?.battery?.charging?.connector || undefined,
            port_location: spec?.battery?.charging?.portLocation || undefined,
        },
    },
    dimensions: {
        length: spec?.dimensions?.length || undefined,
        width: spec?.dimensions?.width || undefined,
        height: spec?.dimensions?.height || undefined,
        wheelbase: spec?.dimensions?.wheelbase || undefined,
        ground_clearance: spec?.dimensions?.groundClearance || undefined,
        kerb_weight: spec?.dimensions?.weight || undefined,
        turning_radius: spec?.dimensions?.turningRadius || undefined,
    },
    interior: {
        seating: spec?.interior?.seating ? Number(spec.interior.seating) || undefined : undefined,
        seating_material: spec?.interior?.seatingMaterial || undefined,
        upholstery: spec?.interior?.upholstery || undefined,
        dashboard: spec?.interior?.dashboard || undefined,
        infotainment: spec?.interior?.infotainment || undefined,
        instrument_cluster: spec?.interior?.instrumentCluster || undefined,
        headroom_front: spec?.interior?.headroomFront || undefined,
        headroom_rear: spec?.interior?.headroomRear || undefined,
        legroom_front: spec?.interior?.legroomFront || undefined,
        legroom_rear: spec?.interior?.legroomRear || undefined,
        cargo_volume: spec?.interior?.cargo || undefined,
        cargo_max: spec?.interior?.cargoMax || undefined,
    },
    safety: {
        ncap_rating: spec?.safety?.rating || undefined,
        airbags: spec?.safety?.airbags || undefined,
        abs: spec?.safety?.abs,
        esc: spec?.safety?.esc,
        tcs: spec?.safety?.tcs,
        blind_spot: spec?.safety?.blindSpot,
        lane_assist: spec?.safety?.laneAssist,
        adaptive_cruise: spec?.safety?.adaptiveCruise,
        parking_sensors: typeof spec?.safety?.parkingSensors === "string"
            ? spec.safety.parkingSensors
            : spec?.safety?.parkingSensors === true ? "both" : undefined,
        camera_360: spec?.safety?.camera360,
        autonomous_level: spec?.safety?.autonomousLevel || undefined,
    },
    wheels: {
        front: spec?.wheels?.front || undefined,
        rear: spec?.wheels?.rear || undefined,
        wheel_type: spec?.wheels?.type || undefined,
        spare: spec?.wheels?.spare || undefined,
        pressure_monitoring: spec?.wheels?.pressureMonitoring,
    },
    features: {
        exterior: spec?.features?.exterior || [],
        interior: spec?.features?.interior || [],
        comfort: spec?.features?.comfort || [],
        entertainment: spec?.features?.entertainment || [],
        connectivity: spec?.features?.connectivity || [],
        convenience: spec?.features?.convenience || [],
    },
});

export const buildPricingPayload = (pricing: any) => ({
    on_road_price: pricing?.onRoadPrice || undefined,
    insurance: pricing?.insurance || undefined,
    registration: pricing?.registration || undefined,
    tcs_tax: pricing?.tax || undefined,
    financing: (pricing?.financing?.emi || pricing?.financing?.interest) ? {
        emi: pricing.financing.emi || undefined,
        down_payment: pricing.financing.downPayment || undefined,
        tenure: pricing.financing.tenure || undefined,
        interest: pricing.financing.interest || undefined,
    } : undefined,
});

// Which spec sub-objects each edit section owns (for individual saves)
const SECTION_SPEC_KEYS: Record<string, string[]> = {
    performance: ["performance"],
    battery: ["battery"],
    dimensions: ["dimensions", "interior"],
    safety: ["safety", "wheels"],
    features: ["features"],
};

const buildOwnershipPayload = (own: any) => {
    if (!own) return undefined;
    return {
        ...(own.warranty ? { warranty: own.warranty } : {}),
        ...(own.battery_warranty ? { battery_warranty: own.battery_warranty } : {}),
        ...(own.service_interval ? { service_interval: own.service_interval } : {}),
        ...(own.maintenance_cost ? { maintenance_cost: own.maintenance_cost } : {}),
        roadside_assist: !!own.roadside_assist,
        ...(own.service_centers != null ? { service_centers: own.service_centers } : {}),
    };
};

const Vehicles: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const brandFilter = searchParams.get("brand_id") || "";
    const modelFilter = searchParams.get("model_id") || "";
    const variantFilter = searchParams.get("variant_id") || "";

    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [brands, setBrands] = useState<BrandLite[]>([]);
    const [models, setModels] = useState<ModelLite[]>([]);
    const [variants, setVariants] = useState<VariantLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const activeBrand = useMemo(() => brands.find(b => b.id === brandFilter), [brands, brandFilter]);
    const activeModel = useMemo(() => models.find(m => m.id === modelFilter), [models, modelFilter]);
    const activeVariant = useMemo(() => variants.find(v => v.id === variantFilter), [variants, variantFilter]);

    // Load brand list once
    useEffect(() => {
        (async () => {
            const res = await getAllBrands({ search: "", offset: 0, limit: 100 });
            if (res?.data?.status) {
                const rows = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setBrands(rows.map((b: any) => ({ id: b.id, name: b.name })));
            }
        })();
    }, []);

    // Load models — scoped to brand if one is selected
    useEffect(() => {
        (async () => {
            const payload: any = { search: "", offset: 0, limit: 100 };
            if (brandFilter) payload.brand_id = brandFilter;
            const res = await getAllModels(payload);
            if (res?.data?.status) {
                const rows = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setModels(rows.map((m: any) => ({ id: m.id, name: m.name, brand_id: m.brand_id })));
            }
        })();
    }, [brandFilter]);

    // Load variants — scoped to model if one is selected, otherwise to brand
    useEffect(() => {
        (async () => {
            const payload: any = { search: "", offset: 0, limit: 100 };
            if (modelFilter) payload.model_id = modelFilter;
            else if (brandFilter) payload.brand_id = brandFilter;
            const res = await getAllVariants(payload);
            if (res?.data?.status) {
                const rows = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setVariants(rows.map((v: any) => ({ id: v.id, name: v.name, model_id: v.model_id })));
            }
        })();
    }, [brandFilter, modelFilter]);

    const fetchVehicles = async () => {
        setLoading(true);
        const payload: any = { search, offset, limit };
        // Most specific filter wins
        if (variantFilter) payload.variant_id = variantFilter;
        else if (modelFilter) payload.model_id = modelFilter;
        else if (brandFilter) payload.brand_id = brandFilter;

        const res = await getAllVehicles(payload);
        if (res?.data?.status) {
            const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
            setVehicles(list);
            setTotal(res.data.data?.count || 0);
        } else {
            setVehicles([]);
            setTotal(0);
        }
        setLoading(false);
    };

    useEffect(() => { fetchVehicles(); }, [search, offset, brandFilter, modelFilter, variantFilter]);

    useEffect(() => {
        setOffset(0);
        setCurrentPage(1);
    }, [brandFilter, modelFilter, variantFilter, search]);

    const updateFilter = (key: "brand_id" | "model_id" | "variant_id", value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        // Cascade clears: changing brand clears model + variant; changing model clears variant
        if (key === "brand_id") {
            next.delete("model_id");
            next.delete("variant_id");
        }
        if (key === "model_id") next.delete("variant_id");
        setSearchParams(next);
    };

    const saveVehicle = async (fullPayload: any) => {
        const { _specifications, _pricing, _specId, _pricingId, ...corePayload } = fullPayload;

        // 1. Save core sub-variant fields
        const vehicleRes = editVehicle
            ? await updateVehicle(editVehicle.id!, corePayload)
            : await createVehicle(corePayload);

        if (!vehicleRes?.data?.status) {
            toast.error(vehicleRes?.data?.message || "Failed to save vehicle");
            return;
        }

        const subVariantId: string = vehicleRes.data.data?.id || editVehicle?.id || "";
        const saveErrors: string[] = [];

        // 2. Upsert specifications (always send even if mostly empty so record exists)
        if (subVariantId && _specifications) {
            const specRes = await upsertSpecifications(buildSpecPayload(subVariantId, _specifications));
            if (!specRes?.data?.status) saveErrors.push("specifications");
        }

        // 3. Create or update pricing
        if (subVariantId && _pricing?.basePrice !== undefined && _pricing?.basePrice !== null) {
            const pricingData = buildPricingPayload(_pricing);
            let pricingRes;
            if (_pricingId) {
                pricingRes = await updatePricing(_pricingId, { ex_showroom_price: _pricing.basePrice, ...pricingData });
            } else {
                pricingRes = await createPricing({ sub_variant_id: subVariantId, ex_showroom_price: _pricing.basePrice, ...pricingData });
            }
            if (!pricingRes?.data?.status) saveErrors.push("pricing");
        }

        if (saveErrors.length > 0) {
            toast.warning(`Vehicle saved, but failed to save: ${saveErrors.join(", ")}`);
        } else {
            toast.success(editVehicle ? "Vehicle updated successfully" : "Vehicle created successfully");
        }
        setShowModal(false);
        setEditVehicle(null);
        fetchVehicles();
    };

    // Per-section save (edit mode only). Each section maps to just its own API call
    // so a section can be updated independently of the others.
    const saveSection = async (
        section: string,
        form: any,
    ): Promise<{ ok: boolean; pricingId?: string }> => {
        const id = editVehicle?.id;
        if (!id) { toast.error("Save the vehicle first"); return { ok: false }; }

        try {
            // Core sub-variant fields
            if (section === "basic") {
                if (!form.name?.trim()) { toast.error("Vehicle name is required"); return { ok: false }; }
                if (!form.slug?.trim()) { toast.error("Slug is required"); return { ok: false }; }
                if (!form.variant_id) { toast.error("Variant is required"); return { ok: false }; }
                if (!form.fuel_type) { toast.error("Fuel type is required"); return { ok: false }; }
                if (!form.transmission) { toast.error("Transmission is required"); return { ok: false }; }
                const res = await updateVehicle(id, {
                    name: form.name.trim(),
                    slug: form.slug.trim(),
                    variant_id: form.variant_id,
                    fuel_type: form.fuel_type,
                    transmission: form.transmission,
                    engine: form.engine?.trim() || "",
                    ...(form.drivetrain ? { drivetrain: form.drivetrain } : {}),
                });
                return finishSection(res, "Basic details");
            }

            if (section === "ownership") {
                const res = await updateVehicle(id, { ownership: buildOwnershipPayload(form.api_ownership) });
                return finishSection(res, "Ownership");
            }

            if (section === "settings") {
                // status lives on the sub-variant; featured + competitor_ids live
                // on the parent Variant (shared across its sub-variants).
                const statusRes = await updateVehicle(id, { status: form.status });
                let ok = !!statusRes?.data?.status;
                if (!ok) { toast.error(statusRes?.data?.message || "Failed to save status"); return { ok: false }; }

                if (form.variant_id) {
                    const varRes = await updateVariant(form.variant_id, {
                        featured: !!form.featured,
                        competitor_ids: form.competitor_ids || [],
                    });
                    if (!varRes?.data?.status) {
                        toast.warning("Status saved, but failed to save featured / competitors");
                        return { ok: false };
                    }
                }
                toast.success("Settings saved");
                fetchVehicles();
                return { ok: true };
            }

            // Specification sections — send only this section's sub-objects so the
            // rest of the specs document is left untouched.
            if (SECTION_SPEC_KEYS[section]) {
                const full: any = buildSpecPayload(id, form.specifications);
                const picked: any = { sub_variant_id: id };
                for (const key of SECTION_SPEC_KEYS[section]) picked[key] = full[key];
                const res = await upsertSpecifications(picked);
                return finishSection(res, "Specifications");
            }

            // Pricing
            if (section === "pricing") {
                if (form.pricing?.basePrice == null || form.pricing.basePrice === "") {
                    toast.error("Base price is required to save pricing");
                    return { ok: false };
                }
                const pricingId = form._pricingId ?? (editVehicle as any)?.pricing?.[0]?.id ?? null;
                const body = { ex_showroom_price: form.pricing.basePrice, ...buildPricingPayload(form.pricing) };
                const res = pricingId
                    ? await updatePricing(pricingId, body)
                    : await createPricing({ sub_variant_id: id, ...body });
                if (res?.data?.status) {
                    toast.success("Pricing saved");
                    return { ok: true, pricingId: res.data.data?.id || pricingId };
                }
                toast.error(res?.data?.message || "Failed to save pricing");
                return { ok: false };
            }

            return { ok: false };
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Save failed");
            return { ok: false };
        }
    };

    const finishSection = (res: any, label: string): { ok: boolean } => {
        if (res?.data?.status) {
            toast.success(`${label} saved`);
            fetchVehicles();
            return { ok: true };
        }
        toast.error(res?.data?.message || `Failed to save ${label}`);
        return { ok: false };
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
        const res = await deleteVehicle(id);
        if (res?.data?.status) {
            toast.success("Vehicle deleted successfully");
            fetchVehicles();
        }
    };

    const handleEdit = async (vehicle: Vehicle) => {
        setEditLoadingId(vehicle.id!);
        try {
            const res = await getVehicleById(vehicle.id!);
            if (res?.data?.status) {
                setEditVehicle(res.data.data);
            } else {
                setEditVehicle(vehicle);
            }
        } catch {
            setEditVehicle(vehicle);
        } finally {
            setEditLoadingId(null);
        }
        setShowModal(true);
    };

    const toggleStatus = async (vehicle: Vehicle) => {
        const newStatus = vehicle.status === "active" ? "discontinued" : "active";
        const res = await updateVehicleStatus(vehicle.id!, newStatus);
        if (res?.data?.status) {
            toast.success(`Vehicle status updated to ${newStatus}`);
            fetchVehicles();
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = { active: "success", discontinued: "danger", upcoming: "warning" };
        return <Badge bg={map[status] || "secondary"}>{status}</Badge>;
    };

    const totalPages = Math.ceil(total / limit);
    const handlePageChange = (page: number) => { setCurrentPage(page); setOffset((page - 1) * limit); };
    const paginationItems = [];
    for (let n = 1; n <= totalPages; n++) {
        paginationItems.push(
            <Pagination.Item key={n} active={n === currentPage} onClick={() => handlePageChange(n)}>{n}</Pagination.Item>
        );
    }

    return (
        <div className="d-flex">
            <div
                style={{ width: `${sidebarWidth}px`, transition: "width 0.3s", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 1000 }}
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
            >
                <Sidebar isCollapsed={!isSidebarHovered} />
            </div>

            <div className="flex-grow-1" style={{ marginLeft: `${sidebarWidth}px`, transition: "margin-left 0.3s", minHeight: "100vh" }}>
                <Header />
                <Container fluid className="px-4 pt-4 mt-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h4 className="fw-bold">Sub-Variants</h4>
                            <p className="text-muted mb-0">
                                Manage sub-variants (the final sellable units)
                                {(activeBrand || activeModel || activeVariant) && (
                                    <span className="ms-2">
                                        · Filtered by{" "}
                                        {activeBrand && <Badge bg="info" className="me-1">{activeBrand.name}</Badge>}
                                        {activeModel && <Badge bg="info" className="me-1">{activeModel.name}</Badge>}
                                        {activeVariant && <Badge bg="info">{activeVariant.name}</Badge>}
                                    </span>
                                )}
                            </p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ Add Sub-Variant</Button>
                    </div>

                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <Form.Select
                            value={brandFilter}
                            onChange={e => updateFilter("brand_id", e.target.value)}
                            style={{ maxWidth: 200 }}
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Select>

                        <Form.Select
                            value={modelFilter}
                            onChange={e => updateFilter("model_id", e.target.value)}
                            style={{ maxWidth: 200 }}
                        >
                            <option value="">{brandFilter ? "All Models for brand" : "All Models"}</option>
                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Form.Select>

                        <Form.Select
                            value={variantFilter}
                            onChange={e => updateFilter("variant_id", e.target.value)}
                            style={{ maxWidth: 200 }}
                        >
                            <option value="">{modelFilter ? "All Variants for model" : "All Variants"}</option>
                            {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </Form.Select>

                        <InputGroup style={{ maxWidth: 280 }}>
                            <Form.Control placeholder="Search sub-variants..." value={search} onChange={e => setSearch(e.target.value)} />
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>

                        {(brandFilter || modelFilter || variantFilter) && (
                            <Button variant="outline-secondary" size="sm" onClick={() => setSearchParams(new URLSearchParams())}>
                                <i className="bi bi-x-circle"></i> Clear filters
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading sub-variants...</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Sub-Variant</th>
                                                <th className="px-4 py-3">Brand</th>
                                                <th className="px-4 py-3">Model</th>
                                                <th className="px-4 py-3">Variant</th>
                                                <th className="px-4 py-3">Featured</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Created</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vehicles.length === 0 ? (
                                                <tr><td colSpan={8} className="text-center py-4">No sub-variants found</td></tr>
                                            ) : (
                                                vehicles.map(vehicle => (
                                                    <tr key={vehicle.id}>
                                                        <td className="px-4 py-3">
                                                            <strong>{vehicle.name}</strong>
                                                            <div className="text-muted small">{vehicle.slug}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                {(vehicle as any).brand?.logo && (
                                                                    <img src={(vehicle as any).brand.logo} alt="" style={{ height: 20, objectFit: "contain" }} />
                                                                )}
                                                                <span className="small">{(vehicle as any).brand?.name ?? "—"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="small">{(vehicle as any).model?.name ?? "—"}</span>
                                                            {(vehicle as any).model?.body_type && (
                                                                <div className="text-muted small">{(vehicle as any).model.body_type}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="small">{(vehicle as any).variant?.name ?? "—"}</span>
                                                            {(vehicle as any).variant?.launch_year && (
                                                                <div className="text-muted small">{(vehicle as any).variant.launch_year}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {vehicle.featured ? <Badge bg="info">Featured</Badge> : <span className="text-muted">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3">{getStatusBadge(vehicle.status)}</td>
                                                        <td className="px-4 py-3">
                                                            {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : "—"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2">
                                                                <Button size="sm" variant="outline-primary" onClick={() => handleEdit(vehicle)} disabled={editLoadingId === vehicle.id}>
                                                                    {editLoadingId === vehicle.id
                                                                        ? <><Spinner animation="border" size="sm" className="me-1" />Loading…</>
                                                                        : <><i className="bi bi-pencil"></i> Edit</>}
                                                                </Button>
                                                                <Button size="sm" variant="outline-warning" onClick={() => toggleStatus(vehicle)}>
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => vehicle.id && handleDelete(vehicle.id)}>
                                                                    <i className="bi bi-trash"></i> Delete
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <Pagination>
                                        <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />
                                        {paginationItems}
                                        <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Container>

                <VehicleFormModal
                    show={showModal}
                    onHide={() => { setShowModal(false); setEditVehicle(null); }}
                    onSubmit={saveVehicle}
                    onSectionSave={saveSection}
                    initialData={editVehicle}
                />
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Vehicles;
