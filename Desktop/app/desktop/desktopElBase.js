/**
 * Created by Administrator on 2014/10/31.
 */
define(function(require, exports, module) {
    seajs.log("初始化：" + module.id);

    /*
     * 桌面组件元素模型基类
     * */
    var DesktopElement = Backbone.Model.extend({defaults: {
        id: "",
        appId:"",
        name: "",
        // 应用 = 0,
        // 小组件 = 1,
        // 指标 = 2,
        // 内部使用 =3,
        // 指标容器=4，
        // 文件夹=5，
        // 复合应用=6
        lock:false,
        appType: 0,
        index: 0,//顺序
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
    var DesktopElements =  Backbone.Collection.extend({
        model:DesktopElement,
        comparator:function(item){
            return item.get("index");
        }
    });


    /*
     * 桌面组件集合
     * */
    var DesktopElementView =  Backbone.View.extend({
    });

    // 此类作为桌面元素的基类
    // 子类调用父类示例代码
    // DesktopElementView.prototype.initialize.apply(this,arguments);

    module.exports = {
        DesktopElement: DesktopElement,
        DesktopElements: DesktopElements,
        DesktopElementView: DesktopElementView
    };
});