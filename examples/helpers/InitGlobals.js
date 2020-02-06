const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const WindowMock = require('window-mock').default;

global.window = new WindowMock();

window = Object.assign(window, {
  XMLHttpRequest: XMLHttpRequest,
  encodeURIComponent: encodeURIComponent,
  addEventListener: () => {},
  location: { origin: 'https://engage-dev.vacd.biz' }
});
