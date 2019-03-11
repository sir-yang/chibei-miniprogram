
Page({

    /**
     * 页面的初始数据
     */
    data: {
        list: []
    },

    state: {
        page: 1,
        hasmore: true,
        pageOnShow: false,
        isOnReachBottom: true,
        isonPullDownRefresh: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

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
        // this.getGoodsList(1);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        if (this.state.isonPullDownRefresh) return;
        if (!this.state.isOnReachBottom) return;
        if (!this.state.hasmore) return;
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        // this.getGoodsList(this.state.page);
        this.state.isOnReachBottom = false;
    },

    // 获取数据列表
    getRecordData() {
        let that = this;

    },

    // 查看详情
    viewDetail(event) {
        let id = event.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/recordDetail/recordDetail'
        })
    }
})