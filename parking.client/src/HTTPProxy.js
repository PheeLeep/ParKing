export const COMMAND_URLS = {
    EMPLOYEE_LOGIN: '/auth/login',
    EMPLOYEE_CHECK_SESSION: '/auth/session',
    EMPLOYEE_CHANGE_PASSWORD: '/auth/changepassword',
    LOGOUT: '/auth/logout',

    GET_DASHBOARD: '/dashboard',
    GET_REPORTS: '/dashboard/reports',
    GET_TICKET_REVENEUE_TREND: '/tickets/get_trend',

    GET_USERS: '/users/populate',
    GET_ONE_USER: '/users/fetch_one',
    ADD_USER: '/users/add',
    EDIT_USER: '/users/update',
    CHANGE_PASS_USER: '/users/changepassword',
    CHANGE_ACTIVE_USER: '/users/activate',

    POPULATE_SLOT_SECTIONS: '/slots/populate_sections',
    POPULATE_SLOTS: '/slots/populate_slots',
    ADD_SLOT_SECTION: '/slots/add_section',
    ADD_SLOTS: '/slots/add',
    OCCUPY_SLOT: '/slots/occupy',
    GET_SLOT: '/slots/get_slot',

    GET_TICKETS: '/tickets',
    FETCH_TICKET: '/tickets/get_ticket',
    UPDATE_TICKET: '/tickets/update',
    SET_TICKET_CANCEL: '/tickets/cancel',

    GET_PAYMENT: '/payment',
    GET_PAYMENT_BY_TICKET: '/payment/fetch_payment',
    GET_PAYMENT_TREND: '/payment/trends',
    PAY_TICKET: '/payment/pay',

    GET_VIOLATIONS: '/violations',
    GET_VIOLATIONS_BY_TICKETID: '/violations/fetch',
    ADD_VIOLATION: '/violations/add',
    REMOVE_VIOLATION: '/violations/remove_violation',

    FETCH_CSRF_TOKEN: '/csrf-token'
};

export const HTTP_COMMANDS = {
    GET: "GET",
    POST: "POST",
    PATCH: "PATCH",
    DELETE: "DELETE"
};

const formatDataToJSON = (data) => {
    if (data !== null && typeof data === 'object') {
        return JSON.stringify(data);
    }
    return undefined;
};

export const formatRequestURL = (url = '') => {
    return `/api${url}`;
};

export const ExecuteHTTP = (requestURI, type, reqData, options = {}, csrfToken) => {
    const uri = formatRequestURL(requestURI);
    const headers = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    };

    const config = {
        headers,
        method: type,
        ...(options || {})
    };

    if (type === HTTP_COMMANDS.POST || type === HTTP_COMMANDS.PATCH) {
        config.body = formatDataToJSON(reqData);
    }

    return fetch(uri, config);
};
