/**
 * Created by Administrator on 2014/10/25.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var elBase = require("app/desktop/desktopElBase");

    var composite_tpl = require("composite_tpl");

    /*
     * 复合应用模型
     * */
    var DesktopComposite = elBase.DesktopElement.extend({defaults:
        _.extend({},elBase.DesktopElement.prototype.defaults,
            {
                appId:"",
                appIconPath: "",
                systemId:"fhyy", //fhyy 系统 ，兼容之前版本
                compositeApps:new elBase.DesktopElements()
            })
    });


    var DesktopCompositeView = elBase.DesktopElementView.extend({
        tempalteComposite: _.template(composite_tpl),
        events: {
            "dblclick": "compositeButtonClick"
        },
        setModel: function (layer,$layer,model,parentView) {
            this.layer = layer;
            this.model = model;
            this.$layer = $layer;
            this.pview = parentView;

            this.listenTo(this.model, "change:appIconPath", this.appIconPathChange);
            this.listenTo(this.model, "change:name", this.nameChange);

            this.render();
        },
        /*
         * 渲染桌面组件
         * */
        render:function(){
            var $composite = $(this.tempalteComposite(this.model.attributes));
            this.setElement($composite);
            $composite.css(this.model.get("position"));
            this.rightContextMenu($composite);
            $composite.find("img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });
            $composite.data("data",this.model);
            $composite.data("from","desktop");
            $composite.data("desktop",this.layer.get("id"));

            var data =  $composite.data("data");
            if(data.get("lock")){
                $composite.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
            }
        },
        /*
         * 释放视图
         * */
        destroy: function() {
            this.$el.remove();
            this.remove();
        },
        appIconPathChange:function(composite){
            this.$el.find(".composite_icon").attr("src",composite.get("appIconPath"));
        },
        nameChange:function(composite){
            this.$el.find(".composite_name").text(composite.get("name"));
            this.$el.find(".composite_icon").attr("alt",composite.get("name")).attr("title",composite.get("name"));
        },
        /*
         * 右键菜单
         * */
        rightContextMenu:function($composite){
            var view = this;
            var $compositePopmenu = $(".composite_popmenu");

            $composite.on("contextmenu",function(event){
                event.stopPropagation();

                PubSub.publishSync(config.HideDesktopPopThings);

                var composite = $composite.data("data");

                $compositePopmenu.css({ left: $(this).offset().left + 65, top: $(this).offset().top });

                if(composite.get("lock")){
                    $compositePopmenu.find(".popmenu_lock").text("解锁");
                    $compositePopmenu.find(".popmenu_del").parent().parent().hide();
                    $compositePopmenu.find(".popmenu_transform").parent().parent().hide();
                    $compositePopmenu.find(".popmenu_rename").parent().parent().hide();
                    $compositePopmenu.find(".popmenu_edit").parent().parent().hide();
                }else{
                    $compositePopmenu.find(".popmenu_lock").text("上锁");
                    $compositePopmenu.find(".popmenu_del").parent().parent().show();
                    $compositePopmenu.find(".popmenu_transform").parent().parent().show();
                    $compositePopmenu.find(".popmenu_rename").parent().parent().show();
                    $compositePopmenu.find(".popmenu_edit").parent().parent().show();
                }
                $compositePopmenu.show();

                $compositePopmenu.find(".popmenu_del").unbind("click").click(function(){
                    if(composite.get("lock")){
                        var data = {};
                        data.title = "温馨提醒";
                        data.msg = "此应用已锁，无法删除，请解锁，在进行删除操作！";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }else{
                        view.pview.model.remove(composite);
                        PubSub.publishSync([util.getActiveLayerId(),config.ResetSortableCellEvent].join("."));
                    }


                });
                $compositePopmenu.find(".popmenu_open").unbind("click").click(function(){
                    $composite.trigger("dblclick");
                });
                $compositePopmenu.find(".popmenu_lock").unbind("click").click(function(){
                    if(composite.get("lock")){
                        $composite.find(".layer_column").find(".sign_lock").remove();
                        composite.set("lock",false);
                        $(this).text("上锁");
                        $(this).css("backgroundImage","url(static/images/menu_lock.png)");
                    }else{
                        $composite.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
                        composite.set("lock",true);
                        $(this).text("解锁");
                        $(this).css("backgroundImage","url(static/images/menu_openlock.png)")
                    }
                });

                $compositePopmenu.find(".popmenu_transform").unbind("click").click(function(){
                    var view  = this;
                    var data = {};
                    data.title = "温馨提醒";
                    data.msg = "您确定要转换成文件夹吗?";
                    data.confirm = function(){
                        PubSub.publishSync([util.getActiveLayerId(),config.RemoveDesktopElementEvent].join("."),composite);
                        composite.set("appId", "F" + util.getNewId());
                        composite.set("appType", config.ElementType.Folder);
                        composite.set("appIconPath",config.AppDefaultIcon);
                        composite.set("folderType",config.FolderType_MIN);
                        composite.set("folderLayout",config.FolderLayout_Grid);
                        composite.set("folderApps",composite.get("compositeApps").clone());
                        PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."),composite);
                    };
                    data.cancel = function(){
                    };
                    PubSub.publishSync(config.ShowWarnMessageEvent,data);
                });

                $compositePopmenu.find(".popmenu_rename").unbind("click").click(function(){
                    var name = $composite.find("h4").text();
                    $composite.find("h4").remove();
                    var input_text = '<input type="text" class = "layer_column_input" maxlength="10" value="'+name+'" />';
                    $composite.find("p").after(input_text);
                    $composite.find(".layer_column_input").focus();
                    $composite.find(".layer_column_input").unbind("blur").blur(function(){
                        var value = $composite.find(".layer_column_input").val();
                        if(util.inputCheck(value) == "" || util.inputCheck(value).length > 10){
                            var data = {};
                            data.title = "温馨提醒";
                            data.msg = "您输入内容:<font color='red'>\""+ util.inputCheck(value) +"\"</font><br/>请确认输入内容,建议1~10个汉字";
                            data.confirm = function(){
                                $composite.find(".layer_column_input").focus();
                            };
                            data.cancel = function(){
                                $composite.find(".layer_column_input").remove();
                                var input_text = '<h4>'+name+'</h4>';
                                $composite.find("p").after(input_text);
                            };
                            PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        }else{
                            $composite.find(".layer_column_input").remove();
                            var input_text = '<h4>'+util.inputCheck(value)+'</h4>';
                            $composite.find("p").after(input_text);
                            composite.set("name",util.inputCheck(value));
                        }
                    });
                    $composite.find("p").unbind("click").click(function(){
                        $composite.find(".layer_column_input").blur();
                    });
                });
                $compositePopmenu.find(".popmenu_edit").unbind("click").click(function(){
                    PubSub.publish(config.OpenEditCompositeEvent,composite);
                });

                return false
            });

            $compositePopmenu.find(".popmenu_list").menu();
        },
        /*
         * 点击事件
         * */
        compositeButtonClick:function(event){
            var $composite = $(event.currentTarget);
            PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),$composite);

            var composite = $composite.data("data");
            var data = {
                "id": composite.get("id"),
                "Name": composite.get("name"),
                "AppID": composite.get("appId"),
                "SystemID": "fhyy",
                "IconPath": composite.get("appIconPath"),
                "AppIconPath": composite.get("appIconPath"),
                "AppType":  config.ElementType.Composite,
                "AppCommand": "",
                "param": [],
                "OpenType": 0
            };

            var length = composite.get("compositeApps").length;
            if(length == 0){
                var confirmdata = {};
                confirmdata.title = "温馨提醒";
                confirmdata.msg = "请确认复合应用中包含子应用！";
                confirmdata.confirm = function(){
                };
                confirmdata.cancel = function(){
                };
                PubSub.publishSync(config.ShowWarnMessageEvent,confirmdata);
                return;
            }

            var appList = [];
            var appName = [];
            composite.get("compositeApps").each(function(app) {
                appList.push(app.get("appId"));
                appName.push(app.get("name"));
                if(app.get("openType") != 7) {
                    data.param.push({
                        "id": app.get("id"),
                        "Name": app.get("name"),
                        "AppID": app.get("appId"),
                        "param": app.get("param"),
                        "SystemID": app.get("systemId"),
                        "IconPath": app.get("appIconPath"),
                        "AppIconPath": app.get("appIconPath"),
                        "AppType": app.get("appType"),
                        "AppCommand": "",
                        "OpenType": app.get("openType")
                    });
                }
            });

            //data.param = appList.join(";") + ";";
            //data.appname = appName.join(";") + ";";

            PubSub.publishSync(config.HideDesktopPopThings);
            PubSub.publish(config.OpenApp,data);

        }

    });

    module.exports = {
        DesktopComposite: DesktopComposite,
        DesktopCompositeView: DesktopCompositeView
    };

});