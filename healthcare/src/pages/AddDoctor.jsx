import { useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft, Loader2 } from "lucide-react";

const AddDoctor = () => {
    const { account, contract } = useBlockchain();
    const navigate = useNavigate();
    const [doctorAddress, setDoctorAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

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
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
            {/* Decorative background dots - matching Profile page */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-green-400 rounded-full opacity-50"></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-green-400 rounded-full opacity-50"></div>
            <div className="absolute bottom-40 left-30 w-2 h-2 bg-green-400 rounded-full opacity-50"></div>

            <div className="max-w-lg mx-auto bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#2A2A2A] shadow-xl">
                <div className="bg-[#2A2A2A] px-6 py-4 border-b border-[#2A2A2A]">
                    <h2 className="text-2xl font-bold">Assign Doctor</h2>
                </div>

                <div className="p-6">
                    <p className="text-gray-400 mb-6">Enter the wallet address of the doctor you want to assign to your healthcare profile.</p>

                    <div className="relative mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Doctor's Wallet Address <span className="text-green-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0x..."
                            value={doctorAddress}
                            onChange={(e) => setDoctorAddress(e.target.value)}
                            className="w-full p-3 bg-[#2A2A2A] text-white border border-[#444] rounded-md focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1.5 text-gray-400">
                            <UserPlus size={20} />
                        </div>
                    </div>

                    <button
                        onClick={handleAssignDoctor}
                        disabled={loading}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className={`w-full py-3 rounded-full font-medium relative overflow-hidden transition-colors duration-200 ${loading
                            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-black hover:shadow-md"
                            }`}
                        style={{
                            transform: isHovering && !loading ? "translateY(-1px)" : "translateY(0)",
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Assigning Doctor...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    <span>Assign Doctor</span>
                                </>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full mt-4 py-3 border border-[#444] text-gray-300 rounded-full font-medium hover:bg-[#2A2A2A] transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddDoctor;