import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Offcanvas, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { VehicleModel, VehicleModelStatus, ModelTimelineEvent } from "./types/model";
import { toast } from "react-toastify";
import { getAllBrands } from "../../service/common.service";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: VehicleModel) => void;
    initialData?: VehicleModel | null;
}

const defaultForm: VehicleModel = {
    name: "", slug: "", brand_id: "", generation: "", body_type: "",
    production_years: "", platform: "", timeline: [], status: "active"
};

// Canonical body styles — must match the backend enum and website tiles/filters
const bodyTypeOptions = ["Sedan", "SUV", "Crossover", "Hatchback", "Coupe", "Convertible", "Truck", "Minivan", "MPV/MUV", "Sports Car"];

// Map legacy free-text values onto the canonical list
const normalizeBodyType = (v?: string): string => {
    if (!v) return "";
    if (bodyTypeOptions.includes(v)) return v;
    const lower = v.toLowerCase();
    if (lower.includes("cross")) return "Crossover";
    if (lower.includes("pick") || lower.includes("truck")) return "Truck";
    if (lower.includes("mpv") || lower.includes("muv")) return "MPV/MUV";
    if (lower.includes("van")) return "Minivan";
    if (lower.includes("sport")) return "Sports Car";
    if (lower.includes("suv")) return "SUV";
    return "";
};
const statusOptions: VehicleModelStatus[] = ["active", "discontinued", "upcoming"];

const statusBg = (s: string) => s === "active" ? "success" : s === "upcoming" ? "warning" : "danger";

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div style={{ borderLeft: "3px solid #0d6efd", paddingLeft: 12, marginBottom: 24 }}>
        <h5 style={{ fontWeight: 700, fontSize: 16, color: "#212529", marginBottom: 2 }}>{title}</h5>
        <p style={{ fontSize: 12, color: "#6c757d", marginBottom: 0 }}>{subtitle}</p>
    </div>
);

