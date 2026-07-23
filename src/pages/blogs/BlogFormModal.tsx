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
import { uploadMediaFile, getBlogLinks, addBlogLink, removeBlogLink, getAllBrands, getAllModels, getAllVehicles } from "../../service/common.service";
import { v4 as uuidv4 } from "uuid";

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

    // Links tab state
    const [linkedContent, setLinkedContent] = useState<{ vehicles: any[]; brands: any[]; models: any[] }>({ vehicles: [], brands: [], models: [] });
    const [linksLoading, setLinksLoading] = useState(false);
    const [linkSelect, setLinkSelect] = useState<{ vehicle: string; brand: string; model: string }>({ vehicle: "", brand: "", model: "" });
    const [linkingType, setLinkingType] = useState<string | null>(null);
    const [linkOptions, setLinkOptions] = useState<{ vehicles: any[]; brands: any[]; models: any[] }>({ vehicles: [], brands: [], models: [] });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                sections: (initialData.sections || []).map(section => ({
                    ...section,
                    images: Array.isArray(section.images) ? section.images : []
                }))
            });
        } else {
            resetForm();
        }
    }, [initialData]);

    useEffect(() => {
        if (activeSection === 5 && initialData?.id) {
            loadLinks();
            loadLinkOptions();
        }
    }, [activeSection]);

    const loadLinks = async () => {
        if (!initialData?.id) return;
        setLinksLoading(true);
        try {
            const data = await getBlogLinks(initialData.id);
            console.log("Load link data :", data?.data.data);
            setLinkedContent({
                vehicles: data?.data?.data.grouped?.vehicles || [],
                brands: data?.data?.data.grouped?.brands || [],
                models: data?.data?.data.grouped?.models || [],
            });
        } catch (e) {
            toast.error("Failed to load linked content");
        } finally {
            setLinksLoading(false);
        }
    };

    const loadLinkOptions = async () => {
        try {
            const [vRes, bRes, mRes] = await Promise.all([
                getAllVehicles({ offset: 0, limit: 100 }),
                getAllBrands({ offset: 0, limit: 100 }),
                getAllModels({ offset: 0, limit: 100 }),
            ]);
            setLinkOptions({
                vehicles: vRes?.data?.data?.data?.rows || vRes?.data?.data?.rows || [],
                brands: bRes?.data?.data?.data?.rows || bRes?.data?.data?.rows || [],
                models: mRes?.data?.data?.data?.rows || mRes?.data?.data?.rows || [],
            });
        } catch {
            // silently fail — dropdowns just stay empty
        }
    };

    const handleAddLink = async (type: "vehicle" | "brand" | "model") => {
        const entityId = linkSelect[type].trim();
        if (!entityId) { toast.error("Please enter an ID"); return; }
        if (!initialData?.id) { toast.error("Save the blog first before adding links"); return; }
        setLinkingType(type);
        try {
            await addBlogLink(initialData.id, type, entityId);
            toast.success("Link added");
            setLinkSelect(prev => ({ ...prev, [type]: "" }));
            await loadLinks();
        } catch (e: any) {
            toast.error(e?.message || "Failed to add link");
        } finally {
            setLinkingType(null);
        }
    };

    const handleRemoveLink = async (type: "vehicle" | "brand" | "model", entityId: string) => {
        if (!initialData?.id) return;
        setLinkingType(`remove-${type}-${entityId}`);
        try {
            await removeBlogLink(initialData.id, type, entityId);
            toast.success("Link removed");
            await loadLinks();
        } catch (e: any) {
            toast.error(e?.message || "Failed to remove link");
        } finally {
            setLinkingType(null);
        }
    };

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
        const updatedSections = [...(form.sections || [])];
        if (index >= 0 && index < updatedSections.length) {
            updatedSections[index] = {
                ...updatedSections[index],
                [key]: value
            };
            updateField("sections", updatedSections);
        }
    };

    const addSection = () => {
        const currentSections = form.sections || [];
        const newSection: BlogSection = {
            id: uuidv4(),
            heading: "",
            content: "",
            images: [],
            order: currentSections.length + 1
        };
        const newSections = [...currentSections, newSection];
        updateField("sections", newSections);
        // Expand the new section
        setExpandedSections(prev => [...prev, newSections.length - 1]);
    };

    const removeSection = (index: number) => {
        const currentSections = form.sections || [];
        const updatedSections = currentSections.filter((_, i) => i !== index);
        const reorderedSections = updatedSections.map((section, idx) => ({
            ...section,
            order: idx + 1
        }));
        updateField("sections", reorderedSections);
        // Remove from expanded sections and adjust indices
        setExpandedSections(prev =>
            prev
                .filter(i => i !== index)
                .map(i => i > index ? i - 1 : i)
        );
    };

    const toggleSection = (index: number) => {
        setExpandedSections(prev =>
            prev.includes(index) ? prev.filter(x => x !== index) : [...prev, index]
        );
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
        console.log('Uploaded URLs:', urls);
        if (isCoverImage) {
            updateField("cover_images", [...form.cover_images, ...urls]);
        } else if (sectionIndex !== undefined) {
            const section = form.sections[sectionIndex];
            updateSection(sectionIndex, "images", [...section.images, ...urls]);
        }

        // Reset file input to allow uploading again
        e.target.value = '';
    };

    const removeImage = (
        imageIndex: number,
        isCoverImage: boolean,
        sectionIndex?: number
    ) => {
        if (isCoverImage) {
            const updatedCoverImages = [...form.cover_images];
            updatedCoverImages.splice(imageIndex, 1);
            updateField("cover_images", updatedCoverImages);
            return;
        }

        if (sectionIndex === undefined) return;

        const updatedSections = [...(form.sections || [])];
        if (sectionIndex >= 0 && sectionIndex < updatedSections.length) {
            const sectionImages = [...(updatedSections[sectionIndex].images || [])];
            sectionImages.splice(imageIndex, 1);

            updatedSections[sectionIndex] = {
                ...updatedSections[sectionIndex],
                images: sectionImages
            };

            updateField("sections", updatedSections);
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
        const { id, ...payload } = form as any;
        // Ensure all sections have images as array (not null)
        const finalForm = {
            ...payload,
            sections: (payload.sections || []).map((section: any) => ({
                ...section,
                images: section.images || [] // Ensure images is always an array
            }))
        };

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
            onEscapeKeyDown={(e: any) => e.stopPropagation()} // Prevent escape key from closing
            backdrop="static" // Prevent clicking outside from closing
            scroll={true} // Enable scrolling
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
                            {initialData?.id && (
                                <button
                                    className={`nav-link text-start mb-2 ${activeSection === 5 ? 'active' : ''}`}
                                    onClick={() => setActiveSection(5)}
                                >
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Linked Content
                                </button>
                            )}
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    removeImage(idx, true);
                                                                }}
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

                                    {(form.sections || []).length === 0 ? ( // Add null check here
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-file-text fs-1 mb-2"></i>
                                            <p>No sections added yet</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {(form.sections || []).map((section, index) => ( // Add null check here
                                                <div key={section.id || `section-${index}`} className="card mb-3 border">
                                                    <div
                                                        className="card-header bg-light d-flex justify-content-between align-items-center"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => toggleSection(index)}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <i className={`bi bi-chevron-${expandedSections.includes(index) ? 'down' : 'right'} me-2`}></i>
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
                                                                    removeSection(index);
                                                                }}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {expandedSections.includes(index) && (
                                                        <div className="card-body">
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Heading</Form.Label>
                                                                <Form.Control
                                                                    value={section.heading || ""}
                                                                    onChange={e => updateSection(index, "heading", e.target.value)}
                                                                    placeholder="Section heading"
                                                                />
                                                            </Form.Group>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Content</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    value={section.content || ""}
                                                                    onChange={e => updateSection(index, "content", e.target.value)}
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
                                                                            handleFileUpload(e, "blogs/sections", false, index)
                                                                        }
                                                                        disabled={uploadingSection === index}
                                                                    />
                                                                    {uploadingSection === index && (
                                                                        <div className="text-muted mt-2 small">
                                                                            <i className="bi bi-upload me-1"></i>
                                                                            Uploading images...
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Section images preview */}
                                                                {(section.images || []).length > 0 && (
                                                                    <div className="mt-3">
                                                                        <p className="text-muted mb-2">
                                                                            <small>Section images ({section.images.length})</small>
                                                                        </p>
                                                                        <div className="d-flex flex-wrap gap-2">
                                                                            {section.images.map((url, imgIdx) => (
                                                                                <div key={imgIdx} className="position-relative" style={{ width: "60px", height: "60px" }}>
                                                                                    <img
                                                                                        src={url}
                                                                                        alt={`Section ${section.id} Image ${imgIdx + 1}`}
                                                                                        className="img-thumbnail w-100 h-100 object-fit-cover"
                                                                                    />
                                                                                    <button
                                                                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger p-0"
                                                                                        style={{ width: "16px", height: "16px", fontSize: "8px" }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation(); // Prevent event from bubbling up
                                                                                            e.preventDefault(); // Prevent default behavior
                                                                                            removeImage(imgIdx, false, index);
                                                                                        }}
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
                            {/* Linked Content */}
                            {activeSection === 5 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">
                                        <i className="bi bi-link-45deg me-2"></i>
                                        Linked Content
                                    </h5>
                                    {linksLoading ? (
                                        <div className="text-center py-4 text-muted">
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Loading linked content...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Vehicles */}
                                            <div className="mb-4">
                                                <h6 className="fw-semibold mb-2"><i className="bi bi-ev-front me-2"></i>Vehicles</h6>
                                                <InputGroup className="mb-2">
                                                    <Form.Select
                                                        value={linkSelect.vehicle}
                                                        onChange={e => setLinkSelect(prev => ({ ...prev, vehicle: e.target.value }))}
                                                    >
                                                        <option value="">-- Select a vehicle --</option>
                                                        {linkOptions.vehicles.map((v: any) => (
                                                            <option key={v.id} value={v.id}>{v.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                    <Button
                                                        variant="outline-primary"
                                                        onClick={() => handleAddLink("vehicle")}
                                                        disabled={linkingType === "vehicle" || !linkSelect.vehicle}
                                                    >
                                                        {linkingType === "vehicle" ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-plus me-1"></i>Link</>}
                                                    </Button>
                                                </InputGroup>
                                                {linkedContent.vehicles.length === 0 ? (
                                                    <p className="text-muted small">No vehicles linked</p>
                                                ) : (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {linkedContent.vehicles.map((item: any) => (
                                                            <Badge key={item.id} bg="primary" className="d-inline-flex align-items-center gap-1 py-2 px-2">
                                                                <span>{item.linked_entity?.name || item.linked_id}</span>
                                                                <button
                                                                    className="btn btn-sm p-0 ms-1 text-white"
                                                                    style={{ lineHeight: 1, fontSize: "0.75rem" }}
                                                                    disabled={linkingType === `remove-vehicle-${item.linked_id}`}
                                                                    onClick={() => handleRemoveLink("vehicle", item.linked_id)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Brands */}
                                            <div className="mb-4">
                                                <h6 className="fw-semibold mb-2"><i className="bi bi-building me-2"></i>Brands</h6>
                                                <InputGroup className="mb-2">
                                                    <Form.Select
                                                        value={linkSelect.brand}
                                                        onChange={e => setLinkSelect(prev => ({ ...prev, brand: e.target.value }))}
                                                    >
                                                        <option value="">-- Select a brand --</option>
                                                        {linkOptions.brands.map((b: any) => (
                                                            <option key={b.id} value={b.id}>{b.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                    <Button
                                                        variant="outline-success"
                                                        onClick={() => handleAddLink("brand")}
                                                        disabled={linkingType === "brand" || !linkSelect.brand}
                                                    >
                                                        {linkingType === "brand" ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-plus me-1"></i>Link</>}
                                                    </Button>
                                                </InputGroup>
                                                {linkedContent.brands.length === 0 ? (
                                                    <p className="text-muted small">No brands linked</p>
                                                ) : (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {linkedContent.brands.map((item: any) => (
                                                            <Badge key={item.id} bg="success" className="d-inline-flex align-items-center gap-1 py-2 px-2">
                                                                <span>{item.linked_entity?.name || item.linked_id}</span>
                                                                <button
                                                                    className="btn btn-sm p-0 ms-1 text-white"
                                                                    style={{ lineHeight: 1, fontSize: "0.75rem" }}
                                                                    disabled={linkingType === `remove-brand-${item.linked_id}`}
                                                                    onClick={() => handleRemoveLink("brand", item.linked_id)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Models */}
                                            <div className="mb-4">
                                                <h6 className="fw-semibold mb-2"><i className="bi bi-layers me-2"></i>Models</h6>
                                                <InputGroup className="mb-2">
                                                    <Form.Select
                                                        value={linkSelect.model}
                                                        onChange={e => setLinkSelect(prev => ({ ...prev, model: e.target.value }))}
                                                    >
                                                        <option value="">-- Select a model --</option>
                                                        {linkOptions.models.map((m: any) => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                    <Button
                                                        variant="outline-warning"
                                                        onClick={() => handleAddLink("model")}
                                                        disabled={linkingType === "model" || !linkSelect.model}
                                                    >
                                                        {linkingType === "model" ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-plus me-1"></i>Link</>}
                                                    </Button>
                                                </InputGroup>
                                                {linkedContent.models.length === 0 ? (
                                                    <p className="text-muted small">No models linked</p>
                                                ) : (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {linkedContent.models.map((item: any) => (
                                                            <Badge key={item.id} bg="warning" text="dark" className="d-inline-flex align-items-center gap-1 py-2 px-2">
                                                                <span>{item.linked_entity?.name || item.linked_id}</span>
                                                                <button
                                                                    className="btn btn-sm p-0 ms-1"
                                                                    style={{ lineHeight: 1, fontSize: "0.75rem" }}
                                                                    disabled={linkingType === `remove-model-${item.linked_id}`}
                                                                    onClick={() => handleRemoveLink("model", item.linked_id)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
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
                        ) : activeSection === 4 ? (
                            <Button variant="primary" onClick={handleSubmit}>
                                {initialData ? "Update Blog" : "Create Blog"}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </Offcanvas>
    );
};

export default BlogFormModal;