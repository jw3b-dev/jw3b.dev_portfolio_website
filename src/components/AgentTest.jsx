import React from 'react';

const AgentTest = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4 text-green-400">Antigravity Agent Active</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <p className="text-xl mb-2">Status: <span className="font-semibold text-blue-400">Configuration Verified</span></p>
                <p className="text-gray-400 text-sm">Skills: Feature-Dev | Rules: React-Vite, Planning</p>
                <p className="mt-4 text-xs text-gray-500">Timestamp: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
};

export default AgentTest;
