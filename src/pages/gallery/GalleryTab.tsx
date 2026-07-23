// src/pages/gallery/GalleryTab.tsx
import React, { useEffect, useState, useRef } from "react";
import { Button, Badge, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { uploadMediaFile, addGalleryItem, getGalleryItems, updateGalleryItem, deleteGalleryItem } from "../../service/common.service";
import { GalleryItem, GalleryEntityType, GalleryCategory, IMAGE_CATEGORIES, VIDEO_CATEGORIES, CATEGORY_COLORS } from "./types/gallery";

interface Props {
  entityType: GalleryEntityType;
  entityId: string;
  entityName?: string;
}

const GalleryTab: React.FC<Props> = ({ entityType, entityId, entityName }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "image" | "video">("all");

  // Upload form state
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [category, setCategory] = useState<GalleryCategory>("exterior");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [editCategory, setEditCategory] = useState<GalleryCategory>("exterior");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPrimary, setEditIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lightbox
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (entityId) loadItems();
  }, [entityId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await getGalleryItems(entityType, entityId);
      const data = res?.data?.data;
      setItems(data?.items || []);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const folder = `gallery/${entityType}/${entityId}/${mediaType}s`;
      const uploadedUrls = await Promise.all(
        Array.from(files).map(file => uploadMediaFile(file, folder))
      );
      await Promise.all(
        uploadedUrls.map((url, i) =>
          addGalleryItem({
            entity_type: entityType,
            entity_id: entityId,
            media_type: mediaType,
            category,
            url,
            title: title || undefined,
            description: description || undefined,
            is_primary: i === 0 ? isPrimary : false,
          })
        )
      );
      toast.success(`${uploadedUrls.length} file(s) added to gallery`);
      setTitle("");
      setDescription("");
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadItems();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item: GalleryItem) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGalleryItem(deleteTarget.id);
      toast.success("Removed from gallery");
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (item: GalleryItem) => {
    setEditItem(item);
    setEditCategory(item.category);
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    setEditIsPrimary(item.is_primary);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    const res = await updateGalleryItem(editItem.id, {
      category: editCategory,
      title: editTitle || undefined,
      description: editDescription || undefined,
      is_primary: editIsPrimary,
    });
    if (res?.data?.status) {
      toast.success("Updated");
      setEditItem(null);
      await loadItems();
    }
    setSaving(false);
  };

  const handleSetPrimary = async (item: GalleryItem) => {
    const res = await updateGalleryItem(item.id, { is_primary: true });
    if (res?.data?.status) {
      toast.success("Set as primary image");
      await loadItems();
    }
  };

  const filteredItems = items.filter(i =>
    activeFilter === "all" ? true : i.media_type === activeFilter
  );
  const images = items.filter(i => i.media_type === "image");
  const videos = items.filter(i => i.media_type === "video");

  const categoryOptions = mediaType === "image" ? IMAGE_CATEGORIES : VIDEO_CATEGORIES;

  return (
    <div>
      {/* Header */}
      <div style={{ borderLeft: "3px solid #0d6efd", paddingLeft: 12, marginBottom: 16 }}>
        <h5 style={{ fontWeight: 700, fontSize: 16, color: "#212529", marginBottom: 2 }}>Gallery</h5>
        <p style={{ fontSize: 12, color: "#6c757d", marginBottom: 0 }}>
          Manage images and videos for{entityName ? ` "${entityName}"` : " this item"}
        </p>
      </div>

      {/* Entity-type guidance banner */}
      {entityType === "sub_variant" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "#166534" }}>
          <i className="bi bi-camera-fill" style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }} />
          <div>
            <strong>Upload all vehicle photos here.</strong> Use <em>Exterior</em> for outside shots, <em>Interior</em> for cabin photos, <em>360°</em> for panoramic views, <em>Color</em> for color-specific images, and <em>Detail</em> for close-up shots. The primary image shows on listing cards.
          </div>
        </div>
      )}
      {entityType === "variant" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "#166534" }}>
          <i className="bi bi-camera-fill" style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }} />
          <div>
            <strong>Upload all car photos here.</strong> Use <em>Exterior</em> / <em>Interior</em> / <em>360°</em> / <em>Color</em> / <em>Detail</em> categories. These photos are shared by every sub-variant of this variant, and the <strong>primary</strong> image shows on listing &amp; budget cards.
          </div>
        </div>
      )}
      {entityType === "model" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "#92400e" }}>
          <i className="bi bi-info-circle-fill" style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }} />
          <div>
            <strong>Model gallery — one showcase photo.</strong> Upload a single primary image that represents the model. All detailed car photos belong on the <em>Variants</em> tab.
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#e8f0fe", borderRadius: 20 }}>
          <i className="bi bi-image" style={{ color: "#0d6efd", fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>{images.length} images</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fde8e8", borderRadius: 20 }}>
          <i className="bi bi-camera-video" style={{ color: "#dc3545", fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#dc3545" }}>{videos.length} videos</span>
        </div>
      </div>

      {/* Upload Panel */}
      <div style={{ border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e9ecef", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-cloud-upload" style={{ color: "#0d6efd" }} />
          <span style={{ fontWeight: 600, fontSize: 13, color: "#495057" }}>Upload Media</span>
        </div>

        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", gap: 20 }}>

            {/* Left column: metadata fields */}
            <div style={{ flex: "0 0 260px" }}>
              {/* Media Type */}
              <Form.Group style={{ marginBottom: 14 }}>
                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>Media Type</Form.Label>
                <div style={{ display: "flex", gap: 16 }}>
                  <Form.Check
                    type="radio" id="mt-image" label="Image" name="mediaType"
                    checked={mediaType === "image"}
                    onChange={() => { setMediaType("image"); setCategory("exterior"); }}
                  />
                  <Form.Check
                    type="radio" id="mt-video" label="Video" name="mediaType"
                    checked={mediaType === "video"}
                    onChange={() => { setMediaType("video"); setCategory("review"); }}
                  />
                </div>
              </Form.Group>

              {/* Category */}
              <Form.Group style={{ marginBottom: 14 }}>
                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>Category</Form.Label>
                <Form.Select size="sm" value={category} onChange={e => setCategory(e.target.value as GalleryCategory)}>
                  {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Form.Select>
              </Form.Group>

              {/* Title */}
              <Form.Group style={{ marginBottom: 14 }}>
                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>
                  Title <span style={{ color: "#adb5bd", fontWeight: 400 }}>(optional)</span>
                </Form.Label>
                <Form.Control size="sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Front view in black" />
              </Form.Group>

              {/* Description */}
              <Form.Group style={{ marginBottom: 14 }}>
                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>
                  Description <span style={{ color: "#adb5bd", fontWeight: 400 }}>(optional)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short description of this media..."
                  style={{ resize: "none" }}
                />
              </Form.Group>

              {/* Primary checkbox */}
              {mediaType === "image" && (
                <Form.Check
                  type="checkbox"
                  id="isPrimary"
                  label={<span style={{ fontSize: 13 }}>Set as primary image</span>}
                  checked={isPrimary}
                  onChange={e => setIsPrimary(e.target.checked)}
                />
              )}
            </div>

            {/* Right column: upload zone */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="gallery-file-input"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  height: "100%", minHeight: 200,
                  border: "2px dashed #dee2e6", borderRadius: 10,
                  background: uploading ? "#f0f4ff" : "#fafafa",
                  cursor: uploading ? "not-allowed" : "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = "#0d6efd"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#dee2e6"; }}
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" style={{ color: "#0d6efd", width: 36, height: 36, marginBottom: 12 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0d6efd" }}>Uploading…</span>
                    <span style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>Please wait</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload" style={{ fontSize: 36, color: "#0d6efd", marginBottom: 10 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#212529" }}>Click to browse files</span>
                    <span style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                      {mediaType === "image"
                        ? "JPG, PNG, WebP, GIF · Multiple files allowed"
                        : "MP4, MOV, WebM · One file at a time"}
                    </span>
                    <span style={{ fontSize: 11, color: "#adb5bd", marginTop: 8, padding: "4px 12px", background: "#e9ecef", borderRadius: 20 }}>
                      {mediaType === "image" ? "Images" : "Videos"} · {category.replace("_", " ")}
                    </span>
                  </>
                )}
              </label>
              <input
                ref={fileInputRef}
                id="gallery-file-input"
                type="file"
                multiple={mediaType === "image"}
                accept={mediaType === "image" ? "image/*" : "video/*"}
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "image", "video"] as const).map(f => (
          <button
            type="button"
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13,
              background: activeFilter === f ? "#0d6efd" : "#e9ecef",
              color: activeFilter === f ? "#fff" : "#495057",
              fontWeight: activeFilter === f ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {f === "all" ? `All (${items.length})` : f === "image" ? `Images (${images.length})` : `Videos (${videos.length})`}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spinner animation="border" size="sm" />
          <span style={{ marginLeft: 8, color: "#6c757d", fontSize: 14 }}>Loading gallery…</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#adb5bd", border: "1px dashed #dee2e6", borderRadius: 10 }}>
          <i className="bi bi-images" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 500 }}>No {activeFilter === "all" ? "media" : activeFilter + "s"} yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Upload some using the panel above</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{ position: "relative", border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}
            >
              {/* Badges */}
              {item.is_primary && (
                <div style={{ position: "absolute", top: 6, left: 6, zIndex: 1 }}>
                  <span style={{ background: "#ffc107", color: "#212529", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                    ★ Primary
                  </span>
                </div>
              )}
              <div style={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}>
                <span style={{ background: (CATEGORY_COLORS[item.category] ? `var(--bs-${CATEGORY_COLORS[item.category]})` : "#6c757d"), color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                  {item.category.replace("_", " ")}
                </span>
              </div>

              {/* Thumbnail */}
              <div
                style={{ height: 130, background: "#f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}
                onClick={() => setLightbox(item)}
              >
                {item.media_type === "image" ? (
                  <img src={item.url} alt={item.title || item.category} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                ) : item.thumbnail ? (
                  <>
                    <img src={item.thumbnail} alt="thumbnail" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="bi bi-play-circle-fill" style={{ fontSize: 32, color: "rgba(255,255,255,0.9)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                    </div>
                  </>
                ) : (
                  <i className="bi bi-play-circle-fill" style={{ fontSize: 36, color: "#dc3545" }} />
                )}
              </div>

              {/* Info + Actions */}
              <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {item.title && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#212529", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <i className={`bi ${item.media_type === "image" ? "bi-image" : "bi-camera-video"}`} style={{ fontSize: 11, color: "#6c757d" }} />
                  <span style={{ fontSize: 11, color: "#6c757d" }}>{item.media_type}</span>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: "auto" }}>
                  {item.media_type === "image" && !item.is_primary && (
                    <button
                      type="button"
                      title="Set as primary"
                      onClick={() => handleSetPrimary(item)}
                      style={{ flex: 1, padding: "4px 0", fontSize: 12, border: "1px solid #ffc107", borderRadius: 5, background: "transparent", color: "#f0a500", cursor: "pointer" }}
                    >
                      <i className="bi bi-star" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(item)}
                    style={{ flex: 1, padding: "4px 0", fontSize: 12, border: "1px solid #0d6efd", borderRadius: 5, background: "transparent", color: "#0d6efd", cursor: "pointer" }}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => handleDelete(item)}
                    style={{ flex: 1, padding: "4px 0", fontSize: 12, border: "1px solid #dc3545", borderRadius: 5, background: "transparent", color: "#dc3545", cursor: "pointer" }}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e9ecef" }}>
          <Modal.Title style={{ fontSize: 15, fontWeight: 700 }}>Edit Gallery Item</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          <Form.Group style={{ marginBottom: 14 }}>
            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>Category</Form.Label>
            <Form.Select size="sm" value={editCategory} onChange={e => setEditCategory(e.target.value as GalleryCategory)}>
              {[...IMAGE_CATEGORIES, ...VIDEO_CATEGORIES].map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group style={{ marginBottom: 14 }}>
            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>
              Title <span style={{ color: "#adb5bd", fontWeight: 400 }}>(optional)</span>
            </Form.Label>
            <Form.Control size="sm" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Optional title" />
          </Form.Group>
          <Form.Group style={{ marginBottom: 14 }}>
            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>
              Description <span style={{ color: "#adb5bd", fontWeight: 400 }}>(optional)</span>
            </Form.Label>
            <Form.Control as="textarea" rows={3} size="sm" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Optional description" style={{ resize: "none" }} />
          </Form.Group>
          <Form.Check
            type="checkbox"
            id="editIsPrimary"
            label={<span style={{ fontSize: 13 }}>Set as primary image</span>}
            checked={editIsPrimary}
            onChange={e => setEditIsPrimary(e.target.checked)}
          />
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #e9ecef" }}>
          <Button size="sm" variant="outline-secondary" onClick={() => setEditItem(null)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={handleSaveEdit} disabled={saving}>
            {saving ? <><Spinner size="sm" animation="border" className="me-1" />Saving…</> : <><i className="bi bi-check2 me-1" />Save Changes</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteTarget} onHide={() => !deleting && setDeleteTarget(null)} centered size="sm">
        <Modal.Body style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <i className="bi bi-trash3" style={{ fontSize: 24, color: "#dc3545" }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#212529", marginBottom: 8 }}>Remove from gallery?</div>
          {deleteTarget?.title && (
            <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>"{deleteTarget.title}"</div>
          )}
          <div style={{ fontSize: 13, color: "#6c757d" }}>
            This will permanently delete the {deleteTarget?.media_type}. This action cannot be undone.
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #e9ecef", justifyContent: "center", gap: 8, padding: "12px 24px" }}>
          <Button
            variant="outline-secondary"
            size="sm"
            style={{ minWidth: 90 }}
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            style={{ minWidth: 90 }}
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? <><Spinner size="sm" animation="border" className="me-1" />Deleting…</> : <><i className="bi bi-trash3 me-1" />Delete</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Lightbox */}
      <Modal show={!!lightbox} onHide={() => setLightbox(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 14 }}>
            {lightbox?.title || `${lightbox?.category?.replace("_", " ")} · ${lightbox?.media_type}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 text-center bg-dark">
          {lightbox?.media_type === "image" ? (
            <img src={lightbox.url} alt={lightbox.title || ""} style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }} />
          ) : lightbox?.media_type === "video" ? (
            <video src={lightbox.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "75vh" }} />
          ) : null}
        </Modal.Body>
        {lightbox?.description && (
          <Modal.Footer className="justify-content-start py-2">
            <small className="text-muted">{lightbox.description}</small>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export default GalleryTab;
