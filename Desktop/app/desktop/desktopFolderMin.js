/**
 * Created by Administrator on 2014/10/31.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");
    var json2 = require("json2");

    var elBase = require("app/desktop/desktopElBase");

    var folderMin_tpl = require("folderMin_tpl");
    var folderPop_tpl = require("folderPop_tpl");
    var application_tpl = require("application_tpl");

    var folderModel = require("app/desktop/desktopFolder");

    var application  = require("app/desktop/desktopApplication");
    /*
     * 桌面应用视图，负责处理桌面应用
     * */
    var DesktopFolderMinView = elBase.DesktopElementView.extend({
        /*
         * 模板
         * */
        templateFolderMin: _.template(folderMin_tpl),
        templateFolderPop: _.template(folderPop_tpl),
        tempalteApp: _.template(application_tpl),
        /*
         * 事件
         * */
        events: {
            "click div.showway": "showListOrGrid",
            "click div.layer_min": "showPopFolder",
            "dblclick": "showFolder"
        },
        /*
         * 设置模型
         * */
        setModel:function(layer,$layer,model,parentView){
            this.layer = layer;
            this.model = model;
            this.$layer = $layer;
            this.pview = parentView;

            this.listenTo(this.model.get("folderApps"), 'add', this.addApplication);
            this.listenTo(this.model.get("folderApps"), 'remove', this.removeApplication);
            this.listenTo(this.model, "change:folderType", this.folderTypeChange);
            this.listenTo(this.model, "change:folderLayout", this.folderLayoutChange);

            this.render();

            var view = this;
            var folderId = this.model.get("id");
            var layerId = this.layer.get("id");
            //移除应用-拖拽之文件夹触发
            PubSub.subscribe([layerId,folderId,config.RemoveFolderAppEvent].join("."),function(message,data){
                view.model.get("folderApps").remove(data)
            });

            //添加应用
            PubSub.subscribe([layerId,folderId,config.AddFolderAppEvent].join("."),function(message,data){
                view.model.get("folderApps").add(data)
            });
        },
        /*
         * 释放视图
         * */
        destroy: function() {
            this.$el.remove();
            if(this.$popWrapper)
                this.$popWrapper.remove();
            this.remove();
        },

        /*
         * 渲染界面
         * */
        render:function() {
            var $folderMinEl = $(this.templateFolderMin(this.model.attributes));
            this.setElement($folderMinEl);

            this.folderMinDroppable();
            this.folderMinRightContextMenu();
            this.initFolderMinIcon();

            $folderMinEl.data("data",this.model);
            $folderMinEl .data("from","desktop");
            var data = $folderMinEl.data("data");
            if(data.get("lock")){
                $folderMinEl.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
            }else{
                $folderMinEl.find(".layer_column").find(".sign_lock").remove();
            }

            var view = this;
            var layerId = this.layer.get("id");
            //移除弹出文件夹
            PubSub.subscribe([layerId,config.RemovePopFolderEvent].join("."),function(){
                if(view.$popWrapper){
                    view.$popWrapper.remove();
                }
                if(view.$el){
                    view.$el.find("h4").show();
                }
            });
        },
        /*
         * 添加文件夹APP
         * */
        addApplication:function(appElement){

            var appElementEl = this.tempalteApp(appElement.attributes);

            var $appElement = $(appElementEl);

            $appElement.data("data",appElement);
            $appElement.data("from","folder");
            $appElement.data("folder",this.model.get("id"));
            $appElement.data("desktop",this.layer.get("id"));

            if(this.model.get("folderLayout") == config.FolderLayout_List){
                $appElement.css("float","none");
            }else{
                $appElement.css("float","left");
            }

            $appElement.css({"position":"relative","margin-left":"5px","margin-top":"5px"});

            $appElement.find("img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });

            var $listBox = this.$el.find(".list_box");

            $appElement.appendTo($listBox).hide().fadeIn();

            this.rightApplicationMenu($appElement);

            this.initFolderMinIcon();

            seajs.log("folderMinAddApplication cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 移除文件夹APP
         * */
        removeApplication:function(appElement){
            var id = appElement.get("id");

            if(this.$popWrapper){
                var $element = this.$popWrapper.find("#"+id);
                $element.fadeOut(function(){
                    $element.remove();
                });
            }

            this.initFolderMinIcon();

            seajs.log("folderMinRemoveApplication cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 右键菜单
         * */
        rightApplicationMenu:function($element){
            var view = this;
            var foldermin =view.$el.data("data");
            $element.on("contextmenu",function(event){
                event.stopPropagation();

                var element = $element.data("data");

                var $applicationPopmenu = $(".application_popmenu");
                $applicationPopmenu.css({ left: $(this).offset().left + 65, top: $(this).offset().top });

                if(foldermin.get("lock")){
                    $applicationPopmenu.find(".popmenu_del").parent().parent().hide();
                    $applicationPopmenu.find(".popmenu_edit").parent().parent().hide();
                    if(element.get("lock")){
                        $applicationPopmenu.find(".popMenu_lock").find("a").text("解锁");

                    }else{
                        $applicationPopmenu.find(".popMenu_lock").find("a").text("上锁");
                    }
                }else{
                    if(element.get("lock")){
                        $applicationPopmenu.find(".popMenu_lock").find("a").text("解锁");
                        $applicationPopmenu.find(".popmenu_del").parent().parent().hide();
                        $applicationPopmenu.find(".popmenu_edit").parent().parent().hide();
                    }else{
                        $applicationPopmenu.find(".popMenu_lock").find("a").text("上锁");
                        $applicationPopmenu.find(".popmenu_del").parent().parent().show();
                        $applicationPopmenu.find(".popmenu_edit").parent().parent().show();
                    }
                }


                $applicationPopmenu.show();

                if(element.get("openType")==7){
                    $applicationPopmenu.find(".popMenu_edit").show();
                    $applicationPopmenu.find(".popMenu_edit").unbind("click").click(function(){
                        event.stopPropagation();
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

                $applicationPopmenu.find(".popmenu_del").unbind("click").click(function(e){
                    e.stopPropagation();
                    view.model.get("folderApps").remove(element);
                    PubSub.publishSync([util.getActiveLayerId(),config.ResetSortableCellEvent].join("."));
                    $applicationPopmenu.hide();
                });
                $applicationPopmenu.find(".popmenu_open").unbind("click").click(function(e){
                    e.stopPropagation();
                    $element.trigger("dblclick");
                    $applicationPopmenu.hide();
                });
                $applicationPopmenu.find(".popMenu_lock").unbind("click").click(function(e){
                    e.stopPropagation();
                    if(element.get("lock")){
                        $element.find(".layer_column").find(".sign_lock").remove();
                        element.set("lock",false);
                        $(this).find("a").text("上锁");
                        $(this).find("a").css("backgroundImage","url(static/images/menu_lock.png)");
                    }else{
                        $element.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
                        element.set("lock",true);
                        $(this).find("a").text("解锁");
                        $(this).find("a").css("backgroundImage","url(static/images/menu_openlock.png)");
                    }
                    $applicationPopmenu.hide();
                });
                //Begin是否第三方
                if(element.get("loginType") == undefined || element.get("loginType") == ""){
                    var systemId = element.get("systemId");
                    var systems = _.where(config.AllSystems,{"SystemID":systemId});
                    if(systems && systems.length > 0){
                        element.set("loginType",systems[0].LoginType);
                    }
                }

                if(element.get("loginType") ==  config.ThirdPartySystem){
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
                            "AppType": config.ElementType.Application
                        });
                    });
                }else{
                    $applicationPopmenu.find(".popMenu_chexiao").hide();
                }
                //End是否第三方


                return false
            });
        },
        /*
         * 文件夹类型修改
         * */
        folderTypeChange:function(folder){
            if(folder.get("folderType") == config.FolderType_MAX) {
                var desktopId = util.getActiveLayerId();
                folder.get("position").width = util.postion.Param.Folder.Width;
                folder.get("position").height = util.postion.Param.Folder.Height;
                PubSub.publishSync([desktopId,config.RemoveDesktopElementEvent].join("."),folder);
                var folderMax = new folderModel.DesktopFolderMax();
                var folderId = "F" + util.getNewId();
                folderMax.set({
                    id: folderId,
                    appId: folder.get("appId"),
                    name: folder.get("name"),
                    appType:config.ElementType.Folder,
                    position:folder.get("position"),
                    folderType:folder.get("folderType"),
                    folderLayout:folder.get("folderLayout"),
                    folderApps: folder.get("folderApps"),
                    lock:folder.get("lock")
                });
                PubSub.publishSync([desktopId,config.CreateDesktopFloatEvent].join("."),folderMax);
            }
        },
        /*
         * 文件夹布局修改
         * */
        folderLayoutChange:function(folder){
            if(folder.get("folderLayout") == config.FolderLayout_List){
                if(this.$popWrapper){
                    console.log($(this).html());
                    this.$popWrapper.find(".min_folder_swicth").addClass("btn_list");
                    this.$popWrapper.find(".min_folder_swicth").find("img").attr("src","static/images/desktop_folder_list1.png");
                    this.$popWrapper.find(".list_box").addClass("control_btn_list");
                    this.$popWrapper.find(".min_folder_swicth").attr("title","图标");
                    this.$popWrapper.find(".list_box .layer_button").css("float", "none");
                }
            }else {
                if(this.$popWrapper) {
                    this.$popWrapper.find(".list_box").removeClass("control_btn_list");
                    this.$popWrapper.find(".list_box .layer_button").css("float", "left");
                    this.$popWrapper.find(".min_folder_swicth").find("img").attr("src", "static/images/desktop_folder_list2.png");
                    this.$popWrapper.find(".min_folder_swicth").attr("title","列表");
                    this.$popWrapper.find(".min_folder_swicth").removeClass("btn_list");
                }
            }
        },
        /*
         * 初始化最小化图标
         * */
        initFolderMinIcon:function(){
            var folderApps = this.model.get("folderApps");
            var showCount = Math.min(folderApps.length,4);
            this.$el.find(".FolderBox").empty();

            for(var i=0;i<showCount;i++){
                var folderApp = folderApps.at(i);
                var id = folderApp.get("id");
                //var imgSrc = this.$el.find("#"+id).find("img")..attr("src");
                var sysIconPath = folderApp.get("sysIconPath");
                var appIconPath = folderApp.get("appIconPath");
                var imgSrc = appIconPath && appIconPath!="" ? appIconPath : sysIconPath;

                var marginStr = "margin:5px 4px 4px 5px;";
                if(i/2 >= 1){
                    marginStr = "margin:5px 4px 4px 5px;";
                }

                var $minIcon = $('<div aid="'+ id +'">' +
                    '<img class="minImg" src="'+imgSrc+'" style="width:100%;height:100%;"/></div>');

                $minIcon.find("img").error(function(){
                    $(this).attr("src",config.AppDefaultIcon);
                });

                this.$el.find(".FolderBox").append($minIcon);

                this.$el.find("img.minImg").error(function(){
                    $(this).attr("src",config.AppDefaultIcon);
                });
            }
        },
        /*
         * 右键菜单
         * */
        popRightContextMenu:function(){
            this.$popWrapper.on("contextmenu",function(){return false;});
        },
        /*
         * 显示列表形式或者表格形式
         * */
        showListOrGrid:function(event){
            event.stopPropagation();
            if(this.model.get("folderLayout") == config.FolderLayout_Grid){
                this.model.set("folderLayout",config.FolderLayout_List);
            }else{
                this.model.set("folderLayout",config.FolderLayout_Grid);
            }
        },
        /*
         * 最小化文件夹拖放效果
         * */
        folderMinDroppable:function(){
            var view = this;
            this.$el.droppable({
                accept:".layer_button,.appstore_list_app li",
                hoverClass: "foldermin_candrop",
                greedy:true,
                drop:function(event,ui){
                    if(view.$el.data("data").get("lock")){
                        var data = {};
                        data.title = "温馨提醒";
                        data.msg ="此文件夹已锁，禁止放入！";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }
                    var model = ui.draggable.data("data");
                    if(model.get("lock")){
                        var data = {};
                        data.title = "温馨提醒";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        data.msg = "此应用已锁，请解锁，在放入文件夹中";
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }
                    if(model.get("openType")==7){
                        var data = {};
                        data.title = "温馨提醒";
                        data.confirm = function(){};
                        data.cancel = function(){};
                        data.msg = "本地应用程序禁止放入文件夹中";
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }
                    if(model.get("appType") == config.ElementType.Application){
                        view.dropHandle(ui);
                    }else{
                        if(
                            model.get("appType") == config.ElementType.Composite ||
                            model.get("appType") == config.ElementType.Folder
                            ){
                            var typeName = model.get("appType") == config.ElementType.Composite ? "复合应用": "文件夹";
                            var data = {};
                            data.title = "温馨提醒";
                            data.msg = typeName + "不支持放到文件夹内！";
                            data.confirm = function(){};
                            data.cancel = function(){};
                            PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        }
                    }
                }
            });
        },
        /*
         * 拖拽处理函数，最大化最小化文件夹通用
         * */
        dropHandle:function(ui){
            var $appElement =  ui.draggable;

            var from = $appElement.data("from");
            var appElement =  $appElement.data("data");

            //从桌面拖来
            if(from == "desktop"){
                var layerId = this.layer.get("id");
                //调用桌面的移除事件
                PubSub.publishSync([layerId,config.RemoveDesktopElementEvent].join("."),appElement);
                //添加应用到文件夹
                this.model.get("folderApps").add(appElement);
            }else if(from == "folder"){
                var forlderId =  $appElement.data("folder");
                //如果是同一个文件夹
                if(forlderId == this.model.get("id")) return;

                var activeLayerid = util.getActiveLayerId();
                //移除之前的文件夹内应用，后重新添加
                PubSub.publishSync([activeLayerid,$appElement.data("folder"),config.RemoveFolderAppEvent].join("."),appElement);
                //添加应用到文件夹
                this.model.get("folderApps").add(appElement);
            }else if(from == "store"){

                if($appElement.data("exist") == false){
                    $appElement.draggable("disable");
                    $appElement.find("a").text("已添加");
                    $appElement.find("a").addClass("add1");
                    $appElement.data("exist",true);
                }

                if(appElement.get("appType") == config.ElementType.Application) {
                    appElement = new application.DesktopApplication({
                        id: "A" + util.getNewId(),//appElement.get("id"),
                        name: appElement.get("appName"),
                        appId: appElement.get("appId"),
                        sysIconPath: appElement.get("iconPath"),
                        appIconPath: appElement.get("appIconPath"),
                        appCommand: appElement.get("appCommand"),
                        //登录类型
                        loginType: appElement.get("loginType"),
                        param: appElement.get("param"),
                        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                        appType: appElement.get("appType"),
                        //0:BS 1:CS 2:独立，3内部启动
                        openType: appElement.get("openType"),
                        systemId: appElement.get("systemId"),
                        position:{
                            width:util.postion.Param.Element.Width,
                            height:util.postion.Param.Element.Height,
                            top: 0,
                            left: 0
                        }
                    });
                    //添加应用到文件夹
                    this.model.get("folderApps").add(appElement);
                }
            }
        },
        /*
         * 最小化文件夹打开全部应用
         * */
        folderMinRightContextMenu:function(){
            var view = this;
            var $folderpopmenu = $(".folder_popmenu");

            this.$el.on("contextmenu",function(event){
                event.stopPropagation();
                PubSub.publishSync(config.HideDesktopPopThings);

                var element = view.$el.data("data");

                $folderpopmenu.css({ left: $(this).offset().left + 65, top: $(this).offset().top });
                if(element.get("lock")){
                    $folderpopmenu.find(".popmenu_del").parent().parent().hide();
                    $folderpopmenu.find(".popmenu_transform").parent().parent().hide();
                    $folderpopmenu.find(".popmenu_rename").parent().parent().hide();
                    $folderpopmenu.find(".popmenu_lock").text("解锁");
                    $folderpopmenu.find(".popmenu_lock").css("backgroundImage","url(static/images/menu_openlock.png)");
                }else{
                    $folderpopmenu.find(".popmenu_del").parent().parent().show();
                    $folderpopmenu.find(".popmenu_transform").parent().parent().show();
                    $folderpopmenu.find(".popmenu_rename").parent().parent().show();
                    $folderpopmenu.find(".popmenu_lock").text("上锁");
                    $folderpopmenu.find(".popmenu_lock").css("backgroundImage","url(static/images/menu_lock.png)");
                }
                $folderpopmenu.show();

                $folderpopmenu.find(".popmenu_del").unbind("click").click(function(){
                    view.pview.model.remove(element);
                    PubSub.publishSync([util.getActiveLayerId(),config.ResetSortableCellEvent].join("."));
                });

                $folderpopmenu.find(".popmenu_xjwjj").unbind("click").click(function(){
                    element.set("folderType",config.FolderType_MAX);
                });
                $folderpopmenu.find(".popmenu_transform").unbind("click").click(function(){

                    var hasLocalApplication = false;
                    element.get("folderApps").each(function(app) {
                        if(app.get("openType") == 7){
                            hasLocalApplication = true;
                        }
                    });
                    if(hasLocalApplication){
                        var confirmdata = {};
                        confirmdata.title = "温馨提醒";
                        confirmdata.msg = "需要转换的文件夹中不能包含本地应用！";
                        confirmdata.confirm = function(){
                        };
                        confirmdata.cancel = function(){
                        };
                        PubSub.publishSync(config.ShowWarnMessageEvent,confirmdata);
                        return;
                    }

                    var data = {};
                    data.title = "温馨提醒";
                    data.msg = "您确定要转换成复合应用?";
                    data.confirm = function(){
                        PubSub.publishSync([util.getActiveLayerId(),config.RemoveDesktopElementEvent].join("."),element);
                        element.set("appId", "C" + util.getNewId());
                        element.set("appType", config.ElementType.Composite);
                        element.set("appIconPath",config.AppDefaultIcon);
                        element.set("compositeApps",element.get("folderApps").clone());
                        PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."),element);
                    };
                    data.cancel = function(){
                    };
                    PubSub.publishSync(config.ShowWarnMessageEvent,data);


                });
                $folderpopmenu.find(".popmenu_rename").unbind("click").click(function(event){
                    PubSub.publishSync(config.HideDesktopPopThings);

                    event.stopPropagation();
                    var name = view.$el.find("h4").text();
                    view.$el.find("h4").remove();
                    var input_text = '<input type="text" class = "layer_column_input" maxlength="10"  value="'+name+'" />';
                    view.$el.find(".FolderBox").after(input_text);
                    view.$el.find(".layer_column_input").focus();
                    view.$el.find(".layer_column_input").click(function(e){
                       e.stopPropagation();
                    });
                    view.$el.find(".layer_column_input").unbind("blur").blur(function(){
                        var value = view.$el.find(".layer_column_input").val();
                        if(util.inputCheck(value) == "" || util.inputCheck(value).length > 10){
                            var data = {};
                            data.title = "温馨提醒";
                            data.msg = "您输入内容:<font color='red'>\""+ util.inputCheck(value) +"\"</font><br/>请确认输入内容,建议1~10个汉字";
                            data.confirm = function(){
                                view.$el.find(".layer_column_input").focus();
                            };
                            data.cancel = function(){
                                view.$el.find(".layer_column_input").remove();
                                var input_text = '<h4>'+name+'</h4>';
                                view.$el.find(".FolderBox").after(input_text);
                            };
                            PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        }else{
                            view.$el.find(".layer_column_input").remove();
                            var input_text = '<h4>'+util.inputCheck(value)+'</h4>';
                            view.$el.find(".FolderBox").after(input_text);
                            element.set("name",util.inputCheck(value));
                        }
						view.$el.attr("title",value);
                    });
                    view.$el.find(".FolderBox").unbind("click").click(function(){
                        view.$el.find(".layer_column_input").blur();
                    });
                });
                $folderpopmenu.find(".popmenu_open").unbind("click").click(function(){
                    var data = {
                        "id": element.get("id"),
                        "Name": element.get("name"),
                        "AppID": element.get("appId"),
                        "IconPath": element.get("appIconPath"),
                        "AppIconPath": element.get("appIconPath"),
                        "AppType": config.ElementType.Folder,
                        "param": [],
                        "SystemID": "",
                        "AppCommand": "",
                        "OpenType": 0
                    };


                    var length = element.get("folderApps").length;
                    if(length == 0){
                        var confirmdata = {};
                        confirmdata.title = "温馨提醒";
                        confirmdata.msg = "请确认文件夹中包含子应用！";
                        confirmdata.confirm = function(){
                        };
                        confirmdata.cancel = function(){
                        };
                        PubSub.publishSync(config.ShowWarnMessageEvent,confirmdata);
                        return;
                    }

                    var appList = [];
                    var appName = [];
                    element.get("folderApps").each(function(app) {
                        appList.push(app.get("appId"));
                        appName.push(app.get("name"));
                        if(app.get("openType") != 7)
                        {
                            data.param.push({
                            "id": app.get("id"),
                            "Name": app.get("name"),
                            "AppID": app.get("appId"),
                            "param": app.get("param"),
                            "SystemID":  app.get("systemId"),
                            "IconPath": app.get("appIconPath"),
                            "AppIconPath": app.get("appIconPath"),
                            "AppType":  app.get("appType"),
                            "AppCommand": "",
                            "OpenType": app.get("openType")
                            });
                        }
                    });

                    //data.param = appList.join(";") + ";";
                    //data.appname = appName.join(";") + ";";

                    PubSub.publish(config.OpenApp,data);
                });
                $folderpopmenu.find(".popmenu_lock").unbind("click").click(function(){
                    if(element.get("lock")){
                        view.$el.find(".layer_column").find(".sign_lock").remove();
                        element.set("lock",false);
                        $(this).text("上锁");
                        $(this).css("backgroundImage","url(static/images/menu_lock.png)");
                    }else{
                        view.$el.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
                        element.set("lock",true);
                        $(this).text("解锁");
                        $(this).css("backgroundImage","url(static/images/menu_openlock.png)");
                    }
                });

                return false
            });

            $folderpopmenu.find(".popmenu_list").menu();
        },
        /*
         * 打开最大化下拉文件夹
         * */
        showPopFolder:function(event){
            var view = this;
            event.stopPropagation();

            if(config.TimeFn){
                clearTimeout(config.TimeFn);
            }

            config.TimeFn = setTimeout(function(){
                seajs.log("click");
                var moving = view.$el.data("moving");
                if(moving) return;

                view.$el.find("h4").hide();

                if(view.$popWrapper){
                    view.$popWrapper.remove();
                }
                view.$popWrapper = view.makePopMaxFolder();
                util.getActiveLayer().find(".FolderBigBox").remove();
                view.$layer.append(view.$popWrapper);

                view.generatePopList();
                view.minShowListOrGridEvent();
                view.switchFolderMaxEvent();
                view.folderLayoutChange(view.model);
                view.sortableFolderAndDrag();
                view.popRightContextMenu();

                view.$popWrapper.hide();
                view.$popWrapper.slideDown();
                view.$popWrapper.unbind("click").bind("click",function(event){event.stopPropagation();});

                PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),view.$popWrapper);
            },300);


        },

        showFolder:function(event){
            event.stopPropagation();
            if(config.TimeFn){
                clearTimeout(config.TimeFn);
            }

            var $folderMin = $(event.currentTarget);
            PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),$folderMin);

            var folder = $folderMin.data("data");
            var data = {
                "id": folder.get("id"),
                "Name": folder.get("name"),
                "AppID": folder.get("appId"),
                "IconPath": folder.get("appIconPath"),
                "AppIconPath": folder.get("appIconPath"),
                "AppType": config.ElementType.Folder,
                "param": [],
                "SystemID": "",
                "AppCommand": "",
                "OpenType": 0
            };

            var length = folder.get("folderApps").length;
            if(length == 0){
                var confirmdata = {};
                confirmdata.title = "温馨提醒";
                confirmdata.msg = "请确认文件夹内包含子应用！";
                confirmdata.confirm = function(){
                };
                confirmdata.cancel = function(){
                };
                PubSub.publishSync(config.ShowWarnMessageEvent,confirmdata);
                return;
            }

            var appList = [];
            var appName = [];
            folder.get("folderApps").each(function(app) {
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

        },
        /*
         * 排序文件夹
         * */
        sortableFolderAndDrag:function(){
            var view = this;

            this.$popWrapper.find(".list_box").sortable({
                placeholder:"sortable_placeholder",
                start:function(event,ui){
                    ui.placeholder.attr("style",ui.item.attr("style")).css({"position":"relative"});
                },
                out:function(event,ui){
                    ui.item.data("outfolder",true);
                },
                over:function(event,ui){
                    ui.item.data("outfolder",false);
                },
                stop:function(event,ui){
                    ui.item.hide().fadeIn();

                    config.IsInitFinish = false;
                    view.computeCellIndexAndPostion();
                    config.IsInitFinish = true;
                    view.initFolderMinIcon();
                    PubSub.publishSync(config.DesktopIsChangedEvent);
                }
            });
            if(this.$el.data("data").get("lock")){
                this.$popWrapper.find(".list_box").sortable("disable");
            }else{
                this.$popWrapper.find(".list_box").sortable("enable");
            }
        },
        /*
         * 计算布局
         * */
        computeCellIndexAndPostion:function(){
            var $sortableElement = this.$popWrapper.find(".list_box").find("> div.layer_element").not(".sortable_placeholder");
            $sortableElement.each(function(j,el){
                var element = $(el).data("data");
                element.set("index", j);
                element.set("position",{
                    width:util.postion.Param.Element.Width,
                    height:util.postion.Param.Element.Height,
                    top: $(el).offset().top,
                    left: $(el).offset().left
                })
            });
            this.model.get("folderApps").sort();
        },
        /*
         * 最小化文件夹显示列表形式或者表格形式
         * */
        minShowListOrGridEvent:function(){
            var view = this;
            if(this.$popWrapper){
                this.$popWrapper.find("div.min_folder_swicth").unbind( "click").bind("click",function(event){
                    event.stopPropagation();

                    if(view.model.get("folderLayout") == config.FolderLayout_Grid){
                        view.model.set("folderLayout",config.FolderLayout_List);
                    }else{
                        view.model.set("folderLayout",config.FolderLayout_Grid);
                    }
                });
            }
        },
        /*
         * 最小化文件夹切换回最大化事件
         * */
        switchFolderMaxEvent:function(){
            var view = this;
            if(this.$popWrapper){
                this.$popWrapper.find("div.min_folder_max").unbind("click").bind("click",function(event){
                    event.stopPropagation();
                    view.model.set("folderType",config.FolderType_MAX);
                });
            }
        },
        /*
         * 输出弹出列表
         * */
        generatePopList:function(){
            var folderApps = this.model.get("folderApps");
            var view = this;

            folderApps.each(function(appElement) {

                var appElementEl = this.tempalteApp(appElement.attributes);

                var $appElement = $(appElementEl);

                $appElement.data("data",appElement)
                    .data("from","folder")
                    .data("folder",this.model.get("id"));

                $appElement.css({"position":"relative","margin-left":"5px","margin-top":"5px"});

                if(this.model.get("folderLayout") == config.FolderLayout_List){
                    $appElement.css("float","none");
                }else{
                    $appElement.css("float","left");
                }

                $appElement.find("img").error(function(){
                    $(this).attr("src",config.AppDefaultIcon);
                });
                if($appElement.data("data").get("lock")){
                    $appElement.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
                }

                var $listBox = this.$popWrapper.find(".list_box");

                $listBox.css("height",(this.$popWrapper.height()-35)+"px");

                $appElement.appendTo($listBox).hide().fadeIn();

                $appElement.dblclick(view.appButtonClick);

                view.rightApplicationMenu($appElement);

            }, this)
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
         * 弹出文件夹外壳包装
         * */
        makePopMaxFolder:function(){
            var pos = this.getPopFolderPosition();
            var obj = {};
            obj.Dwidth = 255 + "px";
            obj.Dheight = pos.height + "px";
            obj.Dleft = pos.left + "px";
            obj.Dtop = pos.top + "px";
            if(pos.left < 150){
                obj.Dleft = "10px";
                if(this.$el.offset().top + this.$el.find(".FolderBox").height() + 20 + pos.height > util.postion.Param.Screen.Height){
                    obj.imageName = "url(static/images/desktop_icon_show2.png)";
                    obj.Atop = pos.height + "px";
                    obj.Aleft = pos.left + 25 + "px";
                }else{
                    obj.imageName = "url(static/images/desktop_icon_show1.png)";
                    obj.Atop = -13 + "px";
                    obj.Aleft = pos.left + 25 + "px";
                }
            }else{
                obj.Dleft = (pos.left+this.$el.width()/2-137) + "px";
                if(this.$el.offset().top + this.$el.find(".FolderBox").height() + 20 + pos.height > util.postion.Param.Screen.Height){
                    obj.imageName = "url(static/images/desktop_icon_show2.png)";
                    obj.Atop = pos.height + "px";
                    obj.Aleft = (255 / 2) + "px";
                }else{
                    obj.imageName = "url(static/images/desktop_icon_show1.png)";
                    obj.Atop = -13 + "px";
                    obj.Aleft = (255 / 2) + "px";
                }
            }
            obj.name = this.model.get("name");
            return $(this.templateFolderPop(obj));
        },
        /*
         * 获取弹出文件夹位置信息
         * */
        getPopFolderPosition:function(){
            var toTop = this.$el.offset().top;
            var toLeft = this.$el.offset().left;
            var height = 0;
            var length = this.model.get("folderApps").length;
            if(this.$el.find(".list_box").hasClass("control_btn_list")){
                if(length > 0){
                    height = 30 * length + 65;
                    if(height >= 255){
                        height = 255;
                    }
                }
            }else{
                if(length >0 &&length<=4){
                    height = 150;
                }
                if(length > 4){
                    height = 255;
                }
            }
            if(length <= 0){
                height = 80;
            }
            toTop = toTop + this.$el.find(".FolderBox").height() + 15;
            if((toTop+height)> util.postion.Param.Screen.Height){
                toTop = this.$el.offset().top-height-8;
            }
            return {
                left : toLeft,
                top : toTop,
                height : height
            };
        }
    });


    module.exports = {
        DesktopFolderMin: folderModel.DesktopFolderMin,
        DesktopFolderMinView: DesktopFolderMinView
    };
});