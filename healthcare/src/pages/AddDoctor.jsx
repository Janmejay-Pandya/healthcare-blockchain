import { useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";

const AddDoctor = () => {
    const { account, contract } = useBlockchain();
    const navigate = useNavigate();
    const [doctorAddress, setDoctorAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAssignDoctor = async () => {
        if (!account || !contract) return alert("Connect Wallet First!");
        if (!doctorAddress) return alert("Please enter a valid wallet address!");

        try {
            setLoading(true);
            const tx = await contract.assignDoctor(doctorAddress);
            await tx.wait();
            alert("Doctor assigned successfully!");
            navigate("/profile"); // Redirect back to profile after assignment
        } catch (error) {
            console.error("Error assigning doctor:", error);
            alert("Assignment failed. Check console for errors.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Assign Doctor</h2>
                <p className="text-gray-600 text-center mb-4">Enter the wallet address of the doctor to assign.</p>

                <input 
                    type="text" 
                    placeholder="Doctor's Wallet Address" 
                    value={doctorAddress} 
                    onChange={(e) => setDoctorAddress(e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />

                <button 
                    onClick={handleAssignDoctor} 
                    disabled={loading}
                    className={`w-full py-2 rounded-md transition ${
                        loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                >
                    {loading ? "Assigning..." : "Assign Doctor"}
                </button>

                <button 
                    onClick={() => navigate("/profile")} 
                    className="w-full mt-4 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
                >
                    Back to Profile
                </button>
            </div>
        </div>
    );
};

export default AddDoctor;
