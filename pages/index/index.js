//获取应用实例
const app = getApp()
let util = app.globalData.utilFun;
let common = app.globalData.commonFun;

Page({
    data: {
        err_msg: '',
        requestStatus: false,
        openLoading: 'hide',
        isShowScan: false
    },

    state: {
        platform: 'ios',
        deviceId:'',
        serviceId:'0000FEE7-0000-1000-8000-00805F9B34FB',
        uuid:{
          notify:'000036F6-0000-1000-8000-00805F9B34FB',
          write:'000036F5-0000-1000-8000-00805F9B34FB'
        }
    },

    lock: {
        mac: ''
    },

    onLoad(options) {
        let that = this;
        let deviceId = common.getStorage('deviceId');
        if (deviceId) {
            that.state.deviceId = deviceId;
        }

        // 判断是否跳转 显示扫码
        if (options.hasOwnProperty('scan')) {
            that.setData({
                isShowScan: true
            })
        }
        
        wx.showLoading({
            title: '加载中...',
        });

        wx.getSystemInfo({
            success(res) {
                that.state.platform = res.platform;
            }
        });
        that.getAuth();
    },

    //找到设备
    getBluetoothDevices() {
        var that = this;
        setTimeout(() => {
            wx.getBluetoothDevices({
                services: ['0000fee7-0000-1000-8000-00805f9b34fb'],
                allowDuplicatesKey: false,
                interval: 0,
                success: function(res) {
                    console.log(res);
                    if (res.devices.length > 0) {
                        for (let i = 0; i < res.devices.length; i++) {
                            var key = common.ab2hex(res.devices[i].advertisData);
                            let maca = that.lock.mac.replace(/:/g, "").toLowerCase()
                            if (key.indexOf(maca) != -1) {
                                console.log(2);
                                that.state.deviceId = res.devices[i].deviceId;
                                common.connectTO(that, res.devices[i].deviceId);
                                wx.hideLoading();
                                // 停止搜索
                                wx.stopBluetoothDevicesDiscovery({
                                    success: function(res) {},
                                })
                            }
                        };
                    } else {
                        console.log("没有找到可用蓝牙锁");
                    }
                },
                fail(res) {
                    console.log(res, '获取蓝牙设备列表失败=====')
                }
            })
        }, 2000)
    },


    //发现设备
    startBluetoothDevicesDiscovery() {
        var that = this;
        setTimeout(() => {
            wx.startBluetoothDevicesDiscovery({
                services: ['0000fee7-0000-1000-8000-00805f9b34fb'],
                success: function(res) {
                    console.log(res);
                    that.getBluetoothDevices();
                },
                fail(res) {
                    console.log('搜索设备失败', res);
                }
            })
        }, 1000)
    },

    //获取授权
    getAuth() {
        let that = this;
        let deviceId = that.state.deviceId;
        if (deviceId) {
            let url = '/api/auth/verify';
            util.httpRequest(url, {
                deviceId
            }).then((res) => {
                wx.hideLoading();
                if (res.err_code == 0) {
                    // 显示开锁加载框
                    that.setData({
                        openLoading: 'show'
                    })
                    let MacAddress = res.result.MacAddress;
                    that.lock.mac = res.result.MacAddress;
                    //苹果手机需要先执行搜索并匹配
                    if (that.state.platform == 'ios') {
                        wx.openBluetoothAdapter({
                            success: function(res) {
                                that.startBluetoothDevicesDiscovery();
                            },
                            fail: function(err) {
                                console.log('初始化适配器失败', err);
                            }
                        })
                    } else {
                        //安卓手机直接连
                        that.state.deviceId = MacAddress;
                        common.connectTO(that);
                    }
                } else if (res.err_code == 4011) {
                    wx.showModal({
                        title: '提示',
                        content: res.err_msg,
                        showCancel: false,
                        success() {
                            wx.reLaunch({
                                url: '/pages/authorize/authorize'
                            });
                        }
                    });
                    that.setData({
                        requestStatus: true,
                        err_msg: res.err_msg
                    })
                } else {
                    common.showClickModal(res.err_msg);
                    that.setData({
                        requestStatus: true,
                        err_msg: res.err_msg
                    })
                }
            });
        } else {
            wx.hideLoading();
            that.setData({
                requestStatus: true,
                isShowScan: true
            })
        }
    },

    // 显示扫码
    showScan() {
        this.setData({
            isShowScan: true
        })
    },

    // 扫码
    saomaEvent() {
        let that = this;
        wx.scanCode({
            onlyFromCamera: true,//是否只能从相机扫码
            success(res) {
                console.log(res);
                if (res.hasOwnProperty('path')) {
                    let code = res.path;
                    if (code) {
                        let codeArr = code.split('?');
                        console.log(codeArr);
                        let arr1 = codeArr[1].split('=');
                        common.setStorage("deviceId", arr1[1]);
                        that.state.deviceId = arr1[1];
                        that.getAuth();
                    } else {
                        common.showClickModal('无效的小程序码！');
                    }
                } else {
                    common.showClickModal('无效的小程序码！');
                }
            }
        });
    }
})