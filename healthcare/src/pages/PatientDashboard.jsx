import React, { useState, useEffect } from 'react';

const PatientDashboard = () => {
    const [user, setUser] = useState({
        name: "Janmejay Pandya",
        wallet: "0xc820c7bd7040ce741b21671971f8294ffd0e...",
        dateOfBirth: "2004-05-11",
        contactNumber: "9321037232",
        address: "B 1507 Teerth avila",
        weight: "65 kg",
        height: "174 cm",
        allergies: "None"
    });

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Welcome Message */}
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <h1 className="text-3xl font-semibold mb-2">Welcome back, {user.name}</h1>
                    <p className="text-gray-400">Your health records are securely stored on the blockchain</p>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Next Appointment</p>
                            <p className="font-medium">No upcoming appointments</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Recent Medications</p>
                            <p className="font-medium">None prescribed</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Medical Records</p>
                            <p className="font-medium">5 documents</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Insurance Status</p>
                            <p className="font-medium">Active</p>
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-6">Medical Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Full Name</p>
                                <p>{user.name}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Date of Birth</p>
                                <p>{user.dateOfBirth}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Contact Number</p>
                                <p>{user.contactNumber}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Weight</p>
                                <p>{user.weight}</p>
                            </div>
                        </div>
                        <div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Wallet Address</p>
                                <p className="flex items-center">
                                    <span>{user.wallet}</span>
                                    <span className="ml-2 bg-green-500 text-black text-xs px-2 py-1 rounded">Patient</span>
                                </p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Address</p>
                                <p>{user.address}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Height</p>
                                <p>{user.height}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Allergies</p>
                                <p>{user.allergies}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 rounded-lg p-8">
                    <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-green-500 pl-4">
                            <p className="font-medium">Medical records accessed by Dr. Smith</p>
                            <p className="text-gray-400 text-sm">April 18, 2025 - 10:30 AM</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <p className="font-medium">Prescription updated</p>
                            <p className="text-gray-400 text-sm">April 15, 2025 - 3:45 PM</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <p className="font-medium">Appointment completed with Dr. Johnson</p>
                            <p className="text-gray-400 text-sm">April 10, 2025 - 2:15 PM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Appointment Button */}
            <div className="fixed bottom-8 right-8">
                <button className="bg-green-500 hover:bg-green-600 text-black font-medium px-6 py-3 rounded-lg flex items-center">
                    Schedule Appointment
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                </button>
            </div>

            {/* Decorative Dots */}
            <div className="fixed top-1/4 left-8 w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="fixed bottom-1/4 left-8 w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="fixed top-1/4 right-8 w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="fixed bottom-1/4 right-8 w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
    );
};

export default PatientDashboard;