/**
 * Created by Administrator on 2014/10/31.
 */
define(function(require, exports, module) {
    seajs.log("初始化：" + module.id);

    /*
     * 桌面组件浮动组件
     * */
    var DesktopFloat = Backbone.Model.extend({defaults: {
        id: "",
        appId:"",
        name: "",
        lock:false,
        // 应用 = 0,
        // 小组件 = 1,
        // 指标 = 2,
        // 内部使用 =3,
        // 指标容器=4，
        // 文件夹=5，
        // 复合应用=6
        appType: 0,
        position: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        }       //位置
    }});

    /*
     * 桌面组件集合
     * */
    var DesktopFloats =  Backbone.Collection.extend({
        model:DesktopFloat
    });

    /*
     * 桌面浮动元素
     * */
    var DesktopFloatView =  Backbone.View.extend({
    });

    // DesktopFloatView.prototype.initialize.apply(this,arguments);
    module.exports = {
        DesktopFloat: DesktopFloat,
        DesktopFloats: DesktopFloats,
        DesktopFloatView: DesktopFloatView
    };
});