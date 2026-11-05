export const subscriptionPlans = [
    {
        tierId: "BASIC",
        name: "Basic",
        price: "₹199", // Adjusted for typical Indian streaming pricing, or use $8.99
        resolution: "720p (HD)",
        videoQuality: "Good",
        supportedDevices: "Phone, Tablet, Computer, TV",
        simultaneousStreams: 1,
        features: [
            "Watch on 1 supported device at a time",
            "Unlimited ad-free movies, TV shows, and mobile games",
            "Download on 1 supported device at a time",
            "Standard audio quality"
        ],
        buttonColor: "bg-gray-600 hover:bg-gray-500",
        isPopular: false
    },
    {
        tierId: "STANDARD",
        name: "Standard",
        price: "₹499",
        resolution: "1080p (Full HD)",
        videoQuality: "Great",
        supportedDevices: "Phone, Tablet, Computer, TV",
        simultaneousStreams: 2,
        features: [
            "Watch on 2 supported devices at a time",
            "Unlimited ad-free movies, TV shows, and mobile games",
            "Download on 2 supported devices at a time",
            "High-quality audio"
        ],
        buttonColor: "bg-pulse-accent hover:bg-red-700", // Your custom red!
        isPopular: true // We can use this to put a "Most Popular" badge on the UI
    },
    {
        tierId: "PREMIUM",
        name: "Premium",
        price: "₹649",
        resolution: "4K (Ultra HD) + HDR",
        videoQuality: "Best",
        supportedDevices: "Phone, Tablet, Computer, TV",
        simultaneousStreams: 4,
        features: [
            "Watch on 4 supported devices at a time",
            "Unlimited ad-free movies, TV shows, and mobile games",
            "Download on 6 supported devices at a time",
            "PulseStream Spatial Audio included"
        ],
        buttonColor: "bg-purple-600 hover:bg-purple-500",
        isPopular: false
    }
];