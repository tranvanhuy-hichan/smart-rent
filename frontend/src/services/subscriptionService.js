import api from './api.js';

export default {
  // Landlord endpoints
  createRequest(packageId, returnUrl, cancelUrl) {
    return api.post('/api/subscriptions/request', { packageId, returnUrl, cancelUrl });
  },
  
  getMyRequests() {
    return api.get('/api/subscriptions/my-requests');
  },
  
  getActiveStatus() {
    return api.get('/api/subscriptions/active-status');
  },
  
  // Package endpoints
  getActivePackages() {
    return api.get('/api/subscriptions/packages');
  },

  getAdminPackages() {
    return api.get('/api/subscriptions/packages/admin');
  },

  createPackage(pack) {
    return api.post('/api/subscriptions/packages', pack);
  },

  updatePackage(id, pack) {
    return api.put(`/api/subscriptions/packages/${id}`, pack);
  },

  deletePackage(id) {
    return api.delete(`/api/subscriptions/packages/${id}`);
  },
  
  // Admin endpoints
  getAdminRequests(status = '', page = 0, size = 10) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('size', size);
    return api.get(`/api/subscriptions/admin/requests?${params.toString()}`);
  },
  
  approveRequest(id) {
    return api.post(`/api/subscriptions/admin/requests/${id}/approve`);
  },
  
  rejectRequest(id) {
    return api.post(`/api/subscriptions/admin/requests/${id}/reject`);
  },
  
  extendLandlord(landlordId, months) {
    return api.post('/api/subscriptions/admin/extend', { landlordId, months });
  },

  getAdminBankInfo() {
    return api.get('/api/subscriptions/admin-bank-info');
  },

  updateAdminBankInfo(setting) {
    return api.put('/api/subscriptions/admin-bank-info', setting);
  },

  getPayosLink(requestId, params) {
    return api.get(`/api/payment/subscriptions/requests/${requestId}/payos-link`, { params });
  }
};
