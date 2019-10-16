const sinon = require('sinon')

const clearModuleCache = module => delete require.cache[require.resolve(module)]

module.exports = clearModuleCache