import React, { useEffect, useState } from "react";
import { Offcanvas, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Variant, VariantStatus, VariantColor } from "./types/variant";
import { VehicleModel } from "../models/types/model";
import { toast } from "react-toastify";
import { getAllModels, uploadMediaFile } from "../../service/common.service";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Variant) => void;
    initialData?: Variant | null;
}

const defaultForm: Variant = {
    name: "", slug: "", model_id: "", trim: "", launch_year: undefined,
    production_status: "in-production", segment: "", colors: [], status: "active"
};

const statusOptions: VariantStatus[] = ["active", "discontinued", "upcoming"];
const productionStatusOptions = ["in-production", "discontinued", "upcoming"];
// Must match the backend colorValidation `type` enum
const colorTypeOptions = ["standard", "metallic", "pearlescent", "matte", "satin"];
// Market tier of the variant — body style lives on the Model, not here
const segmentOptions = ["Budget", "Mid", "Premium", "Luxury"];

const statusBg = (s: string) => s === "active" ? "success" : s === "upcoming" ? "warning" : "danger";

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div style={{ borderLeft: "3px solid #0d6efd", paddingLeft: 12, marginBottom: 24 }}>
        <h5 style={{ fontWeight: 700, fontSize: 16, color: "#212529", marginBottom: 2 }}>{title}</h5>
        <p style={{ fontSize: 12, color: "#6c757d", marginBottom: 0 }}>{subtitle}</p>
    </div>
);

