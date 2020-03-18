pragma solidity >=0.6.1;

interface IRepository {
  function getNumberOfDapps () external view returns (uint);

  function getIdOfDapp (uint _dappNumber) external view returns (string memory);

  function getDapp (string calldata _dappId) external view returns (
    uint hostType_,
    uint numContracts_,
    address publisher_,
    uint date_
  );

  function getIdOfContractForDapp (string calldata _dappId, uint _contractIndex) external view returns (string memory);

  function getNumberOfDappsByPublisher (address _publisher) external view returns (uint);

  function getIdOfDappByPublisher (address _publisher, uint _publisherDappNumber) external view returns (string memory);

  function getNumberOfDappsForContract (bytes32 _bytecodeHash) external view returns (uint);

  function getIdOfDappForContract (bytes32 _bytecodeHash, uint _contractDappNumber) external view returns (string memory);

  function getIdOfLatestDappForContract (bytes32 _bytecodeHash) external view returns (string memory);

  function getIdOfLatestDappForContractByPublisher (bytes32 _bytecodeHash, address _publisher) external view returns (string memory);

  function publish (string calldata _dappId, bytes32[] calldata _bytecodeHashes) external;

  event Publish (string dappId);
}