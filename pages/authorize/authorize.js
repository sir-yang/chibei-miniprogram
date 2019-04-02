let util = require('../../utils/util.js');
let common = require('../../utils/common.js');
const app = getApp();


Page({

    /**
     * 页面的初始数据
     */
    data: {
        authALter: false,
        err_msg: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let that = this;
        common.authInfo(that, (status) => {
            that.setData({
                role: options.role
            });
        });
    },

    // 申请授权
    getAuth() {
        let that = this;
        let url = '/api/auth/putin';
        let deviceId = app.globalData.deviceId;
        wx.showLoading({
            title: '',
            mask: true
        })
        util.httpRequest(url, {
            deviceId: deviceId
        }, 'POST').then((res) => {
            if (res.err_code == 0) {
                wx.hideLoading();
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
            }
        });
    },


    // 获取用户信息 回调
    userInfoHandler(event) {
        if (this.data.role === 'user') {//用户信息绑定
            common.userInfoBind(this, event);
        } else {//员工信息绑定
            let detail = event.detail;
            if (detail.hasOwnProperty('userInfo')) {
                this.staffBind();
            }
        }
    },

    // 配送员信息绑定
    staffBind() {
        let that = this;
        let url = '/api/staff/bind';
        let bindcode = app.globalData.bindcode;
        let data = {
            code: bindcode
        }
        wx.showLoading({
            title: '绑定中...',
            mask: true
        });
        util.httpRequest(url, data, 'POST').then((res) => {
            wx.hideLoading();
            if (res.err_code == 0) {
                that.setData({
                    authALter: false
                })
                common.showClickModal('配送员绑定成功');
                //重新获取信息
                common.getPersonInfo().then(() => { });
            } else {
                common.showClickModal(res.err_msg);
            }
        });
    }
})