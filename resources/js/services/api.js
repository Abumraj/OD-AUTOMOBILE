const API_BASE_URL = "/api";

export const api = {
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  async getKanbanData() {
    const response = await fetch(`${API_BASE_URL}/admin/kanban`);
    if (!response.ok) throw new Error("Failed to fetch kanban data");
    return response.json();
  },

  async getActivityStream() {
    const response = await fetch(`${API_BASE_URL}/admin/activity`);
    if (!response.ok) throw new Error("Failed to fetch activity stream");
    return response.json();
  },

  async getFleetHealth() {
    const response = await fetch(`${API_BASE_URL}/admin/fleet-health`);
    if (!response.ok) throw new Error("Failed to fetch fleet health");
    return response.json();
  },

  async updateShipmentStatus(id, status) {
    const response = await fetch(
      `${API_BASE_URL}/admin/shipments/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    if (!response.ok) throw new Error("Failed to update shipment status");
    return response.json();
  },

  async submitQuote(quoteData) {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit quote");
    }
    return response.json();
  },

  async trackShipment(trackingId) {
    const response = await fetch(`${API_BASE_URL}/tracking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tracking_id: trackingId }),
    });
    if (!response.ok) throw new Error("Failed to track shipment");
    return response.json();
  },

  async getQuotes() {
    const response = await fetch(`${API_BASE_URL}/admin/quotes`);
    if (!response.ok) throw new Error("Failed to fetch quotes");
    return response.json();
  },

  async approveQuote(id) {
    const response = await fetch(`${API_BASE_URL}/admin/quotes/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to approve quote");
    return response.json();
  },

  async rejectQuote(id) {
    const response = await fetch(`${API_BASE_URL}/admin/quotes/${id}/reject`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to reject quote");
    return response.json();
  },

  async getTestimonials() {
    const response = await fetch(`${API_BASE_URL}/testimonials`);
    if (!response.ok) throw new Error("Failed to fetch testimonials");
    return response.json();
  },

  async getFeaturedTestimonials() {
    const response = await fetch(`${API_BASE_URL}/testimonials/featured`);
    if (!response.ok) throw new Error("Failed to fetch featured testimonials");
    return response.json();
  },

  async getAdminTestimonials() {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials`);
    if (!response.ok) throw new Error("Failed to fetch admin testimonials");
    return response.json();
  },

  async createTestimonial(data) {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create testimonial");
    return response.json();
  },

  async updateTestimonial(id, data) {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update testimonial");
    return response.json();
  },

  async deleteTestimonial(id) {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to delete testimonial");
    return response.json();
  },

  async toggleFeaturedTestimonial(id) {
    const response = await fetch(
      `${API_BASE_URL}/admin/testimonials/${id}/toggle-featured`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to toggle featured status");
    return response.json();
  },

  async getSocialMediaSettings() {
    const response = await fetch(`${API_BASE_URL}/social-media-settings`);
    if (!response.ok) throw new Error("Failed to fetch social media settings");
    return response.json();
  },

  async updateSocialMediaSettings(data) {
    const response = await fetch(`${API_BASE_URL}/admin/social-media-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update social media settings");
    return response.json();
  },
};

export default api;
