const got = require('got')

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