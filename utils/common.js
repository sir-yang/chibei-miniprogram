let util = require('util.js');

//弹框
function showClickModal(title) {
    wx.hideLoading();
    wx.showModal({
        title: '提示',
        content: title,
        showCancel: false,
        success(_res) {}
    });
}

function showTimeToast(title) {
    wx.showToast({
        title,
        duration: 2000,
        icon: 'none',
        mask: true
    });
}
//倒计时计算
function timeCountDown(that, timestamp) {
    timestamp = util.formatTimeStamp(timestamp);
    let now = Date.parse(new Date());
    let t = timestamp - now;
    if (Number(t) <= 0) {
        clearInterval(that.data.time);
        return {
            hour: '00',
            minute: '00',
            second: '00'
        };
    }
    let leftsecond = parseInt(t / 1000);
    let day = Math.floor(leftsecond / (60 * 60 * 24));
    let hour = Math.floor((leftsecond - (day * 24 * 60 * 60)) / 3600);
    let minute = Math.floor((leftsecond - (day * 24 * 60 * 60) - (hour * 3600)) / 60);
    let second = Math.floor(leftsecond - (day * 24 * 60 * 60) - (hour * 3600) - (minute * 60));
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (second < 10) {
        second = '0' + second;
    }
    return {
        day,
        hour,
        minute,
        second
    };
}

//滚动到顶部
function isscrollToPage(that) {
    if (wx.pageScrollTo) {
        wx.pageScrollTo({
            scrollTop: 0
        });
    } else {
        showClickModal('您当前微信版本过低');
    }
}

//滚动到顶部按钮的显示和隐藏
function goTopEvent(that, scrollTop) {
    let isPageScrollTo = false;
    if (wx.pageScrollTo) {
        isPageScrollTo = true;
    } else {
        isPageScrollTo = false;
    }
    if (scrollTop > 300 && !that.data.showGoTop) {
        that.setData({
            showGoTop: true,
            isPageScrollTo
        });
    } else if (scrollTop < 300 && that.data.showGoTop) {
        that.setData({
            showGoTop: false,
            isPageScrollTo
        });
    }
}

// 保存数据事件
function setInfo(key, data) {
    try {
        wx.setStorageSync(key, data);
    } catch (event) {
        console.log(event);
    }
}

// 获取已保存数据
function getInfo(key) {
    try {
        let value = wx.getStorageSync(key);
        if (value) {
            return value;
        }
        return null;
    } catch (event) {
        console.log(event);
    }
    return null;
}


/**
 * 移出token
 */
function removeAccessToken() {
    try {
        wx.removeStorageSync('token');
        wx.removeStorageSync('expire_at');
    } catch (event) {
        console.log(event);
    }
}

/**
 * 获取token
 */
function getAccessToken() {
    let accessToken = getInfo('token');
    if (!accessToken) {
        return null;
    }
    let expireAt = getInfo('expire_at');
    if (expireAt) {
        let now = Date.parse(new Date());
        if (now < expireAt) {
            return accessToken;
        }
    }
    removeAccessToken();
    return null;
}

/**
 * 处理并保存token
 */
function setToken(token) {
    setInfo('token', token.AccessToken);
    setInfo('refresh_token', token.RefreshToken);
    //提前一半的时间就要刷新

    let expire = Date.parse(new Date(token.AccessTokenExpire));
    let now = Date.parse(new Date());
    let expireIn = (expire - now) / 2;
    setInfo('expire_at', now + expireIn);
}
/**
 * 获取token
 */
function getToken() {
    //调用登录接口
    return wx.pro.login({

    }).then((res) => {
        // console.log(res.code)
        let wxcode = res.code;
        let values = {
            code: wxcode,
        };
        let url = '/api/token/generate';
        return util.httpRequest(url, values, 'POST');
    }).then((data) => {
        if (data.err_code == 0) {
            setToken(data.result);
            setInfo("hasLoading", true);
        } else {
            console.log(data.err_msg);
        }
        return data;
    });
}

/**
 * 刷新token
 */
function refreshToken() {
    let values = {
        refreshToken: getInfo('refresh_token')
    };
    let url = '/api/token/refresh';
    return util.httpRequest(url, values, 'POST').then((data) => {
        if (data.err_code == 0) {
            setToken(data.token);
            return data;
        }
        return getToken();
    }).catch((res) => {
        wx.removeStorageSync('refresh_token');
        return res;
    });
}

/**
 * 空对象判断
 * @obj  需要判断的字符串
 */
