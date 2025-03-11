import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";

const CreateCase = () => {
    const { contract } = useBlockchain();
    const navigate = useNavigate();
    const location = useLocation();

    const walletAddress = location.state?.walletAddress || "";
    const initialPasscode = location.state?.passcode || "";
    const [loading, setLoading] = useState(false);
    const [caseTitle, setCaseTitle] = useState("");
    const [passcode, setPasscode] = useState(initialPasscode);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caseTitle.trim()) {
            setError("Case title is required!");
            return;
        }

        if (!passcode || passcode.trim().length === 0) {
            setError("Passcode is required!");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Convert passcode to number as required by the contract
            const passcodeNumber = parseInt(passcode);
            if (isNaN(passcodeNumber)) {
                throw new Error("Passcode must be a number");
            }

            // Call createCase with parameters in the correct order as per the contract
            const tx = await contract.createCase(walletAddress, passcodeNumber, caseTitle);
            await tx.wait();

            // Navigate back with refresh flag and preserved data
            navigate("/patient-details", { 
                state: { 
                    walletAddress, 
                    passcode, 
                    refresh: true 
                } 
            });
        } catch (err) {
            console.error("Error creating case:", err);
            setError("Failed to create case: " + (err.message || "Please check the passcode and try again."));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Create New Case</h2>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Patient Wallet Address:</label>
                        <input
                            type="text"
                            value={walletAddress}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Case Title:</label>
                        <input
                            type="text"
                            placeholder="Enter case title"
                            value={caseTitle}
                            onChange={(e) => setCaseTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Patient Passcode:</label>
                        <input
                            type="password"
                            placeholder="Enter patient passcode"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Required for doctor verification</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                        disabled={loading}
                    >
                        {loading ? "Creating Case..." : "Create Case"}
                    </button>
                </form>

                <button
                    onClick={() => navigate(-1)}
                    className="w-full mt-4 bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CreateCase;