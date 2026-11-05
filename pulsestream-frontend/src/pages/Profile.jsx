import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutUserAction } from '../store/actions/authActions';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    //  Pull the user data dynamically from Redux
    const { user } = useSelector((state) => state.auth);
    const currentTier = user?.tier || 'NONE';

    const handleLogout = () => {
        dispatch(logoutUserAction(toast, navigate));
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-6 flex justify-center">
            <div className="w-full max-w-3xl">
                
                <h1 className="text-4xl font-bold text-white mb-8">Account Settings</h1>

                {/* Profile Card */}
                <div className="bg-[#141414] border border-gray-800 rounded-lg p-8 shadow-2xl mb-8">
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded bg-pulse-accent flex items-center justify-center text-4xl font-bold text-white uppercase overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        

                        {/* User Info */}
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                            <p className="text-gray-400">{user?.email}</p>
                            <div className="mt-2 inline-block px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 uppercase tracking-wider">
                                Role: {user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Member'}
                            </div>
                        </div>
                    </div>

                    {/* Subscription Details Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Plan Details</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-white">
                                    {currentTier === 'NONE' ? 'Free Tier' : `${currentTier} Plan`}
                                </span>
                                {currentTier !== 'NONE' && (
                                    <span className="bg-green-500/20 text-green-500 text-xs font-bold px-2 py-1 rounded border border-green-500/30">
                                        Active
                                    </span>
                                )}
                            </div>
                            {currentTier === 'NONE' && (
                                <p className="text-gray-500 text-sm mt-1">You are not currently subscribed to any premium features.</p>
                            )}
                        </div>

                        {/* Navigation to your Subscription Page */}
                        <button 
                            onClick={() => navigate('/subscription')}
                            className="px-6 py-3 bg-pulse-accent hover:bg-red-700 text-white font-bold rounded transition-colors"
                        >
                            {currentTier === 'NONE' ? 'Upgrade Plan' : 'Change Plan'}
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#141414] border border-gray-800 rounded-lg p-8 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold mb-1">Sign Out</h3>
                        <p className="text-gray-500 text-sm">Log out of PulseStream on this device.</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-6 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-white font-bold rounded transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Profile;