import * as t from 'ava'
const { clearModuleCache, stubModule } = require('./runkit')

const clearFreddoCache = () => clearModuleCache('../index')
const stubGot = (returnsVal) => stubModule('got', returnsVal)