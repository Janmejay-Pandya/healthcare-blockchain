import { useNavigate } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";

const ConnectWallet = () => {
    const { account, connectWallet } = useBlockchain();
    const navigate = useNavigate();

    const handleConnect = async () => {
        await connectWallet();
        navigate("/profile"); // Redirect to dashboard after connection
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <button 
                onClick={handleConnect} 
                className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
                {account ? "Connected" : "Connect Wallet"}
            </button>
        </div>
    );
};

export default ConnectWallet;
