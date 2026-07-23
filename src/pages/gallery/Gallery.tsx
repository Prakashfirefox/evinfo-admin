// src/pages/gallery/Gallery.tsx
import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Badge, Spinner, InputGroup } from "react-bootstrap";
import Sidebar from "../../components/Sidebar-left/sideBar";
import Header from "../../components/top-nav";
import GalleryTab from "./GalleryTab";
import { getAllVariants, getAllModels } from "../../service/common.service";
import { toast, ToastContainer } from "react-toastify";
import { GalleryEntityType } from "./types/gallery";

const Gallery: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const sidebarWidth = isSidebarHovered ? 240 : 80;

  const [entityType, setEntityType] = useState<GalleryEntityType>("variant");
  const [entityId, setEntityId] = useState("");
  const [entityName, setEntityName] = useState("");
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadEntities();
    setEntityId("");
    setEntityName("");
  }, [entityType]);

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      let res;
      if (entityType === "variant") res = await getAllVariants({ offset: 0, limit: 100 });
      else res = await getAllModels({ offset: 0, limit: 100 });

      const rows = res?.data?.data?.data?.rows || res?.data?.data?.rows || [];
      setEntities(rows);
    } catch {
      toast.error("Failed to load entities");
    } finally {
      setLoadingEntities(false);
    }
  };

  const filteredEntities = entities.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectEntity = (entity: any) => {
    setEntityId(entity.id);
    setEntityName(entity.name);
  };

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
          <div className="mb-4">
            <h4 className="fw-bold">Gallery Manager</h4>
            <p className="text-muted">Manage images & videos — upload car photos on the <strong>Variants</strong> tab (Models carry one showcase photo)</p>
          </div>

          <Row className="g-4">
            {/* Left: Entity Selector */}
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Header className="bg-light fw-semibold">
                  <i className="bi bi-collection me-2"></i>Select Entity
                </Card.Header>
                <Card.Body>
                  {/* Entity type tabs */}
                  <div className="d-flex gap-2 mb-3">
                    {([
                      { value: "variant", label: "Variants" },
                      { value: "model", label: "Models" },
                    ] as { value: GalleryEntityType; label: string }[]).map(({ value, label }) => (
                      <Button key={value} size="sm"
                        variant={entityType === value ? "primary" : "outline-secondary"}
                        onClick={() => setEntityType(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>

                  <InputGroup size="sm" className="mb-3">
                    <Form.Control
                      placeholder={`Search ${entityType + "s"}...`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  </InputGroup>

                  {loadingEntities ? (
                    <div className="text-center py-3"><Spinner size="sm" animation="border" /></div>
                  ) : (
                    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                      {filteredEntities.length === 0 ? (
                        <p className="text-muted text-center small py-3">No {entityType + "s"} found</p>
                      ) : (
                        filteredEntities.map(entity => (
                          <div
                            key={entity.id}
                            className={`p-2 rounded mb-1 cursor-pointer d-flex align-items-center justify-content-between ${entityId === entity.id ? "bg-primary text-white" : "bg-light"}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSelectEntity(entity)}
                          >
                            <div>
                              <div className="fw-medium small">{entity.name}</div>
                              <div className={`small ${entityId === entity.id ? "text-white-50" : "text-muted"}`}>{entity.slug}</div>
                            </div>
                            <Badge bg={entity.status === "active" ? "success" : "secondary"} style={{ fontSize: "0.6rem" }}>
                              {entity.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Right: Gallery */}
            <Col md={8}>
              {!entityId ? (
                <Card className="shadow-sm">
                  <Card.Body className="text-center py-5 text-muted">
                    <i className="bi bi-images fs-1 d-block mb-3"></i>
                    <h6>Select a {entityType} to manage its gallery</h6>
                    <p className="small">Choose from the list on the left</p>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <Card.Header className="bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <span className="fw-semibold">{entityName}</span>
                      <Badge bg="secondary" className="ms-2" style={{ fontSize: "0.65rem" }}>{entityType}</Badge>
                    </div>
                    <Button size="sm" variant="outline-secondary" onClick={() => { setEntityId(""); setEntityName(""); }}>
                      <i className="bi bi-x"></i>
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <GalleryTab entityType={entityType} entityId={entityId} entityName={entityName} />
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Container>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Gallery;
