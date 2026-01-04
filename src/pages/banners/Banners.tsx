// src/pages/banners/Banners.tsx
import React, { useEffect, useState } from "react";
import {
    Container,
    Card,
    Button,
    Table,
    Badge,
    Spinner,
    InputGroup,
    Form,
    Pagination
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import BannerFormModal from "./BannerFormModal";
import { Banner } from "./types/banner";
import { toast, ToastContainer } from "react-toastify";
import {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

const Banners: React.FC = () => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editBanner, setEditBanner] = useState<Banner | null>(null);
    const sidebarWidth = isSidebarHovered ? 240 : 80;

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await getAllBanners({
                search,
                offset,
                limit
            });
            console.log('Banner fetch response raw:', res);
            if (res?.data?.status) {
                console.log('Banner fetch response:', res.data.data.rows);
                const bannerList = Array.isArray(res.data.data?.rows)
                    ? res.data.data.rows
                    : [];

                setBanners(bannerList);
                setTotal(res.data.data?.pagination?.total || 0);
            } else {
                setBanners([]);
                setTotal(0);
            }
        } catch (error) {
            toast.error("Failed to fetch banners");
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, [search, offset]);

    const saveBanner = async (payload: Banner) => {
        try {
            let res;
            if (editBanner) {
                res = await updateBanner(editBanner.id!, payload);
                toast.success("Banner updated successfully");
            } else {
                res = await createBanner(payload);
                toast.success("Banner created successfully");
            }

            if (res?.data?.status) {
                setShowModal(false);
                setEditBanner(null);
                fetchBanners();
            }
        } catch (error) {
            toast.error("Failed to save banner");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) return;

        try {
            const res = await deleteBanner(id);
            if (res?.data?.status) {
                toast.success("Banner deleted successfully");
                fetchBanners();
            }
        } catch (error) {
            toast.error("Failed to delete banner");
        }
    };

    const toggleStatus = async (banner: Banner) => {
        const newStatus = banner.status === "active" ? "inactive" : "active";

        try {
            const res = await updateBannerStatus(banner.id!, newStatus);
            if (res?.data?.status) {
                toast.success(`Banner status updated to ${newStatus}`);
                fetchBanners();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string, text: string }> = {
            active: { bg: "success", text: "Active" },
            inactive: { bg: "secondary", text: "Inactive" },
            scheduled: { bg: "warning", text: "Scheduled" },
            expired: { bg: "danger", text: "Expired" }
        };
        const config = statusConfig[status] || { bg: "secondary", text: status };
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const getPositionBadge = (position: string) => {
        const positionColors: Record<string, string> = {
            HOME_TOP: "primary",
            HOME_MIDDLE: "info",
            HOME_BOTTOM: "secondary",
            CATEGORY_TOP: "warning",
            PRODUCT_DETAIL: "success",
            CHECKOUT_TOP: "danger",
            POPUP: "dark"
        };
        return <Badge bg={positionColors[position] || "light"}>{position}</Badge>;
    };

    const totalPages = Math.ceil(total / limit);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setOffset((page - 1) * limit);
    };

    const paginationItems = [];
    for (let number = 1; number <= totalPages; number++) {
        paginationItems.push(
            <Pagination.Item
                key={number}
                active={number === currentPage}
                onClick={() => handlePageChange(number)}
            >
                {number}
            </Pagination.Item>
        );
    }

    return (
        <div className="d-flex">
            <div
                style={{
                    width: `${sidebarWidth}px`,
                    transition: "width 0.3s",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100vh",
                    zIndex: 1000,
                }}
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
            >
                <Sidebar isCollapsed={!isSidebarHovered} />
            </div>

            {/* Main content area */}
            <div
                className="flex-grow-1"
                style={{
                    marginLeft: `${sidebarWidth}px`,
                    transition: "margin-left 0.3s",
                    minHeight: "100vh",
                }}
            >
                <Header />

                <Container fluid className="px-4 pt-4 mt-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h4 className="fw-bold">Banners</h4>
                            <p className="text-muted">Manage website banners</p>
                        </div>
                        <Button onClick={() => setShowModal(true)} variant="primary">
                            + Add Banner
                        </Button>
                    </div>

                    <InputGroup className="mb-4" style={{ maxWidth: 300 }}>
                        <Form.Control
                            placeholder="Search banners..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <InputGroup.Text>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                    </InputGroup>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Loading banners...</p>
                        </div>
                    ) : (
                        <>
                            <Card className="shadow-sm">
                                <Card.Body className="p-0">
                                    <Table hover responsive className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Banner</th>
                                                <th className="px-4 py-3">Title</th>
                                                <th className="px-4 py-3">Position</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Schedule</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {banners.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4">
                                                        No banners found
                                                    </td>
                                                </tr>
                                            ) : (
                                                banners?.map(banner => (
                                                    <tr key={banner.id}>
                                                        <td className="px-4 py-3">
                                                            {banner.image_url && (
                                                                <img 
                                                                    src={banner.image_url} 
                                                                    alt={banner.title}
                                                                    style={{ 
                                                                        width: "80px", 
                                                                        height: "40px", 
                                                                        objectFit: "cover",
                                                                        borderRadius: "4px"
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <strong>{banner.title}</strong>
                                                                {banner.slug && (
                                                                    <div className="text-muted small">{banner.slug}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {getPositionBadge(banner.position)}
                                                            <div className="text-muted small mt-1">
                                                                Priority: {banner.priority}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {getStatusBadge(banner.status)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="small">
                                                                <div>
                                                                    <i className="bi bi-calendar me-1"></i>
                                                                    {new Date(banner.start_date).toLocaleDateString()}
                                                                </div>
                                                                <div>
                                                                    <i className="bi bi-calendar-check me-1"></i>
                                                                    {new Date(banner.end_date).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-primary"
                                                                    onClick={() => {
                                                                        setEditBanner(banner);
                                                                        setShowModal(true);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-pencil"></i> Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-warning"
                                                                    onClick={() => toggleStatus(banner)}
                                                                >
                                                                    <i className="bi bi-toggle-on"></i> Status
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() => banner.id && handleDelete(banner.id)}
                                                                >
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
                                        <Pagination.Prev
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        />
                                        {paginationItems}
                                        <Pagination.Next
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Container>

                <BannerFormModal
                    show={showModal}
                    onHide={() => {
                        setShowModal(false);
                        setEditBanner(null);
                    }}
                    onSubmit={saveBanner}
                    initialData={editBanner}
                />

                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default Banners;