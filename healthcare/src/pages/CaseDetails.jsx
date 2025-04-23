import { useState, useEffect, useRef } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { addFileToIPFS, getFileFromIPFS, pinFile } from "../utils/ipfsService";
import IPFSStatus from "../components/IPFSStatus";

const CaseDetails = () => {
    const { contract, account } = useBlockchain();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse state safely
    const state = location.state || {};
    const walletAddress = state.walletAddress || "";
    const caseId = state.caseId || "";
    const caseTitle = state.caseTitle || "";
    const isOngoing = state.isOngoing || false;
    const recordIds = state.recordIds ? JSON.parse(state.recordIds) : [];
    const reportCIDs = state.reportCIDs ? JSON.parse(state.reportCIDs) : [];

    // Add passcode state instead of using it directly from location state
    const [passcode, setPasscode] = useState(state.passcode || "");
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ongoing, setOngoing] = useState(isOngoing);

    // New fields for record form according to contract structure
    const [symptoms, setSymptoms] = useState("");
    const [cause, setCause] = useState("");
    const [inference, setInference] = useState("");
    const [prescription, setPrescription] = useState("");
    const [advices, setAdvices] = useState("");
    const [medications, setMedications] = useState("");

    // IPFS related states
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [reports, setReports] = useState([]);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchRecords();
        fetchReports();
    }, []);

    // Generate preview when file is selected
    useEffect(() => {
        if (!selectedFile) {
            setFilePreview(null);
            return;
        }

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setFilePreview(null);
        }

        // Clean up
        return () => {
            if (filePreview && filePreview.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [selectedFile]);

    const fetchRecords = async () => {
        try {
            if (!contract) {
                setError("Contract not initialized.");
                return;
            }
            if (!recordIds || !recordIds.length) {
                setRecords([]);
                return;
            }

            const recordDetails = await Promise.all(
                recordIds.map(async (recordId) => {
                    try {
                        // Fetch each record directly from the contract using its ID
                        const recordData = await contract.records(recordId);
                        return recordData;
                    } catch (err) {
                        console.error(`Error fetching record ${recordId}:`, err);
                        return null;
                    }
                })
            );

            setRecords(recordDetails.filter(Boolean));
        } catch (err) {
            console.error("Error fetching records:", err);
            setError("Failed to fetch records.");
        }
    };

    

    // Helper function to guess if a CID might point to an image
    const guessIsImage = (cid) => {
        // This is just a basic check if we have metadata about the file type
        // In a real app, you might store metadata about file types in the contract
        return cid.toLowerCase().includes('image') || cid.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
    };

    const handleAddRecord = async () => {
        if (!contract) {
            setError("Contract not initialized.");
            return;
        }
        if (!symptoms.trim()) {
            setError("Symptoms cannot be empty.");
            return;
        }

        if (!passcode.trim()) {
            setError("Passcode is required to add a record.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Validate inputs
            const numCaseId = parseInt(caseId);
            if (isNaN(numCaseId)) {
                throw new Error("Invalid case ID");
            }

            console.log("Adding record with params:", {
                caseId: numCaseId,
                passcode,
                symptoms,
                cause,
                inference,
                prescription,
                advices,
                medications
            });

            const tx = await contract.addRecord(
                numCaseId,
                passcode,
                symptoms,
                cause,
                inference,
                prescription,
                advices,
                medications
            );

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed");

            // Clear form fields
            setSymptoms("");
            setCause("");
            setInference("");
            setPrescription("");
            setAdvices("");
            setMedications("");

            // Refresh records
            fetchRecords();
        } catch (err) {
            console.error("Error adding record:", err);

            // More detailed error reporting
            let errorMessage = "Failed to add record";
            if (err.reason) errorMessage += `: ${err.reason}`;
            else if (err.message) errorMessage += `: ${err.message}`;

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // File selection handler
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setSelectedFile(file);
        setUploadStatus("");
    };

    // Upload and add report to blockchain
    const handleAddReport = async () => {
        if (!contract) {
            setError("Contract not initialized.");
            return;
        }
        if (!selectedFile) {
            setError("Please select a file first.");
            return;
        }
        if (!passcode.trim()) {
            setError("Passcode is required to add a report.");
            return;
        }
    
        setLoading(true);
        setUploadStatus("Uploading to IPFS...");
        setError("");
    
        try {
            // Upload to IPFS using the corrected service
            const cid = await addFileToIPFS(selectedFile);
            console.log("File uploaded to IPFS with CID:", cid);
            
            setUploadStatus("File uploaded to IPFS. Adding to blockchain...");
    
            // Validate inputs
            const numCaseId = parseInt(caseId);
            if (isNaN(numCaseId)) {
                throw new Error("Invalid case ID");
            }
    
            // Add report CID to blockchain
            const tx = await contract.addReport(numCaseId, passcode, cid);
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed");
    
            setUploadStatus("Report added successfully!");
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFilePreview(null);
    
            // Add the new report to state
            const newReport = {
                cid,
                url: getFileFromIPFS(cid),
                isImage: selectedFile.type.startsWith('image/')
            };
            setReports([...reports, newReport]);
        } catch (err) {
            console.error("Error adding report:", err);
    
            // More detailed error reporting
            let errorMessage = "Failed to add report";
            if (err.reason) errorMessage += `: ${err.reason}`;
            else if (err.message) errorMessage += `: ${err.message}`;
    
            setError(errorMessage);
            setUploadStatus("");
        } finally {
            setLoading(false);
        }
    };
    
    // Also update the fetchReports function to use the corrected service:
    const fetchReports = async () => {
        try {
            if (reportCIDs && reportCIDs.length > 0) {
                const reportLinks = reportCIDs.map((cid) => ({
                    cid,
                    url: getFileFromIPFS(cid),
                    isImage: guessIsImage(cid)
                }));
                setReports(reportLinks);
            }
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const handleCloseCase = async () => {
        if (!contract) {
            setError("Contract not initialized.");
            return;
        }
        if (!passcode.trim()) {
            setError("Passcode is required to close this case.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Validate inputs
            const numCaseId = parseInt(caseId);
            if (isNaN(numCaseId)) {
                throw new Error("Invalid case ID");
            }

            console.log("Closing case with params:", {
                caseId: numCaseId,
                passcode
            });

            const tx = await contract.closeCase(numCaseId, passcode);
            console.log("Transaction sent:", tx.hash);

            await tx.wait();
            console.log("Transaction confirmed");

            setOngoing(false);
        } catch (err) {
            console.error("Error closing case:", err);

            // More detailed error reporting
            let errorMessage = "Failed to close case";
            if (err.reason) errorMessage += `: ${err.reason}`;
            else if (err.message) errorMessage += `: ${err.message}`;

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatRecord = (record) => {
        // Safely format record data from the blockchain
        return {
            recordId: record?.recordId?.toString() || "Unknown",
            caseId: record?.caseId?.toString() || "Unknown",
            doctor: record?.doctor || "Unknown",
            symptoms: record?.symptoms || "",
            cause: record?.cause || "",
            inference: record?.inference || "",
            prescription: record?.prescription || "",
            advices: record?.advices || "",
            medications: record?.medications || ""
        };
    };

    // Gets file type icon based on URL or name
    const getFileIcon = (file) => {
        const url = file.url?.toLowerCase() || "";
        
        if (file.isImage || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return "📷";
        } else if (url.match(/\.(pdf)$/i)) {
            return "📄";
        } else if (url.match(/\.(doc|docx)$/i)) {
            return "📝";
        } else if (url.match(/\.(xls|xlsx|csv)$/i)) {
            return "📊";
        } else {
            return "📎";
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
                <IPFSStatus />
                
                <h2 className="text-2xl font-bold text-teal-500 mb-4">{caseTitle}</h2>
                <p className="text-gray-400 mb-4">Case ID: #{caseId}</p>
                <p className={`mb-4 ${ongoing ? "text-green-400" : "text-red-400"}`}>
                    Status: {ongoing ? "Open" : "Closed"}
                </p>

                {/* Add passcode input at the top, visible for ongoing cases */}
                {ongoing && (
                    <div className="mb-4 bg-gray-700 p-4 rounded-lg">
                        <label className="block text-gray-300 mb-1">Case Passcode*</label>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Enter passcode to modify case"
                            className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                        />
                        <p className="text-sm text-gray-400 mt-1">
                            Required for adding records or closing the case
                        </p>
                    </div>
                )}

                {/* Reports Section */}
                <h3 className="text-xl font-semibold text-gray-300 mb-4">Reports & Images</h3>
                {reports && reports.length > 0 ? (
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {reports.map((report, index) => (
                            <div key={index} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-2">{getFileIcon(report)}</span>
                                    <p className="text-sm text-gray-400">Report #{index + 1}</p>
                                </div>
                                
                                {/* Preview for images */}
                                {report.isImage && (
                                    <div className="mb-2 bg-gray-600 rounded overflow-hidden">
                                        <img 
                                            src={report.url} 
                                            alt="Report preview" 
                                            className="w-full h-auto object-contain max-h-40"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/placeholder-image.png';
                                            }}
                                        />
                                    </div>
                                )}
                                
                                <a 
                                    href={report.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-teal-400 hover:underline"
                                >
                                    View Full Report
                                </a>
                                <p className="text-xs text-gray-500 mt-1 break-all">CID: {report.cid}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 mb-6">No reports found.</p>
                )}

                {/* Add Report Section */}
                {ongoing && (
                    <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Add New Report/Image</h4>
                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Select File*</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                            />
                        </div>
                        
                        {/* Preview selected file if it's an image */}
                        {filePreview && (
                            <div className="mb-3 bg-gray-600 rounded-md overflow-hidden">
                                <img 
                                    src={filePreview} 
                                    alt="Selected file preview" 
                                    className="w-full h-auto object-contain max-h-60" 
                                />
                            </div>
                        )}
                        
                        {selectedFile && !filePreview && (
                            <div className="mb-3 p-2 bg-gray-600 rounded-md">
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">📎</span>
                                    <span className="text-gray-300">{selectedFile.name}</span>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </span>
                            </div>
                        )}
                        
                        <button
                            onClick={handleAddReport}
                            className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
                            disabled={loading || !contract || !selectedFile}
                        >
                            {loading ? "Uploading..." : "Upload Report"}
                        </button>
                        {uploadStatus && (
                            <p className="mt-2 text-blue-300">{uploadStatus}</p>
                        )}
                    </div>
                )}

                {/* Records Section */}
                <h3 className="text-xl font-semibold text-gray-300 mb-4">Medical Records</h3>
                {records && records.length > 0 ? (
                    <div className="mb-6">
                        {records.map((record, index) => {
                            const formattedRecord = formatRecord(record);
                            return (
                                <div key={index} className="bg-gray-700 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-gray-400">Record #{formattedRecord.recordId}</p>
                                    <p className="text-sm text-gray-400 mb-2">Doctor: {formattedRecord.doctor}</p>

                                    {formattedRecord.symptoms && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Symptoms:</span> {formattedRecord.symptoms}
                                        </div>
                                    )}

                                    {formattedRecord.cause && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Cause:</span> {formattedRecord.cause}
                                        </div>
                                    )}

                                    {formattedRecord.inference && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Inference:</span> {formattedRecord.inference}
                                        </div>
                                    )}

                                    {formattedRecord.prescription && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Prescription:</span> {formattedRecord.prescription}
                                        </div>
                                    )}

                                    {formattedRecord.advices && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Advice:</span> {formattedRecord.advices}
                                        </div>
                                    )}

                                    {formattedRecord.medications && (
                                        <div className="mb-2">
                                            <span className="font-semibold text-teal-400">Medications:</span> {formattedRecord.medications}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-400 mb-6">No records found.</p>
                )}

                {ongoing && (
                    <div className="mt-4 bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Add New Record</h4>

                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Symptoms*</label>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Cause</label>
                            <textarea
                                value={cause}
                                onChange={(e) => setCause(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Inference</label>
                            <textarea
                                value={inference}
                                onChange={(e) => setInference(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Prescription</label>
                            <textarea
                                value={prescription}
                                onChange={(e) => setPrescription(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-300 mb-1">Advice</label>
                            <textarea
                                value={advices}
                                onChange={(e) => setAdvices(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-300 mb-1">Medications</label>
                            <textarea
                                value={medications}
                                onChange={(e) => setMedications(e.target.value)}
                                className="w-full p-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md"
                                rows="2"
                            />
                        </div>

                        <button
                            onClick={handleAddRecord}
                            className="w-full p-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition"
                            disabled={loading || !contract}
                        >
                            {loading ? "Adding..." : "Add Record"}
                        </button>
                    </div>
                )}

                {ongoing && (
                    <button
                        onClick={handleCloseCase}
                        className="mt-4 p-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition w-full"
                        disabled={loading || !contract}
                    >
                        {loading ? "Closing..." : "Close Case"}
                    </button>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseDetails;