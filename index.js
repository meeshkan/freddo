const got = require('got')
const assert = require('assert').strict

const freddo = url => new Test(url)

function Test(url) {
	this.dataObj = {
		url,
		body: {},
		headers: {},
		statusCode: null,
		error: null
	}
	this.promise = Promise.resolve(null)
	this.request()
}

Test.prototype.extend = function(promise, that) {
    for (const key in that) {
        promise[key] = that[key]
    }
}

Test.prototype.next = function(what) {
    this.promise = this.promise.then(what)
    this.extend(this.promise, this)
    return this.promise
}

Test.prototype.request = function() {
    return this.next(async () => {
        let response = await got(this.dataObj.url)
        this.dataObj.headers = response.headers
        this.dataObj.body = response.body
        this.dataObj.statusCode = response.statusCode
        return true
    })
}

Test.prototype.verify = async function(key, expected, isHeader) {
    let check = expected
    let value
    if (isHeader) {
        value = this.dataObj.headers[key]
    } else {
        value = this.dataObj[key]
    }
    if (typeof value === 'undefined') {
        throw new Error(`Key ${JSON.stringify(key)} does not exist`)
    }
    const location = `key ${JSON.stringify(key)}`
    if (typeof expected !== 'function') {
        check = (actual, location) => {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (e) {
                return {
                    result: false,
                    error: `Expected ${location} to be ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
                }
            }
            return true
        }
    }
    let result = check(value, location)
    let error = `Custom assertion failed: ${check}`
    if (typeof result !== 'boolean') {
        if (typeof result.result === 'undefined') {
            throw new Error('Custom assertion functions must return a boolean or a {result, error} object')
        }
        if (typeof result.error !== 'undefined') {
            error = result.error
        }
        result = result.result
    }
    if (!result) {
        this.dataObj.error = error
    }
    return result
}

Test.prototype.expect = function(key, expected, isHeader = false) {
    return this.next((prev) => prev && this.verify(key, expected, isHeader))
}