function nullObj(obj) {
    for (let key in obj) {
        return false;
    }
    return true;
}

/**
 * 判断是否为空
 * @str  需要判断的字符串
 */
function isNull(str) {
    let regu = '^[ ]+$';
    let re = new RegExp(regu);
    if (!str || str == null || str === '' || str.length === 0 || re.test(str)) {
        return true;
    }
    let reNum = /^[0-9]+.?[0-9]*$/;
    if (!reNum.test(str)) {
        let strValue = str.replace(/\n/g, '');
        if (jsTrim(strValue) == '') {
            return true;
        }
    }
    return false;
}

// 列表接口数据处理
function dataListHandle(that, data, list, offset) {
    wx.stopPullDownRefresh();
    if (data.count > 0) {
        if (offset === 0) {
            list = data.results;
        } else {
            list = list.concat(data.results);
        }
    } else if (offset === 0) {
        list = [];
    }

    let hasNext = true;
    if (data.hasOwnProperty('next')) {
        console.log('count:' + data.count + ';next:' + data.next);
        if (data.next === 0) {
            that.state.hasmore = false;
            hasNext = false;
        } else {
            that.state.hasmore = true;
            hasNext = true;
        }
    } else {
        that.state.hasmore = false;
    }
    that.state.pageOnShow = true;
    that.state.isOnReachBottom = true;
    that.state.isonPullDownRefresh = false;
    that.state.scrolltolower = true;
    wx.hideLoading();
    return {
        list,
        hasNext,
        count: data.count
    };
}



function ab2int(buffer) {
    var hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function(bit) {
            return (parseInt(bit))
        }
    )
    return hexArr.join(',');
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function(bit) {
            return ('00' + bit.toString(16)).slice(-2)
        }
    )
    return hexArr.join('');
}

// 关闭蓝牙模块
function closeBluetoothAdapter() {
    wx.closeBluetoothAdapter({
        success: function(res) {
            console.log('关闭蓝牙模块成功',res);
        },
        fail(err) {
            console.log(err);
        }
    })
}

// 断开设备连接
function closeConnect(that) {
    if (that.state.deviceId) {
        wx.closeBLEConnection({
            deviceId: that.state.deviceId,
            success: function(res) {
                closeBluetoothAdapter();
            },
            fail(err) {
                console.log('断开连接失败', err);
            }
        })
    } else {
        closeBluetoothAdapter();
    }
}

// 发送蓝牙指令
function send(that, hex) {
    console.log('发送指令');
    //转码数据
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function(h) {
        return parseInt(h, 16)
    }))
    console.log(typedArray);
    var buf = typedArray.buffer;
    wx.writeBLECharacteristicValue({
        deviceId: that.state.deviceId,
        serviceId: that.state.serviceId,
        characteristicId: that.state.uuid.write,
        value: buf,
        complete: function(ss) {
            console.log("蓝牙写数据结果：", ss);
        }
    })

}

// 开锁
function openlock(that) {
    let url = '/api/device/signopen';
    var sign = that.state.token;
    let data = {
        sign
    };
    setTimeout(() => {
        util.httpRequest(url, data).then((res) => {
            if (res.err_code !== 0) {
                showClickModal(res.err_msg);
                return;
            }
            // 发送开锁指令
            console.log('发送open');
            send(that, res.result);
        });
    }, 100);
}


//解析广播数据
function unSignNotify(that, sign) {
    let url = '/api/device/unsign';
    let data = {
        sign
    };
    //这时延时100ms
    setTimeout(() => {
        //请求接口
        util.httpRequest(url, data).then((res) => {
            if (res.err_code !== 0) {
                showClickModal(res.err_msg);
                return;
            }

            //获取token结果
            if (res.result.Action === 'gettoken') {
                //console.log(data);
                that.state.token = sign
                //wx.setStorageSync('locktoken', ab2int(res.value));
                //调用开锁
                openlock(that);
                return;
            }
            //开锁结果
            if (res.result.Action === 'openlock') {
                that.setData({
                    openLoading: 'hide'
                })

                //开锁成功
                if (res.result.Result === 'success') {
                    console.log('开锁成功');
                    closeConnect(that);//断开蓝牙连接
                    showTimeToast('开锁成功');
                    wx.redirectTo({
                        url: '/pages/shopList/shopList'
                    });
                    return;
                }
                //开锁失败
                console.log('开锁失败');
                closeConnect(that);//断开蓝牙连接
                showTimeToast('开锁失败');
                wx.reLaunch({
                    url: '/pages/index/index?scan=true'
                });
            }
        });
    }, 100);

}

