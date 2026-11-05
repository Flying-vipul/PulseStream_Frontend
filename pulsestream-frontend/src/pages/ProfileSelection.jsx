import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveProfile, setProfiles } from '../store/slices/profileSlice';
import api from '../api/axiosConfig';
import { FaPlus, FaSpinner, FaPlayCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProfileSelection = () => {
    const dispatch = useDispatch();
    const [localProfiles, setLocalProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/v1/profiles');
            // Assuming response.data is ProfileResponse containing a list of profiles
            const profileList = response.data.profiles || response.data || [];
            setLocalProfiles(profileList);
            dispatch(setProfiles(profileList));
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            toast.error("Failed to load profiles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleSelectProfile = (profile) => {
        dispatch(setActiveProfile(profile));
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;
        try {
            setIsCreating(true);
            const response = await api.post(`/v1/profiles?profileName=${encodeURIComponent(newProfileName.trim())}`);
            await fetchProfiles();
            setNewProfileName('');
            setIsCreating(false);
            toast.success("Profile created!");
        } catch (error) {
            console.error("Failed to create profile", error);
            toast.error("Failed to create profile");
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="w-screen h-screen bg-[#0b0b0c] flex flex-col justify-center items-center text-white">
                <FaSpinner className="animate-spin text-4xl text-red-600 mb-4" />
                <h2 className="text-xl font-bold tracking-widest uppercase">Loading Profiles...</h2>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-[#0b0b0c] flex flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="z-10 text-center w-full max-w-4xl px-4">
                <h1 className="text-3xl md:text-5xl font-black mb-10 tracking-tight">Who's watching?</h1>

                <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12">
                    {localProfiles.map((profile) => (
                        <div key={profile.id} className="flex flex-col items-center group cursor-pointer" onClick={() => handleSelectProfile(profile)}>
                            <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-transparent group-hover:border-white transition-all duration-300 shadow-xl overflow-hidden flex items-center justify-center relative">
                                <FaPlayCircle className="text-gray-600 text-5xl group-hover:text-white transition-colors duration-300" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                            </div>
                            <span className="mt-4 text-gray-400 font-bold group-hover:text-white transition-colors duration-300 text-lg">
                                {profile.name || 'Profile'}
                            </span>
                        </div>
                    ))}

                    {/* Create New Profile Button */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => setIsCreating(true)}>
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl bg-gray-900/50 border-2 border-gray-700 group-hover:border-white transition-all duration-300 flex justify-center items-center hover:bg-gray-800">
                            <FaPlus className="text-gray-500 text-3xl group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="mt-4 text-gray-500 font-bold group-hover:text-white transition-colors duration-300 text-lg">
                            Add Profile
                        </span>
                    </div>
                </div>

                {/* Create Profile Form */}
                {isCreating && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm px-4">
                        <div className="bg-[#181818] p-8 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl relative animate-slide-up">
                            <h2 className="text-2xl font-bold mb-6 text-white">Create Profile</h2>
                            <form onSubmit={handleCreateProfile}>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    placeholder="Name"
                                    className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 transition-colors mb-6"
                                    autoFocus
                                />
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={!newProfileName.trim()}
                                        className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsCreating(false); setNewProfileName(''); }}
                                        className="flex-1 bg-transparent border border-gray-600 text-white font-bold py-3 rounded-xl hover:border-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
        </div>
    );
};

export default ProfileSelection;
