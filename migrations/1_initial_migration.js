const Migrations = artifacts.require("Migrations")

const { deployRepository } = require('./modules/repository')

module.exports = async deployer => {
  await deployer.deploy(Migrations)
  await deployRepository({ deployer, artifacts, enableLogger: true })
}
