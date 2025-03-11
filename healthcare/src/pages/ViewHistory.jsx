import { useState, useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";

const ViewHistory = () => {
    const { contract, account } = useBlockchain();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (account && contract) {
            fetchPatientCases();
        }
    }, [account, contract]);

    const fetchPatientCases = async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch patient's cases directly from contract
            const [caseIds, caseTitles] = await contract.getMyCases();

            if (caseIds.length === 0) {
                setCases([]);
                setLoading(false);
                return;
            }

            // Fetch case details for each case
            const caseData = await Promise.all(
                caseIds.map(async (caseId) => {
                    try {
                        const caseDetails = await contract.getCaseDetails(caseId);
                        return {
                            caseId: Number(caseDetails[0]),
                            patient: caseDetails[1],
                            isOpen: caseDetails[2],
                            caseTitle: caseDetails[3],
                            recordIds: caseDetails[4] || [],
                            reportCIDs: caseDetails[5] || [],
                        };
                    } catch (err) {
                        console.error(`Error fetching case ${caseId}:`, err);
                        return null;
                    }
                })
            );

            // Remove null cases and sort: Open cases first
            const sortedCases = caseData.filter(Boolean).sort((a, b) => b.isOpen - a.isOpen);
            setCases(sortedCases);
        } catch (err) {
            console.error("Error fetching cases:", err);
            setError("Failed to load cases. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCaseClick = (caseId) => {
        navigate(`/case-details/${caseId}`, {
            state: { walletAddress: account },
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    My Medical History
                </h2>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                    </div>
                ) : cases.length === 0 ? (
                    <p className="text-center text-gray-600">No medical history found.</p>
                ) : (
                    <div className="space-y-4">
                        {cases.map((c) => (
                            <div
                                key={c.caseId}
                                className={`p-4 border rounded-md shadow-md cursor-pointer transition duration-300 hover:shadow-lg ${
                                    c.isOpen ? "border-green-500 bg-green-100" : "border-gray-400 bg-gray-100"
                                }`}
                                onClick={() => handleCaseClick(c.caseId)}
                            >
                                <h3 className="font-medium text-lg">{c.caseTitle}</h3>
                                <p className="text-sm text-gray-600">
                                    Status: <span className={c.isOpen ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {c.isOpen ? "Ongoing" : "Closed"}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600">Records: {c.recordIds.length}</p>
                                <p className="text-sm text-gray-600">Reports: {c.reportCIDs.length}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewHistory;
