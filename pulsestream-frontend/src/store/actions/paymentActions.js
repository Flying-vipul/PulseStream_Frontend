import axios from 'axios';
import { loginSuccess } from '../slices/authSlice';
import { loadRazorpayScript } from '../../utils/loadRazorpay'; 

const API_BASE_URL = `${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/payments`;

export const processSubscriptionPayment = (tierId, toast, setLoading, navigate) => async (dispatch, getState) => {
    try {
        setLoading(true);

        // 1. Load the Razorpay SDK
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            toast.error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }

        // 2. Grab the JWT Token from Redux state
        const { user, token } = getState().auth;
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        // 3. Hit Spring Boot: Create the Order
        const { data: orderData } = await axios.post(
            `${API_BASE_URL}/create-order`, 
            { planTier: tierId }, 
            config
        );

        //  GOD MODE LOG: Let's see exactly what Spring Boot sent back!
        console.log(" ORDER DATA FROM SPRING BOOT:", orderData);

        // 4. Configure the Razorpay Checkout Modal
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount, 
            currency: orderData.currency,
            name: "PulseStream",
            description: `Upgrade to ${tierId} Tier`,
            
            //  THE CRITICAL FIX: Catch the ID no matter what Spring Boot named it!
            order_id: orderData.orderId || orderData.id || orderData.razorpayOrderId,
            
            handler: async function (response) {
                try {
                    // 1. RE-FETCH THE FRESH TOKEN DIRECTLY FROM REDUX!
                    const currentToken = getState().auth.token;
                    
                    const freshConfig = {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                            "Content-Type": "application/json"
                        }
                    };

                    //  MAPPED TO CAMELCASE FOR YOUR SPRING BOOT DTO
                    const verifyPayload = {
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySignature: response.razorpay_signature,
                        planTier: tierId 
                    };

                    const { data: verifyData } = await axios.post(
                        `${API_BASE_URL}/verify`, 
                        verifyPayload, 
                        freshConfig 
                    );

                    // 6. Update Redux state so the UI unlocks the Premium features instantly!
                    const updatedReduxPayload = {
                        user: { ...user, tier: tierId }, 
                        token: token 
                    };
                    
                    dispatch(loginSuccess(updatedReduxPayload));
                    toast.success(verifyData.message || "Welcome to PulseStream Premium!");
                    navigate("/"); // Send them to the movie dashboard

                } catch (verifyError) {
                    console.error("Verification failed:", verifyError);
                    toast.error("Payment successful, but verification failed. Contact support.");
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
            },
            theme: {
                color: "#E50914" // Netflix Red!
            }
        };

        // 5. Open the Razorpay Modal
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

    } catch (error) {
        console.error("Payment Initialization Error:", error);
        toast.error(error?.response?.data?.message || "Failed to initiate payment.");
    } finally {
        setLoading(false);
    }
};