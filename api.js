/* api stub — 只返回本地 mock，不发起任何真实网络请求 */
window.API = {
  getProfile: function () {
    return Promise.resolve(window.MOCK.profile);
  }
};
