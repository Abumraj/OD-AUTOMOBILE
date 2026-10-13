const BASE = '/api/portal';

export class PortalApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request(path, { method = 'GET', body, formData, params } = {}) {
    let url = `${BASE}${path}`;
    if (params) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        ).toString();
        if (query) url += `?${query}`;
    }

    const options = { method, headers: { Accept: 'application/json' } };
    if (formData) {
        options.body = formData;
    } else if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new PortalApiError(firstFieldError || data?.message || 'Something went wrong. Please try again.', response.status, data);
    }

    return data;
}

export const portalApi = {
    get: (path, params) => request(path, { params }),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),
    upload: (path, formData) => request(path, { method: 'POST', formData }),
    url: (path, params) => {
        const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString() : '';
        return `${BASE}${path}${query ? `?${query}` : ''}`;
    },
};

export default portalApi;
