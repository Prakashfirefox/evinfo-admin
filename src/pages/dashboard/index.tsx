// src/app/pages/dashboard/index.tsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import Header from '../../components/top-nav';
import Sidebar from '../../components/Sidebar-left/sideBar';

interface DashboardStats {
  total_leads: { value: number; growth: string };
  organizations: { value: number; growth: string };
  active_frameworks: { value: number; growth: string };
  conversion_rate: { value: string; growth: string };
}

interface Lead {
  name: string;
  company: string;
  status: 'Lead' | 'Converted';
}

interface Framework {
  name: string;
  assigned: number;
  progress: number;
}

const Dashboard: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const sidebarWidth = isSidebarHovered ? 240 : 80;

  const dashboardStats: DashboardStats = {
    total_leads: { value: 5, growth: '+12% vs last month' },
    organizations: { value: 5, growth: '+8% vs last month' },
    active_frameworks: { value: 3, growth: '+25% vs last month' },
    conversion_rate: { value: '40%', growth: '+5% vs last month' },
  };

  const recentLeads: Lead[] = [
    { name: 'John Doe', company: 'TechCorp Solutions', status: 'Lead' },
    { name: 'Sarah Wilson', company: 'HealthPlus Medical', status: 'Converted' },
    { name: 'Mike Chen', company: 'FinanceIQ', status: 'Lead' },
    { name: 'Emma Davis', company: 'EduTech Innovations', status: 'Lead' },
    { name: 'Alex Johnson', company: 'RetailMax Group', status: 'Converted' },
  ];

  const frameworks: Framework[] = [
    { name: 'ISO 27001', assigned: 1, progress: 60 },
    { name: 'SOC 2', assigned: 1, progress: 60 },
    { name: 'HIPAA', assigned: 1, progress: 60 },
    { name: 'GDPR', assigned: 0, progress: 10 },
    { name: 'PCI DSS', assigned: 0, progress: 5 },
  ];

  return (
    <div>
      <Header />
      <div
        style={{
          position: 'fixed',
          top: 58,
          left: 0,
          height: '100%',
          width: `${sidebarWidth}px`,
          transition: 'width 0.3s',
          zIndex: 1000,
        }}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Sidebar isCollapsed={!isSidebarHovered} />
      </div>

      <div
        className="main-content"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s',
        }}
      >
        <Container fluid>
          <Row className="mb-2">
            {Object.entries(dashboardStats).map(([key, stat], idx) => (
              <Col xl={3} md={6} key={idx}>
                <Card className="shadow-sm rounded border-0 mb-4">
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">{key.replace('_', ' ').toUpperCase()}</h6>
                      <h3>{stat.value}</h3>
                      <small className="text-success">{stat.growth}</small>
                    </div>
                    <div
                      className={`d-flex justify-content-center align-items-center rounded-circle p-3 ${
                        key === 'total_leads'
                          ? 'bg-primary'
                          : key === 'organizations'
                          ? 'bg-success'
                          : key === 'active_frameworks'
                          ? 'bg-purple'
                          : 'bg-warning'
                      }`}
                      style={{ width: '50px', height: '50px' }}
                    >
                      <i
                        className={`bi ${
                          key === 'total_leads'
                            ? 'bi-people'
                            : key === 'organizations'
                            ? 'bi-building'
                            : key === 'active_frameworks'
                            ? 'bi-shield-check'
                            : 'bi-bar-chart'
                        } text-white`}
                        style={{ fontSize: '24px' }}
                      ></i>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row>
            <Col xl={6}>
              <Card className="shadow-sm rounded mb-4">
                <Card.Header className="border-0">
                  <h5 className="mb-0">Recent Leads</h5>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled mb-0">
                    {recentLeads.map((lead, idx) => (
                      <li
                        key={idx}
                        className="d-flex justify-content-between align-items-center mb-3 pb-2 "
                      >
                        <div>
                          <strong>{lead.name}</strong>
                          <p className="text-muted small mb-0">{lead.company}</p>
                        </div>
                        <Badge
                          bg={lead.status === 'Converted' ? 'success' : 'warning'}
                          className="text-uppercase p-2"
                        >
                          {lead.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={6}>
              <Card className="shadow-sm rounded mb-4">
                <Card.Header className="border-0">
                  <h5 className="mb-0">Framework Distribution</h5>
                </Card.Header>
                <Card.Body>
                  {frameworks.map((fw, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between">
                        <span>{fw.name}</span>
                        <small>{fw.assigned} assigned</small>
                      </div>
                      <ProgressBar
                        now={fw.progress}
                        variant={fw.progress > 0 ? 'primary' : 'secondary'}
                        className="rounded"
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;
