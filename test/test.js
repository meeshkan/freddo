import * as t from 'ava'
const { clearModuleCache, stubModule } = require('./runkit')

const clearFreddoCache = () => clearModuleCache('../index')
const stubGot = (returnsVal) => stubModule('got', returnsVal)

let freddo, expr, exists

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

t('redirectsTo', async t => {
    clearFreddoCache()
    stubGot({
        headers: { location: 'http://www.example.org/' }, 
        statusCode: 301,
        body: {}
    })
    ;({ freddo } = require('../index'))
	t.is(await freddo().redirectsTo('http://www.example.org/'), true)
})

t('invalid key', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: '',
        body: { foo: 'bar' }
    })
    ;({ freddo } = require('../index'))
	const error = await t.throwsAsync(async () => {
		await freddo().expect('does-not-exist', '')
	})
    t.is(error.message, 'Key "does-not-exist" does not exist')
})

t('no match without ensure', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: '',
        body: { foo: 'bar' }
    })
    ;({ freddo } = require('../index'))
	t.is(await freddo().expect('body', {'foo': 'unicorn'}), false)
})

t('expr', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: '',
        body: { foo: 'bar' }
    })
    ;({ freddo, expr } = require('../index'))
	t.is(await freddo().expect(expr('.foo'), ([x]) => x == 'bar'), true)
})

t('exists', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: 200,
        body: { foo: 'bar' }
    })
    ;({ freddo, expr, exists } = require('../index'))
	t.is(await freddo().body(exists, expr('.foo')), true)
})

t('pass function as expected value', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: 404,
        body: {}
    })
    ;({ freddo } = require('../index'))
    t.is(await freddo().expect('statusCode', (x) => x == 404), true)
})

t('pass function that returns boolean and error message', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: null,
        body: {}
    })
    ;({ freddo } = require('../index'))
    const error = await t.throwsAsync(async () => {
		await freddo()
            .expect('statusCode', () => {
                return {
                    result: false,
                    error: 'Some custom error message'
                }
            })
            .ensure()
	})
    t.is(error.message, 'Some custom error message')
})

t('pass function that does not return boolean', async t => {
    clearFreddoCache()
    stubGot({
        headers: {},
        statusCode: 404,
        body: {}
    })
    ;({ freddo } = require('../index'))
    const error = await t.throwsAsync(async () => {
		await freddo()
            .expect('statusCode', (x) => 'unicorn')
            .ensure()
	})
    t.is(error.message, 'Custom assertion functions must return a boolean or a {result, error} object')
})