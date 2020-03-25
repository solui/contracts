pragma solidity >=0.6.1;

import "./IRepository.sol";
import "./IProxyImpl.sol";
import "./Ownable.sol";

contract RepositoryImpl is Ownable, IRepository, IProxyImpl {
  constructor () public Ownable() {}

  function getImplementationVersion () public pure override returns (string memory) {
    return "1";
  }

  function getNumberOfDapps () public view override returns (uint) {
    return dataUint["numDapps"];
  }

  function getIdOfDapp (uint _dappNumber) public view override returns (string memory) {
    return dataString[_si("id", _dappNumber)];
  }

  function getDapp (string memory _dappId) public view override returns (
    uint hostType_,
    uint numContracts_,
    address publisher_,
    uint date_
  ) {
    hostType_ = dataUint[_ss(_dappId, "hostType")];
    numContracts_ = dataUint[_ss(_dappId, "numContracts")];
    publisher_ = dataAddress[_ss(_dappId, "publisher")];
    date_ = dataUint[_ss(_dappId, "date")];
  }

  function getIdOfContractForDapp (string memory _dappId, uint _contractIndex) public view override returns (bytes32) {
    return dataBytes32[_ssi(_dappId, "contract", _contractIndex)];
  }

  function getNumberOfDappsByPublisher (address _publisher) public view override returns (uint) {
    return dataUint[_as(_publisher, "numDapps")];
  }

  function getIdOfDappByPublisher (address _publisher, uint _publisherDappNumber) public view override returns (string memory) {
    return dataString[_asi(_publisher, "dapp", _publisherDappNumber)];
  }

  function getNumberOfDappsForContract (bytes32 _bytecodeHash) public view override returns (uint) {
    return dataUint[_bs(_bytecodeHash, "numDapps")];
  }

  function getIdOfDappForContract (bytes32 _bytecodeHash, uint _contractDappNumber) public view override returns (string memory) {
    return dataString[_bsi(_bytecodeHash, "dapp", _contractDappNumber)];
  }

  function getIdOfLatestDappForContract (bytes32 _bytecodeHash) public view override returns (string memory) {
    uint latestDappNum = getNumberOfDappsForContract(_bytecodeHash);
    return getIdOfDappForContract(_bytecodeHash, latestDappNum);
  }

  function getIdOfLatestDappForContractByPublisher (bytes32 _bytecodeHash, address _publisher) public view override returns (string memory) {
    return dataString[_bsa(_bytecodeHash, "publisherLatestDapp", _publisher)];
  }

  function publish (string memory _dappId, bytes32[] memory _bytecodeHashes) public override {
    require(dataAddress[_ss(_dappId, "publisher")] == address(0), 'already published');
    require(_bytecodeHashes.length > 0, 'need atleast 1 bytecode hash');

    // save dapp data
    dataAddress[_ss(_dappId, "publisher")] = msg.sender;
    dataUint[_ss(_dappId, "numContracts")] = _bytecodeHashes.length;
    dataUint[_ss(_dappId, "date")] = now;

    for (uint i = 0; i < _bytecodeHashes.length; i += 1) {
      bytes32 h = _bytecodeHashes[i];

      dataBytes32[_ssi(_dappId, "contract", i + 1)] = h;
      require(!dataBool[_bs(h, _dappId)], 'duplicate bytecode hash detected');
      dataBool[_bs(h, _dappId)] = true;

      // save contract data
      dataUint[_bs(h, "numDapps")] += 1;
      dataString[_bsi(h, "dapp", dataUint[_bs(h, "numDapps")])] = _dappId;

      // if there are duplicate bytecodes hashes in the list then thi=s will fail
      dataString[_bsa(h, "publisherLatestDapp", msg.sender)] = _dappId;
    }

    // save publisher data
    dataUint[_as(msg.sender, "numDapps")] += 1;
    dataString[_asi(msg.sender, "dapp", dataUint[_as(msg.sender, "numDapps")])] = _dappId;

    // update root dapp list
    dataUint["numDapps"] += 1;
    dataString[_si("id", dataUint["numDapps"])] = _dappId;

    // notify
    emit Publish(_dappId);
 }
}