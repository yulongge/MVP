/**
 * Created by Administrator on 2014/10/31.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var application_tpl = require("application_tpl");

    var elBase = require("app/desktop/desktopElBase");

    /*
     * 桌面应用，继承自桌面元素
     * */
    var DesktopApplication = elBase.DesktopElement.extend({defaults:
        _.extend({},elBase.DesktopElement.prototype.defaults,
            {
                appId:"",
                param:"",
                // 0:BS,
                // 1:CS,
                // 2:独立,
                // 3内部启动
                openType:0,
                systemId:"",
                appCommand:"",
                sysIconPath:"",
                appIconPath:"",
                //系统类型
                loginType:""
            })
    });

    /*
    * 桌面应用视图，负责处理桌面应用
    * */
    var DesktopApplicationView = elBase.DesktopElementView.extend({
        /*
         * 模板
         * */
        tempalteApp: _.template(application_tpl),
        events: {
            "dblclick": "appButtonClick"
        },
        setModel:function(layer,$layer,model,parentView){
            this.layer = layer;
            this.model = model;
            this.$layer = $layer;
            this.pview = parentView;

            this.render();
        },
        render:function(){
            var $application = $(this.tempalteApp(this.model.attributes));
            this.setElement($application);
            $application.css(this.model.get("position"));
            this.rightContextMenu($application);
            $application.find("img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });
            $application.data("data",this.model);
            $application.data("from","desktop");
            $application.data("desktop",this.layer.get("id"));

            var data =  $application.data("data");
            if(data.get("name").length>10){
                $application.find("h4").text(data.get("name").substring(0,9)+"...")
            }
            $application.attr("title",data.get("name"));
            if(data.get("lock")){
                $application.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
            }
        },
        /*
         * 右键菜单
         * */
        rightContextMenu:function($application){
            var view = this;
            var $applicationPopmenu = $(".application_popmenu");

            $application.on("contextmenu",function(event){
                event.stopPropagation();
                var _this = this;

                PubSub.publishSync(config.HideDesktopPopThings);

                var element = $application.data("data");
                if(element.get("openType")==7){
                    $applicationPopmenu.find(".popMenu_edit").show();
                    $applicationPopmenu.find(".popMenu_edit").unbind("click").click(function(){
                        event.stopPropagation();
                        config.eidtClientApp = $application;
                        PubSub.publish(config.AddClientApp,{
                            "id": element.get("id"),
                            "Name": element.get("name"),
                            "AppID": element.get("appId"),
                            "SystemID": element.get("systemId"),
                            "IconPath": element.get("sysIconPath"),
                            "AppIconPath": element.get("appIconPath"),
                            "AppCommand": element.get("appCommand"),
                            "position": element.get("position"),
                            "param":  element.get("param"),
                            "AppType": config.ElementType.Application,
                            "Index": 0,
                            "OpenType": element.get("openType")
                        });
                    });
                }else{
                    $applicationPopmenu.find(".popMenu_edit").hide();
                }

                $applicationPopmenu.css({ left: $(this).offset().left + 65, top: $(this).offset().top });
                if(element.get("lock")){
                    $applicationPopmenu.find(".popMenu_lock").find("a").text("解锁");
                   // $applicationPopmenu.find(".popmenu_del").attr("disabled",true);
                    $applicationPopmenu.find(".popmenu_del").parent().parent().hide();
                }else{
                    $applicationPopmenu.find(".popMenu_lock").find("a").text("上锁");
                    $applicationPopmenu.find(".popmenu_del").parent().parent().show();
                }
                $applicationPopmenu.show();

               //Begin是否第三方
                if(element.get("loginType") == undefined || element.get("loginType") == ""){
                    var systemId = element.get("systemId");
                    var systems = _.where(config.AllSystems,{"SystemID":systemId});
                    if(systems && systems.length > 0){
                        element.set("loginType",systems[0].LoginType);
                    }
                }
               /* if(element.get("loginType") ==  config.ThirdPartySystem){
                    return;
                    $applicationPopmenu.find(".popMenu_chexiao").show();
                    $applicationPopmenu.find(".popmenu_aywfz").unbind("click").click(function(){
                        //撤销登陆
                        PubSub.publishSync(config.LogoutApp,{
                            "id": element.get("id"),
                            "Name": element.get("name"),
                            "AppID": element.get("appId"),
                            "SystemID": element.get("systemId"),
                            "IconPath": element.get("sysIconPath"),
                            "AppIconPath": element.get("appIconPath"),
                            "AppCommand": element.get("appCommand"),
                            "position": element.get("position"),
                            "param":  element.get("param"),
                            "AppType": config.ElementType.Application,
                            "Index": 0,
                            "OpenType": 0
                        });
                    });
                }else{
                    $applicationPopmenu.find(".popMenu_chexiao").hide();
                }*/
                //End是否第三方

                $applicationPopmenu.find(".popmenu_del").unbind("click").click(function(){
                    if(element.get("lock")){
                        var data = {};
                        data.title = "温馨提醒";
                        data.msg = "此应用已锁，无法删除，请解锁，在进行删除操作！";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }else{
                        view.pview.model.remove(element);
                        PubSub.publishSync([util.getActiveLayerId(),config.ResetSortableCellEvent].join("."));
                    }

                });
                $applicationPopmenu.find(".popmenu_open").unbind("click").click(function(){
                    $application.trigger("dblclick");
                });
                $applicationPopmenu.find(".popMenu_lock").unbind("click").click(function(){
                    if(element.get("lock")){
                        $application.find(".layer_column").find(".sign_lock").remove();
                        element.set("lock",false);
                        $(this).find("a").text("上锁");
                        $(this).find("a").css("backgroundImage","url(static/images/menu_lock.png)");
                    }else{
                        $application.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
                        element.set("lock",true);
                        $(this).find("a").text("解锁");
                        $(this).find("a").css("backgroundImage","url(static/images/menu_openlock.png)");
                    }
                });

                PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),$application);

                return false
            });

            $applicationPopmenu.find(".popmenu_list").menu();
        },
        /*
         * 点击事件
         * */
        appButtonClick:function(event){
            var $element = $(event.currentTarget);
            PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),$element);


            var element  = $element.data("data");
            PubSub.publish(config.OpenApp,{
                "id": element.get("id"),
                "Name": element.get("name"),
                "AppID": element.get("appId"),
                "SystemID": element.get("systemId"),
                "IconPath": element.get("sysIconPath"),
                "AppIconPath": element.get("appIconPath"),
                "AppCommand": element.get("appCommand"),
                "param":  element.get("param"),
                "AppType": config.ElementType.Application,
                "OpenType": element.get("openType")
            });

            PubSub.publishSync(config.HideDesktopPopThings);
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
        DesktopApplication: DesktopApplication,
        DesktopApplicationView: DesktopApplicationView
    };
});
