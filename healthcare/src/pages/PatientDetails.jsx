import { useState, useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate, useLocation } from "react-router-dom";

const PatientDetails = () => {
    const { contract } = useBlockchain();
    const navigate = useNavigate();
    const location = useLocation();
    const [walletAddress, setWalletAddress] = useState(location.state?.walletAddress || "");
    const [passcode, setPasscode] = useState(location.state?.passcode || "");
    const [patient, setPatient] = useState(null);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (location.state?.refresh && walletAddress) {
            fetchPatientData();
        }
    }, [location.state]);

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        return today.getFullYear() - birthDate.getFullYear();
    };

    const fetchPatientData = async () => {
        if (!walletAddress) {
            setError("Enter a wallet address!");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Get basic patient data
            const data = await contract.patients(walletAddress);

            if (!data || !data.fullName) {
                setError("Patient not found!");
                setLoading(false);
                return;
            }

            setPatient({
                fullName: data.fullName,
                dob: data.dob,
                age: calculateAge(data.dob),
                weight: Number(data.weight),
                height: Number(data.height),
                allergies: data.allergies,
                addressDetails: data.addressDetails,
                contactNumber: data.contactNumber
            });

            try {
                // Get the patient's caseIds directly from their struct
                const caseIds = await contract.getCaseIdsForPatient(walletAddress);

                if (!caseIds || caseIds.length === 0) {
                    setCases([]);
                    setLoading(false);
                    return;
                }

                const caseDetails = await Promise.all(
                    caseIds.map(async (caseId) => {
                        try {
                            const caseData = await contract.getCaseDetails(Number(caseId));
                            return {
                                caseId: Number(caseData[0]),
                                patient: caseData[1],
                                isOngoing: caseData[2],
                                caseTitle: caseData[3],
                                recordIds: caseData[4],
                                reportCIDs: caseData[5]
                            };
                        } catch (err) {
                            console.error(`Error fetching case ${caseId}:`, err);
                            return null;
                        }
                    })
                );

                setCases(caseDetails.filter(Boolean).sort((a, b) => b.isOngoing - a.isOngoing));
            } catch (err) {
                console.error("Error fetching case IDs:", err);
                // Fallback method - check if we need to modify the contract to add this function
                console.log("Attempting direct access of cases via contract...");

                // This is a fallback that will work with the current contract structure
                // But is less efficient than adding a dedicated function
                const patientCases = [];
                const totalCases = Number(await contract.caseCounter());

                // Check each case to see if it belongs to this patient
                for (let i = 1; i <= totalCases; i++) {
                    try {
                        const caseData = await contract.getCaseDetails(i);
                        if (caseData[1].toLowerCase() === walletAddress.toLowerCase()) {
                            patientCases.push({
                                caseId: Number(caseData[0]),
                                patient: caseData[1],
                                isOngoing: caseData[2],
                                caseTitle: caseData[3],
                                recordIds: caseData[4],
                                reportCIDs: caseData[5]
                            });
                        }
                    } catch (error) {
                        console.error(`Error checking case ${i}:`, error);
                    }
                }

                setCases(patientCases.sort((a, b) => b.isOngoing - a.isOngoing));
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to fetch patient details: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCaseClick = (c) => {
        navigate(`/case-details/${c.caseId}`, {
            state: {
                walletAddress,
                passcode: passcode || undefined,
                caseId: c.caseId,
                caseTitle: c.caseTitle,
                isOngoing: c.isOngoing,
                recordIds: c.recordIds,
                reportCIDs: c.reportCIDs
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700 mb-6">
                    <h2 className="text-2xl font-bold text-center mb-6 text-teal-500">
                        Patient Profile
                    </h2>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/2">
                            <div className="flex items-center space-x-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Enter Patient Wallet Address"
                                    value={walletAddress}
                                    onChange={(e) => setWalletAddress(e.target.value)}
                                    className="w-full p-3 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <button
                                    onClick={fetchPatientData}
                                    className="p-3 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    disabled={loading}
                                >
                                    {loading ? "..." : "Fetch"}
                                </button>
                            </div>

                            <input
                                type="password"
                                placeholder="Enter Patient Passcode (for doctor actions)"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="w-full p-3 mb-4 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="w-full md:w-1/2 flex justify-end items-center">
                            {patient && (
                                <button
                                    onClick={() =>
                                        navigate("/create-case", {
                                            state: { walletAddress, passcode: passcode || undefined }
                                        })
                                    }
                                    className="w-full md:w-auto p-3 bg-green-600 text-white rounded-md hover:bg-green-500 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    Create New Case
                                </button>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-center bg-red-400/10 p-3 rounded-md mt-4">{error}</p>}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center bg-gray-800/50 backdrop-blur-sm p-12 rounded-xl border border-gray-700">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-teal-600/30 mb-4"></div>
                            <p className="text-gray-400">Loading patient details...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {patient && (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Patient Information Card - Left Side */}
                                <div className="w-full lg:w-1/3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
                                    <div className="bg-teal-600/20 p-4 border-b border-gray-700">
                                        <h3 className="text-xl font-bold text-teal-400">
                                            Patient Information
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-center mb-6">
                                            <div className="w-24 h-24 rounded-full bg-teal-600/20 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-teal-400">
                                                    {patient.fullName.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-700/30 p-4 rounded-lg">
                                            <p className="text-lg font-semibold text-teal-400">{patient.fullName}</p>
                                            <p className="text-sm text-gray-400">
                                                ID: {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                                <p className="text-xs text-gray-400">Date of Birth</p>
                                                <p className="text-sm font-medium">{patient.dob}</p>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                                <p className="text-xs text-gray-400">Age</p>
                                                <p className="text-sm font-medium">{patient.age} years</p>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                                <p className="text-xs text-gray-400">Weight</p>
                                                <p className="text-sm font-medium">{patient.weight} kg</p>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                                <p className="text-xs text-gray-400">Height</p>
                                                <p className="text-sm font-medium">{patient.height} cm</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-700/30 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400">Address</p>
                                            <p className="text-sm font-medium">{patient.addressDetails}</p>
                                        </div>

                                        <div className="bg-gray-700/30 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400">Contact Number</p>
                                            <p className="text-sm font-medium">{patient.contactNumber}</p>
                                        </div>

                                        <div className="bg-gray-700/30 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400">Allergies</p>
                                            <p className="text-sm font-medium">{patient.allergies || "None"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Cases - Right Side */}
                                <div className="w-full lg:w-2/3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
                                    <div className="bg-teal-600/20 p-4 border-b border-gray-700">
                                        <h3 className="text-xl font-bold text-teal-400">
                                            Medical Cases {cases.length > 0 && `(${cases.length})`}
                                        </h3>
                                    </div>

                                    <div className="p-6">
                                        {cases.length > 0 ? (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {cases.map((c, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleCaseClick(c)}
                                                        className={`p-4 rounded-lg cursor-pointer transition transform hover:scale-105 hover:shadow-lg ${c.isOngoing
                                                            ? "bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30"
                                                            : "bg-gray-700/30 border border-gray-600/30"
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="font-bold text-lg">{c.caseTitle}</p>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${c.isOngoing
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-gray-600/20 text-gray-400"
                                                                }`}>
                                                                {c.isOngoing ? "Open" : "Closed"}
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-400 text-sm mb-2">
                                                            Case ID: #{c.caseId}
                                                        </p>

                                                        <div className="flex justify-between mt-3 text-sm">
                                                            <div className="flex items-center">
                                                                <div className="w-2 h-2 rounded-full bg-teal-500 mr-2"></div>
                                                                <span className="text-gray-400">
                                                                    Records: {c.recordIds ? c.recordIds.length : 0}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                                                <span className="text-gray-400">
                                                                    Reports: {c.reportCIDs ? c.reportCIDs.length : 0}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            patient && (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-400 mb-6">No medical cases found for this patient.</p>
                                                    <button
                                                        onClick={() =>
                                                            navigate("/create-case", {
                                                                state: { walletAddress, passcode: passcode || undefined }
                                                            })
                                                        }
                                                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition"
                                                    >
                                                        Create First Case
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientDetails;