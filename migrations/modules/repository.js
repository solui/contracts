const { createLog, deploy } = require('../../utils/functions')

export const deployRepository = async ({ deployer, artifacts, enableLogger }, settingsAddress) => {
  const log = createLog(enableLogger)

  log('Deploying RepositoryImpl ...')
  const RepositoryImpl = artifacts.require('./RepositoryImpl')
  const repositoryImpl = await deploy(deployer, RepositoryImpl)
  log(`... deployed at ${repositoryImpl.address}`)

  log('Deploying Repository ...')
  const Repository = artifacts.require('./Repository')
  const repository = await deploy(deployer, Repository, repositoryImpl.address)
  log(`... deployed at ${repository.address}`)

  return artifacts.require('./IRepository').at(repository.address)
}