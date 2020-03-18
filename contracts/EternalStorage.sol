pragma solidity >=0.6.1;

contract EternalStorage {
  // scalars
  mapping(string => address) dataAddress;
  mapping(string => string) dataString;
  mapping(string => bytes32) dataBytes32;
  mapping(string => int) dataInt;
  mapping(string => uint) dataUint;
  mapping(string => bool) dataBool;
  // arrays
  mapping(string => address[]) dataManyAddresses;
  mapping(string => bytes32[]) dataManyBytes32s;
  mapping(string => int[]) dataManyInts;
  mapping(string => uint[]) dataManyUints;
  mapping(string => bool[]) dataManyBools;
  // helpers
  function _si (string memory s1, uint i1) internal pure returns (string memory) {
    return string(abi.encodePacked(s1, i1));
  }
  function _ss (string memory s1, string memory s2) internal pure returns (string memory) {
    return string(abi.encodePacked(s1, s2));
  }
  function _ssi (string memory s1, string memory s2, uint i1) internal pure returns (string memory) {
    return string(abi.encodePacked(s1, s2, i1));
  }
  function _as (address a1, string memory s1) internal pure returns (string memory) {
    return string(abi.encodePacked(a1, s1));
  }
  function _asi (address a1, string memory s1, uint i1) internal pure returns (string memory) {
    return string(abi.encodePacked(a1, s1, i1));
  }
  function _bs (bytes32 b1, string memory s1) internal pure returns (string memory) {
    return string(abi.encodePacked(b1, s1));
  }
  function _bsi (bytes32 b1, string memory s1, uint i1) internal pure returns (string memory) {
    return string(abi.encodePacked(b1, s1, i1));
  }
  function _bsa (bytes32 b1, string memory s1, address a1) internal pure returns (string memory) {
    return string(abi.encodePacked(b1, s1, a1));
  }
}