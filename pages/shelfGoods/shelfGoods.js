let util = require('../../utils/util.js');
let common = require('../../utils/common.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        requestStatus: false,
        recycle: 'hide',
        deviceId: '',
        orderdetail: ''
    },

    state: {
        options: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.state.options = options;
        wx.showLoading({
            title: '加载中...',
            mask: true
        })
        if (options.hasOwnProperty('deviceId')) {
            this.setData({
                deviceId: options.deviceId
            })
        }
        this.getorderdetail();
    },

    // 事件处理
    recycleGoodsEvent(event) {
        let dataset = event.currentTarget.dataset;
        if (dataset.types === 'recycle') {
            this.setData({
                recycle: 'show'
            })
        } else if (dataset.types === 'sureRecycle') {
            let vals = event.detail.value;
            console.log(vals);
            this.requestRecycle(vals);
        } else if (dataset.types === 'close') { //关闭回收弹框
            this.setData({
                recycle: 'hide'
            })
        }
    },

    // 货柜清单
    getorderdetail(opt) {
        let that = this;
        let url = '/api/staff/getorderdetail';
        let options = that.state.options;
        let data = {};
        if (options && options.hasOwnProperty('deviceId')) {
            data.deviceId = options.deviceId;
        }
        util.httpRequest(url, data).then((res) => {
            wx.hideLoading();
            if (res.err_code == 0) {
                that.setData({
                    requestStatus: true,
                    orderdetail: res.result
                })
            } else {
                common.showClickModal(res.err_msg);
            }
        })
    },

    // 货柜回收
    requestRecycle(vals) {
        let that = this;
        wx.showLoading({
            title: '',
            mask: true
        })
        let token = common.getStorage('token');
        let deviceId = common.getStorage('deviceId');
        wx.request({
            url: wx.getStorageSync("serverurl") + '/api/staff/recycle',
            header: {
                'AccessToken': token ? token : '',
                'DeviceID': (deviceId || deviceId == 0) ? deviceId : "",
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: JSON.stringify(vals),
            method: 'POST',
            success: function(res) {
                res = res.data;
                if (res.err_code == 0) {
                    common.showClickModal('货柜回收成功');
                    that.setData({
                        recycle: 'hide'
                    })
                    wx.showModal({
                        title: '提示',
                        content: '货柜回收成功',
                        showCancel: false,
                        success() {
                            wx.navigateBack({});
                        }
                    })
                } else {
                    common.showClickModal(res.err_msg);
                }
            },
            fail: function(res) {
                common.showClickModal('请求失败');
            }
        })
    }

})