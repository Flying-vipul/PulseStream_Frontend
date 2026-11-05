import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaVideo, FaUsers, FaChartLine, FaUpload, FaServer, FaHdd } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import { fetchSystemStorage } from '../../store/slices/contentSlice';

const AdminDashboard = () => {
    
    const { user } = useSelector((state) => state.auth);

    // 🛡️ 1. STATE MANAGEMENT
    const [stats, setStats] = useState({ totalContent: null, activeUsers: null, premiumSubs: null });
    const [statsLoading, setStatsLoading] = useState(true);
    
    // Server Hardware State
    const [storage, setStorage] = useState(null);
    const [storageLoading, setStorageLoading] = useState(true);

    // 🛡️ 2. DATA FETCHING ENGINE
    useEffect(() => {
        // Fetch User/Content Stats
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/content/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to load admin stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };

        // Fetch Hardware Storage Stats
        const fetchStorage = async () => {
            try {
                // Using your secure api instance to pass the JWT!
                const { data } = await api.get('/admin/system/storage');
                setStorage(data);
                setStorageLoading(false);
            } catch (err) {
                console.error('Failed to load storage stats:', err);
            }
        };

        fetchStats();
        fetchStorage();
        
        // Poll the hard drive every 60 seconds to watch it fill up live
        const interval = setInterval(fetchStorage, 60000); 
        return () => clearInterval(interval);
    }, []);

    // Formats number with commas: 8942 → "8,942"
    const fmt = (n) => n === null ? '—' : n.toLocaleString();

    // Reusable Top KPI Card Component
    const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
        <div className="bg-[#141414] border border-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-6">
            <div className={`p-4 ${iconBg} rounded-full ${iconColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{label}</p>
                {statsLoading ? (
                    <div className="mt-1 w-16 h-8 bg-gray-700 rounded animate-pulse" />
                ) : (
                    <p className="text-3xl font-black text-white transition-all duration-500">{value}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
            
            {/* 🎬 HEADER SECTION */}
            <div className="flex justify-between items-end mb-10 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        Admin <span className="text-pulse-accent">Command Center</span>
                    </h1>
                    <p className="text-gray-400">Welcome back, Director {user?.name}. All systems online.</p>
                </div>
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-bold tracking-wider">SYSTEM SECURE</span>
                </div>
            </div>

            {/* 📊 KPI ANALYTICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard icon={<FaVideo size={30} />} label="Total Movies & Series" value={fmt(stats.totalContent)} iconBg="bg-red-900/20" iconColor="text-pulse-accent" />
                <StatCard icon={<FaUsers size={30} />} label="Active Users" value={fmt(stats.activeUsers)} iconBg="bg-blue-900/20" iconColor="text-blue-500" />
                <StatCard icon={<FaChartLine size={30} />} label="Premium Subs" value={fmt(stats.premiumSubs)} iconBg="bg-yellow-900/20" iconColor="text-yellow-500" />
            </div>

            {/* 🛠️ MAIN DASHBOARD GRID */}
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* LEFT COLUMN: Quick Actions */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <FaUpload className="text-pulse-accent" /> Content Management
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* UPLOAD MOVIE */}
                        <Link to="/admin/upload-movie" 
                              className="group bg-gradient-to-br from-pulse-accent to-red-900 p-6 rounded-xl shadow-lg hover:shadow-red-900/50 transition-all transform hover:-translate-y-1 border border-red-700 flex flex-col items-center justify-center text-center h-48">
                            <FaUpload size={40} className="text-white mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold text-white">Upload Movie</h3>
                            <p className="text-red-200 text-sm mt-2">Standalone Film Pipeline</p>
                        </Link>

                        {/* UPLOAD WEB SERIES */}
                        <Link to="/admin/upload-series" 
                              className="group bg-gradient-to-br from-purple-600 to-indigo-900 p-6 rounded-xl shadow-lg hover:shadow-indigo-900/50 transition-all transform hover:-translate-y-1 border border-indigo-700 flex flex-col items-center justify-center text-center h-48">
                            <FaVideo size={40} className="text-white mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold text-white">Upload Web Series</h3>
                            <p className="text-purple-200 text-sm mt-2">Multi-Step Episode Pipeline</p>
                        </Link>

                        {/* DATABASE MANAGER */}
                        <div className="bg-[#141414] border border-gray-800 p-6 rounded-xl shadow-lg hover:border-gray-600 cursor-not-allowed opacity-70 flex flex-col items-center justify-center text-center h-48 transition-colors sm:col-span-2">
                            <FaServer size={40} className="text-gray-500 mb-4" />
                            <h3 className="text-xl font-bold text-white">Manage Database Content</h3>
                            <p className="text-gray-500 text-sm mt-2">Edit, Delete, and Restructure existing content (Coming Soon)</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Hardware Storage Monitor */}
                <div className="w-full lg:w-1/3">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <FaHdd className="text-gray-400" /> Hardware Telemetry
                    </h2>
                    
                    <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 shadow-2xl h-full flex flex-col">
                        {storageLoading || !storage ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 animate-pulse py-10">
                                <FaHdd size={40} className="mb-4 text-gray-700" />
                                <p>Scanning Local Disk (C:)...</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-between">
                                
                                {/* PulseStream Vault Stats */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <h4 className="text-white font-bold tracking-wide">PulseStream Vault</h4>
                                            <p className="text-xs text-gray-500">FFmpeg Output Directory</p>
                                        </div>
                                        <span className="text-pulse-accent font-black text-xl">{storage.pulseStreamUsageGB} GB</span>
                                    </div>
                                    <div className="w-full bg-black rounded-full h-2 border border-gray-800 overflow-hidden">
                                        <div 
                                            className="bg-pulse-accent h-full shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-all duration-1000" 
                                            style={{ width: `${storage.usagePercentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right font-medium">
                                        Consuming {storage.usagePercentage}% of total drive
                                    </p>
                                </div>

                                {/* Total Laptop Stats */}
                                <div className="bg-black/50 p-4 rounded-lg border border-gray-800/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-gray-900 rounded-lg">
                                            <FaServer className="text-gray-400" size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Local Drive (C:)</h4>
                                            <p className="text-xs text-green-500 font-bold">{storage.driveFreeGB} GB Free</p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-gray-400 h-full transition-all duration-1000" 
                                            style={{ width: `${((storage.driveTotalGB - storage.driveFreeGB) / storage.driveTotalGB * 100).toFixed(1)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Used: {(storage.driveTotalGB - storage.driveFreeGB).toFixed(1)} GB</span>
                                        <span>Total: {storage.driveTotalGB} GB</span>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;