//获取token
function getLockToken(that) {
    setTimeout(() => {
        let url = '/api/device/signtoken';
        util.httpRequest(url, {}, 'POST').then((res) => {
            console.log("签名结果", res);
            if (res.err_code !== 0) {
                showClickModal(res.err_msg);
                return;
            }
            console.log('发送token');
            send(that, res.result);
        });
    }, 500);
}

//注册监听方法
function BLECharacteristicValueChange(that) {
    setTimeout(() => {
        //添加接收数据处理
        wx.onBLECharacteristicValueChange((res) => {
            console.log('收到广播:', res)
            console.log('广播数据:', ab2int(res.value))
            //解析广播
            unSignNotify(that, ab2int(res.value))
        });
    }, 100);
}

//注册广播回调方法
function notifyBLECharacteristicValueChange(that) {
    setTimeout(() => {
        wx.notifyBLECharacteristicValueChange({
            deviceId: that.state.deviceId,
            serviceId: that.state.serviceId,
            characteristicId: that.state.uuid.notify,
            state: true,
            success(res) {
                console.log("注册通知事件结果:", res)
            }
        });
    }, 0);
}
//获取设备特征
function getBLEDeviceCharacteristics(that) {
    setTimeout(() => {
        wx.getBLEDeviceCharacteristics({
            deviceId: that.state.deviceId,
            serviceId: that.state.serviceId,
            success(res) {
                //设置监听方法
                BLECharacteristicValueChange(that);
                //注册监听
                notifyBLECharacteristicValueChange(that);
                //获取token
                getLockToken(that);
            }
        })
    }, 10);
}

//获取设备服务
function getBLEDeviceServices(that) {
    setTimeout(() => {
        wx.getBLEDeviceServices({
            deviceId: that.state.deviceId,
            success(res) {
                getBLEDeviceCharacteristics(that);
            }
        })
    }, 10);
}

// 连接蓝牙
function connectTO(that) {
    if (that.state.deviceId === '') {
        showClickModal('没有找到蓝牙锁');
        return;
    }
    wx.createBLEConnection({
        deviceId: that.state.deviceId,
        success(res) {
            console.log("设备连接成功：", res)
            getBLEDeviceServices(that);
            //getBLEDeviceCharacteristics(that);
            //省略取service和characteristicId 因为设备的特征值是固定

            //注册广播服务
            //notifyBLECharacteristicValueChange(that);
        },
        fail(err) {
            console.log('连接失败', err);
            showTimeToast('连接失败');
            that.setData({
                openLoading: 'hide',
                requestStatus: true,
                isShowScan: true
            })
        }
    })
}

// 授权判断
function authInfo(that, func) {
    let myInfo = getInfo('userInfo');
    if (myInfo.hasOwnProperty("ID")) {
        if (!myInfo.HeadImg && !myInfo.NickName) {
            that.setData({
                authALter: true
            });
            func(false);
            return;
        }
        func(true);
    }
}

/**
 * 获取用户信息
 */
function getPersonInfo() {
    let url = "/api/profile";
    return util.httpRequest(url).then((res) => {
        if (res.err_code == 0) {
            setInfo('userInfo', res.result);
            return res.result;
        } else {
            showClickModal(res.err_msg);
            wx.hideLoading()
        }
    })
}


/**
 * 绑定用户信息
 */
function userInfoBind(that, event) {
    let detail = event.detail;
    if (detail.hasOwnProperty('userInfo')) {
        wx.showLoading({
            title: '绑定中...',
            mask: true
        });
        let val = {
            nickName: detail.userInfo.nickName,
            headImg: detail.userInfo.avatarUrl
        };

        let url = '/api/profile/modify';
        util.httpRequest(url, val, 'POST').then((res) => {
            console.log(JSON.stringify(res));
            wx.hideLoading();
            if (res.err_code == 0) {
                that.setData({
                    authALter: false
                });
                showClickModal('用户信息绑定成功，请再次点击获取设备授权');
                //重新获取信息
                getPersonInfo().then(() => {});
            } else {
                showClickModal('用户信息绑定失败');
            }
        });
    }
}

module.exports = {
    timeCountDown,
    goTopEvent,
    setStorage: setInfo,
    getStorage: getInfo,
    getToken,
    getAccessToken,
    showClickModal,
    showTimeToast,
    dataListHandle,
    nullObj,
    isNull,
    connectTO,
    ab2hex,
    authInfo,
    getPersonInfo,
    userInfoBind
};