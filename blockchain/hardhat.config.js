require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "ganache",
  networks: {
    volta: {
      url: "https://volta-rpc.energyweb.org",
      accounts: ["0bbc7e982630f87c5588fca0f8d09ef856de8bb92ec72e773d2e8504653b803b"],
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [
        "0bbc7e982630f87c5588fca0f8d09ef856de8bb92ec72e773d2e8504653b803b",
      ],
    },
  },
};