const ModelFormModal: React.FC<Props> = ({ show, onHide, onSubmit, initialData }) => {
    const [form, setForm] = useState<VehicleModel>(defaultForm);
    const [activeSection, setActiveSection] = useState(0);
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [newTimeline, setNewTimeline] = useState<ModelTimelineEvent>({ year: new Date().getFullYear(), event: "", description: "" });

    useEffect(() => {
        if (initialData) {
            const { id, created_at, updated_at, is_deleted, bodyType, productionYears, created_by, updated_by, brand, _count, ...clean } = initialData;
            setForm({ ...clean, body_type: normalizeBodyType(clean.body_type) });
        } else {
            setForm(defaultForm);
            setActiveSection(0);
        }
    }, [initialData, show]);

    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));

    useEffect(() => { loadBrands(); }, []);

    const loadBrands = async () => {
        try {
            const res = await getAllBrands({ offset: 0, limit: 100 });
            const rows = res?.data?.data?.data?.rows || res?.data?.data?.rows || [];
            setBrands(rows);
        } catch {
            toast.error("Failed to load brands");
        }
    };

    const updateField = (key: keyof VehicleModel, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const addTimeline = () => {
        if (!newTimeline.event.trim()) { toast.error("Event is required"); return; }
        setForm(prev => ({ ...prev, timeline: [...(prev.timeline || []), { ...newTimeline }] }));
        setNewTimeline({ year: new Date().getFullYear(), event: "", description: "" });
    };

    const removeTimeline = (idx: number) =>
        setForm(prev => ({ ...prev, timeline: (prev.timeline || []).filter((_, i) => i !== idx) }));

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-").trim();

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error("Model name is required"); return; }
        if (!form.slug.trim()) { toast.error("Slug is required"); return; }
        if (!form.brand_id.trim()) { toast.error("Brand is required"); return; }
        onSubmit(form);
    };

    const steps = [
        { icon: "bi-info-circle", label: "Basic Info" },
        { icon: "bi-car-front", label: "Details" },
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
                        {initialData ? "Edit Vehicle Model" : "Add New Vehicle Model"}
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
                                    <SectionTitle title="Basic Information" subtitle="Name, slug, and brand association" />
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Model Name <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            value={form.name}
                                            onChange={e => {
                                                updateField("name", e.target.value);
                                                if (!form.slug) updateField("slug", generateSlug(e.target.value));
                                            }}
                                            placeholder="e.g. Model S"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Slug <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            value={form.slug}
                                            onChange={e => updateField("slug", e.target.value)}
                                            placeholder="model-s"
                                        />
                                        <Form.Text className="text-muted">URL-friendly identifier. Auto-filled from name.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>
                                            Brand <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Select
                                            options={brandOptions}
                                            value={brandOptions.find(opt => opt.value === form.brand_id) || null}
                                            onChange={(selected: any) => updateField("brand_id", selected?.value || "")}
                                            placeholder="Search and select brand..."
                                            isClearable
                                        />
                                    </Form.Group>
                                </div>
                            )}

                            {activeSection === 1 && (
                                <div>
                                    <SectionTitle title="Model Details" subtitle="Body type, generation, and platform info" />
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Body Type</Form.Label>
                                                <Form.Select value={form.body_type} onChange={e => updateField("body_type", e.target.value)}>
                                                    <option value="">Select body type</option>
                                                    {bodyTypeOptions.map(b => <option key={b} value={b}>{b}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Production Years</Form.Label>
                                                <Form.Control
                                                    value={form.production_years}
                                                    onChange={e => updateField("production_years", e.target.value)}
                                                    placeholder="e.g. 2020–present"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Generation</Form.Label>
                                                <Form.Control
                                                    value={form.generation}
                                                    onChange={e => updateField("generation", e.target.value)}
                                                    placeholder="e.g. Gen 3"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Platform</Form.Label>
                                                <Form.Control
                                                    value={form.platform}
                                                    onChange={e => updateField("platform", e.target.value)}
                                                    placeholder="e.g. MEB Platform"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Model history timeline — shown on the website's car detail page */}
                                    <div style={{ border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden", marginTop: 8, marginBottom: 16 }}>
                                        <div style={{ padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#495057" }}>
                                                <i className="bi bi-clock-history me-2" />Model History Timeline
                                            </span>
                                            <div style={{ fontSize: 11, color: "#6c757d", marginTop: 2 }}>
                                                Launch / facelift / milestone events — shown on the website car page
                                            </div>
                                        </div>
                                        <div style={{ padding: "16px" }}>
                                            <Row>
                                                <Col md={2}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Year</Form.Label>
                                                        <Form.Control type="number" size="sm" value={newTimeline.year}
                                                            onChange={e => setNewTimeline(p => ({ ...p, year: parseInt(e.target.value) || new Date().getFullYear() }))} />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Event</Form.Label>
                                                        <Form.Control size="sm" value={newTimeline.event}
                                                            onChange={e => setNewTimeline(p => ({ ...p, event: e.target.value }))} placeholder="India Launch" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Description</Form.Label>
                                                        <Form.Control size="sm" value={newTimeline.description || ""}
                                                            onChange={e => setNewTimeline(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2} className="d-flex align-items-end mb-2">
                                                    <Button size="sm" variant="primary" onClick={addTimeline}>+ Add</Button>
                                                </Col>
                                            </Row>

                                            {(form.timeline || []).length === 0 && (
                                                <div style={{ textAlign: "center", padding: "12px", color: "#adb5bd", border: "1px dashed #dee2e6", borderRadius: 8, fontSize: 13 }}>
                                                    No timeline events yet
                                                </div>
                                            )}
                                            {(form.timeline || []).map((t, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e9ecef", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
                                                    <Badge bg="primary">{t.year}</Badge>
                                                    <div style={{ flex: 1, fontSize: 13 }}>
                                                        <strong>{t.event}</strong>
                                                        {t.description && <span className="text-muted ms-2">{t.description}</span>}
                                                    </div>
                                                    <Button size="sm" variant="outline-danger" onClick={() => removeTimeline(i)}><i className="bi bi-trash" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 2 && (
                                <div>
                                    <SectionTitle title="Settings" subtitle="Visibility and publish status" />
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Status</Form.Label>
                                        <div className="d-flex gap-3 mt-1">
                                            {statusOptions.map(s => (
                                                <Form.Check
                                                    key={s} type="radio" id={`mstatus-${s}`}
                                                    label={<Badge bg={statusBg(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>}
                                                    name="modelStatus" checked={form.status === s}
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
                                            <div style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>{form.name || "Model Name"}</div>
                                            <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                                                {form.body_type && `${form.body_type} · `}{form.production_years}
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
                        {activeSection < 2 ? (
                            <Button variant="primary" size="sm" onClick={() => setActiveSection(activeSection + 1)}>
                                Continue <i className="bi bi-chevron-right ms-1" />
                            </Button>
                        ) : activeSection === 2 ? (
                            <Button variant="success" size="sm" onClick={handleSubmit}>
                                <i className="bi bi-check2-circle me-1" />
                                {initialData ? "Update Model" : "Create Model"}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default ModelFormModal;
