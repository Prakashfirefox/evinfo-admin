// src/pages/enquiries/Enquiries.tsx — contact-form messages from the website
import React, { useEffect, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination, Modal,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import { toast, ToastContainer } from "react-toastify";
import { getContactMessages, updateContactStatus, deleteContactMessage } from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

interface Enquiry {
    id: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    status: "new" | "read" | "resolved";
    created_at: string;
}

const statusBadge = (s: string) =>
    s === "new" ? "danger" : s === "read" ? "warning" : "success";

const Enquiries: React.FC = () => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [rows, setRows] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 20;
    const [total, setTotal] = useState(0);
    const [newCount, setNewCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewing, setViewing] = useState<Enquiry | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const fetchRows = async () => {
        setLoading(true);
        const params: any = { offset, limit };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const res = await getContactMessages(params);
        if (res?.data?.status) {
            setRows(res.data.data?.rows || []);
            setTotal(res.data.data?.count || 0);
            setNewCount(res.data.data?.newCount || 0);
        } else {
            setRows([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchRows(); }, [search, statusFilter, offset]);

    const openMessage = async (m: Enquiry) => {
        setViewing(m);
        if (m.status === "new") {
            const res = await updateContactStatus(m.id, "read");
            if (res?.data?.status) fetchRows();
        }
    };

    const setStatus = async (id: string, status: string) => {
        const res = await updateContactStatus(id, status);
        if (res?.data?.status) {
            toast.success(`Marked as ${status}`);
            setViewing(null);
            fetchRows();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this enquiry?")) return;
        const res = await deleteContactMessage(id);
        if (res?.data?.status) {
            toast.success("Enquiry deleted");
            setViewing(null);
            fetchRows();
        }
    };

    const totalPages = Math.ceil(total / limit);
    const handlePageChange = (page: number) => { setCurrentPage(page); setOffset((page - 1) * limit); };

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
                            <h4 className="fw-bold">
                                Enquiries
                                {newCount > 0 && <Badge bg="danger" className="ms-2" style={{ fontSize: "0.6em", verticalAlign: "middle" }}>{newCount} new</Badge>}
                            </h4>
                            <p className="text-muted mb-0">Messages from the website contact form</p>
                        </div>
                    </div>

                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <Form.Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0); setCurrentPage(1); }} style={{ maxWidth: 180 }}>
                            <option value="">All statuses</option>
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="resolved">Resolved</option>
                        </Form.Select>
                        <InputGroup style={{ maxWidth: 300 }}>
                            <Form.Control placeholder="Search name, email, message…" value={search} onChange={e => { setSearch(e.target.value); setOffset(0); setCurrentPage(1); }} />
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading enquiries…</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">From</th>
                                                <th className="px-4 py-3">Subject</th>
                                                <th className="px-4 py-3">Message</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Received</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4">No enquiries found</td></tr>
                                            ) : (
                                                rows.map(m => (
                                                    <tr key={m.id} style={{ fontWeight: m.status === "new" ? 600 : 400, cursor: "pointer" }} onClick={() => openMessage(m)}>
                                                        <td className="px-4 py-3">
                                                            <div>{m.name}</div>
                                                            <div className="text-muted small fw-normal">{m.email}</div>
                                                        </td>
                                                        <td className="px-4 py-3"><span className="small">{m.subject || "—"}</span></td>
                                                        <td className="px-4 py-3" style={{ maxWidth: 320 }}>
                                                            <span className="small text-truncate d-inline-block" style={{ maxWidth: 300 }}>{m.message}</span>
                                                        </td>
                                                        <td className="px-4 py-3"><Badge bg={statusBadge(m.status)}>{m.status}</Badge></td>
                                                        <td className="px-4 py-3"><span className="small">{new Date(m.created_at).toLocaleString()}</span></td>
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                            <div className="d-flex gap-2">
                                                                <Button size="sm" variant="outline-primary" onClick={() => openMessage(m)}>
                                                                    <i className="bi bi-envelope-open"></i>
                                                                </Button>
                                                                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(m.id)}>
                                                                    <i className="bi bi-trash"></i>
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
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>{i + 1}</Pagination.Item>
                                        ))}
                                        <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Container>

                {/* Message viewer */}
                <Modal show={!!viewing} onHide={() => setViewing(null)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title style={{ fontSize: 16 }}>{viewing?.subject || "Enquiry"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <div className="fw-semibold">{viewing?.name}</div>
                            <a href={`mailto:${viewing?.email}`} className="small">{viewing?.email}</a>
                            <div className="text-muted small">{viewing && new Date(viewing.created_at).toLocaleString()}</div>
                        </div>
                        <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{viewing?.message}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-danger" size="sm" onClick={() => viewing && handleDelete(viewing.id)}>Delete</Button>
                        <Button variant="outline-secondary" size="sm" href={`mailto:${viewing?.email}?subject=Re: ${encodeURIComponent(viewing?.subject || "Your enquiry to EVInfo")}`}>
                            Reply by email
                        </Button>
                        {viewing?.status !== "resolved" && (
                            <Button variant="success" size="sm" onClick={() => viewing && setStatus(viewing.id, "resolved")}>Mark resolved</Button>
                        )}
                    </Modal.Footer>
                </Modal>

                <ToastContainer position="top-right" autoClose={2500} />
            </div>
        </div>
    );
};

export default Enquiries;
