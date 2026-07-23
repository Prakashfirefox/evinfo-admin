import React, { useEffect, useMemo, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import VariantFormModal from "./VariantFormModal";
import { Variant } from "./types/variant";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllVariants, createVariant, updateVariant, deleteVariant, updateVariantStatus,
    getAllBrands, getAllModels
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

type BrandLite = { id: string; name: string };
type ModelLite = { id: string; name: string; brand_id?: string };

const Variants: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const brandFilter = searchParams.get("brand_id") || "";
    const modelFilter = searchParams.get("model_id") || "";

    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [brands, setBrands] = useState<BrandLite[]>([]);
    const [models, setModels] = useState<ModelLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editVariant, setEditVariant] = useState<Variant | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const activeBrand = useMemo(() => brands.find(b => b.id === brandFilter), [brands, brandFilter]);
    const activeModel = useMemo(() => models.find(m => m.id === modelFilter), [models, modelFilter]);

    // Load brands once
    useEffect(() => {
        (async () => {
            const res = await getAllBrands({ search: "", offset: 0, limit: 100 });
            if (res?.data?.status) {
                const rows = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setBrands(rows.map((b: any) => ({ id: b.id, name: b.name })));
            }
        })();
    }, []);

    // Load models — filtered by brand if one is selected
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

    const fetchVariants = async () => {
        setLoading(true);
        const payload: any = { search, offset, limit };
        if (modelFilter) payload.model_id = modelFilter;
        else if (brandFilter) payload.brand_id = brandFilter;

        const res = await getAllVariants(payload);
        if (res?.data?.status) {
            const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
            setVariants(list);
            setTotal(res.data.data?.count || 0);
        } else {
            setVariants([]);
            setTotal(0);
        }
        setLoading(false);
    };

    useEffect(() => { fetchVariants(); }, [search, offset, brandFilter, modelFilter]);

    useEffect(() => {
        setOffset(0);
        setCurrentPage(1);
    }, [brandFilter, modelFilter, search]);

    const updateFilter = (key: "brand_id" | "model_id", value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        // Clearing brand also clears model (model is scoped to brand)
        if (key === "brand_id" && !value) next.delete("model_id");
        setSearchParams(next);
    };

    const saveVariant = async (payload: Variant) => {
        const res = editVariant
            ? await updateVariant(editVariant.id!, payload)
            : await createVariant(payload);

        if (res?.data?.status) {
            toast.success(editVariant ? "Variant updated successfully" : "Variant created successfully");
            setShowModal(false);
            setEditVariant(null);
            fetchVariants();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this variant?")) return;
        const res = await deleteVariant(id);
        if (res?.data?.status) {
            toast.success("Variant deleted successfully");
            fetchVariants();
        }
    };

    const toggleStatus = async (variant: Variant) => {
        const newStatus = variant.status === "active" ? "discontinued" : "active";
        const res = await updateVariantStatus(variant.id!, newStatus);
        if (res?.data?.status) {
            toast.success(`Variant status updated to ${newStatus}`);
            fetchVariants();
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { bg: string }> = {
            active: { bg: "success" }, discontinued: { bg: "danger" }, upcoming: { bg: "warning" }
        };
        return <Badge bg={map[status]?.bg || "secondary"}>{status}</Badge>;
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
                            <h4 className="fw-bold">Variants</h4>
                            <p className="text-muted mb-0">
                                Manage vehicle variants
                                {(activeBrand || activeModel) && (
                                    <span className="ms-2">
                                        · Filtered by{" "}
                                        {activeBrand && <Badge bg="info" className="me-1">{activeBrand.name}</Badge>}
                                        {activeModel && <Badge bg="info">{activeModel.name}</Badge>}
                                    </span>
                                )}
                            </p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ Add Variant</Button>
                    </div>

                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <Form.Select
                            value={brandFilter}
                            onChange={e => updateFilter("brand_id", e.target.value)}
                            style={{ maxWidth: 220 }}
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Select>

                        <Form.Select
                            value={modelFilter}
                            onChange={e => updateFilter("model_id", e.target.value)}
                            style={{ maxWidth: 220 }}
                            disabled={!brandFilter && models.length === 0}
                        >
                            <option value="">{brandFilter ? "All Models for brand" : "All Models"}</option>
                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Form.Select>

                        <InputGroup style={{ maxWidth: 300 }}>
                            <Form.Control placeholder="Search variants..." value={search} onChange={e => setSearch(e.target.value)} />
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>

                        {(brandFilter || modelFilter) && (
                            <Button variant="outline-secondary" size="sm" onClick={() => setSearchParams(new URLSearchParams())}>
                                <i className="bi bi-x-circle"></i> Clear filters
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading variants...</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Trim</th>
                                                <th className="px-4 py-3">Segment</th>
                                                <th className="px-4 py-3">Launch Year</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4">No variants found</td></tr>
                                            ) : (
                                                variants.map(variant => (
                                                    <tr key={variant.id}>
                                                        <td className="px-4 py-3">
                                                            <strong>{variant.name}</strong>
                                                            <div className="text-muted small">{variant.slug}</div>
                                                        </td>
                                                        <td className="px-4 py-3">{variant.trim || "—"}</td>
                                                        <td className="px-4 py-3">{variant.segment || "—"}</td>
                                                        <td className="px-4 py-3">{variant.launch_year || "—"}</td>
                                                        <td className="px-4 py-3">{getStatusBadge(variant.status)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                <Button size="sm" variant="outline-info" onClick={() => variant.id && navigate(`/vehicles?variant_id=${variant.id}`)}>
                                                                    <i className="bi bi-ev-front"></i> Sub-Variants
                                                                </Button>
                                                                <Button size="sm" variant="outline-primary" onClick={() => { setEditVariant(variant); setShowModal(true); }}>
                                                                    <i className="bi bi-pencil"></i> Edit
                                                                </Button>
                                                                <Button size="sm" variant="outline-warning" onClick={() => toggleStatus(variant)}>
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => variant.id && handleDelete(variant.id)}>
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

                <VariantFormModal
                    show={showModal}
                    onHide={() => { setShowModal(false); setEditVariant(null); }}
                    onSubmit={saveVariant}
                    initialData={editVariant}
                />
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Variants;
