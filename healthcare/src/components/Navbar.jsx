import { Link } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";
import { useState, useEffect } from "react";

const Navbar = () => {
    const { account, contract } = useBlockchain();
    const [role, setRole] = useState("");

    useEffect(() => {
        if (contract && account) {
            fetchRole();
        }
    }, [contract, account]);

    const fetchRole = async () => {
        try {
            const userRole = await contract.getRole(account);
            setRole(userRole);
        } catch (error) {
            console.error("Error fetching role:", error);
        }
    };

    return (
        <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Healthcare DApp</h1>
            
            {/* Navigation Links */}
            <div className="space-x-4">
                <Link to="/" className="hover:underline">Home</Link>
                
                {account && (
                    <>
                        <Link to="/profile" className="hover:underline">Profile</Link>
                        {role === "Doctor" && (
                            <Link to="/patient-details" className="hover:underline">Patient Details</Link>
                        )}
                        {role === "Patient" && (
                            <Link to="/view-history" className="hover:underline">View History</Link>
                        )}
                    </>
                )}
            </div>

            {/* Wallet Display */}
            <p className="text-sm">
                {account ? `Wallet: ${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
            </p>
        </nav>
    );
};

export default Navbar;
