import * as t from 'ava'
const { clearModuleCache, stubModule } = require('./runkit')

const clearFreddoCache = () => clearModuleCache('../index')
const stubGot = (returnsVal) => stubModule('got', returnsVal)

let freddo, expr, toExist

t('body', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: '',
        body: { foo: 'bar' }
    })
    ;({ freddo } = require('../index'))
	t.is(await freddo().body({'foo': 'bar'}), true)
})

t('body with no match', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: '',
        body: { foo: 'bar' }
    })
    ;({ freddo } = require('../index'))
	const error = await t.throwsAsync(async () => { 
		await freddo()
			.expect('body', {'foo': 'unicorn'})
            .ensure()
    })
	t.is(error.message, 'Expected key "body" to be {"foo":"unicorn"}, but got {"foo":"bar"}')
})

t('status code', async t => {
    clearFreddoCache()
    stubGot({
        headers: {}, 
        statusCode: 200, 
        body: {}
    })
    ;({ freddo } = require('../index'))
	t.is(await freddo().status(200), true)
})

t('headers', async t => {
    clearFreddoCache()
    stubGot({
        headers: { 'content-type': 'application/json' },
    	statusCode: '',
        body: {}
    })
    ;({ freddo } = require('../index'))
	t.is(await freddo().header('content-type', 'application/json'), true)
})