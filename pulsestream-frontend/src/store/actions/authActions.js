import api from '../../api/axiosConfig';
import { loginSuccess, logout } from '../slices/authSlice';

// All auth API calls use the centralized `api` instance (not raw axios).
// This ensures the request interceptor attaches Authorization headers
// and the response interceptor handles 401s uniformly.
//
// Error messages are read from err.userMessage (normalized by interceptor)
// or fall back to err.response?.data?.message for auth-specific endpoints
// that bypass the interceptor (e.g., /auth/signin itself).

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const loginUserAction = (credentials, toast, navigate, setLoading) => async (dispatch) => {
    try {
        setLoading(true);
        const { data } = await api.post('/auth/signin', credentials);

        // Defensive: accept whichever field name the backend sends.
        // If 'jwtToken' is undefined (backend sends 'token'), fall back gracefully.
        const token = data.jwtToken || data.token;
        if (!token) throw new Error('No token in signin response');

        dispatch(loginSuccess({
            token,
            user: {
                id:    data.id,
                name:  data.name,
                email: data.email,
                role:  data.role,
                tier:  data.planTier || data.plan_tier,
            },
        }));

        toast.success('Welcome back to PulseStream!');
        navigate('/');

    } catch (err) {
        const msg = err.response?.data?.message || err.userMessage || 'Invalid email or password.';
        toast.error(msg);
    } finally {
        setLoading(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGISTER (triggers OTP send)
// ─────────────────────────────────────────────────────────────────────────────
export const registerUserAction = (payload, toast, setStep, setLoading) => async () => {
    try {
        setLoading(true);
        const { data } = await api.post('/auth/signup', payload);
        toast.success(data?.message || 'OTP sent to your email!');
        setStep(2);
    } catch (err) {
        const msg = err.userMessage || err.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(msg);
    } finally {
        setLoading(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. VERIFY OTP (completes registration → authenticates)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtpAction = (payload, toast, switchMode, setLoading) => async (dispatch) => {
    try {
        setLoading(true);
        const { data } = await api.post('/auth/verify-otp', payload);

        toast.success(data?.message || 'Account verified! Please log in.');
        
        // Backend returns a MessageResponse, NOT a token.
        // We must switch back to the LOGIN mode so the user can actually sign in.
        switchMode('LOGIN');

    } catch (err) {
        const msg = err.userMessage || err.response?.data?.message || 'Invalid or expired OTP.';
        toast.error(msg);
    } finally {
        setLoading(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FORGOT PASSWORD — step 1: request OTP
// ─────────────────────────────────────────────────────────────────────────────
export const triggerForgotPasswordAction = (email, toast, setStep, setLoading) => async () => {
    try {
        setLoading(true);
        // Backend uses @RequestParam so email must be sent as a URL query parameter.
        const { data } = await api.post(`/auth/forgot-password/trigger?email=${encodeURIComponent(email)}`);
        toast.success(data?.message || 'Reset code sent to your email.');
        setStep(2);
    } catch (err) {
        const msg = err.userMessage || err.response?.data?.message || 'Failed to send reset code.';
        toast.error(msg);
    } finally {
        setLoading(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. FORGOT PASSWORD — step 2: submit OTP + new password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPasswordAction = (payload, toast, switchMode, setLoading) => async () => {
    try {
        setLoading(true);
        const { data } = await api.post('/auth/forgot-password/reset', payload);
        toast.success(data?.message || 'Password reset successfully!');
        switchMode('LOGIN');
    } catch (err) {
        const msg = err.userMessage || err.response?.data?.message || 'Failed to reset password.';
        toast.error(msg);
    } finally {
        setLoading(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logoutUserAction = (toast, navigate) => (dispatch) => {
    dispatch(logout());
    toast.success('You have been signed out.');
    navigate('/auth');
};