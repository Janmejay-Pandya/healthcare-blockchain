import { useState, useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate, useParams } from "react-router-dom";

const PatientCaseDetails = () => {
  const { contract, account } = useBlockchain();
  const navigate = useNavigate();
  const { caseId: caseIdParam } = useParams();
  const [caseDetails, setCaseDetails] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const caseId = caseIdParam ? parseInt(caseIdParam, 10) : null;

  useEffect(() => {
    if (account && contract && caseId !== null) {
      fetchCaseDetails();
    }
  }, [account, contract, caseId]);

  useEffect(() => {
    if (caseDetails?.recordIds?.length > 0) {
      fetchRecords();
    }
  }, [caseDetails]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const details = await contract.getMyCaseDetails(caseId);
      setCaseDetails({
        caseId: details.caseId.toString(),
        patient: details.patient,
        isOngoing: details.isOngoing,
        caseTitle: details.caseTitle,
        recordIds: details.recordIds.map((id) => id.toString()),
        reportCIDs: details.reportCIDs,
      });
    } catch (err) {
      console.error("Error fetching case details:", err);
      setError("Failed to fetch case details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!contract || !caseDetails?.recordIds) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const recordDetails = await Promise.all(
        caseDetails.recordIds.map(async (recordId) => {
          try {
            const recordData = await contract.records(recordId);
            console.log(recordData);

            return {
              recordId: recordData.recordId.toString(),
              caseId: recordData.caseId.toString(),
              doctor: recordData.doctor,
              symptoms: recordData.symptoms,
              cause: recordData.cause,
              inference: recordData.inference,
              prescription: recordData.prescription,
              advices: recordData.advices,
              medications: recordData.medications,
            };
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : caseDetails ? (
          <>
            <h2 className="text-2xl font-bold text-teal-500 mb-4">
              {caseDetails.caseTitle}
            </h2>
            <p className="text-gray-400 mb-4">Case ID: #{caseDetails.caseId}</p>
            <p
              className={`mb-4 ${
                caseDetails.isOngoing ? "text-green-400" : "text-red-400"
              }`}
            >
              Status: {caseDetails.isOngoing ? "Open" : "Closed"}
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-4">
              Medical Records
            </h3>
            {records && records.length > 0 ? (
              <div className="mb-6">
                {records.map((record, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-400">
                      Record #{record.recordId}
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      Doctor: {record.doctor}
                    </p>
                    {record.symptoms && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Symptoms:
                        </span>{" "}
                        {record.symptoms}
                      </p>
                    )}
                    {record.cause && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Cause:
                        </span>{" "}
                        {record.cause}
                      </p>
                    )}
                    {record.inference && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Inference:
                        </span>{" "}
                        {record.inference}
                      </p>
                    )}
                    {record.prescription && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Prescription:
                        </span>{" "}
                        {record.prescription}
                      </p>
                    )}
                    {record.advices && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Advice:
                        </span>{" "}
                        {record.advices}
                      </p>
                    )}
                    {record.medications && (
                      <p>
                        <span className="font-semibold text-teal-400">
                          Medications:
                        </span>{" "}
                        {record.medications}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 mb-6">
                No medical records found for this case.
              </p>
            )}

            <h3 className="text-xl font-semibold text-gray-300 mb-4">
              Medical Reports
            </h3>
            {caseDetails.reportCIDs && caseDetails.reportCIDs.length > 0 ? (
              <div className="space-y-6 mb-6">
                {caseDetails.reportCIDs.map((cid, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 mb-2">
                      CID: <span className="break-all">{cid}</span>
                    </p>

                    {/* View link (opens in new tab) */}
                    <a
                      href={`http://127.0.0.1:8080/ipfs/${cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-teal-400 hover:underline mb-2"
                    >
                      🔗 View Report
                    </a>

                    {/* Optional embedded viewer if it's a PDF */}
                    {cid.endsWith(".pdf") && (
                      <iframe
                        src={`http://127.0.0.1:8080/ipfs/${cid}`}
                        width="100%"
                        height="400px"
                        title={`Report ${index + 1}`}
                        className="mt-2 border border-gray-600 rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 mb-6">
                No medical reports found for this case.
              </p>
            )}

            <button
              onClick={() => navigate("/view-history")}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition duration-300"
            >
              Back to History
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default PatientCaseDetails;
