import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Axios instance ────────────────────────────── */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {'Content-Type': 'application/json'},
  timeout: 10000,
});

/* ── Response interceptor — centralised error handling ── */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error.response?.data?.message ||   // backend ErrorResponse.message
      error.response?.data ||            // plain string error
      error.message ||                   // axios / network error
      'Something went wrong';

    console.error(
      `[${api}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      `→ ${error.response?.status || 'NETWORK'}:`,
      msg,
    );
    toast.error(String(msg));
    return Promise.reject(error);
  },
);

/* ── Auth ──────────────────────────────────────── */

/** POST /api/users/create  { uniqueId, name, password } → boolean */
export const signUp = (dto) =>
  api.post('/users/create', dto).then((r) => r.data);

/** POST /api/users/login  { uniqueId, password } → User */
export const login = (dto) =>
  api.post('/users/login', dto).then((r) => r.data);

/* ── OTP ───────────────────────────────────────── */

/** POST /otp/send-otp?email=... → string */
export const sendOtp = (email) =>
  api.post('/otp/send-otp', null, { params: { email }, timeout: 15000 }).then((r) => r.data);

/** POST /otp/verify?email=...&otp=... → string */
export const verifyOtp = (email, otp) =>
  api.post('/otp/verify', null, { params: { email, otp }, timeout: 10000 }).then((r) => r.data);

/* ── Groups ────────────────────────────────────── */

/** GET /api/groups/ → Group[] */
export const getGroups = () =>
  api.get('/groups/').then((r) => r.data);

/** POST /api/groups/create  { groupName } → Group */
export const createGroup = (dto) =>
  api.post('/groups/create', dto).then((r) => r.data);

/** DELETE /api/groups/delete?groupId=...&userId=... → string */
export const deleteGroup = (groupId, userId) =>
  api.delete('/groups/delete', { params: { groupId, userId } }).then((r) => r.data);

/* ── Chats ─────────────────────────────────────── */

/** GET /api/chats/?groupId=... → Chat[]  (today only) */
export const getTodayChats = (groupId) =>
  api.get('/chats/', { params: { groupId } }).then((r) => r.data);

/** GET /api/chats/all?groupId=... → Chat[]  (all history) */
export const getAllChats = (groupId) =>
  api.get('/chats/all', { params: { groupId } }).then((r) => r.data);

/** POST /api/files/upload  FormData → { url, filename } */
export const uploadFile = (formData) =>
  api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

