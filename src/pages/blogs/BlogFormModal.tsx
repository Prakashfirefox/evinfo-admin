// src/pages/blogs/BlogFormModal.tsx
import React, { useEffect, useState } from "react";
import {
    Button,
    Form,
    Row,
    Col,
    Badge,
    InputGroup,
    Offcanvas
} from "react-bootstrap";
import { Blog, BlogSection, BlogSEO } from "./types/blog";
import { toast } from "react-toastify";
import { uploadMediaFile } from "../../service/common.service";

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (payload: Blog) => void;
    initialData?: Blog | null;
}

const BlogFormModal: React.FC<Props> = ({
    show,
    onHide,
    onSubmit,
    initialData
}) => {
    const [form, setForm] = useState<Blog>({
        title: "",
        slug: "",
        excerpt: "",
        cover_images: [],
        categories: [],
        tags: [],
        sections: [],
        seo: {
            metaTitle: "",
            metaDescription: "",
            keywords: []
        },
        status: "draft",
        featured: false
    });
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingSection, setUploadingSection] = useState<number | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [newTag, setNewTag] = useState("");
    const [seoKeyword, setSeoKeyword] = useState("");
    const [activeSection, setActiveSection] = useState(0);
    const [expandedSections, setExpandedSections] = useState<number[]>([]);

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        } else {
            resetForm();
        }
    }, [initialData]);

    const resetForm = () => {
        setForm({
            title: "",
            slug: "",
            excerpt: "",
            cover_images: [],
            categories: [],
            tags: [],
            sections: [],
            seo: {
                metaTitle: "",
                metaDescription: "",
                keywords: []
            },
            status: "draft",
            featured: false
        });
        setNewCategory("");
        setNewTag("");
        setSeoKeyword("");
        setExpandedSections([]);
    };

    const updateField = (key: keyof Blog, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const updateSEOField = (key: keyof BlogSEO, value: any) => {
        setForm(prev => ({
            ...prev,
            seo: {
                ...prev.seo,
                [key]: value
            }
        }));
    };

    const updateSection = (index: number, key: keyof BlogSection, value: any) => {
        const updatedSections = [...form.sections];
        updatedSections[index] = {
            ...updatedSections[index],
            [key]: value
        };
        updateField("sections", updatedSections);
    };

    const addSection = () => {
        const newSection: BlogSection = {
            heading: "",
            content: "",
            images: [],
            order: form.sections.length + 1
        };
        updateField("sections", [...form.sections, newSection]);
        // Expand the new section
        setExpandedSections([...expandedSections, form.sections.length]);
    };

    const removeSection = (index: number) => {
        const updatedSections = form.sections.filter((_, i) => i !== index);
        const reorderedSections = updatedSections.map((section, idx) => ({
            ...section,
            order: idx + 1
        }));
        updateField("sections", reorderedSections);
        // Remove from expanded sections
        setExpandedSections(expandedSections.filter(i => i !== index));
    };

    const toggleSection = (index: number) => {
        if (expandedSections.includes(index)) {
            setExpandedSections(expandedSections.filter(i => i !== index));
        } else {
            setExpandedSections([...expandedSections, index]);
        }
    };

    const addCategory = () => {
        if (newCategory.trim()) {
            const categories = newCategory.split(",").map(cat => cat.trim()).filter(cat => cat);
            updateField("categories", [...form.categories, ...categories]);
            setNewCategory("");
        }
    };

    const removeCategory = (index: number) => {
        const updatedCategories = form.categories.filter((_, i) => i !== index);
        updateField("categories", updatedCategories);
    };

    const addTag = () => {
        if (newTag.trim()) {
            const tags = newTag.split(",").map(tag => tag.trim()).filter(tag => tag);
            updateField("tags", [...form.tags, ...tags]);
            setNewTag("");
        }
    };

    const removeTag = (index: number) => {
        const updatedTags = form.tags.filter((_, i) => i !== index);
        updateField("tags", updatedTags);
    };

    const addSeoKeyword = () => {
        if (seoKeyword.trim()) {
            const keywords = seoKeyword.split(",").map(kw => kw.trim()).filter(kw => kw);
            updateSEOField("keywords", [...form.seo.keywords, ...keywords]);
            setSeoKeyword("");
        }
    };

    const removeSeoKeyword = (index: number) => {
        const updatedKeywords = form.seo.keywords.filter((_, i) => i !== index);
        updateSEOField("keywords", updatedKeywords);
    };

    const uploadImages = async (
        files: FileList,
        folder: string,
        sectionIndex?: number
    ): Promise<string[]> => {
        if (sectionIndex !== undefined) {
            setUploadingSection(sectionIndex);
        } else {
            setUploadingCover(true);
        }
        
        try {
            const urls = await Promise.all(
                Array.from(files).map(file =>
                    uploadMediaFile(file, folder)
                )
            );

            toast.success(`${files.length} image(s) uploaded successfully`);
            return urls;
        } catch (error: any) {
            toast.error("Image upload failed");
            return [];
        } finally {
            if (sectionIndex !== undefined) {
                setUploadingSection(null);
            } else {
                setUploadingCover(false);
            }
        }
    };

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        folder: string,
        isCoverImage: boolean = false,
        sectionIndex?: number
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const urls = await uploadImages(files, folder, sectionIndex);
        
        if (isCoverImage) {
            updateField("cover_images", [...form.cover_images, ...urls]);
        } else if (sectionIndex !== undefined) {
            const section = form.sections[sectionIndex];
            updateSection(sectionIndex, "images", [...section.images, ...urls]);
        }

        // Reset file input to allow uploading again
        e.target.value = '';
    };

    const removeImage = (index: number, isCoverImage: boolean = true, sectionIndex?: number) => {
        if (isCoverImage) {
            const updatedImages = form.cover_images.filter((_, i) => i !== index);
            updateField("cover_images", updatedImages);
            toast.success("Cover image removed");
        } else if (sectionIndex !== undefined) {
            const section = form.sections[sectionIndex];
            const updatedImages = section.images.filter((_, i) => i !== index);
            updateSection(sectionIndex, "images", updatedImages);
            toast.success("Section image removed");
        }
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

        const finalForm = { ...form };
        if (!finalForm.seo.metaTitle) {
            finalForm.seo.metaTitle = finalForm.title;
        }
        if (!finalForm.seo.metaDescription && finalForm.excerpt) {
            finalForm.seo.metaDescription = finalForm.excerpt.substring(0, 160);
        }

        onSubmit(finalForm);
    };

    return (
        <Offcanvas 
            show={show} 
            onHide={onHide} 
            placement="end" 
            style={{ width: "800px" }}
            className="blog-form-offcanvas"
        >
            <Offcanvas.Header closeButton className="bg-light border-bottom">
                <Offcanvas.Title className="fw-bold">
                    {initialData ? "Edit Blog" : "Add New Blog"}
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
                                <i className="bi bi-tags me-2"></i>
                                Categories & Tags
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 2 ? 'active' : ''}`}
                                onClick={() => setActiveSection(2)}
                            >
                                <i className="bi bi-file-text me-2"></i>
                                Content Sections
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 3 ? 'active' : ''}`}
                                onClick={() => setActiveSection(3)}
                            >
                                <i className="bi bi-search me-2"></i>
                                SEO Settings
                            </button>
                            <button 
                                className={`nav-link text-start mb-2 ${activeSection === 4 ? 'active' : ''}`}
                                onClick={() => setActiveSection(4)}
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
                                    <Row>
                                        <Col md={8}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    value={form.title}
                                                    onChange={e => updateField("title", e.target.value)}
                                                    placeholder="Enter blog title"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    value={form.slug}
                                                    onChange={e => updateField("slug", e.target.value)}
                                                    placeholder="blog-url-slug"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Excerpt</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={form.excerpt}
                                            onChange={e => updateField("excerpt", e.target.value)}
                                            placeholder="Brief description of the blog"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Cover Images</Form.Label>
                                        <div className="mb-3">
                                            <Form.Control
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                                    handleFileUpload(e, "blogs/covers", true)
                                                }
                                                disabled={uploadingCover}
                                            />
                                            {uploadingCover && (
                                                <div className="text-muted mt-2 small">
                                                    <i className="bi bi-upload me-1"></i>
                                                    Uploading images, please wait...
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Uploaded images preview */}
                                        {form.cover_images.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-muted mb-2">
                                                    <small>Uploaded images ({form.cover_images.length})</small>
                                                </p>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {form.cover_images.map((url, idx) => (
                                                        <div key={idx} className="position-relative" style={{ width: "80px", height: "80px" }}>
                                                            <img 
                                                                src={url} 
                                                                alt={`Cover ${idx + 1}`}
                                                                className="img-thumbnail w-100 h-100 object-fit-cover"
                                                                style={{ borderRadius: "4px" }}
                                                            />
                                                            <button
                                                                className="position-absolute top-0 end-0 btn btn-sm btn-danger p-0"
                                                                style={{ width: "20px", height: "20px", fontSize: "10px" }}
                                                                onClick={() => removeImage(idx)}
                                                            >
                                                                ×
                                                            </button>
                                                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white text-center small py-1">
                                                                {url.split('/').pop()?.substring(0, 10)}...
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Form.Group>
                                </div>
                            )}

                            {/* Categories & Tags */}
                            {activeSection === 1 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-tags me-2"></i>
                                        Categories & Tags
                                    </h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Categories</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        value={newCategory}
                                                        onChange={e => setNewCategory(e.target.value)}
                                                        placeholder="Add categories (comma separated)"
                                                    />
                                                    <Button variant="outline-primary" onClick={addCategory}>
                                                        <i className="bi bi-plus"></i>
                                                    </Button>
                                                </InputGroup>
                                                <div className="mt-2">
                                                    {form.categories.map((cat, idx) => (
                                                        <Badge key={idx} bg="primary" className="me-2 mb-2 d-inline-flex align-items-center">
                                                            {cat}
                                                            <Button
                                                                variant="link"
                                                                className="text-white p-0 ms-2"
                                                                style={{ fontSize: "0.7rem" }}
                                                                onClick={() => removeCategory(idx)}
                                                            >
                                                                ×
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Tags</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        value={newTag}
                                                        onChange={e => setNewTag(e.target.value)}
                                                        placeholder="Add tags (comma separated)"
                                                    />
                                                    <Button variant="outline-success" onClick={addTag}>
                                                        <i className="bi bi-plus"></i>
                                                    </Button>
                                                </InputGroup>
                                                <div className="mt-2">
                                                    {form.tags.map((tag, idx) => (
                                                        <Badge key={idx} bg="success" className="me-2 mb-2 d-inline-flex align-items-center">
                                                            {tag}
                                                            <Button
                                                                variant="link"
                                                                className="text-white p-0 ms-2"
                                                                style={{ fontSize: "0.7rem" }}
                                                                onClick={() => removeTag(idx)}
                                                            >
                                                                ×
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* Sections */}
                            {activeSection === 2 && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">
                                            <i className="bi bi-file-text me-2"></i>
                                            Content Sections
                                        </h5>
                                        <Button variant="outline-primary" size="sm" onClick={addSection}>
                                            <i className="bi bi-plus me-1"></i>
                                            Add Section
                                        </Button>
                                    </div>
                                    
                                    {form.sections.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-file-text fs-1 mb-2"></i>
                                            <p>No sections added yet</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {form.sections.map((section, idx) => (
                                                <div key={idx} className="card mb-3 border">
                                                    <div 
                                                        className="card-header bg-light d-flex justify-content-between align-items-center"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => toggleSection(idx)}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <i className={`bi bi-chevron-${expandedSections.includes(idx) ? 'down' : 'right'} me-2`}></i>
                                                            <span className="fw-medium">Section {section.order}</span>
                                                            {section.heading && (
                                                                <span className="text-muted small ms-2">- {section.heading}</span>
                                                            )}
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeSection(idx);
                                                                }}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {expandedSections.includes(idx) && (
                                                        <div className="card-body">
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Heading</Form.Label>
                                                                <Form.Control
                                                                    value={section.heading}
                                                                    onChange={e => updateSection(idx, "heading", e.target.value)}
                                                                    placeholder="Section heading"
                                                                />
                                                            </Form.Group>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Content</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    value={section.content}
                                                                    onChange={e => updateSection(idx, "content", e.target.value)}
                                                                    placeholder="Section content"
                                                                />
                                                            </Form.Group>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Section Images</Form.Label>
                                                                <div className="mb-2">
                                                                    <Form.Control
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                                                            handleFileUpload(e, "blogs/sections", false, idx)
                                                                        }
                                                                        disabled={uploadingSection === idx}
                                                                    />
                                                                    {uploadingSection === idx && (
                                                                        <div className="text-muted mt-2 small">
                                                                            <i className="bi bi-upload me-1"></i>
                                                                            Uploading images...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Section images preview */}
                                                                {section.images.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <p className="text-muted mb-2">
                                                                            <small>Section images ({section.images.length})</small>
                                                                        </p>
                                                                        <div className="d-flex flex-wrap gap-2">
                                                                            {section.images.map((url, imgIdx) => (
                                                                                <div key={imgIdx} className="position-relative" style={{ width: "60px", height: "60px" }}>
                                                                                    <img 
                                                                                        src={url} 
                                                                                        alt={`Section ${idx + 1} Image ${imgIdx + 1}`}
                                                                                        className="img-thumbnail w-100 h-100 object-fit-cover"
                                                                                    />
                                                                                    <button
                                                                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger p-0"
                                                                                        style={{ width: "16px", height: "16px", fontSize: "8px" }}
                                                                                        onClick={() => removeImage(imgIdx, false, idx)}
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SEO Information */}
                            {activeSection === 3 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-search me-2"></i>
                                        SEO Settings
                                    </h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Meta Title</Form.Label>
                                        <Form.Control
                                            value={form.seo.metaTitle}
                                            onChange={e => updateSEOField("metaTitle", e.target.value)}
                                            placeholder="SEO title for search engines"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Meta Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={form.seo.metaDescription}
                                            onChange={e => updateSEOField("metaDescription", e.target.value)}
                                            placeholder="SEO description for search engines"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Keywords</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                value={seoKeyword}
                                                onChange={e => setSeoKeyword(e.target.value)}
                                                placeholder="Add keywords (comma separated)"
                                            />
                                            <Button variant="outline-info" onClick={addSeoKeyword}>
                                                <i className="bi bi-plus"></i>
                                            </Button>
                                        </InputGroup>
                                        <div className="mt-2">
                                            {form.seo.keywords.map((keyword, idx) => (
                                                <Badge key={idx} bg="info" className="me-2 mb-2 d-inline-flex align-items-center">
                                                    {keyword}
                                                    <Button
                                                        variant="link"
                                                        className="text-white p-0 ms-2"
                                                        style={{ fontSize: "0.7rem" }}
                                                        onClick={() => removeSeoKeyword(idx)}
                                                    >
                                                        ×
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </div>
                            )}

                            {/* Status & Featured */}
                            {activeSection === 4 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-gear me-2"></i>
                                        Settings
                                    </h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Status</Form.Label>
                                                <Form.Select
                                                    value={form.status}
                                                    onChange={e => updateField("status", e.target.value as "draft" | "published")}
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="switch"
                                                    id="featured-switch"
                                                    label="Featured Blog"
                                                    checked={form.featured}
                                                    onChange={e => updateField("featured", e.target.checked)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
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
                        {activeSection < 4 ? (
                            <Button variant="outline-primary" onClick={() => setActiveSection(activeSection + 1)}>
                                Next
                                <i className="bi bi-chevron-right ms-1"></i>
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit}>
                                {initialData ? "Update Blog" : "Create Blog"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default BlogFormModal;