import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { processSubscriptionPayment } from '../store/actions/paymentActions'; 

//  THE NEW ARCHITECTURE: Teaching React which plan is mathematically better
const TIER_RANK = {
    "NONE": 0,
    "BASIC": 1,
    "STANDARD": 2,
    "PREMIUM": 3
};

const subscriptionPlans = [
    {
        tierId: "BASIC",
        name: "Basic",
        price: "₹199", 
        resolution: "720p (HD)",
        features: ["Watch on 1 device", "Unlimited ad-free movies", "Standard audio"],
        buttonColor: "bg-gray-600 hover:bg-gray-500",
    },
    {
        tierId: "STANDARD",
        name: "Standard",
        price: "₹499",
        resolution: "1080p (Full HD)",
        features: ["Watch on 2 devices", "Unlimited ad-free movies", "High-quality audio"],
        buttonColor: "bg-pulse-accent hover:bg-red-700", 
        isPopular: true 
    },
    {
        tierId: "PREMIUM",
        name: "Premium",
        price: "₹649",
        resolution: "4K (Ultra HD) + HDR",
        features: ["Watch on 4 devices", "Unlimited ad-free movies", "PulseStream Spatial Audio"],
        buttonColor: "bg-purple-600 hover:bg-purple-500",
    }
];

const Subscription = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { user } = useSelector((state) => state.auth);
    const currentTier = user?.tier || 'NONE'; 
    
    // 🛡️ Find out the user's mathematical rank (e.g., STANDARD = 2)
    const currentTierRank = TIER_RANK[currentTier] || 0;

    const [loading, setLoading] = useState(false);

    const handleUpgrade = (selectedTierId) => {
        // Failsafe: Double check they aren't somehow passing a lower or equal tier
        if (TIER_RANK[selectedTierId] <= currentTierRank) return; 
        
        dispatch(processSubscriptionPayment(selectedTierId, toast, setLoading, navigate));
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto">
                
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Choose the plan that's right for you</h1>
                    <p className="text-gray-400 text-lg">Unlock premium entertainment today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {subscriptionPlans.map((plan) => {
                        
                        // 🛡️ THE UPGRADE LOGIC
                        const planRank = TIER_RANK[plan.tierId];
                        const isCurrentPlan = currentTier === plan.tierId;
                        const isDowngrade = planRank < currentTierRank; // True if they are looking at a cheaper plan
                        
                        // Disable the button if it's their current plan, a downgrade, or if loading
                        const isDisabled = isCurrentPlan || isDowngrade || loading;

                        return (
                            <div 
                                key={plan.tierId} 
                                className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                                    isCurrentPlan 
                                        ? 'bg-gray-900/80 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                        : isDowngrade 
                                            ? 'bg-black/50 border-gray-800 opacity-60' // Dim the downgraded cards!
                                            : 'bg-gray-900/40 border-gray-800 hover:border-gray-500' 
                                }`}
                            >
                                {plan.isPopular && !isCurrentPlan && !isDowngrade && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-pulse-accent text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                        Your Current Plan
                                    </div>
                                )}

                                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                                <div className="text-4xl font-bold text-white mb-1">{plan.price}<span className="text-sm font-normal text-gray-500">/month</span></div>
                                <p className="text-pulse-accent font-medium mb-6">{plan.resolution}</p>

                                <ul className="flex-grow space-y-4 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start text-gray-300">
                                            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button 
                                    onClick={() => handleUpgrade(plan.tierId)}
                                    disabled={isDisabled}
                                    className={`w-full py-4 rounded font-bold transition-all ${
                                        isCurrentPlan 
                                            ? 'bg-transparent border-2 border-green-500 text-green-500 cursor-not-allowed' 
                                        : isDowngrade
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed' // Sleek disabled look
                                        : `${plan.buttonColor} text-white shadow-lg` 
                                    }`}
                                >
                                    {isCurrentPlan ? 'Active Plan' : 
                                     isDowngrade ? 'Included in Plan' : 
                                     `Upgrade to ${plan.name}`}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default Subscription;