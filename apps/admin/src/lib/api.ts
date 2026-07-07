const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Authentication
  register: (data: { name: string; email: string; password: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/users/me"),

  // Businesses
  myBusinesses: () => request("/businesses"),
  createBusiness: (data: { name: string; category: string }) =>
    request("/businesses", { method: "POST", body: JSON.stringify(data) }),

  // Locations
  listLocations: (businessId: string) => request(`/businesses/${businessId}/locations`),
  createLocation: (businessId: string, data: { name: string; address?: string; googlePlaceId?: string }) =>
    request(`/businesses/${businessId}/locations`, { method: "POST", body: JSON.stringify(data) }),
  deleteLocation: (businessId: string, locationId: string) =>
    request(`/businesses/${businessId}/locations/${locationId}`, { method: "DELETE" }),

  // Team
  getTeam: (businessId: string) => request(`/businesses/${businessId}/team`),
  inviteMember: (businessId: string, data: { name: string; email: string; role: "MANAGER" | "EMPLOYEE" }) =>
    request(`/businesses/${businessId}/team`, { method: "POST", body: JSON.stringify(data) }),
  updateMemberRole: (businessId: string, memberId: string, role: string) =>
    request(`/businesses/${businessId}/team/${memberId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMember: (businessId: string, memberId: string) =>
    request(`/businesses/${businessId}/team/${memberId}`, { method: "DELETE" }),

  // Analytics
  analytics: (businessId: string) => request(`/businesses/${businessId}/analytics/overview`),
  getAdvancedAnalytics: (businessId: string) => request(`/businesses/${businessId}/analytics/advanced`),
  getLocationBreakdown: (businessId: string) => request(`/businesses/${businessId}/analytics/locations`),

  // Review Requests (Protected)
  listReviewRequests: (businessId: string) => request(`/businesses/${businessId}/review-requests`),
  createReviewRequest: (
    businessId: string,
    data: { customerName: string; customerEmail?: string; customerPhone?: string; locationId: string; channel: string },
  ) =>
    request(`/businesses/${businessId}/review-requests`, { method: "POST", body: JSON.stringify(data) }),

  // Customer Portal (Public - Token-Based)
  getReviewRequest: (token: string) => request(`/review-requests/token/${token}`),
  submitRating: (token: string, data: { stars: number; feedback?: string; keywords?: string; tone?: string }) =>
    request(`/review-requests/token/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),
  regenerateDraft: (token: string, data: { keywords?: string; tone: string }) =>
    request(`/review-requests/token/${token}/regenerate`, { method: "POST", body: JSON.stringify(data) }),

  // Location Walk-In (QR scan - Public)
  getPublicLocation: (id: string) => request(`/public/locations/${id}`),
  submitGuestRating: (
    locationId: string,
    data: {
      stars: number;
      feedback?: string;
      keywords?: string;
      tone?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
    },
  ) =>
    request(`/locations/${locationId}/guest-submit`, { method: "POST", body: JSON.stringify(data) }),

  // Review Campaigns (Protected)
  listCampaigns: (businessId: string) => request(`/businesses/${businessId}/campaigns`),
  getCampaign: (businessId: string, id: string) => request(`/businesses/${businessId}/campaigns/${id}`),
  createCampaign: (
    businessId: string,
    data: {
      name: string;
      channel: string;
      locationId: string;
      customers: Array<{ name: string; email?: string; phone?: string }>;
    },
  ) =>
    request(`/businesses/${businessId}/campaigns`, { method: "POST", body: JSON.stringify(data) }),

  // Google Business Profile Integration (Protected)
  getGoogleOauthUrl: (locationId: string) => request(`/google-integration/oauth-url?locationId=${locationId}`),
  callbackGoogleOauth: (locationId: string) => request(`/google-integration/callback?locationId=${locationId}`),
  syncGoogleReviews: (locationId: string) => request(`/google-integration/locations/${locationId}/sync`, { method: "POST" }),
  listGoogleReviews: (locationId: string) => request(`/google-integration/locations/${locationId}/reviews`),
  submitGoogleReply: (reviewId: string, replyText: string) =>
    request(`/google-integration/reviews/${reviewId}/reply`, { method: "POST", body: JSON.stringify({ replyText }) }),
  draftGoogleReply: (reviewId: string) =>
    request(`/google-integration/reviews/${reviewId}/draft-reply`, { method: "POST" }),

  // Enterprise Mappings (Branding, Billing, API Keys)
  updateBranding: (businessId: string, data: { logoUrl?: string; primaryColor?: string; customDomain?: string }) =>
    request(`/businesses/${businessId}/branding`, { method: "PATCH", body: JSON.stringify(data) }),
  upgradeBilling: (businessId: string) =>
    request(`/businesses/${businessId}/billing/upgrade`, { method: "POST" }),
  listApiKeys: (businessId: string) =>
    request(`/businesses/${businessId}/keys`),
  createApiKey: (businessId: string, label: string) =>
    request(`/businesses/${businessId}/keys`, { method: "POST", body: JSON.stringify({ label }) }),
  revokeApiKey: (businessId: string, keyId: string) =>
    request(`/businesses/${businessId}/keys/${keyId}`, { method: "DELETE" }),

  // Omnichannel Mappings (Yelp, Facebook, TripAdvisor, widgets)
  syncAllPlatformReviews: (locationId: string) =>
    request(`/locations/${locationId}/sync-all`, { method: "POST" }),
  listPlatformReviews: (locationId: string) =>
    request(`/locations/${locationId}/platform-reviews`),
  socialShareReview: (locationId: string, reviewId: string, platform: string) =>
    request(`/locations/${locationId}/social-share/${reviewId}`, { method: "POST", body: JSON.stringify({ platform }) }),
  getPublicWidgetData: (businessId: string) =>
    request(`/public/widgets/${businessId}/reviews`),

  // Ticketing Mappings (Customer support requests)
  listTickets: (businessId: string) =>
    request(`/businesses/${businessId}/tickets`),
  createTicket: (businessId: string, data: { title: string; description: string; priority?: string }) =>
    request(`/businesses/${businessId}/tickets`, { method: "POST", body: JSON.stringify(data) }),
  updateTicket: (businessId: string, ticketId: string, data: { status?: string; assignedTo?: string; resolution?: string }) =>
    request(`/businesses/${businessId}/tickets/${ticketId}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Competitive Mappings (Google Places sync & benchmarks)
  listCompetitors: (businessId: string) =>
    request(`/businesses/${businessId}/competitors`),
  syncCompetitors: (businessId: string) =>
    request(`/businesses/${businessId}/competitors/sync`, { method: "POST" }),
  createCompetitor: (businessId: string, data: { name: string; rating?: number; reviewCount?: number }) =>
    request(`/businesses/${businessId}/competitors`, { method: "POST", body: JSON.stringify(data) }),

  // Admin Portal Mappings (SaaS operations & billing overrides)
  adminGetStats: () => request("/admin/stats"),
  adminListUsers: () => request("/admin/users"),
  adminUpdateUserRole: (userId: string, role: string) =>
    request(`/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminToggleUserStatus: (userId: string, suspended: boolean) =>
    request(`/admin/users/${userId}/toggle-status`, { method: "POST", body: JSON.stringify({ suspended }) }),
  adminListBusinesses: () => request("/admin/businesses"),
  adminOverrideSubscription: (businessId: string, data: { plan: string; status: string; currentPeriodEnd?: string }) =>
    request(`/admin/businesses/${businessId}/subscription`, { method: "PATCH", body: JSON.stringify(data) }),
  adminImpersonateUser: (userId: string) =>
    request(`/admin/users/${userId}/impersonate`, { method: "POST" }),
  adminGetPrompt: () => request("/admin/config/prompt"),
  adminSavePrompt: (value: string) =>
    request("/admin/config/prompt", { method: "POST", body: JSON.stringify({ value }) }),
  adminListGlobalTickets: () => request("/admin/tickets"),
  adminUpdateTicket: (ticketId: string, data: { status?: string; assignedTo?: string; resolution?: string }) =>
    request(`/admin/tickets/${ticketId}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminGetBusinessDetails: (id: string) => request(`/admin/businesses/${id}`),
  adminListSubscriptions: () => request("/admin/subscriptions"),
  adminGetAiUsage: () => request("/admin/ai-usage"),
  adminGetAuditLogs: () => request("/admin/audit-logs"),
  adminListFeatureFlags: () => request("/admin/feature-flags"),
  adminCreateFeatureFlag: (data: { key: string; description: string; enabledPlans?: string[]; enabledForBusinessIds?: string[]; globallyEnabled?: boolean }) =>
    request("/admin/feature-flags", { method: "POST", body: JSON.stringify(data) }),
  adminToggleFeatureFlag: (id: string, data: { globallyEnabled?: boolean; enabledPlans?: string[]; enabledForBusinessIds?: string[] }) =>
    request(`/admin/feature-flags/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminListApiKeys: () => request("/admin/api-keys"),
  adminRevokeApiKey: (id: string) => request(`/admin/api-keys/${id}`, { method: "DELETE" }),
};
