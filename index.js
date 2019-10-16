const freddo = url => new Test(url)

function Test(url) {
	this.dataObj = {
		url,
		body: {},
		headers: {},
		statusCode: null,
		error: null
	}
}