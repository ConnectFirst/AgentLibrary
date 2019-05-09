function HttpService(apiBase) {
  this.XMLHttpRequest = window.XMLHttpRequest;
  this.encodeURIComponent = window.encodeURIComponent;

  // Set the apiBase value based on .env file.
  this.apiBase = apiBase || "http://localhost:81";

  var that = this;

  /**
   * Makes a GET request to Engage Auth.
   *
   * @param {string} path - Relative path to append to apiUrl.
   * @param {Object} config - Object describing different properties of the request.
   * @returns {Promise} Promise that represents status of the request. Resolves if server responds with 200 status code, and is rejected otherwise.
   */
  this.httpGet = function (path, config) {
    return new Promise(function(resolve, reject) {
      var req = new that.XMLHttpRequest();
      var queryParams = "";
      if(config.queryParams) {
        queryParams = "?" + _getUriEncodedParams(config.queryParams);
      }
      req.open("GET", that.apiBase + path + queryParams);
      _addHeaders(config, req);
      _addCompletionListeners(resolve, reject, req);
      req.send();
    });
  };


  /**
   * Makes a GET request to Engage Auth.
   *
   * @param {string} path - Relative path to append to apiUrl.
   * @param {Object} config - Object describing different properties of the request.
   * @returns {Promise} Promise that represents status of the request. Resolves if server responds with 200 status code, and is rejected otherwise.
   */
  this.httpPost = function (path, config) {
    return new Promise(function(resolve, reject) {
      var req = new that.XMLHttpRequest();
      var queryParams = "";
      if(config.queryParams) {
        queryParams = "?" + _getUriEncodedParams(config.queryParams);
      }
      req.open("POST", that.apiBase + path + queryParams);
      _addHeaders(config, req);
      _addCompletionListeners(resolve, reject, req);
      req.send(_getUriEncodedBody(config));
    });
  };

  /**
   * Utility method used to check if an argument is actually an object.
   *
   * @param {*} obj
   */
  function _isObj(obj) {
    return typeof obj === "object" && obj !== null;
  }


  /**
   * Adds headers to XMLHttpRequest based on configuration object.
   *
   * @param {Object} config - Config object passed to HttpService methods.
   * @param {XMLHttpRequest} req - Instance of XMLHttpRequest that needs to be configured.
   */
  function _addHeaders(config, req) {
    if (!_isObj(config)) {
      return;
    }

    var headers = config.headers;

    if (!_isObj(headers)) {
      return;
    }

    for(var key in headers){
      req.setRequestHeader(key, headers[key]);
    }
  }


  /**
   * Configures an XMLHttpRequest object to properly resolve/reject a promise, depending on the outcome of the request.
   *
   * @param {Function} resolve - Resolve callback function from a promise. Invoked if the request completed successfully.
   * @param {Function} reject - Reject callback function from a promise. Invoked if the request failed.
   * @param {XMLHttpRequest} req - Instance of XMLHttpRequest that will be configured.
   */
  function _addCompletionListeners(resolve, reject, req) {
    req.addEventListener("error", function(e) {
      reject(e);
    });
    req.addEventListener("timeout", function() {
      reject(new Error("request timeout"));
    });
    req.addEventListener("load", function() {
      if (this.status !== 200) {
        reject({
          status: this.status,
          response: this.responseText
        });
      } else {
        resolve({
          status: this.status,
          response: this.responseText
        });
      }
    });
  }


  /**
   * Takes a config object and serializes/URI encodes the contents of the body property. If the "Content-Type" header is set
   * to "application/json", it encodes the payload as JSON. Otherwise, we assume that the payload should be x-www-form-urlencoded.
   */
  function _getUriEncodedBody (config) {
    var contentType =
        config && config.headers && config.headers["Content-Type"];
    var body = (config && config.body) || "";

    if (contentType === "application/json") {
      body = JSON.stringify(body);
    } else {
      if (_isObj(body)) {
        body =  _getUriEncodedParams(body);
      }
    }

    return body;
  }

  function _getUriEncodedParams(params){
    if (!_isObj(params)) {
      return;
    }

    return Object
        .keys(params)
        .map(function(key) {
          return encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
        })
        .join("&")
  }
}





