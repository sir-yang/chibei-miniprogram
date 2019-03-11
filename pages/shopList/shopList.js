let util = require('../../utils/util.js');
let common = require('../../utils/common.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        cartTk: 'hide',
        list: [],
        cartList: [],
        cartNum: 0,
        totalMoney: 0
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
    onLoad(options) {
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.getCartList('load');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        if (!this.state.pageOnShow) return;
        this.getCartList('load');
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.state.isonPullDownRefresh = true;
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.state.page = 1;
        this.getGoodsList(1);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        if (this.state.isonPullDownRefresh) return;
        if (!this.state.isOnReachBottom) return;
        if (!this.state.hasmore) return;
        wx.showLoading({
            title: '加载中...',
            mask: true
        });
        this.getGoodsList(this.state.page);
        this.state.isOnReachBottom = false;
    },

    // 数据存储
    store(patch) {
        this.setData(patch);
    },

    // 事件处理
    shopEven(event) {
        let dataset = event.currentTarget.dataset;
        if (dataset.types == 'cart'){
            let cartTk = this.data.cartTk;
            cartTk = cartTk == 'show' ? 'hide' : 'show';
            if (cartTk == 'show') {
                this.getCartList('cart');
            }
            if (this.data.cartList.length == 0) {
                cartTk = 'hide';
            }
            this.store({
                cartTk
            });
        } else if (dataset.types == 'empty') {//清空购物车
            this.clearCart();
        } else if (dataset.types == 'pay') {
            if (this.data.cartNum > 0) {
                wx.navigateTo({
                    url: '/pages/submitOrder/submitOrder'
                });
            } else {
                common.showClickModal('亲，购物车空空如也！');
            }
        }
    },

    // 加减商品数量
    addLessNum(event) {
        let that = this;
        let list = that.data.list;
        let shopList = that.data.list;
        let dataset = event.currentTarget.dataset;
        wx.showLoading({
            title: '',
            mask: true
        });
        if (dataset.types == 'add') {
            console.log('添加');
            if (dataset.option == 'cart') {
                list = that.data.cartList;
                shopList.forEach((item) => {
                    if (list[dataset.index].GoodsSkuID == item.GoodsSkuID) {
                        item.num += 1;
                    }
                });
                list[dataset.index].Amount += 1;
            } else {
                list[dataset.index].num += 1;
            }
            let patch =  {
                skuId: list[dataset.index].GoodsSkuID,
                amount: dataset.option == 'cart' ? list[dataset.index].Amount : list[dataset.index].num
            }
            this.cartPatch('add', patch, shopList);
        } else {
            console.log('减少');
            if (dataset.option == 'cart') {
                list = that.data.cartList;
                shopList.forEach((item) => {
                    if (list[dataset.index].GoodsSkuID == item.GoodsSkuID) {
                        item.num -= 1;
                    }
                });
                list[dataset.index].Amount -= 1;
            } else {
                list[dataset.index].num -= 1;
            }
            let patch = {
                skuId: list[dataset.index].GoodsSkuID,
                amount: dataset.option == 'cart' ? list[dataset.index].Amount : list[dataset.index].num
            }
            this.cartPatch('less', patch, shopList);
        }
    },

    // 获取商品列表
    getGoodsList(page) {
        let that = this;
        let cartList = that.data.cartList;
        let url = '/api/shop/goods';
        let data = {
            page
        }
        util.httpRequest(url, data).then((res) => {
            if (res.err_code == 0) {
                let list = that.data.list;
                if (that.state.page > 1) {
                    list = list.concat(res.result.List);
                } else {
                    list = res.result.List;
                }

                list.forEach((item)=> {
                    item.num = 0;
                    if (item.Image.indexOf('https') === -1) {
                        item.Image = common.getStorage('serverurl') + item.Image;
                    }
                    cartList.forEach((cart) => {
                        if (cart.GoodsSkuID == item.GoodsSkuID) {
                            item.num = cart.Amount;
                        }
                    });
                });

                that.setData({
                    list
                });
                that.state.pageOnShow = true;
                that.state.page = res.result.Pager.NextPage;
            } else {
                common.showClickModal(res.err_msg);
            }
            wx.hideLoading();
        });
    },

    // 购物车列表
    getCartList(types) {
        let that = this;
        let url = '/api/shop/cart';
        util.httpRequest(url).then((res) => {
            if (res.err_code == 0) {
                console.log('cartList', res.result);
                if(res.result.List.length == 0 && types == 'cart') {
                    common.showClickModal('亲，购物车空空如也！');
                }
                let total = that.getcartNum(res.result.List);
                let cartNum = total.totalNum;
                let totalMoney = total.totalMoney;
                that.store({
                    cartNum,
                    totalMoney,
                    cartList: res.result.List
                });
                if (types == 'load') {
                    that.getGoodsList(1);
                }
            } else {
                common.showClickModal(res.err_msg);
            }
        });
    },

    // 购物车操作
    cartPatch(types, data, shopList) {
        let that = this;
        let url = '/api/shop/cart/patch';
        util.httpRequest(url, data, 'POST').then((res) => {
            if (res.err_code == 0) {
                let total = that.getcartNum(res.result.List);
                let cartNum = total.totalNum;
                let totalMoney = total.totalMoney;
                that.store({
                    cartNum, 
                    totalMoney,
                    cartList: res.result.List,
                    list: shopList
                });
            } else {
                common.showClickModal(res.err_msg);
            }
            wx.hideLoading();
        });
    },

    // 清空购物车
    clearCart() {
        let that = this;
        let url = '/api/shop/cart/clear';
        util.httpRequest(url, {}, 'POST').then((res) => {
            if (res.err_code == 0) {
                let list = that.data.list;
                list.forEach((item) => {
                    item.num = 0;
                });
                that.store({
                    list,
                    cartList: [],
                    cartNum: 0,
                    totalMoney: 0,
                    cartTk: 'hide'
                });
            } else {
                common.showClickModal(res.err_msg);
            }
        });
    },
    
    // 获取购物车数量   
    getcartNum(list) {
        let totalNum = 0;
        let totalMoney = 0;
        list.forEach((item) => {
            totalNum += Number(item.Amount);
            totalMoney += Number(item.Price) * item.Amount;
        });
        return {
            totalNum,
            totalMoney
        };
    },

    // 购买记录
    buyRecord() {
        wx.navigateTo({
            url: '/pages/buyRecord/buyRecord'
        })
    }
})