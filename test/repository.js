const { ADDRESS_ZERO, extractEventArgs } = require('./utils')
const { events } = require('../')
const { keccak256 } = require('../utils/web3')

const IProxyImpl = artifacts.require("./IProxyImpl")
const Repository = artifacts.require("./Repository")
const RepositoryImpl = artifacts.require("./RepositoryImpl")
const IRepository = artifacts.require("./IRepository")
const TestProxyImpl2 = artifacts.require("./test/TestProxyImpl2")

contract('Repository', accounts => {
  let repository
  let repositoryImpl
  let repositoryProxy
  let proxyImpl

  beforeEach(async () => {
    repositoryImpl = await RepositoryImpl.new()
    repositoryProxy = await Repository.new(repositoryImpl.address)
    repository = await IRepository.at(repositoryProxy.address)
    proxyImpl = await IProxyImpl.at(repository.address)
  })

  it('works', async () => {
    await repositoryProxy.owner().should.eventually.eq(accounts[0])
    await repository.getNumberOfDapps().should.eventually.eq(0)
  })

  describe('upgradeability', () => {
    let testProxyImpl2

    beforeEach(async () => {
      testProxyImpl2 = await TestProxyImpl2.new()
    })

    it('default implementation works', async () => {
      await proxyImpl.getImplementationVersion().should.eventually.eq('1')
    })

    it('can have implementation frozen by owner', async () => {
      await repositoryProxy.isImplementationFrozen().should.eventually.eq(false)
      await repositoryProxy.freezeImplementation({ from: accounts[1] }).should.be.rejectedWith('not the owner')
      await repositoryProxy.freezeImplementation().should.be.fulfilled
      await repositoryProxy.isImplementationFrozen().should.eventually.eq(true)
    })

    it('cannot be upgraded to zero address', async () => {
      await repositoryProxy.setImplementation(ADDRESS_ZERO).should.be.rejectedWith('implementation must be valid')
    })

    it('cannot be upgraded to same implementation again', async () => {
      await repositoryProxy.setImplementation(repositoryImpl.address).should.be.rejectedWith('already this implementation')
    })

    it('cannot be upgraded if not the owner', async () => {
      await repositoryProxy.setImplementation(testProxyImpl2.address, { from: accounts[1] }).should.be.rejectedWith('not the owner')
    })

    it('cannot be upgraded if implementation frozen', async () => {
      await repositoryProxy.freezeImplementation()
      await repositoryProxy.setImplementation(testProxyImpl2.address).should.be.rejectedWith('already frozen')
    })

    it('can be upgraded if the owner and a new implementation', async () => {
      await repositoryProxy.setImplementation(testProxyImpl2.address).should.be.fulfilled
      await proxyImpl.getImplementationVersion().should.eventually.eq('test2')
    })
  })

  describe('publishing', () => {
    const toHash = a => (Array.isArray(a) ? a.map(v => keccak256(v)) : keccak256(a))

    it('anyone can publish', async () => {
      await repository.publish('dapp1', toHash(['bh1', 'bh2']), { from: accounts[2] }).should.be.fulfilled
    })

    it('does not allow duplicate bytecode hashes', async () => {
      await repository.publish('dapp1', toHash(['bh1', 'bh1'])).should.be.rejectedWith('duplicate')
    })

    it('does not allow empty bytecode hashes list', async () => {
      await repository.publish('dapp1', toHash([])).should.be.rejectedWith('need atleast 1 bytecode hash')
    })

    it('does not allow same dapp twice', async () => {
      await repository.publish('dapp1', toHash(['bh1', 'bh2']))
      await repository.publish('dapp1', toHash(['bh3', 'bh4'])).should.be.rejectedWith('already published')
    })

    describe('updates internal state if successful', () => {
      beforeEach(async () => {
        await repository.publish('dapp1', toHash(['bh1', 'bh2']))
      })

      it('including dapp data', async () => {
        await repository.getNumberOfDapps().should.eventually.eq(1)
        await repository.getIdOfDapp(1).should.eventually.eq('dapp1')
        await repository.getDapp('dapp1').should.eventually.matchObj({
          hostType_: 0,
          numContracts_: 2,
          publisher_: accounts[0],
        })
        await repository.getIdOfContractForDapp('dapp1', 1).should.eventually.eq(toHash('bh1'))
        await repository.getIdOfContractForDapp('dapp1', 2).should.eventually.eq(toHash('bh2'))
      })

      it('including contract data', async () => {
        await repository.getNumberOfDappsForContract(toHash('bh1')).should.eventually.eq(1)
        await repository.getIdOfDappForContract(toHash('bh1'), 1).should.eventually.eq('dapp1')
        await repository.getIdOfLatestDappForContract(toHash('bh1')).should.eventually.eq('dapp1')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh1'), accounts[0]).should.eventually.eq('dapp1')
      })

      it('including publisher data', async () => {
        await repository.getNumberOfDappsByPublisher(accounts[1]).should.eventually.eq(0)
        await repository.getNumberOfDappsByPublisher(accounts[0]).should.eventually.eq(1)
        await repository.getIdOfDappByPublisher(accounts[0], 1).should.eventually.eq('dapp1')
      })
    })

    describe('updates internal state correctly after multiple calls', () => {
      beforeEach(async () => {
        await repository.publish('dapp1', toHash(['bh1', 'bh2']))
        await repository.publish('dapp2', toHash(['bh1', 'bh2']), { from: accounts[1] })
        await repository.publish('dapp3', toHash(['bh2']))
        await repository.publish('dapp4', toHash(['bh3', 'bh4']))
      })

      it('including dapp data', async () => {
        await repository.getNumberOfDapps().should.eventually.eq(4)

        await repository.getIdOfDapp(1).should.eventually.eq('dapp1')
        await repository.getIdOfDapp(2).should.eventually.eq('dapp2')
        await repository.getIdOfDapp(3).should.eventually.eq('dapp3')
        await repository.getIdOfDapp(4).should.eventually.eq('dapp4')

        await repository.getDapp('dapp1').should.eventually.matchObj({
          hostType_: 0,
          numContracts_: 2,
          publisher_: accounts[0],
        })
        await repository.getIdOfContractForDapp('dapp1', 1).should.eventually.eq(toHash('bh1'))
        await repository.getIdOfContractForDapp('dapp1', 2).should.eventually.eq(toHash('bh2'))

        await repository.getDapp('dapp2').should.eventually.matchObj({
          hostType_: 0,
          numContracts_: 2,
          publisher_: accounts[1],
        })
        await repository.getIdOfContractForDapp('dapp2', 1).should.eventually.eq(toHash('bh1'))
        await repository.getIdOfContractForDapp('dapp2', 2).should.eventually.eq(toHash('bh2'))

        await repository.getDapp('dapp3').should.eventually.matchObj({
          hostType_: 0,
          numContracts_: 1,
          publisher_: accounts[0],
        })
        await repository.getIdOfContractForDapp('dapp3', 1).should.eventually.eq(toHash('bh2'))

        await repository.getDapp('dapp4').should.eventually.matchObj({
          hostType_: 0,
          numContracts_: 2,
          publisher_: accounts[0],
        })
        await repository.getIdOfContractForDapp('dapp4', 1).should.eventually.eq(toHash('bh3'))
        await repository.getIdOfContractForDapp('dapp4', 2).should.eventually.eq(toHash('bh4'))
      })

      it('including contract data', async () => {
        await repository.getNumberOfDappsForContract(toHash('bh1')).should.eventually.eq(2)
        await repository.getIdOfDappForContract(toHash('bh1'), 1).should.eventually.eq('dapp1')
        await repository.getIdOfDappForContract(toHash('bh1'), 2).should.eventually.eq('dapp2')
        await repository.getIdOfLatestDappForContract(toHash('bh1')).should.eventually.eq('dapp2')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh1'), accounts[0]).should.eventually.eq('dapp1')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh1'), accounts[1]).should.eventually.eq('dapp2')

        await repository.getNumberOfDappsForContract(toHash('bh2')).should.eventually.eq(3)
        await repository.getIdOfDappForContract(toHash('bh2'), 1).should.eventually.eq('dapp1')
        await repository.getIdOfDappForContract(toHash('bh2'), 2).should.eventually.eq('dapp2')
        await repository.getIdOfDappForContract(toHash('bh2'), 3).should.eventually.eq('dapp3')
        await repository.getIdOfLatestDappForContract(toHash('bh2')).should.eventually.eq('dapp3')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh2'), accounts[0]).should.eventually.eq('dapp3')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh2'), accounts[1]).should.eventually.eq('dapp2')

        await repository.getNumberOfDappsForContract(toHash('bh3')).should.eventually.eq(1)
        await repository.getIdOfDappForContract(toHash('bh3'), 1).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContract(toHash('bh3')).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh3'), accounts[0]).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh3'), accounts[1]).should.eventually.eq('')

        await repository.getNumberOfDappsForContract(toHash('bh4')).should.eventually.eq(1)
        await repository.getIdOfDappForContract(toHash('bh4'), 1).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContract(toHash('bh4')).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh4'), accounts[0]).should.eventually.eq('dapp4')
        await repository.getIdOfLatestDappForContractByPublisher(toHash('bh4'), accounts[1]).should.eventually.eq('')
      })

      it('including publisher data', async () => {
        await repository.getNumberOfDappsByPublisher(accounts[0]).should.eventually.eq(3)
        await repository.getIdOfDappByPublisher(accounts[0], 1).should.eventually.eq('dapp1')
        await repository.getIdOfDappByPublisher(accounts[0], 2).should.eventually.eq('dapp3')
        await repository.getIdOfDappByPublisher(accounts[0], 3).should.eventually.eq('dapp4')

        await repository.getNumberOfDappsByPublisher(accounts[1]).should.eventually.eq(1)
        await repository.getIdOfDappByPublisher(accounts[1], 1).should.eventually.eq('dapp2')
      })
    })
  })
})
