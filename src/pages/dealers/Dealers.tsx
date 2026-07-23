import React, { useEffect, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import DealerFormModal from "./DealerFormModal";
import { Dealer } from "./types/dealer";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllDealers, createDealer, updateDealer, deleteDealer, updateDealerStatus
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

const Dealers: React.FC = () => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editDealer, setEditDealer] = useState<Dealer | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const res = await getAllDealers({ search, offset, limit });
            if (res?.data?.status) {
                const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setDealers(list);
                setTotal(res.data.data?.count || 0);
            } else {
                setDealers([]);
                setTotal(0);
            }
        } catch {
            toast.error("Failed to fetch dealers");
            setDealers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDealers(); }, [search, offset]);

    const saveDealer = async (payload: Dealer) => {
        const res = editDealer
            ? await updateDealer(editDealer.id!, payload)
            : await createDealer(payload);

        if (res?.data?.status) {
            toast.success(editDealer ? "Dealer updated successfully" : "Dealer created successfully");
            setShowModal(false);
            setEditDealer(null);
            fetchDealers();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this dealer?")) return;
        try {
            const res = await deleteDealer(id);
            if (res?.data?.status) {
                toast.success("Dealer deleted successfully");
                fetchDealers();
            }
        } catch {
            toast.error("Failed to delete dealer");
        }
    };

    const toggleStatus = async (dealer: Dealer) => {
        const newStatus = dealer.status === "active" ? "inactive" : "active";
        try {
            const res = await updateDealerStatus(dealer.id!, newStatus);
            if (res?.data?.status) {
                toast.success(`Dealer status updated to ${newStatus}`);
                fetchDealers();
            }
        } catch {
            toast.error("Failed to update status");
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = { active: "success", inactive: "secondary", closed: "danger" };
        return <Badge bg={map[status] || "light"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    };

    const getRatingStars = (rating?: number) => {
        if (!rating) return <span className="text-muted">—</span>;
        return (
            <span className="text-warning">
                {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
                <small className="text-muted ms-1">({rating.toFixed(1)})</small>
            </span>
        );
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
                            <h4 className="fw-bold">Dealers</h4>
                            <p className="text-muted">Manage EV dealers</p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ Add Dealer</Button>
                    </div>

                    <InputGroup className="mb-4" style={{ maxWidth: 300 }}>
                        <Form.Control placeholder="Search dealers..." value={search} onChange={e => setSearch(e.target.value)} />
                        <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                    </InputGroup>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading dealers...</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Location</th>
                                                <th className="px-4 py-3">Contact</th>
                                                <th className="px-4 py-3">Rating</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dealers.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4">No dealers found</td></tr>
                                            ) : (
                                                dealers.map(dealer => (
                                                    <tr key={dealer.id}>
                                                        <td className="px-4 py-3"><strong>{dealer.name}</strong></td>
                                                        <td className="px-4 py-3">
                                                            <div>{dealer.city}, {dealer.state}</div>
                                                            <div className="text-muted small">{dealer.country}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {dealer.phone && <div><i className="bi bi-telephone me-1"></i>{dealer.phone}</div>}
                                                            {dealer.email && <div className="text-muted small"><i className="bi bi-envelope me-1"></i>{dealer.email}</div>}
                                                        </td>
                                                        <td className="px-4 py-3">{getRatingStars(dealer.rating)}</td>
                                                        <td className="px-4 py-3">{getStatusBadge(dealer.status)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2">
                                                                <Button size="sm" variant="outline-primary" onClick={() => { setEditDealer(dealer); setShowModal(true); }}>
                                                                    <i className="bi bi-pencil"></i> Edit
                                                                </Button>
                                                                <Button size="sm" variant="outline-warning" onClick={() => toggleStatus(dealer)}>
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => dealer.id && handleDelete(dealer.id)}>
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

                <DealerFormModal
                    show={showModal}
                    onHide={() => { setShowModal(false); setEditDealer(null); }}
                    onSubmit={saveDealer}
                    initialData={editDealer}
                />
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Dealers;
