import api from './axiosConfig';

export const savePlaybackProgress = async (profileId, payload) => {
    if (!profileId) throw new Error("profileId is required");
    const response = await api.post(`/v1/profiles/${profileId}/history/heartbeat`, payload);
    return response.data;
};

export const getContinueWatching = async (profileId) => {
    if (!profileId) throw new Error("profileId is required");
    const response = await api.get(`/v1/profiles/${profileId}/history/continue-watching`);
    return response.data;
};
