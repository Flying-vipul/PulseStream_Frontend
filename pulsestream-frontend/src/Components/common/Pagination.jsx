import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ pageNumber, totalPages, lastPage, onPrev, onNext }) => {
    // If there is only 1 page, render nothing! Keep the UI clean.
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-6 mt-16 mb-8">
            {/* PREVIOUS BUTTON */}
            <button 
                onClick={onPrev}
                disabled={pageNumber === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded font-bold transition-all ${
                    pageNumber === 0 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-800 text-white hover:bg-pulse-accent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                }`}
            >
                <FaChevronLeft /> Previous
            </button>

            {/* PAGE INDICATOR */}
            <span className="text-gray-400 font-medium">
                Page <span className="text-white text-lg font-bold mx-1">{pageNumber + 1}</span> of {totalPages}
            </span>

            {/* NEXT BUTTON */}
            <button 
                onClick={onNext}
                disabled={lastPage}
                className={`flex items-center gap-2 px-6 py-3 rounded font-bold transition-all ${
                    lastPage 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-800 text-white hover:bg-pulse-accent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                }`}
            >
                Next <FaChevronRight />
            </button>
        </div>
    );
};

export default Pagination;