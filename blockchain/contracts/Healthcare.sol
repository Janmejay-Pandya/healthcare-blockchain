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
        uint256 passcodeHash; // Hashed passcode
    }

    struct MedicalCase {
        uint256 caseId;
        address patient;
        bool isOngoing;
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
    event CaseCreated(uint256 indexed caseId, address indexed patient);
    event RecordAdded(uint256 indexed recordId, uint256 indexed caseId, address indexed doctor);
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
        require(bytes(patients[msg.sender].fullName).length > 0, "Not a registered patient");
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
    require(bytes(patients[msg.sender].fullName).length == 0, "Patient already registered");
    patients[msg.sender] = Patient(
        _fullName,
        _dob,
        _addressDetails,
        _contactNumber,
        _allergies,
        _weight,
        _height,
        new uint256[](0), // Correctly initialize an empty uint256 array
        uint256(keccak256(abi.encodePacked(_passcode))) // Correctly hash and store the passcode
    );
    emit PatientRegistered(msg.sender, _fullName);
}

    function verifyPasscode(address _patient, uint256 _passcode) internal view {
        require(patients[_patient].passcodeHash == uint256(keccak256(abi.encodePacked(_passcode))), "Invalid Passcode");
    }

    function createCase(uint256 _passcode) external onlyPatient {
        verifyPasscode(msg.sender, _passcode);
        caseCounter++;
        cases[caseCounter] = MedicalCase(caseCounter, msg.sender, true, new uint256[](0), new string[](0));
        patients[msg.sender].caseIds.push(caseCounter);
        emit CaseCreated(caseCounter, msg.sender);
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
        records[recordCounter] = MedicalRecord(recordCounter, _caseId, msg.sender, _symptoms, _cause, _inference, _prescription, _advices, _medications);
        cases[_caseId].recordIds.push(recordCounter);
        emit RecordAdded(recordCounter, _caseId, msg.sender);
    }

    function addReport(uint256 _caseId, uint256 _passcode, string memory _cid) external onlyDoctor {
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

    function getPatientCases(address _patient) external view returns (uint256[] memory) {
        return patients[_patient].caseIds;
    }
}
