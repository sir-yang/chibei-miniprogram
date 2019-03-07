// pages/successOrder/successOrder.js
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    // 继续购买
    carryPay() {
        wx.redirectTo({
            url: '/pages/shopList/shopList'
        });
    }
})