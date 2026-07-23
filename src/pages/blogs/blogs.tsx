// src/pages/blogs/blogs.tsx (updated imports and handlers)
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
import BlogFormModal from "./BlogFormModal";
import { Blog, BlogSection, BlogSEO } from "./types/blog";
import { toast, ToastContainer } from "react-toastify";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  updateBlogStatus
} from "../../service/common.service";
import "react-toastify/dist/ReactToastify.css";

const Blogs: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const sidebarWidth = isSidebarHovered ? 240 : 80;

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await getAllBlogs({
        search,
        offset,
        limit
      });
        console.log('fetchBlogs res>>',res.data.status)
      if (res?.data?.status) {
        console.log('fetchBlogs res data>>',res.data.data.data.rows)
        const blogList = Array.isArray(res.data.data.data.rows)
          ? res.data.data.data.rows
          : [];

        setBlogs(blogList);
        setTotal(res.data.data?.pagination?.total || 0);
      } else {
        setBlogs([]);
        setTotal(0);
      }
    } catch (error) {
      toast.error("Failed to fetch blogs");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchBlogs();
  }, [search, offset]);

  const saveBlog = async (payload: Blog) => {
    const res = editBlog
      ? await updateBlog(editBlog.id!, payload)
      : await createBlog(payload);

    if (res?.data?.status) {
      toast.success(editBlog ? "Blog updated successfully" : "Blog created successfully");
      setShowModal(false);
      setEditBlog(null);
      fetchBlogs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      const res = await deleteBlog(id);
      if (res?.data?.status) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      }
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  const toggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";

    try {
      const res = await updateBlogStatus(blog.id!, newStatus);
      if (res?.data?.status) {
        toast.success(`Blog marked as ${newStatus}`);
        fetchBlogs();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
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
              <h4 className="fw-bold">Blogs</h4>
              <p className="text-muted">Manage EVInfo blogs</p>
            </div>
            <Button onClick={() => setShowModal(true)} variant="primary">
              + Add Blog
            </Button>
          </div>

          <InputGroup className="mb-4" style={{ maxWidth: 300 }}>
            <Form.Control
              placeholder="Search blogs..."
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
              <p className="mt-2">Loading blogs...</p>
            </div>
          ) : (
            <>
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Featured</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            No blogs found
                          </td>
                        </tr>
                      ) : (
                        blogs?.map(blog => (
                          <tr key={blog.id}>
                            <td className="px-4 py-3">
                              <div>
                                <strong>{blog.title}</strong>
                                {blog.slug && (
                                  <div className="text-muted small">{blog.slug}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                bg={
                                  blog.status === "published"
                                    ? "success"
                                    : "secondary"
                                }
                                className="px-3 py-1"
                              >
                                {blog.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {blog.featured ? (
                                <Badge bg="warning" className="px-3 py-1">
                                  Featured
                                </Badge>
                              ) : (
                                <span className="text-muted">No</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => {
                                    setEditBlog(blog);
                                    setShowModal(true);
                                  }}
                                >
                                  <i className="bi bi-pencil"></i> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  onClick={() => toggleStatus(blog)}
                                >
                                  <i className="bi bi-toggle-on"></i> Status
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => blog.id && handleDelete(blog.id)}
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

        <BlogFormModal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setEditBlog(null);
          }}
          onSubmit={saveBlog}
          initialData={editBlog}
        />

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Blogs;