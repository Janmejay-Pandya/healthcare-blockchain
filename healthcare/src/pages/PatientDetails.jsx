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
    
            // We need to call getMyCases or a similar function to get the case IDs
            // Using a different approach since we're not the patient address
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
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Patient Details
                </h2>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Enter Patient Wallet Address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    />
                    <input
                        type="password"
                        placeholder="Enter Patient Passcode (for doctor actions)"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <button
                        onClick={fetchPatientData}
                        className="w-full bg-blue-500 text-white py-2 mt-2 rounded-md hover:bg-blue-600 transition"
                        disabled={loading}
                    >
                        {loading ? "Fetching..." : "Fetch Patient"}
                    </button>
                </div>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {loading ? (
                    <p className="text-center text-gray-600">Loading patient details...</p>
                ) : (
                    <>
                        {patient && (
                            <div className="bg-gray-50 p-4 rounded-md mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Patient Information
                                </h3>
                                <p>
                                    <span className="font-medium">Name:</span> {patient.fullName}
                                </p>
                                <p>
                                    <span className="font-medium">Date of Birth:</span> {patient.dob}
                                </p>
                                <p>
                                    <span className="font-medium">Age:</span> {patient.age} years
                                </p>
                                <p>
                                    <span className="font-medium">Weight:</span> {patient.weight} kg
                                </p>
                                <p>
                                    <span className="font-medium">Height:</span> {patient.height} cm
                                </p>
                                <p>
                                    <span className="font-medium">Address:</span> {patient.addressDetails}
                                </p>
                                <p>
                                    <span className="font-medium">Contact:</span> {patient.contactNumber}
                                </p>
                                <p>
                                    <span className="font-medium">Allergies:</span>{" "}
                                    {patient.allergies || "None"}
                                </p>
                            </div>
                        )}

                        {cases.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Medical Cases ({cases.length})</h3>
                                {cases.map((c, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-md cursor-pointer ${
                                            c.isOngoing ? "border-green-500" : "border-gray-400"
                                        }`}
                                        onClick={() => handleCaseClick(c)}
                                    >
                                        <p className="font-medium">Case ID: {c.caseId}</p>
                                        <p className="font-medium">Title: {c.caseTitle}</p>
                                        <p className="text-sm text-gray-600">
                                            Status: {c.isOngoing ? "Open" : "Closed"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Records: {c.recordIds ? c.recordIds.length : 0}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Reports: {c.reportCIDs ? c.reportCIDs.length : 0}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            patient && <p className="text-gray-600 text-center">No cases found.</p>
                        )}
                    </>
                )}

                {patient && (
                    <button
                        onClick={() =>
                            navigate("/create-case", {
                                state: { walletAddress, passcode: passcode || undefined }
                            })
                        }
                        className="w-full bg-green-500 text-white py-2 mt-4 rounded-md hover:bg-green-600 transition"
                    >
                        Create New Case
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatientDetails;