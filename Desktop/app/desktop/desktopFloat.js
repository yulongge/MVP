/**
 * Created by Administrator on 2014/10/31.
 */
define(function(require, exports, module) {
    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var flBase = require("app/desktop/desktopFlBase");
    var foldermax  = require("app/desktop/desktopFolderMax");
    var widget  = require("app/desktop/desktopWidget");

    /*
     * 桌面浮动元素集合视图
     * */
    var DesktopFloatsView = Backbone.View.extend({
        /*
         * 模型绑定
         * */
        setModel: function (layer,model) {
            this.model = model;
            this.layer = layer;
            this.listenTo(this.model, 'add', this.addFloat);
            this.listenTo(this.model, 'remove', this.removeFloat);
            this.listenTo(this.model, "change", this.propertyChange);

            this.render();

            var view = this;
            var desktopId = this.layer.get("id");
            //整理桌面-右键菜单
            PubSub.subscribe([desktopId,config.TidyFloatsEvent].join("."),function(message,data){
                view.tidyFloats(data);
            });

            //新建浮动元素-右键菜单
            PubSub.subscribe([desktopId,config.CreateDesktopFloatEvent].join("."),function(message,data){
                var position = data.get("position");
                if(position.top <= 0)
                    position.top= (util.postion.Param.Screen.Height - util.postion.Param.Folder.Height) /2;
                if(position.left <= 0)
                    position.left= (util.postion.Param.Screen.Width - util.postion.Param.Folder.Width) /2;

                if(position.width < util.postion.Param.Folder.Width)
                    position.width = util.postion.Param.Folder.Width;
                if(position.height < util.postion.Param.Folder.Height)
                    position.height = util.postion.Param.Folder.Height;

                view.model.add(data);
            });

            //移除文件夹
            PubSub.subscribe([desktopId,config.RemoveDesktopFloatEvent].join("."),function(message,data){
                var folderId = data.get("id");
                if(config.isFolderTypeChange){
                    view.model.remove(data);
                    PubSub.unsubscribe([desktopId,folderId].join("."));
                }else{
                    var elements = $("#"+desktopId).find("#"+folderId).find(".layer_element");
                    var flag= false;
                    elements.each(function(i,v){
                        var element = $(v).data("data");
                        if(element.get("lock")){
                            flag = true;
                            return;
                        }
                    });
                    if(flag){
                        var data = {};
                        data.title = "温馨提醒";
                        data.msg = "文件中有应用被锁，无法对文件夹进行删除！";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        //PubSub.publishSync(config.ShowWarnMessageEvent,data);
                       setTimeout(function(){
                           PubSub.publishSync(config.ShowWarnMessageEvent,data);
                       },100);
                        return;
                    };
                    view.model.remove(data);
                    PubSub.unsubscribe([desktopId,folderId].join("."));
                }


            });
        },
        /*
         * 渲染组件
         * */
        render:function(){
            this.model.each(this.addFloat, this);
        },
        /*
         * 整理文件夹
         * */
        tidyFloats:function(position){

            var foldersList = this.$el.find(">.layer_folder");
            util.postion.Param.FolderPosition.Left = util.postion.Param.Screen.Width;
            util.postion.Param.FolderPosition.Top = 35;
            util.postion.Param.FolderPosition.Width = 100;
            util.postion.Param.FolderPosition.Height = 100;
            if(foldersList.length>0){
                var compArray = [];
                for (var i = 0; i < foldersList.length; i++) {
                    var compobj = foldersList[i];
                    var compWidth = $(compobj).width();
                    compArray[i] = foldersList[i];
                }
                for (var i = 0; i < compArray.length - 1; i++) {
                    for (var j = i + 1; j < compArray.length; j++) {
                        if ($(compArray[i]).width() < $(compArray[j]).width()) {
                            var temp = compArray[i];
                            compArray[i] = compArray[j];
                            compArray[j] = temp;
                        }
                    }
                }
                for (var i = 0; i < compArray.length; i++) {
                    var folderObj = compArray[i];

                    if ($(folderObj).width() >  util.postion.Param.FolderPosition.Width) {
                        util.postion.Param.FolderPosition.Left=  util.postion.Param.FolderPosition.Left- $(folderObj).width() -  util.postion.Param.FolderPosition.MarginSize;
                        util.postion.Param.FolderPosition.Width = $(folderObj).width();
                    }
                    if(util.postion.Param.FolderPosition.Top + $(folderObj).height() > util.postion.Param.Screen.Height - util.postion.Param.Folder.MarginBottom){
                        util.postion.Param.FolderPosition.Width = $(folderObj).width();
                        util.postion.Param.FolderPosition.Top = 35;
                        util.postion.Param.FolderPosition.Left =  util.postion.Param.FolderPosition.Left -  util.postion.Param.FolderPosition.Width - util.postion.Param.FolderPosition.MarginSize;
                    }
                    var sortPosition = { top: util.postion.Param.FolderPosition.Top, left: util.postion.Param.FolderPosition.Left- (util.postion.Param.Screen.WidthPadding)};
                    $(folderObj).animate(sortPosition, 200);
                    var element = $(folderObj).data("data");
                    element.get("position").top = sortPosition.top;
                    element.get("position").left = sortPosition.left;
                    util.postion.Param.FolderPosition.Top = util.postion.Param.FolderPosition.Top + $(folderObj).height() + util.postion.Param.FolderPosition.MarginSize
                }

            }
        },
        /*
         * 属性变更，保存桌面
         * */
        propertyChange:function(){
            seajs.log("propertyChange cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 添加文件夹
         * */
        addFloat:function(float) {
            if(float.get("appType") == config.ElementType.Folder){
                float.view = new foldermax.DesktopFolderMaxView();
            }
            if(float.get("appType") == config.ElementType.Widget){
                float.view = new widget.DesktopWidgetVeiw();
            }

            float.view.setModel(this.layer,this.$el,float,this);
            this.$el.append(float.view.$el);

            float.view.$el.data("data",float); //浮动图层数据
            float.view.$el.data("from","desktop"); //位置来源
            float.view.$el.data("desktop",this.layer.get("id")); //来源桌面

            float.view.$el.hide().fadeIn();

            seajs.log("addFloat cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },

        /*
         * 删除文件夹
         * */
        removeFloat:function(float) {
            if(float.view){
                float.view.destroy();
            }

            seajs.log("removeFloat cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 释放视图
         * */
        destroy: function() {
            this.remove();
        }
    });


    module.exports = {
        DesktopFloat: flBase.DesktopFloat,
        DesktopFloats: flBase.DesktopFloats,
        DesktopFloatsView: DesktopFloatsView
    };
});