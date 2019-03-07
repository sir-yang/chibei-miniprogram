let util = require('../../utils/util.js');
let common = require('../../utils/common.js');


Page({

    /**
     * 页面的初始数据
     */
    data: {
        hasLoading: false,
        authALter: false,
        err_msg: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let that = this;
        let token = common.getAccessToken();
        if (token) {
            common.authInfo(that, (status) => {
                that.setData({
                    hasLoading: common.getStorage("hasLoading")
                });
            });
        } else {
            getApp().globalData.tokenUpdated = function () {
                console.log('update success');
                common.authInfo(that, (status) => {
                    that.setData({
                        hasLoading: common.getStorage("hasLoading")
                    });
                });
            }
        }
    },

    // 申请授权
    getAuth () {
        let that = this;
        let url = '/api/auth/putin';
        let deviceId = common.getStorage('deviceId');
        util.httpRequest(url, { deviceId: deviceId }, 'POST').then((res) => {
            if (res.err_code == 0) {
                console.log(res);
                wx.showModal({
                    title: '提示',
                    content: '申请授权成功，等待管理员审核',
                    showCancel: false,
                    success() {
                        wx.reLaunch({
                            url: '/pages/index/index?scan=true'
                        });
                    }
                });
            } else {
                common.showClickModal(res.err_msg);
                that.setData({
                    err_msg: res.err_msg
                });
            }
        });
    },


    // 获取用户信息 回调
    userInfoHandler(event) {
        common.userInfoBind(this, event);
    },
})