// import { useState } from "react";
// import { useBlockchain } from "../context/BlockchainContext";
// import { useNavigate } from "react-router-dom";

// const AddDoctor = () => {
//     const { account, contract } = useBlockchain();
//     const navigate = useNavigate();
//     const [doctorAddress, setDoctorAddress] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleAssignDoctor = async () => {
//         if (!account || !contract) return alert("Connect Wallet First!");
//         if (!doctorAddress) return alert("Please enter a valid wallet address!");

//         try {
//             setLoading(true);
//             const tx = await contract.assignDoctor(doctorAddress);
//             await tx.wait();
//             alert("Doctor assigned successfully!");
//             navigate("/profile"); // Redirect back to profile after assignment
//         } catch (error) {
//             console.error("Error assigning doctor:", error);
//             alert("Assignment failed. Check console for errors.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
//             <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
//                 <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Assign Doctor</h2>
//                 <p className="text-gray-600 text-center mb-4">Enter the wallet address of the doctor to assign.</p>

//                 <input 
//                     type="text" 
//                     placeholder="Doctor's Wallet Address" 
//                     value={doctorAddress} 
//                     onChange={(e) => setDoctorAddress(e.target.value)} 
//                     className="w-full p-2 border border-gray-300 rounded-md mb-4"
//                 />

//                 <button 
//                     onClick={handleAssignDoctor} 
//                     disabled={loading}
//                     className={`w-full py-2 rounded-md transition ${
//                         loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600 text-white"
//                     }`}
//                 >
//                     {loading ? "Assigning..." : "Assign Doctor"}
//                 </button>

//                 <button 
//                     onClick={() => navigate("/profile")} 
//                     className="w-full mt-4 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
//                 >
//                     Back to Profile
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default AddDoctor;


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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
            <div className="w-full max-w-lg bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-white mb-6">Assign Doctor</h2>
                <p className="text-gray-300 text-center mb-6">Enter the wallet address of the doctor you want to assign to your healthcare profile.</p>

                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Doctor's Wallet Address (0x...)"
                        value={doctorAddress}
                        onChange={(e) => setDoctorAddress(e.target.value)}
                        className="w-full p-4 pl-4 pr-12 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <UserPlus size={20} />
                    </div>
                </div>

                <button
                    onClick={handleAssignDoctor}
                    disabled={loading}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className={`w-full py-4 rounded-xl font-bold text-base relative overflow-hidden transition-all duration-300 ${loading
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20"
                        }`}
                    style={{
                        transform: isHovering && !loading ? "translateY(-2px)" : "translateY(0)",
                    }}
                >
                    <div className="relative z-10 flex items-center justify-center gap-2">
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

                    {!loading && (
                        <div className="absolute inset-0 -z-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => navigate("/profile")}
                    className="w-full mt-4 py-4 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Profile</span>
                </button>
            </div>
        </div>
    );
};

export default AddDoctor;