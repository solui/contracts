pragma solidity >=0.6.1;

import "./Proxy.sol";

contract Repository is Proxy {
  constructor (address _impl) Proxy(_impl) public {}
}