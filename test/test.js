import {serial as test} from 'ava'
const {clearModuleCache, stubModule} = require('./runkit')

const clearFreddoCache = () => clearModuleCache('..')
const stubGot = returnsVal => stubModule('got', returnsVal)

let freddo
let expr
let exists

test.beforeEach(clearFreddoCache)

test('body', async t => {
	stubGot({
		headers: {},
		statusCode: '',
		body: {foo: 'bar'}
	});
	({freddo} = require('..'))
	t.is(await freddo().body({foo: 'bar'}), true)
})

test('body with no match', async t => {
	stubGot({
		headers: {},
		statusCode: '',
		body: {foo: 'bar'}
	});
	({freddo} = require('..'))
	const error = await t.throwsAsync(async () => {
		await freddo()
			.expect('body', {foo: 'unicorn'})
			.ensure()
	})
	t.is(error.message, 'Expected key "body" to be {"foo":"unicorn"}, but got {"foo":"bar"}')
})

test('status code', async t => {
	stubGot({
		headers: {},
		statusCode: 200,
		body: {}
	});
	({freddo} = require('..'))
	t.is(await freddo().status(200), true)
})

test('headers', async t => {
	stubGot({
		headers: {'content-type': 'application/json'},
		statusCode: '',
		body: {}
	});
	({freddo} = require('..'))
	t.is(await freddo().header('content-type', 'application/json'), true)
})

test('redirectsTo', async t => {
	stubGot({
		headers: {location: 'http://www.example.org/'},
		statusCode: 301,
		body: {}
	});
	({freddo} = require('..'))
	t.is(await freddo().redirectsTo('http://www.example.org/'), true)
})

test('invalid key', async t => {
	stubGot({
		headers: {},
		statusCode: '',
		body: {foo: 'bar'}
	});
	({freddo} = require('..'))
	const error = await t.throwsAsync(async () => {
		await freddo().expect('does-not-exist', '')
	})
	t.is(error.message, 'Key "does-not-exist" does not exist')
})

test('no match without ensure', async t => {
	stubGot({
		headers: {},
		statusCode: '',
		body: {foo: 'bar'}
	});
	({freddo} = require('..'))
	t.is(await freddo().expect('body', {foo: 'unicorn'}), false)
})

test('expr', async t => {
	stubGot({
		headers: {},
		statusCode: '',
		body: {foo: 'bar'}
	});
	({freddo, expr} = require('..'))
	t.is(await freddo().expect(expr('.foo'), ([x]) => x === 'bar'), true)
})

test('exists', async t => {
	stubGot({
		headers: {},
		statusCode: 200,
		body: {foo: 'bar'}
	});
	({freddo, expr, exists} = require('..'))
	t.is(await freddo().body(exists, expr('.foo')), true)
})

test('pass function as expected value', async t => {
	stubGot({
		headers: {},
		statusCode: 404,
		body: {}
	});
	({freddo} = require('..'))
	t.is(await freddo().expect('statusCode', x => x === 404), true)
})

test('pass function that returns boolean and error message', async t => {
	stubGot({
		headers: {},
		statusCode: null,
		body: {}
	});
	({freddo} = require('..'))
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

test('pass function that does not return boolean', async t => {
	stubGot({
		headers: {},
		statusCode: 404,
		body: {}
	});
	({freddo} = require('..'))
	const error = await t.throwsAsync(async () => {
		await freddo()
			.expect('statusCode', _ => 'unicorn')
			.ensure()
	})
	t.is(error.message, 'Custom assertion functions must return a boolean or a {result, error} object')
})
