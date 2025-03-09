import { useState, useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const { account, contract } = useBlockchain();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: "",
        dob: "",
        addressDetails: "",
        contactNumber: "",
        allergies: "",
        weight: "",
        height: "",
        passcode: "",
    });

    useEffect(() => {
        if (contract && account) {
            fetchRole();
            fetchPatientDetails();
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

    const fetchPatientDetails = async () => {
        try {
            const data = await contract.patients(account);
            if (data.fullName) {
                setPatient({
                    fullName: data.fullName,
                    dob: data.dob,
                    addressDetails: data.addressDetails,
                    contactNumber: data.contactNumber,
                    allergies: data.allergies,
                    weight: Number(data.weight),
                    height: Number(data.height),
                });
            }
        } catch (error) {
            console.error("Error fetching patient data:", error);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        if (!account || !contract) return alert("Connect Wallet First!");

        try {
            const tx = await contract.registerPatient(
                formData.fullName,
                formData.dob,
                formData.addressDetails,
                formData.contactNumber,
                formData.allergies,
                Number(formData.weight),
                Number(formData.height),
                Number(formData.passcode)
            );
            await tx.wait();
            alert("Registration successful!");
            fetchPatientDetails();
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Check console for errors.");
        }
    };

    if (loading) return <p className="text-center text-gray-600 mt-6">Loading...</p>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Profile</h2>

                <div className="text-center text-gray-700 mb-4">
                    <p><span className="font-medium">Wallet Address:</span> {account}</p>
                    <p><span className="font-medium">Role:</span> <span className="text-blue-600">{role || "Loading..."}</span></p>
                </div>

                {patient ? (
                    <div className="space-y-3">
                        <p><span className="font-medium">Full Name:</span> {patient.fullName}</p>
                        <p><span className="font-medium">Date of Birth:</span> {patient.dob}</p>
                        <p><span className="font-medium">Address:</span> {patient.addressDetails}</p>
                        <p><span className="font-medium">Contact Number:</span> {patient.contactNumber}</p>
                        <p><span className="font-medium">Allergies:</span> {patient.allergies}</p>
                        <p><span className="font-medium">Weight:</span> {patient.weight} kg</p>
                        <p><span className="font-medium">Height:</span> {patient.height} cm</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 text-center mb-4">You are not registered. Please enter your details below:</p>
                        <div className="space-y-4">
                            <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="date" name="dob" placeholder="Date of Birth" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="text" name="addressDetails" placeholder="Address" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="text" name="contactNumber" placeholder="Contact Number" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="text" name="allergies" placeholder="Allergies" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="password" name="passcode" placeholder="6-digit Passcode" maxLength="6" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            <button onClick={handleRegister} className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition">Register</button>
                        </div>
                    </div>
                )}

                {/* Show Add Doctor button if the user is an admin */}
                {role === "Admin" && (
                    <button
                        onClick={() => navigate("/add-doctor")}
                        className="w-full bg-green-500 text-white py-2 rounded-md mt-6 hover:bg-green-600 transition"
                    >
                        Add Doctor
                    </button>
                )}
            </div>
        </div>
    );
};

export default Profile;
