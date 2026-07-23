import React, { useEffect, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import BrandFormModal from "./BrandFormModal";
import { Brand } from "./types/brand";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllBrands, createBrand, updateBrand, deleteBrand, updateBrandStatus
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

const Brands: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState<Brand | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const res = await getAllBrands({ search, offset, limit });
            if (res?.data?.status) {
                const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setBrands(list);
                setTotal(res.data.data?.count || 0);
            } else {
                setBrands([]);
                setTotal(0);
            }
        } catch {
            toast.error("Failed to fetch brands");
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBrands(); }, [search, offset]);

    const saveBrand = async (payload: Brand) => {
        const res = editBrand
            ? await updateBrand(editBrand.id!, payload)
            : await createBrand(payload);

        if (res?.data?.status) {
            toast.success(editBrand ? "Brand updated successfully" : "Brand created successfully");
            setShowModal(false);
            setEditBrand(null);
            fetchBrands();
        }
        // Error toast is shown automatically by apiRequest
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this brand?")) return;
        try {
            const res = await deleteBrand(id);
            if (res?.data?.status) {
                toast.success("Brand deleted successfully");
                fetchBrands();
            }
        } catch {
            toast.error("Failed to delete brand");
        }
    };

    const toggleStatus = async (brand: Brand) => {
        const newStatus = brand.status === "active" ? "inactive" : "active";
        try {
            const res = await updateBrandStatus(brand.id!, newStatus);
            if (res?.data?.status) {
                toast.success(`Brand status updated to ${newStatus}`);
                fetchBrands();
            }
        } catch {
            toast.error("Failed to update status");
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string }> = {
            active: { bg: "success", text: "Active" },
            inactive: { bg: "secondary", text: "Inactive" },
            archived: { bg: "danger", text: "Archived" },
        };
        const c = map[status] || { bg: "light", text: status };
        return <Badge bg={c.bg}>{c.text}</Badge>;
    };

    const totalPages = Math.ceil(total / limit);
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setOffset((page - 1) * limit);
    };
    const paginationItems = [];
    for (let n = 1; n <= totalPages; n++) {
        paginationItems.push(
            <Pagination.Item key={n} active={n === currentPage} onClick={() => handlePageChange(n)}>
                {n}
            </Pagination.Item>
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
                            <h4 className="fw-bold">Brands</h4>
                            <p className="text-muted">Manage EV brands</p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ Add Brand</Button>
                    </div>

                    <InputGroup className="mb-4" style={{ maxWidth: 300 }}>
                        <Form.Control
                            placeholder="Search brands..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                    </InputGroup>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Loading brands...</p>
                        </div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Logo</th>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Country</th>
                                                <th className="px-4 py-3">Founded</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {brands.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4">No brands found</td></tr>
                                            ) : (
                                                brands.map(brand => (
                                                    <tr key={brand.id}>
                                                        <td className="px-4 py-3">
                                                            {brand.logo ? (
                                                                <img src={brand.logo} alt={brand.name} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 4 }} />
                                                            ) : (
                                                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                                    <i className="bi bi-building text-muted"></i>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <strong>{brand.name}</strong>
                                                            <div className="text-muted small">{brand.slug}</div>
                                                        </td>
                                                        <td className="px-4 py-3">{brand.country || "—"}</td>
                                                        <td className="px-4 py-3">{brand.founded || "—"}</td>
                                                        <td className="px-4 py-3">{getStatusBadge(brand.status)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                <Button size="sm" variant="outline-info" onClick={() => brand.id && navigate(`/models?brand_id=${brand.id}`)}>
                                                                    <i className="bi bi-layers"></i> Models
                                                                </Button>
                                                                <Button size="sm" variant="outline-primary" onClick={() => { setEditBrand(brand); setShowModal(true); }}>
                                                                    <i className="bi bi-pencil"></i> Edit
                                                                </Button>
                                                                <Button size="sm" variant="outline-warning" onClick={() => toggleStatus(brand)}>
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => brand.id && handleDelete(brand.id)}>
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

                <BrandFormModal
                    show={showModal}
                    onHide={() => { setShowModal(false); setEditBrand(null); }}
                    onSubmit={saveBrand}
                    initialData={editBrand}
                />
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Brands;
