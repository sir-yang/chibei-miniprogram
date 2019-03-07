import 'utils/wx-pro.js';

let util = require('utils/util.js');
let common = require('utils/common.js');

App({
    checkToken: false,
    onLaunch(options) {
        if (options.hasOwnProperty('query')) {
            common.setStorage("deviceId", options.query.deviceId);
        }

        wx.setStorageSync("serverurl", "https://buyadd.miniprogramadmin.com");

        // 检测蓝牙是否开启
        wx.openBluetoothAdapter({
            success(res) {
                console.log(res);
                //监听蓝牙适配器状态
                wx.onBluetoothAdapterStateChange(function (res) {
                    console.log('监听状态');
                })
            },
            fail(err) {
                if (err.errCode == 10001) {
                    common.showClickModal('手机蓝牙功能不可用');
                }
            }
        })
    },

    onShow(options) {
        let that = this;
        wx.pro.checkSession().then(() => {
            let token = common.getAccessToken();
            if (!token) {
                console.log('no token');
            } else if (that.checkToken) {
                that.checkToken = false;
            }
            that.refresh(options);
        }).catch((_e) => {
            that.refresh(options);
        });

        wx.getSystemInfo({
            success(res) {
                let SDKVersion = res.SDKVersion;
                if (SDKVersion == '1.0.0' || SDKVersion == '1.0.1' || SDKVersion == undefined) {
                    wx.showModal({
                        title: '提示',
                        content: '当前微信版本过低，请升级至高版本',
                        showCancel: false
                    });
                }
            }
        });
    },

    // 刷新token
    refresh(_options) {
        let that = this;
        common.getToken().then((_res) => {
            common.getPersonInfo().then((info) => {
                getApp().globalData.tokenUpdated();
            });
        });
    },

    globalData: {
        commonFun: common,
        utilFun: util,
        tokenUpdated: null
    }
});