const VariantFormModal: React.FC<Props> = ({ show, onHide, onSubmit, initialData }) => {
    const [form, setForm] = useState<Variant>(defaultForm);
    const [activeSection, setActiveSection] = useState(0);
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [newColor, setNewColor] = useState<VariantColor>({ id: "", name: "", code: "#000000", price: 0, type: "standard", isAvailable: true });
    const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
    const [uploadingColorImage, setUploadingColorImage] = useState(false);

    useEffect(() => {
        if (initialData) {
            const { id, created_at, created_by, updated_by, model, _count, updated_at, is_deleted, view_count, colors, ...clean } = initialData as any;
            // Map API colors (snake_case) → form colors (camelCase)
            const mappedColors: VariantColor[] = (colors || []).map((c: any) => ({
                id: c.id || `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
                name: c.name,
                code: c.hex_code ?? c.code ?? "#000000",
                image: c.image_url ?? c.image ?? "",
                price: c.price_delta ?? c.price ?? 0,
                type: c.type || "standard",
                isAvailable: c.is_available ?? c.isAvailable ?? true,
            }));
            setForm({
                ...defaultForm,
                ...clean,
                production_status: clean.production_status || "in-production",
                // Legacy data mixed body styles into segment — reset anything
                // that isn't a market tier so the user re-picks a valid one
                segment: segmentOptions.includes(clean.segment) ? clean.segment : "",
                colors: mappedColors,
            });
        } else {
            setForm(defaultForm);
            setActiveSection(0);
        }
        // Reset the color editor whenever we (re)open or switch variants
        setNewColor({ id: "", name: "", code: "#000000", price: 0, type: "standard", isAvailable: true });
        setEditingColorIdx(null);
    }, [initialData, show]);

    useEffect(() => {
        if (!show) return;
        setModelsLoading(true);
        getAllModels({ offset: 0, limit: 100 })
            .then((res: any) => {
                const list = res?.data?.data?.rows ?? res?.data?.data ?? [];
                setModels(list);
            })
            .catch(() => toast.error("Failed to load models"))
            .finally(() => setModelsLoading(false));
    }, [show]);

    const updateField = (key: keyof Variant, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-").trim();

    const handleColorImageUpload = async (file: File) => {
        setUploadingColorImage(true);
        try {
            const url = await uploadMediaFile(file, "variants/colors");
            setNewColor(p => ({ ...p, image: url }));
        } catch {
            toast.error("Failed to upload color image");
        } finally {
            setUploadingColorImage(false);
        }
    };

    const resetColorEditor = () => {
        setNewColor({ id: "", name: "", code: "#000000", price: 0, type: "standard", isAvailable: true });
        setEditingColorIdx(null);
    };

    const saveColor = () => {
        if (!newColor.name || !newColor.code) { toast.error("Color name and code are required"); return; }
        if (editingColorIdx !== null) {
            // Update the existing color in place, preserving its id
            setForm(prev => ({
                ...prev,
                colors: (prev.colors || []).map((c, i) =>
                    i === editingColorIdx ? { ...newColor, id: newColor.id || c.id || `c${Date.now()}` } : c
                ),
            }));
        } else {
            setForm(prev => ({ ...prev, colors: [...(prev.colors || []), { ...newColor, id: newColor.id || `c${Date.now()}` }] }));
        }
        resetColorEditor();
    };

    const editColor = (idx: number) => {
        const c = (form.colors || [])[idx];
        if (!c) return;
        setNewColor({ ...c });
        setEditingColorIdx(idx);
    };

    const removeColor = (idx: number) => {
        setForm(prev => ({ ...prev, colors: (prev.colors || []).filter((_, i) => i !== idx) }));
        // If we were editing this row (or one after it shifted), reset the editor to avoid stale index
        if (editingColorIdx !== null && (editingColorIdx === idx || editingColorIdx >= (form.colors || []).length - 1)) {
            resetColorEditor();
        }
    };

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error("Variant name is required"); return; }
        if (!form.slug.trim()) { toast.error("Slug is required"); return; }
        if (!form.model_id.trim()) { toast.error("Model is required"); return; }

        // Convert form colors (camelCase) → API shape (snake_case)
        const colors = (form.colors || []).map(c => ({
            id: c.id,
            name: c.name,
            hex_code: c.code,
            ...(c.image ? { image_url: c.image } : {}),
            price_delta: c.price ?? 0,
            ...(c.type ? { type: c.type } : {}),
            is_available: c.isAvailable ?? true,
        }));

        // production_status must be one of the enum values — never send "" / null
        const VALID_PRODUCTION_STATUSES = ["in-production", "discontinued", "upcoming"];
        const production_status = VALID_PRODUCTION_STATUSES.includes(form.production_status || "")
            ? form.production_status
            : "in-production";

        const payload: any = { ...form, colors, production_status };
        // segment is an optional enum — omit it entirely if blank so it doesn't fail validation
        if (!form.segment) delete payload.segment;

        onSubmit(payload);
    };

    const steps = [
        { icon: "bi-info-circle", label: "Basic Info" },
        { icon: "bi-list-ul", label: "Details" },
        { icon: "bi-palette", label: "Colors" },
        { icon: "bi-gear", label: "Settings" },
    ];

    return (
        <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: 720 }}>
            <Offcanvas.Header
                closeButton
                style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", background: "#fff", alignItems: "flex-start" }}
            >
                <div>
                    <Offcanvas.Title style={{ fontWeight: 700, fontSize: 17, color: "#212529" }}>
                        {initialData ? "Edit Variant" : "Add New Variant"}
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
                        width: 210, flexShrink: 0,
                        borderRight: "1px solid #e9ecef",
                        background: "#fafafa",
                        overflowY: "auto",
                        padding: "16px 12px",
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#adb5bd", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, paddingLeft: 4 }}>
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
                                        display: "flex", alignItems: "center", gap: 10,
                                        width: "100%", textAlign: "left", border: "none",
                                        padding: "9px 12px", borderRadius: 8, marginBottom: 4,
                                        background: isActive ? "rgba(13,110,253,0.08)" : "transparent",
                                        borderLeft: `2px solid ${isActive ? "#0d6efd" : "transparent"}`,
                                        cursor: "pointer",
                                        color: isActive ? "#0d6efd" : isDone ? "#198754" : "#6c757d",
                                        fontWeight: isActive ? 600 : 400,
                                        fontSize: 13,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <div style={{
                                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700,
                                        background: isActive ? "#0d6efd" : isDone ? "#198754" : "#e9ecef",
                                        color: (isActive || isDone) ? "#fff" : "#6c757d",
                                    }}>
                                        {isDone ? "✓" : i + 1}
                                    </div>
                                    {step.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                        <Form>
                            {activeSection === 0 && (
                                <div>
                                    <SectionTitle title="Basic Information" subtitle="Name, slug, and model association" />
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Variant Name <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            value={form.name}
                                            onChange={e => {
                                                updateField("name", e.target.value);
                                                if (!form.slug) updateField("slug", generateSlug(e.target.value));
                                            }}
                                            placeholder="e.g. Long Range AWD"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Slug <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            value={form.slug}
                                            onChange={e => updateField("slug", e.target.value)}
                                            placeholder="long-range-awd"
                                        />
                                        <Form.Text className="text-muted">URL-friendly identifier. Auto-filled from name.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Model <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={form.model_id}
                                            onChange={e => updateField("model_id", e.target.value)}
                                            disabled={modelsLoading}
                                        >
                                            <option value="">{modelsLoading ? "Loading models…" : "Select a model"}</option>
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            )}

                            {activeSection === 1 && (
                                <div>
                                    <SectionTitle title="Variant Details" subtitle="Trim, segment, and production info" />
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Trim Level</Form.Label>
                                                <Form.Control
                                                    value={form.trim}
                                                    onChange={e => updateField("trim", e.target.value)}
                                                    placeholder="e.g. Premium, Sport"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Launch Year</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={form.launch_year || ""}
                                                    onChange={e => updateField("launch_year", parseInt(e.target.value) || undefined)}
                                                    placeholder="e.g. 2023"
                                                    min="1990"
                                                    max="2030"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Segment (price tier)</Form.Label>
                                                <Form.Select value={form.segment} onChange={e => updateField("segment", e.target.value)}>
                                                    <option value="">Select segment</option>
                                                    {segmentOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Production Status</Form.Label>
                                                <Form.Select
                                                    value={form.production_status}
                                                    onChange={e => updateField("production_status", e.target.value)}
                                                >
                                                    {productionStatusOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {activeSection === 2 && (
                                <div>
                                    <SectionTitle title="Colors" subtitle="Paint options shared across all sub-variants of this variant" />
                                    <div style={{ border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                                        <div style={{ padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#495057" }}>
                                                {editingColorIdx !== null ? "Edit Color" : "Add Color"}
                                            </span>
                                        </div>
                                        <div style={{ padding: "16px" }}>
                                            <Row>
                                                <Col md={5}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Name <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control size="sm" value={newColor.name} onChange={e => setNewColor(p => ({ ...p, name: e.target.value }))} placeholder="Pearl White Multi-Coat" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Code</Form.Label>
                                                        <Form.Control type="color" value={newColor.code} onChange={e => setNewColor(p => ({ ...p, code: e.target.value }))} style={{ height: 31 }} />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Type</Form.Label>
                                                        <Form.Select size="sm" value={newColor.type || ""} onChange={e => setNewColor(p => ({ ...p, type: e.target.value }))}>
                                                            {colorTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Price Delta (₹)</Form.Label>
                                                        <Form.Control type="number" size="sm" value={newColor.price ?? ""} onChange={e => setNewColor(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={9}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Color Image</Form.Label>
                                                        <Form.Control type="file" size="sm" accept="image/*" disabled={uploadingColorImage}
                                                            onChange={e => {
                                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                                if (file) { handleColorImageUpload(file); (e.target as HTMLInputElement).value = ""; }
                                                            }}
                                                        />
                                                        {uploadingColorImage && <div className="text-muted mt-1 small"><i className="bi bi-upload me-1" />Uploading…</div>}
                                                        {newColor.image && (
                                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                                <img src={newColor.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid #dee2e6" }} />
                                                                <Button size="sm" variant="outline-danger" onClick={() => setNewColor(p => ({ ...p, image: "" }))}><i className="bi bi-x" /></Button>
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3} className="d-flex align-items-end mb-2">
                                                    <Form.Check type="switch" label="Available" checked={!!newColor.isAvailable} onChange={e => setNewColor(p => ({ ...p, isAvailable: e.target.checked }))} />
                                                </Col>
                                            </Row>
                                            <div className="d-flex gap-2">
                                                <Button size="sm" variant="primary" onClick={saveColor} disabled={uploadingColorImage}>
                                                    <i className={`bi ${editingColorIdx !== null ? "bi-check2" : "bi-plus"} me-1`} />
                                                    {editingColorIdx !== null ? "Update Color" : "Add Color"}
                                                </Button>
                                                {editingColorIdx !== null && (
                                                    <Button size="sm" variant="outline-secondary" onClick={resetColorEditor}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {(form.colors || []).length === 0 && (
                                        <div style={{ textAlign: "center", padding: "24px", color: "#adb5bd", border: "1px dashed #dee2e6", borderRadius: 8 }}>
                                            <i className="bi bi-palette" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
                                            No colors added yet
                                        </div>
                                    )}
                                    {(form.colors || []).map((color, idx) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${editingColorIdx === idx ? "#0d6efd" : "#e9ecef"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, background: editingColorIdx === idx ? "rgba(13,110,253,0.04)" : "#fff" }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: color.code, border: "1px solid #dee2e6", flexShrink: 0 }} />
                                            {color.image && <img src={color.image} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 6, border: "1px solid #dee2e6", flexShrink: 0 }} />}
                                            <div style={{ flex: 1, fontSize: 13 }}>
                                                <strong>{color.name}</strong>
                                                <span className="text-muted ms-2">{color.type} · {color.code} · ₹{(color.price || 0).toLocaleString()}</span>
                                            </div>
                                            <Badge bg={color.isAvailable ? "success" : "secondary"}>{color.isAvailable ? "Available" : "N/A"}</Badge>
                                            <Button size="sm" variant="outline-primary" onClick={() => editColor(idx)}><i className="bi bi-pencil" /></Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => removeColor(idx)}><i className="bi bi-trash" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeSection === 3 && (
                                <div>
                                    <SectionTitle title="Settings" subtitle="Visibility and publish status" />
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Status</Form.Label>
                                        <div className="d-flex gap-3 mt-1">
                                            {statusOptions.map(s => (
                                                <Form.Check
                                                    key={s} type="radio" id={`vstatus-${s}`}
                                                    label={<Badge bg={statusBg(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>}
                                                    name="variantStatus" checked={form.status === s}
                                                    onChange={() => updateField("status", s)}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>

                                    <div style={{ border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
                                        <div style={{ padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#495057" }}>Preview</span>
                                        </div>
                                        <div style={{ padding: "16px" }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>{form.name || "Variant Name"}</div>
                                            <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                                                {form.trim && `Trim: ${form.trim} · `}
                                                {form.launch_year && `Year: ${form.launch_year}`}
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <Badge bg={statusBg(form.status)}>{form.status}</Badge>
                                            </div>
                                        </div>
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
                    <div>
                        {activeSection > 0 && (
                            <Button variant="outline-secondary" size="sm" onClick={() => setActiveSection(activeSection - 1)}>
                                <i className="bi bi-chevron-left me-1" />Back
                            </Button>
                        )}
                    </div>
                    <span style={{ fontSize: 12, color: "#adb5bd", fontWeight: 500 }}>
                        {activeSection + 1} of {steps.length}
                    </span>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={onHide}>Cancel</Button>
                        {activeSection < steps.length - 1 ? (
                            <Button variant="primary" size="sm" onClick={() => setActiveSection(activeSection + 1)}>
                                Continue <i className="bi bi-chevron-right ms-1" />
                            </Button>
                        ) : (
                            <Button variant="success" size="sm" onClick={handleSubmit}>
                                <i className="bi bi-check2-circle me-1" />
                                {initialData ? "Update Variant" : "Create Variant"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default VariantFormModal;
