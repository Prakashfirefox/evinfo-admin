import React, { useEffect, useMemo, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import ModelFormModal from "./ModelFormModal";
import { VehicleModel } from "./types/model";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllModels, createModel, updateModel, deleteModel, updateModelStatus,
    getAllBrands
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

type BrandLite = { id: string; name: string };

const Models: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const brandFilter = searchParams.get("brand_id") || "";

    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [brands, setBrands] = useState<BrandLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editModel, setEditModel] = useState<VehicleModel | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const activeBrand = useMemo(
        () => brands.find(b => b.id === brandFilter),
        [brands, brandFilter]
    );

    // Load brand list once for the filter dropdown
    useEffect(() => {
        (async () => {
            const res = await getAllBrands({ search: "", offset: 0, limit: 100 });
            if (res?.data?.status) {
                const rows = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setBrands(rows.map((b: any) => ({ id: b.id, name: b.name })));
            }
        })();
    }, []);

    const fetchModels = async () => {
        setLoading(true);
        const payload: any = { search, offset, limit };
        if (brandFilter) payload.brand_id = brandFilter;

        const res = await getAllModels(payload);
        if (res?.data?.status) {
            const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
            setModels(list);
            setTotal(res.data.data?.count || 0);
        } else {
            setModels([]);
            setTotal(0);
        }
        setLoading(false);
    };

    useEffect(() => { fetchModels(); }, [search, offset, brandFilter]);

    // Reset pagination when filter changes
    useEffect(() => {
        setOffset(0);
        setCurrentPage(1);
    }, [brandFilter, search]);

    const updateBrandFilter = (value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set("brand_id", value);
        else next.delete("brand_id");
        setSearchParams(next);
    };

    const saveModel = async (payload: VehicleModel) => {
        const res = editModel
            ? await updateModel(editModel.id!, payload)
            : await createModel(payload);

        if (res?.data?.status) {
            toast.success(editModel ? "Model updated successfully" : "Model created successfully");
            setShowModal(false);
            setEditModel(null);
            fetchModels();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this model?")) return;
        const res = await deleteModel(id);
        if (res?.data?.status) {
            toast.success("Model deleted successfully");
            fetchModels();
        }
    };

    const toggleStatus = async (model: VehicleModel) => {
        const newStatus = model.status === "active" ? "discontinued" : "active";
        const res = await updateModelStatus(model.id!, newStatus);
        if (res?.data?.status) {
            toast.success(`Model status updated to ${newStatus}`);
            fetchModels();
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string }> = {
            active: { bg: "success", text: "Active" },
            discontinued: { bg: "danger", text: "Discontinued" },
            upcoming: { bg: "warning", text: "Upcoming" },
        };
        const c = map[status] || { bg: "light", text: status };
        return <Badge bg={c.bg}>{c.text}</Badge>;
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
                            <h4 className="fw-bold">Vehicle Models</h4>
                            <p className="text-muted mb-0">
                                Manage vehicle models
                                {activeBrand && (
                                    <span className="ms-2">
                                        · Filtered by <Badge bg="info">{activeBrand.name}</Badge>
                                    </span>
                                )}
                            </p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ Add Model</Button>
                    </div>

                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <Form.Select
                            value={brandFilter}
                            onChange={e => updateBrandFilter(e.target.value)}
                            style={{ maxWidth: 240 }}
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </Form.Select>

                        <InputGroup style={{ maxWidth: 300 }}>
                            <Form.Control placeholder="Search models..." value={search} onChange={e => setSearch(e.target.value)} />
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>

                        {brandFilter && (
                            <Button variant="outline-secondary" size="sm" onClick={() => updateBrandFilter("")}>
                                <i className="bi bi-x-circle"></i> Clear filter
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading models...</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Body Type</th>
                                                <th className="px-4 py-3">Production Years</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {models.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-4">No models found</td></tr>
                                            ) : (
                                                models.map(model => (
                                                    <tr key={model.id}>
                                                        <td className="px-4 py-3">
                                                            <strong>{model.name}</strong>
                                                            <div className="text-muted small">{model.slug}</div>
                                                        </td>
                                                        <td className="px-4 py-3">{model.body_type || "—"}</td>
                                                        <td className="px-4 py-3">{model.production_years || "—"}</td>
                                                        <td className="px-4 py-3">{getStatusBadge(model.status)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                <Button size="sm" variant="outline-info" onClick={() => model.id && navigate(`/variants?model_id=${model.id}`)}>
                                                                    <i className="bi bi-list-ul"></i> Variants
                                                                </Button>
                                                                <Button size="sm" variant="outline-primary" onClick={() => { setEditModel(model); setShowModal(true); }}>
                                                                    <i className="bi bi-pencil"></i> Edit
                                                                </Button>
                                                                <Button size="sm" variant="outline-warning" onClick={() => toggleStatus(model)}>
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => model.id && handleDelete(model.id)}>
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

                <ModelFormModal
                    show={showModal}
                    onHide={() => { setShowModal(false); setEditModel(null); }}
                    onSubmit={saveModel}
                    initialData={editModel}
                />
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Models;
