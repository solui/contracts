import { EthHdWallet } from 'eth-hd-wallet'
import _ from 'lodash'
import { parseLog } from 'ethereum-event-logs'
import EthVal from 'ethval'

import packageJson from '../../package.json'
import { toBN, isBN, isAddress } from '../../utils/web3'

require('./chai')

export const MNEMONIC = (packageJson.scripts.devnet.match(/\'(.+)\'/))[1]
console.log(`Mnemonic: ${MNEMONIC}`)

export const hdWallet = EthHdWallet.fromMnemonic(MNEMONIC)
hdWallet.generateAddresses(10)

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const BYTES32_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000'

export const getBalance = async addr => toBN(await web3.eth.getBalance(addr))

export const mulBN = (bn, factor) => bn.mul(toBN(factor * 1000)).div(toBN(1000))

export const parseEvents = (result, e) => {
  return parseLog(result.receipt.rawLogs, [e])
}

export const extractEventArgs = (result, eventAbi) => {
  const { args } = parseEvents(result, eventAbi).pop()

  for (let key in args) {
    if (isBN(args[key])) {
      args[key] = args[key].toString(10)
    }
  }

  return args
}

export const outputBNs = bn => {
  console.log('BNs: ');
  Object.keys(bn).forEach(k => {
    console.log(`   ${bn[k].toString(10)} => ${bn[k].toString(2)}`)
  })
}


export const gwei = v => new EthVal(v, 'gwei').toWei()
export const wei = v => new EthVal(v, 'wei')
export const eth = v => new EthVal(v, 'eth').toWei()


export const web3EvmIncreaseTime = async (web3, ts) => {
  await new Promise((resolve, reject) => {
    return web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [ts],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })

  await new Promise((resolve, reject) => {
    return web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: [],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

export const promiseMapSerial = async (items, asyncFn) => {
  const ret = []

  await items.reduce((lastPromise, k, i) => (
    lastPromise
      .then(() => asyncFn(k))
      .then(result => {
        ret[i] = result
      })
  ), Promise.resolve())

  return ret
}