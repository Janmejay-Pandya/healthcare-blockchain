// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Healthcare {
    struct Patient {
        string fullName;
        string dob;
        string addressDetails;
        string contactNumber;
        string allergies;
        uint256 weight;
        uint256 height;
        uint256[] caseIds;
        uint256 passcodeHash;
    }

    struct MedicalCase {
        uint256 caseId;
        address patient;
        bool isOngoing;
        string caseTitle;
        uint256[] recordIds;
        string[] reportCIDs;
    }

    struct MedicalRecord {
        uint256 recordId;
        uint256 caseId;
        address doctor;
        string symptoms;
        string cause;
        string inference;
        string prescription;
        string advices;
        string medications;
    }

    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isDoctor;
    mapping(address => Patient) public patients;
    mapping(uint256 => MedicalCase) public cases;
    mapping(uint256 => MedicalRecord) public records;
    address[] public doctorList;

    uint256 public caseCounter;
    uint256 public recordCounter;

    event DoctorAssigned(address indexed doctor);
    event PatientRegistered(address indexed patient, string fullName);
    event CaseCreated(
        uint256 indexed caseId,
        address indexed patient,
        string caseTitle
    );
    event RecordAdded(
        uint256 indexed recordId,
        uint256 indexed caseId,
        address indexed doctor
    );
    event ReportAdded(uint256 indexed caseId, string cid);
    event CaseClosed(uint256 indexed caseId);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin can perform this action");
        _;
    }

    modifier onlyDoctor() {
        require(isDoctor[msg.sender], "Only doctor can perform this action");
        _;
    }

    modifier onlyPatient() {
        require(
            bytes(patients[msg.sender].fullName).length > 0,
            "Not a registered patient"
        );
        _;
    }

    constructor() {
        isAdmin[msg.sender] = true;
    }

    function assignDoctor(address _doctor) external onlyAdmin {
        require(!isDoctor[_doctor], "Doctor already assigned");
        isDoctor[_doctor] = true;
        doctorList.push(_doctor);
        emit DoctorAssigned(_doctor);
    }

    function registerPatient(
        string memory _fullName,
        string memory _dob,
        string memory _addressDetails,
        string memory _contactNumber,
        string memory _allergies,
        uint256 _weight,
        uint256 _height,
        uint256 _passcode
    ) external {
        require(
            bytes(patients[msg.sender].fullName).length == 0,
            "Patient already registered"
        );

        patients[msg.sender] = Patient({
            fullName: _fullName,
            dob: _dob,
            addressDetails: _addressDetails,
            contactNumber: _contactNumber,
            allergies: _allergies,
            weight: _weight,
            height: _height,
            caseIds: new uint256[](0),
            passcodeHash: uint256(keccak256(abi.encodePacked(_passcode)))
        });
        emit PatientRegistered(msg.sender, _fullName);
    }

    function verifyPasscode(address _patient, uint256 _passcode) internal view {
        require(
            patients[_patient].passcodeHash ==
                uint256(keccak256(abi.encodePacked(_passcode))),
            "Invalid Passcode"
        );
    }

    function createCase(
        address _patientAddress,
        uint256 _passcode,
        string memory _caseTitle
    ) external onlyDoctor {
        verifyPasscode(_patientAddress, _passcode);

        caseCounter++;
        cases[caseCounter] = MedicalCase({
            caseId: caseCounter,
            patient: _patientAddress,
            isOngoing: true,
            caseTitle: _caseTitle,
            recordIds: new uint256[](0),
            reportCIDs: new string[](0)
        });

        patients[_patientAddress].caseIds.push(caseCounter);
        emit CaseCreated(caseCounter, _patientAddress, _caseTitle);
    }

    function addRecord(
        uint256 _caseId,
        uint256 _passcode,
        string memory _symptoms,
        string memory _cause,
        string memory _inference,
        string memory _prescription,
        string memory _advices,
        string memory _medications
    ) external onlyDoctor {
        verifyPasscode(cases[_caseId].patient, _passcode);
        require(cases[_caseId].isOngoing, "Case is not ongoing");

        recordCounter++;
        records[recordCounter] = MedicalRecord({
            recordId: recordCounter,
            caseId: _caseId,
            doctor: msg.sender,
            symptoms: _symptoms,
            cause: _cause,
            inference: _inference,
            prescription: _prescription,
            advices: _advices,
            medications: _medications
        });

        cases[_caseId].recordIds.push(recordCounter);
        emit RecordAdded(recordCounter, _caseId, msg.sender);
    }

    function addReport(
        uint256 _caseId,
        uint256 _passcode,
        string memory _cid
    ) external onlyDoctor {
        verifyPasscode(cases[_caseId].patient, _passcode);
        require(cases[_caseId].isOngoing, "Case is not ongoing");

        cases[_caseId].reportCIDs.push(_cid);
        emit ReportAdded(_caseId, _cid);
    }

    function closeCase(uint256 _caseId, uint256 _passcode) external onlyDoctor {
        verifyPasscode(cases[_caseId].patient, _passcode);
        require(cases[_caseId].isOngoing, "Case is not ongoing");

        cases[_caseId].isOngoing = false;
        emit CaseClosed(_caseId);
    }

    function getRole(address _user) external view returns (string memory) {
        if (isAdmin[_user]) return "Admin";
        if (isDoctor[_user]) return "Doctor";
        if (bytes(patients[_user].fullName).length > 0) return "Patient";
        return "None";
    }

    function getAllDoctors() external view returns (address[] memory) {
        return doctorList;
    }

    function getMyCases()
        external
        view
        onlyPatient
        returns (uint256[] memory, string[] memory)
    {
        uint256[] memory caseIds = patients[msg.sender].caseIds;
        string[] memory caseTitles = new string[](caseIds.length);

        for (uint256 i = 0; i < caseIds.length; i++) {
            caseTitles[i] = cases[caseIds[i]].caseTitle;
        }

        return (caseIds, caseTitles);
    }

    function getCaseDetails(
        uint256 _caseId
    )
        public
        view
        returns (
            uint256,
            address,
            bool,
            string memory,
            uint256[] memory,
            string[] memory
        )
    {
        MedicalCase storage medCase = cases[_caseId];
        return (
            medCase.caseId,
            medCase.patient,
            medCase.isOngoing,
            medCase.caseTitle,
            medCase.recordIds,
            medCase.reportCIDs
        );
    }

    function getMyCaseDetails(
        uint256 _caseId
    ) external view onlyPatient returns (MedicalCase memory) {
        require(
            cases[_caseId].patient == msg.sender,
            "This case does not belong to you"
        );
        return cases[_caseId];
    }

    function getMyCaseRecords(
        uint256 _caseId
    ) external view onlyPatient returns (MedicalRecord[] memory) {
        require(
            cases[_caseId].patient == msg.sender,
            "This case does not belong to you"
        );

        uint256[] memory recordIds = cases[_caseId].recordIds;
        MedicalRecord[] memory recordsArray = new MedicalRecord[](
            recordIds.length
        );

        for (uint256 i = 0; i < recordIds.length; i++) {
            recordsArray[i] = records[recordIds[i]];
        }

        return recordsArray;
    }

    function getMyCaseReports(
        uint256 _caseId
    ) external view onlyPatient returns (string[] memory) {
        require(
            cases[_caseId].patient == msg.sender,
            "This case does not belong to you"
        );
        return cases[_caseId].reportCIDs;
    }

    function getCaseIdsForPatient(
        address _patientAddress
    ) public view returns (uint256[] memory) {
        return patients[_patientAddress].caseIds;
    }

    function verifyPatientAccess(
        address _patientAddress,
        uint256 _passcode
    ) public view returns (bool) {
        // Return true if passcode matches or if the caller is the patient themselves
        return
            (msg.sender == _patientAddress) ||
            (patients[_patientAddress].passcodeHash ==
                uint256(keccak256(abi.encodePacked(_passcode))));
    }

    function getPatientDetailsWithPasscode(
        address _patientAddress,
        uint256 _passcode
    )
        public
        view
        returns (
            string memory fullName,
            string memory dob,
            string memory addressDetails,
            string memory contactNumber,
            string memory allergies,
            uint256 weight,
            uint256 height
        )
    {
        // Verify access rights
        require(
            verifyPatientAccess(_patientAddress, _passcode),
            "Access denied: Invalid passcode"
        );

        Patient storage patient = patients[_patientAddress];
        return (
            patient.fullName,
            patient.dob,
            patient.addressDetails,
            patient.contactNumber,
            patient.allergies,
            patient.weight,
            patient.height
        );
    }
}
