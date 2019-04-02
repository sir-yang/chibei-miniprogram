let util = require('../../utils/util.js');
let common = require('../../utils/common.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        requestStatus: false,
        list: [],
        totalMoney: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.getCartList();
    },

    // 数据存储
    store(patch) {
        this.setData(patch);
    },

    // 获取订单列表
    getCartList() {
        let that = this;
        let url = '/api/shop/cart';
        util.httpRequest(url).then((res) => {
            if (res.err_code == 0) {
                let list = res.result.List;
                let totalMoney = 0;
                list.forEach((item) => {
                    if (item.Image.indexOf('https') === -1) {
                        item.Image = common.getStorage('serverurl') + item.Image;
                    }
                    totalMoney += Number(item.Price) * item.Amount;
                });
                that.store({
                    requestStatus: true,
                    list,
                    totalMoney
                });
            } else {
                common.showClickModal(res.err_msg);
            }
            wx.hideLoading();
        });
    },

    // 结算
    creatOrder() {
        wx.showLoading({
            title: '提交中...',
            mask: true
        });
        let that = this;
        let url = '/api/shop/createorder';
        util.httpRequest(url, {}, 'POST').then((res) => {
            if (res.err_code == 0) {
                // 调用支付
                that.payOrder(res.result.OrderNo);
            } else {
                wx.hideLoading();
                common.showClickModal(res.err_msg);
            }
        });
    },

    // 支付
    payOrder(orderNo) {
        let that = this;
        let url = '/api/shop/payorder';
        let data = {
            orderNo
        }
        // 微信支付
        util.httpRequest(url, data).then((res) => {
            console.log(res);
            wx.hideLoading();
            if (res.err_code == 0) {
                let data = res.result;
                wx.requestPayment({
                    'timeStamp': data.timeStamp,
                    'nonceStr': data.nonceStr,
                    'package': data.package,
                    'signType': data.signType,
                    'paySign': data.paySign,
                    'success': function (suc) {
                        wx.redirectTo({
                            url: '/pages/successOrder/successOrder'
                        });
                    },
                    'fail': function (err) {
                        console.log(err);
                        if (err.errMsg == 'requestPayment:fail cancel') {
                            common.showClickModal('支付取消');
                        } else {
                            common.showClickModal('支付失败');
                        }
                    }
                });
            } else {
                common.showClickModal(res.err_msg);
            }
        });
    }

})