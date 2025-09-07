import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import Chatbot from '../components/Chatbot';

const PatientDashboard = () => {
    const { account, contract } = useBlockchain();
    const [user, setUser] = useState(null);
    const [cases, setCases] = useState([]); // open cases
    const [closedCasesCount, setClosedCasesCount] = useState(0);
    const [recentMedication, setRecentMedication] = useState('None prescribed');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!contract || !account) return;
            try {
                // Patient details
                const data = await contract.patients(account);
                setUser({
                    name: data.fullName,
                    wallet: account,
                    dateOfBirth: data.dob,
                    contactNumber: data.contactNumber,
                    address: data.addressDetails,
                    weight: data.weight.toString(),
                    height: data.height.toString(),
                    allergies: data.allergies
                });
            } catch (err) {
                setUser(null);
            }
            let openCases = [];
            let closedCases = 0;
            try {
                // Cases
                const [caseIds, caseTitles] = await contract.getMyCases();
                // Fetch open and closed cases
                const caseStatusArr = await Promise.all(caseIds.map(async (id, idx) => {
                    const details = await contract.getMyCaseDetails(id);
                    return { isOngoing: details.isOngoing, id: id.toString(), title: caseTitles[idx] };
                }));
                openCases = caseStatusArr.filter(c => c.isOngoing).map(c => ({ id: c.id, title: c.title }));
                closedCases = caseStatusArr.filter(c => !c.isOngoing).length;
                setCases(openCases);
                setClosedCasesCount(closedCases);
            } catch (err) {
                setCases([]);
                setClosedCasesCount(0);
            }
            // Fetch recent medication from latest record of each open case
            try {
                let meds = [];
                for (const c of openCases) {
                    const records = await contract.getMyCaseRecords(c.id);
                    if (records.length > 0) {
                        const latestRecord = records[records.length - 1];
                        if (latestRecord.medications && latestRecord.medications.trim() !== '') {
                            meds.push(latestRecord.medications);
                        }
                    }
                }
                setRecentMedication(meds.length > 0 ? meds.join(', ') : 'None prescribed');
            } catch (err) {
                setRecentMedication('None prescribed');
            }
            setLoading(false);
        };
        fetchData();
    }, [contract, account]);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <h1 className="text-3xl font-semibold mb-2">Welcome back, {user?.name || 'Patient'}</h1>
                    <p className="text-gray-400">Your health records are securely stored on the blockchain</p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Next Appointment</p>
                            <p className="font-medium">No upcoming appointments</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Recent Medications</p>
                            <p className="font-medium">{recentMedication}</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Cases</p>
                            <p className="font-medium">Open: {cases.length} | Closed: {closedCasesCount}</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Insurance Status</p>
                            <p className="font-medium">Not Available</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-6">Medical Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Full Name</p>
                                <p>{user?.name}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Date of Birth</p>
                                <p>{user?.dateOfBirth}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Contact Number</p>
                                <p>{user?.contactNumber}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Weight</p>
                                <p>{user?.weight}</p>
                            </div>
                        </div>
                        <div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Wallet Address</p>
                                <p className="flex items-center">
                                    <span>{user?.wallet}</span>
                                    <span className="ml-2 bg-green-500 text-black text-xs px-2 py-1 rounded">Patient</span>
                                </p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Address</p>
                                <p>{user?.address}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Height</p>
                                <p>{user?.height}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Allergies</p>
                                <p>{user?.allergies}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cases Section */}
                <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-6">Your Open Cases</h2>
                    {cases.length === 0 ? (
                        <p className="text-gray-400">No cases found.</p>
                    ) : (
                        <ul className="list-disc ml-6">
                            {cases.map(c => (
                                <li key={c.id} className="mb-2">
                                    <span className="font-medium">{c.title}</span> <span className="text-gray-400">(ID: {c.id})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent Activity (static for now) */}
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
                <Chatbot />
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