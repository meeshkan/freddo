const sinon = require('sinon')

const clearModuleCache = module => delete require.cache[require.resolve(module)]

const stubModule = async (module, returnVal) => {
	clearModuleCache(module)
	require.cache[require.resolve(module)] = {
		exports: sinon.stub().returns(returnVal)
	}
}

module.exports = {
	clearModuleCache,
	stubModule
}
