// src/pages/banners/BannerFormModal.tsx
import React, { useEffect, useState } from "react";
import {
    Offcanvas,
    Button,
    Form,
    Row,
    Col,
    Badge,
    InputGroup
} from "react-bootstrap";
import { Banner, BannerPosition, BannerStatus } from "./types/banner";
import { toast } from "react-toastify";
import { uploadMediaFile } from "../../service/common.service";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Banner) => void;
    initialData?: Banner | null;
}

const BannerFormModal: React.FC<Props> = ({
    show,
    onHide,
    onSubmit,
    initialData
}) => {
    const [form, setForm] = useState<Banner>({
        title: "",
        slug: "",
        image_url: "",
        redirect_url: "",
        position: "HOME_TOP",
        priority: 1,
        start_date: "",
        end_date: "",
        status: "active"
    });
    const [uploading, setUploading] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        if (initialData) {
            const { id, created_at, updated_at, created_by, updated_by, is_deleted, ...cleanData } = initialData;
            setForm(cleanData);
        } else {
            resetForm();
        }
    }, [initialData]);

    const resetForm = () => {
        setForm({
            title: "",
            slug: "",
            image_url: "",
            redirect_url: "",
            position: "HOME_TOP",
            priority: 1,
            start_date: "",
            end_date: "",
            status: "active"
        });
    };

    const updateField = (key: keyof Banner, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const file = files[0];
            const url = await uploadMediaFile(file, "banners");
            
            updateField("image_url", url);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const getStatusBadge = (status: BannerStatus) => {
        const statusConfig = {
            active: { bg: "success", text: "Active" },
            inactive: { bg: "secondary", text: "Inactive" },
            scheduled: { bg: "warning", text: "Scheduled" },
            expired: { bg: "danger", text: "Expired" }
        };
        const config = statusConfig[status];
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const getPositionLabel = (position: BannerPosition) => {
        const positionLabels: Record<BannerPosition, string> = {
            HOME_TOP: "Home Page - Top",
            HOME_MIDDLE: "Home Page - Middle",
            HOME_BOTTOM: "Home Page - Bottom",
            CATEGORY_TOP: "Category Page - Top",
            PRODUCT_DETAIL: "Product Detail Page",
            CHECKOUT_TOP: "Checkout Page - Top",
            POPUP: "Popup Banner"
        };
        return positionLabels[position];
    };

    const handleSubmit = () => {
        if (!form.title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!form.slug.trim()) {
            toast.error("Slug is required");
            return;
        }

        if (!form.image_url.trim()) {
            toast.error("Banner image is required");
            return;
        }

        if (!form.redirect_url.trim()) {
            toast.error("Redirect URL is required");
            return;
        }

        if (!form.start_date) {
            toast.error("Start date is required");
            return;
        }

        if (!form.end_date) {
            toast.error("End date is required");
            return;
        }

        if (new Date(form.end_date) <= new Date(form.start_date)) {
            toast.error("End date must be after start date");
            return;
        }

        onSubmit(form);
    };

    // Generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    };

    const positionOptions: BannerPosition[] = [
        "HOME_TOP",
        "HOME_MIDDLE",
        "HOME_BOTTOM",
        "CATEGORY_TOP",
        "PRODUCT_DETAIL",
        "CHECKOUT_TOP",
        "POPUP"
    ];

    const statusOptions: BannerStatus[] = ["active", "inactive", "scheduled"];

    return (
        <Offcanvas 
            show={show} 
            onHide={onHide} 
            placement="end" 
            style={{ width: "700px" }}
        >
            <Offcanvas.Header closeButton className="bg-light border-bottom">
                <Offcanvas.Title className="fw-bold">
                    {initialData ? "Edit Banner" : "Add New Banner"}
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="p-0">
                <div className="d-flex" style={{ height: "calc(100vh - 73px)" }}>
                    {/* Left sidebar for navigation */}
                    <div className="border-end bg-light" style={{ width: "200px" }}>
                        <nav className="nav flex-column p-3">
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 0 ? 'active' : ''}`}
                                onClick={() => setActiveSection(0)}
                            >
                                <i className="bi bi-info-circle me-2"></i>
                                Basic Info
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 1 ? 'active' : ''}`}
                                onClick={() => setActiveSection(1)}
                            >
                                <i className="bi bi-image me-2"></i>
                                Banner Image
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 2 ? 'active' : ''}`}
                                onClick={() => setActiveSection(2)}
                            >
                                <i className="bi bi-calendar me-2"></i>
                                Schedule
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 3 ? 'active' : ''}`}
                                onClick={() => setActiveSection(3)}
                            >
                                <i className="bi bi-gear me-2"></i>
                                Settings
                            </button>
                        </nav>
                    </div>

                    {/* Main content area */}
                    <div className="flex-grow-1" style={{ overflowY: "auto", padding: "20px" }}>
                        <Form>
                            {/* Basic Information */}
                            {activeSection === 0 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Basic Information
                                    </h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            value={form.title}
                                            onChange={e => {
                                                updateField("title", e.target.value);
                                                // Auto-generate slug if empty
                                                if (!form.slug && e.target.value) {
                                                    updateField("slug", generateSlug(e.target.value));
                                                }
                                            }}
                                            placeholder="Enter banner title"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            value={form.slug}
                                            onChange={e => updateField("slug", e.target.value)}
                                            placeholder="banner-url-slug"
                                        />
                                        <Form.Text className="text-muted">
                                            URL-friendly identifier for the banner
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Redirect URL <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            value={form.redirect_url}
                                            onChange={e => updateField("redirect_url", e.target.value)}
                                            placeholder="https://example.com/offers/sale"
                                            type="url"
                                        />
                                        <Form.Text className="text-muted">
                                            URL where users will be redirected when clicking the banner
                                        </Form.Text>
                                    </Form.Group>
                                </div>
                            )}

                            {/* Banner Image */}
                            {activeSection === 1 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-image me-2"></i>
                                        Banner Image
                                    </h5>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Upload Banner Image <span className="text-danger">*</span></Form.Label>
                                        <div className="mb-3">
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            {uploading && (
                                                <div className="text-muted mt-2 small">
                                                    <i className="bi bi-upload me-1"></i>
                                                    Uploading image, please wait...
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Image preview */}
                                        {form.image_url && (
                                            <div className="mt-3">
                                                <p className="text-muted mb-2">
                                                    <small>Banner Preview</small>
                                                </p>
                                                <div className="border rounded p-3 bg-light text-center">
                                                    <img 
                                                        src={form.image_url} 
                                                        alt="Banner Preview"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: "200px", objectFit: "contain" }}
                                                    />
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => updateField("image_url", "")}
                                                        >
                                                            <i className="bi bi-trash me-1"></i>
                                                            Remove Image
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-muted small">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Image URL: {form.image_url.substring(0, 50)}...
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!form.image_url && (
                                            <div className="text-center border rounded p-5 bg-light">
                                                <i className="bi bi-image fs-1 text-muted mb-3"></i>
                                                <p className="text-muted">No image uploaded yet</p>
                                            </div>
                                        )}
                                    </Form.Group>
                                </div>
                            )}

                            {/* Schedule */}
                            {activeSection === 2 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-calendar me-2"></i>
                                        Schedule
                                    </h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    value={form.start_date ? new Date(form.start_date).toISOString().slice(0, 16) : ""}
                                                    onChange={e => updateField("start_date", new Date(e.target.value).toISOString())}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    value={form.end_date ? new Date(form.end_date).toISOString().slice(0, 16) : ""}
                                                    onChange={e => updateField("end_date", new Date(e.target.value).toISOString())}
                                                    min={form.start_date ? new Date(form.start_date).toISOString().slice(0, 16) : ""}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    {form.start_date && form.end_date && (
                                        <div className="alert alert-info">
                                            <div className="d-flex">
                                                <i className="bi bi-clock me-2"></i>
                                                <div>
                                                    <strong>Banner Schedule:</strong>
                                                    <div className="small">
                                                        From: {new Date(form.start_date).toLocaleString()} <br />
                                                        To: {new Date(form.end_date).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Settings */}
                            {activeSection === 3 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-gear me-2"></i>
                                        Settings
                                    </h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Position <span className="text-danger">*</span></Form.Label>
                                                <Form.Select
                                                    value={form.position}
                                                    onChange={e => updateField("position", e.target.value as BannerPosition)}
                                                >
                                                    {positionOptions.map(position => (
                                                        <option key={position} value={position}>
                                                            {getPositionLabel(position)}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Text className="text-muted">
                                                    Where this banner will be displayed
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Priority <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={form.priority}
                                                    onChange={e => updateField("priority", parseInt(e.target.value) || 1)}
                                                />
                                                <Form.Text className="text-muted">
                                                    Higher number means higher priority (1-100)
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <div className="d-flex gap-3">
                                            {statusOptions.map(status => (
                                                <Form.Check
                                                    key={status}
                                                    type="radio"
                                                    id={`status-${status}`}
                                                    label={getStatusBadge(status)}
                                                    name="bannerStatus"
                                                    checked={form.status === status}
                                                    onChange={() => updateField("status", status)}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>

                                    {/* Preview Card */}
                                    <div className="card border mt-4">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Banner Preview</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-2">
                                                        <small className="text-muted">Title:</small>
                                                        <div className="fw-medium">{form.title || "Untitled Banner"}</div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <small className="text-muted">Position:</small>
                                                        <div>{getPositionLabel(form.position)}</div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <small className="text-muted">Status:</small>
                                                        <div>{getStatusBadge(form.status)}</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-8">
                                                    <div className="border rounded p-2 bg-light">
                                                        {form.image_url ? (
                                                            <img 
                                                                src={form.image_url} 
                                                                alt="Banner Preview"
                                                                className="img-fluid rounded"
                                                                style={{ maxHeight: "100px" }}
                                                            />
                                                        ) : (
                                                            <div className="text-center p-3">
                                                                <i className="bi bi-image text-muted fs-3"></i>
                                                                <div className="text-muted small">No image</div>
                                                            </div>
                                                        )}
                                                    </div>
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
                                <i className="bi bi-chevron-left me-1"></i>
                                Previous
                            </Button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={onHide}>
                            Cancel
                        </Button>
                        {activeSection < 3 ? (
                            <Button variant="outline-primary" onClick={() => setActiveSection(activeSection + 1)}>
                                Next
                                <i className="bi bi-chevron-right ms-1"></i>
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit}>
                                {initialData ? "Update Banner" : "Create Banner"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default BannerFormModal;