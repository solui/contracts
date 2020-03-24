const { deployRepository } = require('./modules/repository')

module.exports = async deployer => {
  await deployRepository({ deployer, artifacts, enableLogger: true })
}
