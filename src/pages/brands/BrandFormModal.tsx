import React, { useEffect, useState } from "react";
import { Offcanvas, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Brand, BrandStatus } from "./types/brand";
import { toast } from "react-toastify";
import { uploadMediaFile } from "../../service/common.service";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Brand) => void;
    initialData?: Brand | null;
}

const defaultForm: Brand = {
    name: "", slug: "", logo: "", country: "", founded: undefined,
    description: "", website: "", status: "active"
};

const BrandFormModal: React.FC<Props> = ({ show, onHide, onSubmit, initialData }) => {
    const [form, setForm] = useState<Brand>(defaultForm);
    const [uploading, setUploading] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        if (initialData) {
            const { id, created_at, created_by,updated_by, updated_at, is_deleted, _count, ...clean } = initialData;
            setForm(clean);
        } else {
            setForm(defaultForm);
            setActiveSection(0);
        }
    }, [initialData, show]);

    const updateField = (key: keyof Brand, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-").trim();

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const url = await uploadMediaFile(files[0], "brands");
            updateField("logo", url);
            toast.success("Logo uploaded successfully");
        } catch {
            toast.error("Logo upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error("Brand name is required"); return; }
        if (!form.slug.trim()) { toast.error("Slug is required"); return; }
        onSubmit(form);
    };

    const statusOptions: BrandStatus[] = ["active", "inactive", "archived"];

    const steps = [
        { icon: "bi-info-circle", label: "Basic Info" },
        { icon: "bi-image", label: "Logo" },
        { icon: "bi-gear", label: "Settings" },
    ];

    return (
        <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: "700px" }}>
            <Offcanvas.Header closeButton className="bg-light border-bottom">
                <Offcanvas.Title className="fw-bold">
                    {initialData ? "Edit Brand" : "Add New Brand"}
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
                                        <Form.Label>Brand Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            value={form.name}
                                            onChange={e => {
                                                updateField("name", e.target.value);
                                                if (!form.slug) updateField("slug", generateSlug(e.target.value));
                                            }}
                                            placeholder="e.g. Tesla"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
                                        <Form.Control value={form.slug} onChange={e => updateField("slug", e.target.value)} placeholder="tesla" />
                                        <Form.Text className="text-muted">URL-friendly identifier</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control as="textarea" rows={3} value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Brand description..." />
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Country of Origin</Form.Label>
                                                <Form.Control value={form.country} onChange={e => updateField("country", e.target.value)} placeholder="e.g. USA" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Founded Year</Form.Label>
                                                <Form.Control type="number" value={form.founded || ""} onChange={e => updateField("founded", parseInt(e.target.value) || undefined)} placeholder="e.g. 2003" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Website URL</Form.Label>
                                        <Form.Control value={form.website} onChange={e => updateField("website", e.target.value)} placeholder="https://www.tesla.com" type="url" />
                                    </Form.Group>
                                </div>
                            )}

                            {activeSection === 1 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-image me-2"></i>Brand Logo</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Upload Logo</Form.Label>
                                        <Form.Control type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                        {uploading && <div className="text-muted mt-2 small"><i className="bi bi-upload me-1"></i>Uploading...</div>}
                                    </Form.Group>
                                    {form.logo ? (
                                        <div className="border rounded p-3 bg-light text-center">
                                            <img src={form.logo} alt="Logo Preview" style={{ maxHeight: 120, objectFit: "contain" }} className="img-fluid rounded" />
                                            <div className="mt-2">
                                                <Button variant="outline-danger" size="sm" onClick={() => updateField("logo", "")}>
                                                    <i className="bi bi-trash me-1"></i>Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center border rounded p-5 bg-light">
                                            <i className="bi bi-image fs-1 text-muted"></i>
                                            <p className="text-muted mt-2">No logo uploaded</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 2 && (
                                <div>
                                    <h5 className="mb-3"><i className="bi bi-gear me-2"></i>Settings</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <div className="d-flex gap-3">
                                            {statusOptions.map(s => (
                                                <Form.Check key={s} type="radio" id={`status-${s}`}
                                                    label={<Badge bg={s === "active" ? "success" : s === "inactive" ? "secondary" : "danger"}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>}
                                                    name="brandStatus" checked={form.status === s} onChange={() => updateField("status", s)}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>
                                    <div className="card border mt-4">
                                        <div className="card-header bg-light"><h6 className="mb-0">Preview</h6></div>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center gap-3">
                                                {form.logo ? (
                                                    <img src={form.logo} alt="Logo" style={{ width: 50, height: 50, objectFit: "contain" }} />
                                                ) : (
                                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                                                        <i className="bi bi-building text-muted fs-4"></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <strong>{form.name || "Brand Name"}</strong>
                                                    <div className="text-muted small">{form.country || ""}{form.founded ? ` · Est. ${form.founded}` : ""}</div>
                                                    <div className="mt-1"><Badge bg={form.status === "active" ? "success" : "secondary"}>{form.status}</Badge></div>
                                                </div>
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
                                {initialData ? "Update Brand" : "Create Brand"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default BrandFormModal;
