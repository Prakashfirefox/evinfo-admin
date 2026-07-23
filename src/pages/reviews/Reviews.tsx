import React, { useEffect, useState } from "react";
import {
    Container, Card, Button, Table, Badge, Spinner,
    InputGroup, Form, Pagination
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import { Review } from "./types/review";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllReviews, deleteReview, updateReviewStatus
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

const Reviews: React.FC = () => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await getAllReviews({ search, offset, limit, ...(statusFilter ? { status: statusFilter } : {}) });
            if (res?.data?.status) {
                const list = Array.isArray(res.data.data?.rows) ? res.data.data.rows : [];
                setReviews(list);
                setTotal(res.data.data?.count || 0);
            } else {
                setReviews([]);
                setTotal(0);
            }
        } catch {
            toast.error("Failed to fetch reviews");
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [search, offset, statusFilter]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            const res = await deleteReview(id);
            if (res?.data?.status) {
                toast.success("Review deleted successfully");
                fetchReviews();
            }
        } catch {
            toast.error("Failed to delete review");
        }
    };

    const handleUpdateStatus = async (review: Review, newStatus: "approved" | "rejected" | "pending") => {
        try {
            const res = await updateReviewStatus(review.id!, newStatus);
            if (res?.data?.status) {
                toast.success(`Review ${newStatus}`);
                fetchReviews();
            }
        } catch {
            toast.error("Failed to update review status");
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = { pending: "warning", approved: "success", rejected: "danger" };
        return <Badge bg={map[status] || "secondary"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    };

    const renderStars = (rating: number) => (
        <span className="text-warning">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
    );

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
                            <h4 className="fw-bold">Reviews</h4>
                            <p className="text-muted">Moderate vehicle reviews</p>
                        </div>
                    </div>

                    <div className="d-flex gap-3 mb-4">
                        <InputGroup style={{ maxWidth: 300 }}>
                            <Form.Control placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} />
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>
                        <Form.Select style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </Form.Select>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading reviews...</p></div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Rating</th>
                                                <th className="px-4 py-3">Title</th>
                                                <th className="px-4 py-3">Vehicle ID</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4">No reviews found</td></tr>
                                            ) : (
                                                reviews.map(review => (
                                                    <tr key={review.id}>
                                                        <td className="px-4 py-3">{renderStars(review.rating)}</td>
                                                        <td className="px-4 py-3">
                                                            <div>{review.title || <span className="text-muted">No title</span>}</div>
                                                            {review.content && <div className="text-muted small">{review.content.substring(0, 60)}...</div>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-muted small font-monospace">{review.vehicle_id?.substring(0, 12)}...</span>
                                                        </td>
                                                        <td className="px-4 py-3">{getStatusBadge(review.status)}</td>
                                                        <td className="px-4 py-3">
                                                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : "—"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-1 flex-wrap">
                                                                {review.status !== "approved" && (
                                                                    <Button size="sm" variant="outline-success" onClick={() => handleUpdateStatus(review, "approved")}>
                                                                        <i className="bi bi-check-lg"></i> Approve
                                                                    </Button>
                                                                )}
                                                                {review.status !== "rejected" && (
                                                                    <Button size="sm" variant="outline-warning" onClick={() => handleUpdateStatus(review, "rejected")}>
                                                                        <i className="bi bi-x-lg"></i> Reject
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="outline-danger" onClick={() => review.id && handleDelete(review.id)}>
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
                                        {paginationItems}
                                        <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Container>
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Reviews;
