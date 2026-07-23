import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Table } from 'react-bootstrap';
import Header from '../../components/top-nav';
import Sidebar from '../../components/Sidebar-left/sideBar';
import { getDashboardStats } from '../../service/common.service';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  sub?: string;
}

const Dashboard: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [popularVehicles, setPopularVehicles] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [dealerStats, setDealerStats] = useState<any>(null);
  const sidebarWidth = isSidebarHovered ? 240 : 80;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getDashboardStats();
        if (res?.data?.status) {
          const d = res.data.data;
          setOverview(d.overview || null);
          setPopularVehicles(d.popularVehicles || []);
          setRecentReviews(d.recentReviews || []);
          setDealerStats(d.dealerStats || null);
        }
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards: StatCard[] = overview
    ? [
        { label: 'Total Vehicles', value: overview.totalVehicles ?? 0, icon: 'bi-ev-front', color: 'bg-primary', sub: `+${overview.recentActivity?.vehiclesAdded ?? 0} this month` },
        { label: 'Total Brands', value: overview.totalBrands ?? 0, icon: 'bi-building', color: 'bg-success', sub: `${overview.totalModels ?? 0} models` },
        { label: 'Total Reviews', value: overview.totalReviews ?? 0, icon: 'bi-star', color: 'bg-warning', sub: `+${overview.recentActivity?.reviewsAdded ?? 0} this month` },
        { label: 'Active Dealers', value: overview.totalDealers ?? 0, icon: 'bi-shop', color: 'bg-info', sub: `+${overview.recentActivity?.dealersAdded ?? 0} this month` },
        { label: 'Total Views', value: (overview.totalViews ?? 0).toLocaleString(), icon: 'bi-eye', color: 'bg-secondary', sub: 'all time' },
        { label: 'Avg Rating', value: (overview.averageRating ?? 0).toFixed(1), icon: 'bi-star-half', color: 'bg-danger', sub: 'out of 5.0' },
        { label: 'Variants', value: overview.totalVariants ?? 0, icon: 'bi-list-ul', color: 'bg-primary', sub: `across ${overview.totalModels ?? 0} models` },
        { label: 'Total Users', value: overview.totalUsers ?? 0, icon: 'bi-people', color: 'bg-success', sub: 'active users' },
      ]
    : [];

  const renderStars = (rating: number) => (
    <span className="text-warning small">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );

  const getReviewStatusBadge = (status: string) => {
    const map: Record<string, string> = { approved: 'success', pending: 'warning', rejected: 'danger' };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div>
      <Header />
      <div
        style={{ position: 'fixed', top: 58, left: 0, height: '100%', width: `${sidebarWidth}px`, transition: 'width 0.3s', zIndex: 1000 }}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Sidebar isCollapsed={!isSidebarHovered} />
      </div>

      <div className="main-content" style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s', paddingTop: '20px' }}>
        <Container fluid className="px-4">

          {/* Page title */}
          <div className="mb-4">
            <h4 className="fw-bold">Dashboard</h4>
            <p className="text-muted mb-0">Overview of your EVInfo platform</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <Row className="mb-4 g-3">
                {statCards.map((card, i) => (
                  <Col xl={3} md={6} key={i}>
                    <Card className="shadow-sm border-0 h-100">
                      <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted small mb-1 text-uppercase fw-semibold">{card.label}</p>
                          <h3 className="fw-bold mb-0">{card.value}</h3>
                          {card.sub && <small className="text-muted">{card.sub}</small>}
                        </div>
                        <div
                          className={`${card.color} d-flex justify-content-center align-items-center rounded-circle`}
                          style={{ width: 50, height: 50, flexShrink: 0 }}
                        >
                          <i className={`bi ${card.icon} text-white`} style={{ fontSize: 22 }}></i>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row className="g-4">
                {/* Popular Vehicles */}
                <Col xl={7}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                      <h6 className="fw-bold mb-0"><i className="bi bi-trophy me-2 text-warning"></i>Popular Vehicles</h6>
                      <Badge bg="light" text="dark">Top {popularVehicles.length}</Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {popularVehicles.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-ev-front fs-2"></i>
                          <p className="mt-2">No vehicle data yet</p>
                        </div>
                      ) : (
                        <Table hover className="mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="px-3 py-2 small">#</th>
                              <th className="px-3 py-2 small">Vehicle</th>
                              <th className="px-3 py-2 small">Brand</th>
                              <th className="px-3 py-2 small">Views</th>
                              <th className="px-3 py-2 small">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {popularVehicles.map((v: any, i: number) => (
                              <tr key={v.id || i}>
                                <td className="px-3 py-2">
                                  <span className={`fw-bold ${i === 0 ? 'text-warning' : i === 1 ? 'text-secondary' : i === 2 ? 'text-danger' : 'text-muted'}`}>
                                    #{i + 1}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <strong className="small">{v.name}</strong>
                                  <div className="text-muted" style={{ fontSize: 11 }}>{v.slug}</div>
                                </td>
                                <td className="px-3 py-2 small">{v.brand?.name || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className="fw-semibold small">{(v.views || 0).toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <Badge bg={v.status === 'active' ? 'success' : v.status === 'upcoming' ? 'warning' : 'secondary'} style={{ fontSize: 10 }}>
                                    {v.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Dealer Overview */}
                <Col xl={5}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-white border-bottom py-3">
                      <h6 className="fw-bold mb-0"><i className="bi bi-shop me-2 text-info"></i>Dealer Overview</h6>
                    </Card.Header>
                    <Card.Body>
                      {!dealerStats ? (
                        <div className="text-center py-4 text-muted">No dealer data</div>
                      ) : (
                        <>
                          <Row className="g-3 mb-4">
                            <Col xs={6}>
                              <div className="border rounded p-3 text-center">
                                <h4 className="fw-bold text-success mb-0">{dealerStats.active ?? 0}</h4>
                                <small className="text-muted">Active</small>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="border rounded p-3 text-center">
                                <h4 className="fw-bold text-secondary mb-0">{dealerStats.inactive ?? 0}</h4>
                                <small className="text-muted">Inactive</small>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="border rounded p-3 text-center">
                                <h4 className="fw-bold text-warning mb-0">
                                  {(dealerStats.averageRating ?? 0).toFixed(1)}
                                </h4>
                                <small className="text-muted">Avg Rating</small>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="border rounded p-3 text-center">
                                <h4 className="fw-bold text-primary mb-0">{dealerStats.total ?? 0}</h4>
                                <small className="text-muted">Total</small>
                              </div>
                            </Col>
                          </Row>

                          {dealerStats.topCities && dealerStats.topCities.length > 0 && (
                            <>
                              <p className="text-muted small fw-semibold mb-2">TOP CITIES</p>
                              <ul className="list-unstyled mb-0">
                                {dealerStats.topCities.slice(0, 5).map((c: any, i: number) => (
                                  <li key={i} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                    <span className="small">{c.city}{c.state ? `, ${c.state}` : ''}</span>
                                    <Badge bg="light" text="dark">{c.count}</Badge>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Recent Reviews */}
                <Col xl={12}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                      <h6 className="fw-bold mb-0"><i className="bi bi-chat-square-text me-2 text-success"></i>Recent Reviews</h6>
                      <a href="/reviews" className="small text-primary text-decoration-none">View all →</a>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {recentReviews.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-star fs-2"></i>
                          <p className="mt-2">No reviews yet</p>
                        </div>
                      ) : (
                        <Table hover responsive className="mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="px-4 py-2 small">Rating</th>
                              <th className="px-4 py-2 small">Review</th>
                              <th className="px-4 py-2 small">Vehicle</th>
                              <th className="px-4 py-2 small">Status</th>
                              <th className="px-4 py-2 small">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentReviews.map((r: any, i: number) => (
                              <tr key={r.id || i}>
                                <td className="px-4 py-2">{renderStars(r.rating)} <small className="text-muted">({r.rating})</small></td>
                                <td className="px-4 py-2">
                                  {r.title && <div className="small fw-semibold">{r.title}</div>}
                                  {r.content && <div className="text-muted" style={{ fontSize: 12 }}>{r.content.substring(0, 60)}{r.content.length > 60 ? '...' : ''}</div>}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="small">
                                    {r.sub_variant?.variant?.model?.name || '—'}
                                    {r.sub_variant?.name ? ` ${r.sub_variant.name}` : ''}
                                  </div>
                                  {r.sub_variant?.variant?.model?.brand?.name && (
                                    <div className="text-muted" style={{ fontSize: 11 }}>
                                      {r.sub_variant.variant.model.brand.name}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2">{getReviewStatusBadge(r.status)}</td>
                                <td className="px-4 py-2 small text-muted">
                                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Dashboard;
