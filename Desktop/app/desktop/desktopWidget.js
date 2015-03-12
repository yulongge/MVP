/**
 * Created by Administrator on 2014/11/17.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var config = require("app/config");
    var util = require("app/util");
    var flBase = require("app/desktop/desktopFlBase");
    var widget_tpl = require("widget_tpl");
    var json2 = require("json2");

    var DesktopWidget = flBase.DesktopFloat.extend({defaults:
        _.extend({},flBase.DesktopFloat.prototype.defaults,
            {
                url:""
            })
    });

    var DesktopWidgetVeiw =flBase.DesktopFloatView.extend({
        /*
         * 模板
         * */
        tempalteWidget: _.template(widget_tpl),
        events:{},
        setModel:function(layer,$layer,model,parentView){
            this.layer = layer;
            this.model = model;
            this.$layer = $layer;
            this.pview = parentView;
            this.render();
        },
        render:function(){
            var $desktopWidget = $(this.tempalteWidget(this.model.attributes));
            this.setElement($desktopWidget);
            this.positionWidget();
            this.rightContextMenu();
            this.dragWidgetEvent();
            this.resizableEvent();
        },
        /*
         * 设置文件夹尺寸
         * */
        positionWidget:function(){

            this.$el.css("position","absolute");
            this.$el.css(this.model.get("position"));
            this.$el.find(".iframe_part").css("height",(this.$el.height() - 35) + "px");
        },
        /*
         * 右键菜单
         * */
        rightContextMenu:function(){
            this.$el.on("contextmenu",function(){return false;});
        },
        /*
         * 拖拽事件
         * */

        dragWidgetEvent:function(){
            var view = this;
            //拖拽支持
            this.$el.draggable({
                handle:".title,input",
                cursor:"pointer",
                start:function(event,ui){
                    config.OverLayer.IsELementMoving = true;
                    config.OverLayer.DragOverUi = ui;
                    config.OverLayer.DragOverOrigin = view.$el;

                    PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),view.$el);
                },
                drag:function(event,ui){
                },
                stop:function(event,ui){
                    config.OverLayer.IsELementMoving = false;
                    config.OverLayer.DragOverUi = null;
                    config.OverLayer.DragOverOrigin = null;

                    var pos = {
                        top : ui.position.top,
                        left : ui.position.left,
                        width : ui.helper.width(),
                        height : ui.helper.height()
                    };
                    var toPos =  util.postion.checkBoundary(pos,{top:util.postion.Param.Widget.MarginTop,bottom:util.postion.Param.Widget.MarginBottom});
                    ui.helper.animate(toPos);
                    view.model.set("position", toPos);
                }
            });
        },
        /*
         * 缩放文件夹
         * */
        resizableEvent:function(){
            var view = this;
            this.$el.resizable({
                minWidth:util.postion.Param.Widget.Width,
                minHeight:util.postion.Param.Widget.Height,
                maxHeight:800,
                maxWidth:800,
                resize:function(event,ui){
                    //view.$el.find(".list_box").css("height",(view.$el.height() - 35)+"px");
                    PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),view.$el);
                },
                stop:function(event,ui){
                    var pos = {
                        top : ui.position.top,
                        left : ui.position.left,
                        width : ui.helper.width(),
                        height : ui.helper.height()
                    };
                    var toPos = util.postion.checkBoundary(pos,{top:util.postion.Param.Widget.MarginTop,bottom:util.postion.Param.Widget.MarginBottom});
                    view.$el.find(".iframe_part").css("height",(toPos.height - 35)+"px");
                    ui.helper.animate(toPos);
                   // view.$el.animate(toPos);
                    view.model.set("position", toPos);
                }
            });
        },
        /*
         * 释放视图
         * */
        destroy: function() {
            this.$el.remove();
            this.remove();
        }
      });

    module.exports = {
        DesktopWidget:DesktopWidget,
        DesktopWidgetVeiw:DesktopWidgetVeiw
    };

});