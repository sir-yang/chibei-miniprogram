let util = require('../../utils/util.js');
let common = require('../../utils/common.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        requestStatus: false,
        list: [],
        hasmore: true //更多数据
    },

    state: {
        page: 1,
        pageOnShow: false,
        isOnReachBottom: true,
        isonPullDownRefresh: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.getRecordData(1);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        this.state.isonPullDownRefresh = true;
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.state.page = 1;
        this.getRecordData(1);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        if (this.state.isonPullDownRefresh) return;
        if (!this.state.isOnReachBottom) return;
        if (!this.data.hasmore) return;
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.getRecordData(this.state.page);
        this.state.isOnReachBottom = false;
    },

    // 获取数据列表
    getRecordData(page) {
        let that = this;
        let url = '/api/shop/orderlist';
        let data = {
            page
        }
        util.httpRequest(url, data).then((res) => {
            wx.hideLoading();
            wx.stopPullDownRefresh();
            if (res.err_code === 0) {
                let list = that.data.list;
                let hasmore = that.data.hasmore;
                if (page > 1) {
                    list = list.concat(res.result.List);
                } else {
                    list = res.result.List;
                }
                if (res.result.Pager.CurrentPage == res.result.Pager.NextPage) {
                    hasmore = false;
                } else {
                    hasmore = true;
                }
                that.setData({
                    requestStatus: true,
                    list,
                    hasmore
                })
                that.state.pageOnShow = true;
                that.state.isOnReachBottom = true;
                that.state.isonPullDownRefresh = false;
                that.state.page = res.result.Pager.NextPage;
            } else {
                common.showClickModal(res.err_msg);
            }
        })
    }
})