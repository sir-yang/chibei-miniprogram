import 'utils/wx-pro.js';

let util = require('utils/util.js');
let common = require('utils/common.js');

App({
    checkToken: false,
    onLaunch(options) {
        console.log(options);
        wx.setStorageSync("serverurl", "https://buyadd.miniprogramadmin.com");
        if (wx.getStorageSync('bindcode')) {
            wx.removeStorageSync('bindcode');
        }
        
        if (options.hasOwnProperty('query')) {
            if (options.query.hasOwnProperty('deviceId')) {
                common.setStorage("deviceId", options.query.deviceId);
                
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
                        console.log(err);
                        if (err.errCode == 10001) {
                            common.showClickModal('手机蓝牙功能不可用');
                        }
                    }
                })
            } else {//配送员
                common.setStorage("deviceId", "0");
                common.setStorage("bindcode", options.query.bindcode);
                // common.setStorage("bindcode", '1T8h2F5v');
            }
        }
    },

    onShow(options) {
        let that = this;
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

        // 获取个人信息
        common.getPersonInfo().then(() => {});
    },

    globalData: {
        commonFun: common,
        utilFun: util
    }
});