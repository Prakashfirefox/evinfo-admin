import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Modal,
} from "react-bootstrap";
import Header from "../../components/top-nav";
import Sidebar from "../../components/Sidebar-left/sideBar";
import {
  getAllLeads,
  getAllLeadsCounts,
  updateLeadStatus,
  sendInviteEmail
} from "../../service/common.service";
import { capitalizeText } from "../../utils/stringUtils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Lead {
  id: number;
  full_name: string;
  email: string;
  org_name: string | null;
  status: string;
  phone?: string;
  created_at?: string;
  country_code?: string;
  phoneNo?: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: {
    data: {
      count: number;
      rows: Lead[];
    };
  };
}

const LeadManagement: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [convertedCount, setConvertedCount] = useState(0);
  const [totalOrgsCount, settotalOrgsCount] = useState(0);
  const [totalUsersCount, settotalUsersCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: 'convert' | 'email' | 'reinvite' | null }>({});

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Confirmation Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const sidebarWidth = isSidebarHovered ? 240 : 80;

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLeads = async (search?: string, status?: string) => {
    try {
      setLoading(true);
      const payload = {
        is_staff: true,
        offset,
        limit,
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && status !== "all" && { status: status.toLowerCase() }),
      };

      const response = await getAllLeads(payload);
      const apiData = response.data;
      if (apiData.status) {
        setLeads(apiData.data.data.rows);
        setTotal(apiData.data.data.count);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await getAllLeadsCounts();
      const apiData = response.data;
      if (apiData.status) {
        setActiveCount(apiData.data.activeUsers);
        setConvertedCount(apiData.data.convertedUsers);
        settotalUsersCount(apiData.data.totalUsers);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  // Fetch leads when offset, search term, or status filter changes
  useEffect(() => {
    fetchLeads(debouncedSearchTerm, statusFilter);
  }, [offset, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleNext = () => {
    if (offset + limit < total) setOffset(offset + limit);
  };

  const handlePrev = () => {
    if (offset > 0) setOffset(offset - limit);
  };

  // Handle convert lead to customer with confirmation
  const handleConvertConfirmation = (lead: Lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;

    try {
      setActionLoading(prev => ({ ...prev, [selectedLead.id]: 'convert' }));
      setShowConvertModal(false);

      const result = await updateLeadStatus(selectedLead.id, { status: 'converted' });
      const response = result.data;

      if (response.status) {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === selectedLead.id
              ? { ...lead, status: 'converted' }
              : lead
          )
        );
        fetchCounts();
        toast.info(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Error converting lead");
      console.error("Error converting lead:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedLead.id]: null }));
      setSelectedLead(null);
    }
  };

  // Handle send invite email with confirmation
  const handleEmailConfirmation = (lead: Lead) => {
    setSelectedLead(lead);
    setShowEmailModal(true);
  };

  // Handle re-invite email with confirmation
  const handleReinviteConfirmation = (lead: Lead) => {
    setSelectedLead(lead);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!selectedLead) return;

    try {
      const actionType = selectedLead.status === 'converted' ? 'email' : 'reinvite';
      setActionLoading(prev => ({ ...prev, [selectedLead.id]: actionType }));
      setShowEmailModal(false);

      const result = await sendInviteEmail(selectedLead.id, { email: selectedLead.email });
      const response = result.data;
      
      if (response.status) {
        // If sending to converted lead, update status to invite_sent
        if (selectedLead.status === 'converted') {
          const statusResult = await updateLeadStatus(selectedLead.id, { status: 'invite_sent' });
          if (statusResult.data.status) {
            setLeads(prevLeads =>
              prevLeads.map(lead =>
                lead.id === selectedLead.id
                  ? { ...lead, status: 'invite_sent' }
                  : lead
              )
            );
          }
        }
        
        toast.info("Invite email sent successfully");
      } else {
        toast.error(response.message);
        console.error("Failed to send email:", response.message);
      }
    } catch (error) {
      toast.error("Error sending invite email");
      console.error("Error sending email:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedLead.id]: null }));
      setSelectedLead(null);
    }
  };

  // Clear search input only
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Clear all filters and search
  const handleClearAll = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setOffset(0);
  };

  // Helper function to determine if lead is new
  const isNewLead = (status: string) => {
    console.log('Checking isNewLead for status:', status);
    return status?.toLowerCase() === 'new' || status?.toLowerCase() === null;
  };

  // Helper function to determine if lead is converted
  const isConvertedLead = (status: string) => {
    return status?.toLowerCase() === 'converted';
  };

  // Helper function to determine if invite is sent
  const isInviteSent = (status: string) => {
    return status?.toLowerCase() === 'invite_sent';
  };

  // Helper function to determine if lead is active
  const isActiveLead = (status: string) => {
    return status?.toLowerCase() === 'active';
  };

  // Get appropriate button based on status
  const getActionButton = (lead: Lead) => {
    if (isActiveLead(lead.status)) {
      return null; // Don't show any button for active status
    }

    if (isNewLead(lead.status)) {
      return (
        <Button
          size="sm"
          variant="success"
          className="fw-semibold px-3 py-1 rounded-pill bg-success bg-opacity-10 text-success border-0"
          onClick={() => handleConvertConfirmation(lead)}
          disabled={actionLoading[lead.id] !== undefined && actionLoading[lead.id] !== null}
        >
          {actionLoading[lead.id] === 'convert' ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Converting...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-1"></i>{" "}
              Convert
            </>
          )}
        </Button>
      );
    }

    if (isConvertedLead(lead.status)) {
      return (
        <Button
          size="sm"
          variant="primary"
          className="fw-semibold px-3 py-1 rounded-pill bg-primary bg-opacity-10 text-primary border-0"
          onClick={() => handleEmailConfirmation(lead)}
          disabled={actionLoading[lead.id] !== undefined && actionLoading[lead.id] !== null}
        >
          {actionLoading[lead.id] === 'email' ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Sending...
            </>
          ) : (
            <>
              <i className="bi bi-envelope me-1"></i> Send
              Invite
            </>
          )}
        </Button>
      );
    }

    if (isInviteSent(lead.status)) {
      return (
        <Button
          size="sm"
          variant="warning"
          className="fw-semibold px-3 py-1 rounded-pill bg-warning bg-opacity-10 text-warning border-0"
          onClick={() => handleReinviteConfirmation(lead)}
          disabled={actionLoading[lead.id] !== undefined && actionLoading[lead.id] !== null}
        >
          {actionLoading[lead.id] === 'reinvite' ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Sending...
            </>
          ) : (
            <>
              <i className="bi bi-envelope-arrow-up me-1"></i> Re-invite
            </>
          )}
        </Button>
      );
    }

    return null;
  };

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

      <div
        className="flex-grow-1"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 0.3s",
        }}
      >
        <Header />

        <Container fluid className="main-content px-4">
          <Row className="align-items-center mb-4">
            <Col>
              <h4 className="fw-bold mb-0">Lead Management</h4>
              <p className="text-muted mb-0">
                Track and convert user registrations into customers
              </p>
            </Col>
            <Col className="d-flex justify-content-end align-items-center">
              {/* Search Input with Clear Button */}
              <InputGroup className="me-2" style={{ width: "300px" }}>
                <Form.Control
                  placeholder="Search by name, email, phone, organization..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setOffset(0); // Reset to first page when searching
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={handleClearSearch}
                    style={{ border: '1px solid #dee2e6' }}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </InputGroup>

              {/* Status Filter Dropdown */}
              <Form.Select
                style={{ width: "180px" }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setOffset(0); // Reset to first page when filtering
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="converted">Converted</option>
                <option value="invite_sent">Invite Sent</option>
                <option value="pending">Pending</option>
              </Form.Select>

              {/* Clear All Filters Button */}
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-2"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              )}
            </Col>
          </Row>

          {/* ✅ Status Count Cards */}
          <Row>
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-3 mb-4">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 text-warning p-3 rounded me-3">
                    <i className="bi bi-clock" style={{ fontSize: "24px" }}></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Active Leads</h6>
                    <h4 className="mb-0 fw-bold">{activeCount ?? 0}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-3 mb-4">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 text-success p-3 rounded me-3">
                    <i
                      className="bi bi-check-circle"
                      style={{ fontSize: "24px" }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Converted</h6>
                    <h4 className="mb-0 fw-bold">{convertedCount ?? 0}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-3 mb-4">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 text-primary p-3 rounded me-3">
                    <i
                      className="bi bi-person"
                      style={{ fontSize: "24px" }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Total Registrations</h6>
                    <h4 className="mb-0 fw-bold">{totalUsersCount ?? 0}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body>
              {/* Search and Filter Summary */}
              {(searchTerm || statusFilter !== "all") && (
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <small className="text-muted me-2">Active filters:</small>
                      {searchTerm && (
                        <Badge bg="secondary" className="me-2">
                          Search: "{searchTerm}"
                          <Button
                            variant="link"
                            className="text-white p-0 ms-1"
                            style={{ textDecoration: 'none' }}
                            onClick={handleClearSearch}
                          >
                            <i className="bi bi-x small"></i>
                          </Button>
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge bg="primary" className="me-2">
                          Status: {capitalizeText(statusFilter)}
                          <Button
                            variant="link"
                            className="text-white p-0 ms-1"
                            style={{ textDecoration: 'none' }}
                            onClick={() => setStatusFilter("all")}
                          >
                            <i className="bi bi-x small"></i>
                          </Button>
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleClearAll}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2">Loading leads...</p>
                </div>
              ) : (
                <>
                  <Table hover responsive className="align-middle mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th>USER DETAILS</th>
                        <th>PHONE</th>
                        <th>ORGANIZATION</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length > 0 ? (
                        leads.map((lead) => (
                          <tr key={lead.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="avatar-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center rounded-circle me-3"
                                  style={{ width: "40px", height: "40px" }}
                                >
                                  {lead.full_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">
                                    {lead.full_name || "—"}
                                  </div>
                                  <small className="text-muted">
                                    {lead.email}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td className="text-dark">
                              <i className="bi bi-telephone me-1 text-secondary"></i>
                              {lead.country_code && lead.phoneNo ? `${lead.country_code} ${lead.phoneNo}` : "—"}
                            </td>

                            <td className="text-dark">
                              <i className="bi bi-building me-1 text-secondary"></i>
                              {lead.org_name || "—"}
                            </td>

                            <td>
                              <Badge
                                bg=""
                                className={`fw-semibold px-3 py-2 rounded-pill ${
                                  isActiveLead(lead.status)
                                    ? "text-success bg-success bg-opacity-10"
                                    : isConvertedLead(lead.status)
                                    ? "text-primary bg-primary bg-opacity-10"
                                    : isInviteSent(lead.status)
                                    ? "text-info bg-info bg-opacity-10"
                                    : isNewLead(lead.status)
                                    ? "text-warning bg-warning bg-opacity-10"
                                    : "text-secondary bg-secondary bg-opacity-10"
                                }`}
                              >
                                {capitalizeText(lead.status) || "Lead"}
                              </Badge>
                            </td>

                            <td>
                              {getActionButton(lead)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4">
                            {searchTerm || statusFilter !== "all"
                              ? "No leads match your search criteria."
                              : "No leads found."
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {leads.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="text-muted small">
                        Showing {offset + 1}–
                        {Math.min(offset + limit, total)} of {total} leads
                        {(searchTerm || statusFilter !== "all") && " (filtered)"}
                      </span>
                      <div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          onClick={handlePrev}
                          disabled={offset === 0}
                        >
                          <i className="bi bi-chevron-left"></i> Prev
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleNext}
                          disabled={offset + limit >= total}
                        >
                          Next <i className="bi bi-chevron-right"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Convert Confirmation Modal */}
      <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Convert Lead</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to convert <strong>{selectedLead?.full_name}</strong> to a customer?
          </p>
          <p className="text-muted small">
            This action will change their status to "converted" and they will be marked as a customer.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConvertLead}>
            Yes, Convert Lead
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send Email Confirmation Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedLead?.status === 'converted' ? 'Send Invite Email' : 'Re-send Invite Email'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to {selectedLead?.status === 'converted' ? 'send an invite email' : 're-send an invite email'} to <strong>{selectedLead?.email}</strong>?
          </p>
          <p className="text-muted small">
            {selectedLead?.status === 'converted' 
              ? 'This will send an invitation email to the lead\'s email address and update their status to "invite_sent".'
              : 'This will re-send an invitation email to the lead\'s email address.'
            }
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendEmail}>
            Yes, {selectedLead?.status === 'converted' ? 'Send Email' : 'Re-send Email'}
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-right" autoClose={2500} />

    </div>
  );
};

export default LeadManagement;