"use strict";

const env = process.env.NODE_ENV || "development";
const config = require("../config/config")(env);
const whitelistedAttributes = new Set(config.defaults.filterableAttributes);

const isObject = o => Object.prototype.toString.call(o) === "[object Object]";
const isArray = o => Object.prototype.toString.call(o) === "[object Array]";

//filters an object with valid filters in the filterArray returns an Object
const objFilter = (obj, filterArray) => { 
	return filterArray.reduce((acc,curr) => {
	 if (obj[curr]) acc[curr] = obj[curr];
	 return acc;
 } , {});
};

//filters an array of objects with objFilter returns an Array
const arrFilter = (arr, filterArray) => { 
	return arr.map(obj => objFilter(obj,filterArray));
};

const requiresFilter = (request, response) => {
	const jsonResponse = response.jsonApiResponse;
	return (jsonResponse && request.query.filter && jsonResponse.status === 200);
};

const filterArray = request => {
	return request.query.filter.replace(/\s/g, "")
	 .toLowerCase()
	 .split(",")
	 .filter(e => whitelistedAttributes.has(e));
};


const postRequestFilter = (request, response, filteredArray) => {
	
	const resultData = response.jsonApiResponse.result;
	resultData.forEach(obj => {
		if (isObject(obj.result)) obj.result = objFilter(obj.result, filteredArray);
		else if (isArray(obj.result)) obj.result = arrFilter(obj.result, filteredArray);
	});
};



const filterMapper = {
	"/postcodes": postRequestFilter
};

const filterResponse = (request, response, next) => {
	if (!requiresFilter(request, response)) return next();
	const filteredArray = filterArray(request);
	const filter = filterMapper[request.route.path];
	
	if (filter) filter(request, response, filteredArray);
	return next();
};

module.exports = filterResponse;