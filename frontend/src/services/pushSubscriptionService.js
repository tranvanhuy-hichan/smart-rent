import api from './api';

export default {
  getPublicKey() {
    return api.get('/api/push-subscriptions/public-key', { skipLoading: true });
  },
  subscribe(subscriptionData) {
    return api.post('/api/push-subscriptions/subscribe', subscriptionData, { skipLoading: true });
  },
  unsubscribe(endpoint) {
    return api.post('/api/push-subscriptions/unsubscribe', { endpoint }, { skipLoading: true });
  }
};
