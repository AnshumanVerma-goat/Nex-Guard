import { api } from '../api';

export const RemoteAuthService = {
  async registerRemote(data: { email: string; password: string; full_name: string; phone_number?: string }) {
    return await api.register(data);
  },

  async loginRemote(data: { email: string; password: string }) {
    return await api.login(data);
  },
};
