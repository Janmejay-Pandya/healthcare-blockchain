// import { Link } from "react-router-dom";
// import { useBlockchain } from "../context/BlockchainContext";
// import { useState, useEffect } from "react";
// import { Shield } from "lucide-react";

// const Navbar = () => {
//     const { account, contract } = useBlockchain();
//     const [role, setRole] = useState("");

//     useEffect(() => {
//         if (contract && account) {
//             fetchRole();
//         }
//     }, [contract, account]);

//     const fetchRole = async () => {
//         try {
//             const userRole = await contract.getRole(account);
//             setRole(userRole);
//         } catch (error) {
//             console.error("Error fetching role:", error);
//         }
//     };

//     return (
//         <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
//             <div className="flex items-center">
//                 <Shield className="text-green-400 mr-2" size={32} />
//                 <h1 className="text-2xl font-bold">MedLedger</h1>
//             </div>

//             {/* Navigation Links */}
//             <div className="space-x-4">
//                 <Link to="/" className="hover:underline">Home</Link>

//                 {account && (
//                     <>
//                         <Link to="/profile" className="hover:underline">Profile</Link>
//                         {role === "Doctor" && (
//                             <Link to="/patient-details" className="hover:underline">Patient Details</Link>
//                         )}
//                         {role === "Patient" && (
//                             <Link to="/view-history" className="hover:underline">View History</Link>
//                         )}
//                     </>
//                 )}
//             </div>

//             {/* Wallet Display */}
//             <p className="text-sm">
//                 {account ? `Wallet: ${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
//             </p>
//         </nav>
//     );
// };

// export default Navbar;


import { Link } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";
import { useState, useEffect } from "react";
import { Shield, User, History, Clipboard, ExternalLink } from "lucide-react";

const Navbar = () => {
    const { account, contract } = useBlockchain();
    const [role, setRole] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-black border-b border-gray-800 text-white py-4 px-6">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center hover:text-green-400 transition duration-300">
                    <Shield className="text-green-400 mr-2" size={32} />
                    <h1 className="text-2xl font-bold">MedLedger</h1>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="hover:text-green-400 transition duration-300">Home</Link>

                    {account && (
                        <>
                            <Link to="/profile" className="flex items-center hover:text-green-400 transition duration-300">
                                <User size={16} className="mr-1" />
                                <span>Profile</span>
                            </Link>

                            {role === "Doctor" && (
                                <Link to="/patient-details" className="flex items-center hover:text-green-400 transition duration-300">
                                    <Clipboard size={16} className="mr-1" />
                                    <span>Patient Details</span>
                                </Link>
                            )}

                            {role === "Patient" && (
                                <Link to="/view-history" className="flex items-center hover:text-green-400 transition duration-300">
                                    <History size={16} className="mr-1" />
                                    <span>View History</span>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* Wallet Display */}
                <div className="hidden md:flex items-center">
                    <div className={`px-4 py-2 rounded-full text-sm ${account ? 'bg-gray-800' : 'bg-gray-700'}`}>
                        {account ? (
                            <div className="flex items-center">
                                <span className="mr-2">
                                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                                </span>
                                <ExternalLink size={14} className="text-green-400" />
                            </div>
                        ) : (
                            "Not connected"
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-white" onClick={toggleMenu}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-gray-800">
                    <Link to="/" className="block py-2 px-4 hover:bg-gray-800" onClick={toggleMenu}>Home</Link>

                    {account && (
                        <>
                            <Link to="/profile" className="block py-2 px-4 hover:bg-gray-800" onClick={toggleMenu}>
                                <div className="flex items-center">
                                    <User size={16} className="mr-2" />
                                    <span>Profile</span>
                                </div>
                            </Link>

                            {role === "Doctor" && (
                                <Link to="/patient-details" className="block py-2 px-4 hover:bg-gray-800" onClick={toggleMenu}>
                                    <div className="flex items-center">
                                        <Clipboard size={16} className="mr-2" />
                                        <span>Patient Details</span>
                                    </div>
                                </Link>
                            )}

                            {role === "Patient" && (
                                <Link to="/view-history" className="block py-2 px-4 hover:bg-gray-800" onClick={toggleMenu}>
                                    <div className="flex items-center">
                                        <History size={16} className="mr-2" />
                                        <span>View History</span>
                                    </div>
                                </Link>
                            )}

                            <div className="py-2 px-4 text-gray-400">
                                Wallet: {`${account.slice(0, 6)}...${account.slice(-4)}`}
                            </div>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;