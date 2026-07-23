import React, { useEffect, useState } from "react";
import { Offcanvas, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Dealer, DealerStatus, DealerService } from "./types/dealer";
import { toast } from "react-toastify";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Dealer) => void;
    initialData?: Dealer | null;
}

const defaultForm: Dealer = {
    name: "", address: "", city: "", state: "", country: "", pincode: "",
    phone: "", email: "", website: "", brands: [], services: [], rating: undefined, status: "active"
};

const statusOptions: DealerStatus[] = ["active", "inactive", "closed"];
const serviceOptions: DealerService[] = [
    "sales", "service", "parts", "financing", "insurance",
    "test-drive", "home-delivery", "charging-installation",
    "maintenance", "repair", "body-shop", "rental"
];

const DealerFormModal: React.FC<Props> = ({ show, onHide, onSubmit, initialData }) => {
    const [form, setForm] = useState<Dealer>(defaultForm);
    const [activeSection, setActiveSection] = useState(0);
    const [newBrand, setNewBrand] = useState("");

    useEffect(() => {
        if (initialData) {
            const { id, created_at, updated_at, is_deleted, ...clean } = initialData;
            setForm({ ...defaultForm, ...clean });
        } else {
            setForm(defaultForm);
            setActiveSection(0);
        }
        setNewBrand("");
    }, [initialData, show]);

    const updateField = (key: keyof Dealer, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const toggleService = (service: DealerService) => {
        const current = form.services || [];
        if (current.includes(service)) {
            updateField("services", current.filter(s => s !== service));
        } else {
            updateField("services", [...current, service]);
        }
    };

    const addBrand = () => {
        if (!newBrand.trim()) return;
        updateField("brands", [...(form.brands || []), newBrand.trim()]);
        setNewBrand("");
    };

    const removeBrand = (index: number) => {
        updateField("brands", (form.brands || []).filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error("Dealer name is required"); return; }
        if (!form.address.trim()) { toast.error("Address is required"); return; }
        if (!form.city.trim()) { toast.error("City is required"); return; }
        if (!form.state.trim()) { toast.error("State is required"); return; }
        if (!form.country.trim()) { toast.error("Country is required"); return; }
        onSubmit(form);
    };

    const steps = [
        { icon: "bi-info-circle", label: "Basic Info" },
        { icon: "bi-geo-alt", label: "Location" },
        { icon: "bi-wrench", label: "Services" },
        { icon: "bi-gear", label: "Settings" },
    ];

    return (
        <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: "700px" }}>
            <Offcanvas.Header closeButton className="bg-light border-bottom">
                <Offcanvas.Title className="fw-bold">
                    {initialData ? "Edit Dealer" : "Add New Dealer"}
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="p-0">
                <div className="d-flex" style={{ height: "calc(100vh - 73px)" }}>
                    <div className="border-end bg-light" style={{ width: "200px" }}>
                        <nav className="nav flex-column p-3">
                            {steps.map((step, i) => (
                                <button key={i} className={`nav-link text-start mb-2 ${activeSection === i ? "active" : ""}`} onClick={() => setActiveSection(i)}>
                                    <i className={`bi ${step.icon} me-2`}></i>{step.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex-grow-1" style={{ overflowY: "auto", padding: "20px" }}>
                        <Form>
                            {activeSection === 0 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-info-circle me-2"></i>Basic Information</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Dealer Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. AutoNation EV Center" />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+1-800-000-0000" type="tel" />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="dealer@example.com" type="email" />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Website</Form.Label>
                                        <Form.Control value={form.website} onChange={e => updateField("website", e.target.value)} placeholder="https://dealer.com" type="url" />
                                    </Form.Group>
                                </div>
                            )}

                            {activeSection === 1 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-geo-alt me-2"></i>Location</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                                        <Form.Control value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="Street address" />
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>City <span className="text-danger">*</span></Form.Label>
                                                <Form.Control value={form.city} onChange={e => updateField("city", e.target.value)} placeholder="City" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>State <span className="text-danger">*</span></Form.Label>
                                                <Form.Control value={form.state} onChange={e => updateField("state", e.target.value)} placeholder="State/Province" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                                                <Form.Control value={form.country} onChange={e => updateField("country", e.target.value)} placeholder="Country" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Pincode</Form.Label>
                                                <Form.Control value={form.pincode} onChange={e => updateField("pincode", e.target.value)} placeholder="ZIP/Postal Code" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {activeSection === 2 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-wrench me-2"></i>Services & Brands</h5>
                                    <Form.Label>Services Offered</Form.Label>
                                    <div className="d-flex flex-wrap gap-2 mb-4">
                                        {serviceOptions.map(service => (
                                            <Badge
                                                key={service}
                                                bg={(form.services || []).includes(service) ? "primary" : "light"}
                                                text={(form.services || []).includes(service) ? undefined : "dark"}
                                                className="px-3 py-2"
                                                style={{ cursor: "pointer", border: "1px solid #dee2e6" }}
                                                onClick={() => toggleService(service)}
                                            >
                                                {service}
                                            </Badge>
                                        ))}
                                    </div>

                                    <Form.Label>Brand IDs</Form.Label>
                                    <div className="d-flex gap-2 mb-2">
                                        <Form.Control
                                            value={newBrand}
                                            onChange={e => setNewBrand(e.target.value)}
                                            placeholder="Enter brand ID"
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBrand())}
                                        />
                                        <Button variant="outline-primary" onClick={addBrand}>Add</Button>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {(form.brands || []).map((b, i) => (
                                            <Badge key={i} bg="secondary" className="px-2 py-1 d-flex align-items-center gap-1">
                                                {b}
                                                <i className="bi bi-x" style={{ cursor: "pointer" }} onClick={() => removeBrand(i)}></i>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeSection === 3 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-gear me-2"></i>Settings</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <div className="d-flex gap-3">
                                            {statusOptions.map(s => (
                                                <Form.Check key={s} type="radio" id={`dstatus-${s}`}
                                                    label={<Badge bg={s === "active" ? "success" : s === "inactive" ? "secondary" : "danger"}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>}
                                                    name="dealerStatus" checked={form.status === s} onChange={() => updateField("status", s)}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Rating (0–5)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={form.rating ?? ""}
                                            onChange={e => updateField("rating", parseFloat(e.target.value) || undefined)}
                                            placeholder="e.g. 4.5"
                                        />
                                    </Form.Group>
                                    <div className="card border mt-4">
                                        <div className="card-header bg-light"><h6 className="mb-0">Preview</h6></div>
                                        <div className="card-body">
                                            <strong>{form.name || "Dealer Name"}</strong>
                                            <div className="text-muted small">{[form.city, form.state, form.country].filter(Boolean).join(", ")}</div>
                                            <div className="mt-1">
                                                <Badge bg={form.status === "active" ? "success" : form.status === "inactive" ? "secondary" : "danger"}>{form.status}</Badge>
                                                {form.rating && <span className="text-warning ms-2">{"★".repeat(Math.round(form.rating))} ({form.rating})</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </Offcanvas.Body>

            <div className="border-top bg-light p-3">
                <div className="d-flex justify-content-between">
                    <div>
                        {activeSection > 0 && (
                            <Button variant="outline-secondary" onClick={() => setActiveSection(activeSection - 1)}>
                                <i className="bi bi-chevron-left me-1"></i>Previous
                            </Button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={onHide}>Cancel</Button>
                        {activeSection < steps.length - 1 ? (
                            <Button variant="outline-primary" onClick={() => setActiveSection(activeSection + 1)}>
                                Next<i className="bi bi-chevron-right ms-1"></i>
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit}>
                                {initialData ? "Update Dealer" : "Create Dealer"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default DealerFormModal;
