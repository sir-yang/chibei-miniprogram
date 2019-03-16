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
        common.authInfo(that, (status) => {
            that.setData({
                role: options.role,
                hasLoading: common.getStorage("hasLoading")
            });
        });
    },

    // 申请授权
    getAuth() {
        let that = this;
        let url = '/api/auth/putin';
        let deviceId = common.getStorage('deviceId');
        util.httpRequest(url, {
            deviceId: deviceId
        }, 'POST').then((res) => {
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
                // that.setData({
                //     err_msg: res.err_msg
                // });
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
                // wx.showLoading({
                //     title: '绑定中...',
                //     mask: true
                // });
                // let bindcode = common.getStorage('bindcode');
                // let vals = {
                //     code: bindcode,
                //     nickName: detail.userInfo.nickName,
                //     headImg: detail.userInfo.avatarUrl
                // };

                this.staffBind();
            }
        }
    },

    // 配送员信息绑定
    staffBind() {
        let that = this;
        let url = '/api/staff/bind';
        let bindcode = common.getStorage('bindcode');
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