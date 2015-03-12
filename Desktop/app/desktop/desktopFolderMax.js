/**
 * Created by Administrator on 2014/10/13.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var folder_tpl = require("folder_tpl");
    var application_tpl = require("application_tpl");

    var flBase = require("app/desktop/desktopFlBase");

    var folderModel = require("app/desktop/desktopFolder");

    var application  = require("app/desktop/desktopApplication");
    /*
    * 桌面文件夹视图
    * */
    var DesktopFolderMaxView = flBase.DesktopFloatView.extend({
        /*
         * 模板
         * */
        tempalteFolder: _.template(folder_tpl),
        tempalteApp: _.template(application_tpl),
        /*
        * 事件
        * */
        events: {
            "click div.showway": "showListOrGrid",
            "click a.pack_up": "switchFolderMin",
            "click div.layer_min": "showPopMaxFolder",
            "dblclick div.layer_app": "appButtonClick",
            "click div.btn_lock":"folderLock"
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
            this.remove();
        },

        /*
        * 渲染界面
        * */
        render:function() {
            var $folderMaxEl = $(this.tempalteFolder(this.model.attributes));
            this.setElement($folderMaxEl);

            //=======Init MaxFolder========//
            this.positionFolder();
            this.rightContextMenu();
            this.dragFolderEvent();
            this.resizableEvent();
            this.renameFolder();
            this.hoverEvent();
            this.sortableFolder();
            this.dropAddAppEvent();

            //初始化文件夹布局
            this.folderLayoutChange(this.model);

            this.model.get("folderApps").each(this.addApplication, this);

            this.$el.data("data",this.model);
        },
        /*
         * 添加文件夹APP
         * */
        addApplication:function(appElement){

            var appElementEl = this.tempalteApp(appElement.attributes);

            var $appElement = $(appElementEl);

            $appElement.data("data",appElement);
            $appElement.data("from","folder");  //元素位置
            $appElement.data("folder",this.model.get("id"));  //哪个文件夹
            $appElement.data("desktop",this.layer.get("id")); //哪个桌面

            if(this.model.get("folderLayout") == config.FolderLayout_List){
                $appElement.css("float","none");
            }else{
                $appElement.css("float","left");
            }
            var data =  $appElement.data("data");
            if(data.get("name").length>10){
                $appElement.find("h4").text(data.get("name").substring(0,9)+"...")
            }
            $appElement.attr("title",data.get("name"));
            if(data.get("lock")){
                $appElement.find(".layer_column").append("<span class=\"sign_lock\"><\/span>");
            }

            $appElement.css({"position":"relative","margin-left":"5px","margin-top":"5px"});

            $appElement.find("img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });

            var $listBox = this.$el.find(".list_box");

            $appElement.appendTo($listBox).hide().fadeIn();

            this.rightApplicationMenu($appElement);

            seajs.log("folderAddApplication cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 移除文件夹APP
         * */
        removeApplication:function(appElement){
            var id = appElement.get("id");
            var $element = this.$el.find("#"+id);
            $element.fadeOut(function(){
                $element.remove();

                seajs.log("folderRemoveApplication cause changed");
                PubSub.publishSync(config.DesktopIsChangedEvent);
            });
        },
        /*
         * 右键菜单
         * */
        rightApplicationMenu:function($element){
            var view = this;
            $element.on("contextmenu",function(event){
                event.stopPropagation();

                var element = $element.data("data");

                var $applicationPopmenu = $(".application_popmenu");
                $applicationPopmenu.css({ left: $(this).offset().left + 65, top: $(this).offset().top });
                if($element.parents(".g_file").data("data").get("lock")){
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
                        config.eidtClientApp = $element;
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
                        view.model.get("folderApps").remove(element);
                    }

                });
                $applicationPopmenu.find(".popmenu_open").unbind("click").click(function(){
                    $element.trigger("dblclick");
                });
                $applicationPopmenu.find(".popMenu_lock").unbind("click").click(function(){
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
            if(folder.get("folderType") == config.FolderType_MIN) {
                var desktopId = util.getActiveLayerId();
                folder.get("position").width = util.postion.Param.Element.Width;
                folder.get("position").height = util.postion.Param.Element.Height;
                config.isFolderTypeChange = true;
                PubSub.publishSync([desktopId,config.RemoveDesktopFloatEvent].join("."),folder);
                var folderMin = new folderModel.DesktopFolderMax();
                var folderId = "F" + util.getNewId();
                folderMin.set({
                    id: folderId,
                    appId:  folder.get("appId"),
                    name: folder.get("name"),
                    appType:config.ElementType.Folder,
                    position:folder.get("position"),
                    folderType:folder.get("folderType"),
                    folderLayout:folder.get("folderLayout"),
                    folderApps: folder.get("folderApps"),
                    lock:folder.get("lock")
                });
                PubSub.publishSync([desktopId,config.CreateDesktopElementEvent].join("."),folderMin);
                config.isFolderTypeChange = false;
            }
        },
        /*
        * 文件夹布局修改
        * */
        folderLayoutChange:function(folder){
            if(folder.get("folderLayout") == config.FolderLayout_List){
                this.$el.find(".showway").addClass("btn_list");
                this.$el.find(".showway").find("img").attr("src", "static/images/desktop_folder_list1.png");
                this.$el.find(".list_box").addClass("control_btn_list");
                this.$el.find(".list_box .layer_button").css("float", "none");
                this.$el.find(".showway").attr("title","图标");
            }else {
                this.$el.find(".list_box").removeClass("control_btn_list");
                this.$el.find(".list_box .layer_button").css("float","left");
                this.$el.find(".showway").find("img").attr("src","static/images/desktop_folder_list2.png");
                this.$el.find(".showway").removeClass("btn_list");
                this.$el.find(".showway").attr("title","列表");
            }

            if(folder.get("lock")){
                this.$el.find(".btn_lock").css("backgroundImage","url(static/images/desktop_folder_lock.png)");
                this.$el.find(".list_box").sortable("disable");
            }else{
                this.$el.find(".btn_lock").css("backgroundImage","url(static/images/desktop_folder_open.png)");
                this.$el.find(".list_box").sortable("enable");
            }
        },
        /*
        * 排序支持
        * */
        sortableFolder:function(){
            var view = this;
            this.$el.find(".list_box").sortable({
                placeholder:"sortable_placeholder",
                tolerance:"pointer",
                start:function(event,ui){
                    ui.placeholder.attr("style",ui.item.attr("style")).css({"position":"relative"});
                    PubSub.publishSync(config.HideDesktopPopThings);

                    PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),view.$el);
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

                    seajs.log("sortableFolder cause changed");
                    PubSub.publishSync(config.DesktopIsChangedEvent);
                }
            });
        },
        /*
         * 计算布局
         * */
        computeCellIndexAndPostion:function(){
            var $sortableElement = this.$el.find(".list_box").find("> div.layer_element").not(".sortable_placeholder");
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
         * 切换至文件夹最小化模式
         * */
        switchFolderMin:function(event){
            event.stopPropagation();
            this.model.set("folderType",config.FolderType_MIN);
        },
        /*
         * 文件夹锁定
         * */
        folderLock:function(event){
            var $element = $(event.currentTarget);
            var folder = this.$el.data("data");
            if(folder.get("lock")){
                folder.set("lock",false);
                $element.css("backgroundImage","url(static/images/desktop_folder_open.png)");
                this.$el.find(".list_box").sortable("enable");
            }else{
                folder.set("lock",true);
                $element.css("backgroundImage","url(static/images/desktop_folder_lock.png)");
                this.$el.find(".list_box").sortable("disable");
            }

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
        dragFolderEvent:function(){
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
                    var toPos =  util.postion.checkBoundary(pos,{top:util.postion.Param.Folder.MarginTop,bottom:util.postion.Param.Folder.MarginBottom});
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
                minWidth:util.postion.Param.Folder.Width,
                minHeight:util.postion.Param.Folder.Height,
                maxHeight:800,
                maxWidth:800,
                resize:function(event,ui){
                    view.$el.find(".list_box").css("height",(view.$el.height() - 35)+"px");
                    PubSub.publishSync([util.getActiveLayerId(),config.ToAllElementTopEvent].join("."),view.$el);
                },
                stop:function(event,ui){
                    var pos = {
                        top : ui.position.top,
                        left : ui.position.left,
                        width : ui.helper.width(),
                        height : ui.helper.height()
                    };
                   var toPos = util.postion.checkBoundary(pos,{top:util.postion.Param.Folder.MarginTop,bottom:util.postion.Param.Folder.MarginBottom});
                    view.$el.find(".list_box").css("height",(toPos.height - 35)+"px");
                    ui.helper.animate(toPos);
                    view.model.set("position", toPos);
                }
            });
            this.$el.find(".ui-resizable-handle").css("z-index",0);
        },
        /*
         * 拖拽移动应用事件
         * */
        dropAddAppEvent:function(){
            var view = this;
            this.$el.find(".list_box").droppable({
                accept:".layer_button,.appstore_list_app li:not(.widget)",
                greedy:true,
                drop:function(event,ui){
                    var model = ui.draggable.data("data");
                    var data = {};
                    data.title = "温馨提醒";
                    data.confirm = function(){};
                    data.cancel = function(){};
                   if(model.get("openType")==7){
                       data.msg = "本地应用程序禁止放入文件夹中";
                       PubSub.publishSync(config.ShowWarnMessageEvent,data);
                       return;
                   }
                   if(view.$el.data("data").get("lock")){
                      /* if(ui.draggable.data("from")=="folder"){
                            return;
                       }else{*/
                           data.msg = "文件夹已锁，请解锁，在放入文件夹中";
                           PubSub.publishSync(config.ShowWarnMessageEvent,data);
                           return;
                      // }

                   }else if(model.get("lock")){
                      if(ui.draggable.parents(".g_file").data("data")!=null){
                          if(ui.draggable.parents(".g_file").data("data").get("appId")==view.$el.data("data").get("appId")){
                              return;
                          }
                      }
                        data.msg = "此应用已锁，请解锁，在放入文件夹中";
                        PubSub.publishSync(config.ShowWarnMessageEvent,data);
                        return;
                    }else if(model.get("appType") == config.ElementType.Application) {
                        view.dropHandle(ui);
                    }else{
                        if(
                            model.get("appType") == config.ElementType.Composite ||
                                model.get("appType") == config.ElementType.Folder
                            ){
                            var typeName = model.get("appType") == config.ElementType.Composite ? "复合应用": "文件夹";
                            data.msg = typeName + "不支持放到文件夹内！";
                            data.cancelShow = false;
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
                var forlderId = $appElement.data("folder");
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

                if(appElement.get("appType") == config.ElementType.Application){
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
                            width: util.postion.Param.Element.Width,
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
         * 文件夹重命名
         * */
        renameFolder:function(){
            var view = this;
            this.$el.find("input").click(function(event){
                $(this).addClass("text_click");
                $(this).css("cursor","text");
                $(this).val(view.model.get("name"));
                $(this).select();
                event.stopPropagation();
            }).blur(function(){
                var $input = $(this);
                var value = $input.val();
                    if(value.indexOf("...")>0){
                        value = view.model.get("name");
                    }
                if(util.inputCheck(value) == "" || util.inputCheck(value).length > 10){
                   /* var data = {};
                    data.title = "温馨提醒";
                    data.msg = "您输入内容:<font color='red'>\""+ util.inputCheck(value) +"\"</font><br/>请确认输入内容,建议1~10个汉字";
                    data.confirm = function(){
                        view.$el.find("input").addClass("text_click");
                        view.$el.find("input").css("cursor","text");
                        view.$el.find("input").select();
                        view.$el.find("input").focus();
                    };
                    data.cancel = function(){
                        $input.val(view.model.get("name"));
                        view.$el.find(".titleZC a").attr("title",view.model.get("name"));
                    };
                   // PubSub.publishSync(config.ShowWarnMessageEvent,data);

                    //$input.val(util.inputCheck(value));*/
                    //$input.val(util.inputCheck(value))
                    view.model.set("name",util.inputCheck(value));
                    view.$el.find(".titleZC a").attr("title",util.inputCheck(view.model.get("name")));
                    $input.val(util.inputCheck(view.model.get("name")).substring(0,10)+"...");
                    $input.removeClass("text_click");
                    $input.css("cursor","context-menu");
                    view.$el.find(".titleZC").show();
                }else{
                    //名称改变
                    $input.val(util.inputCheck(value));
                    view.model.set("name",util.inputCheck(value));
                    view.$el.find(".titleZC a").attr("title",util.inputCheck(value));
                    $input.removeClass("text_click");
                    $input.css("cursor","context-menu");
                    view.$el.find(".titleZC").show();
                }
            });

            this.$el.find(".title").click(function(){
                view.$el.find("input").blur();
            });

            this.$el.find(".titleZC").dblclick(function(e){
                e.stopPropagation();
               // this.$el.find(".title").unbind("click");
                if(view.$el.data("data").get("lock")){
                    return;
                }
                $(this).hide();
                view.$el.find("input").click();
            });

            //this.$el.find(".titleZC a").attr("title",this.$el.find("input").val());
            this.$el.find(".titleZC a").attr("title", view.model.get("name"));
        },
        /*
        * 悬停事件
        * */
        hoverEvent:function(){
            var view = this;
            this.$el.hover(function(){
                if(view.$el.find(".layer_del").length<=0){
                    $(this).find(".showway").show();
                    $(this).find(".buts").show();
                    //$(this).find(".btn_lock").show();
                }
            },function(){
                $(this).find(".showway").hide();
                $(this).find(".buts").hide();
                //$(this).find(".btn_lock").hide();
            });
        },
        /*
         * 设置文件夹尺寸
         * */
        positionFolder:function(){
            this.$el.css(this.model.get("position"));
            this.$el.find(".list_box").css("height",(this.$el.height() - 35) + "px");
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
        }
    });

    module.exports = {
        DesktopFolderMax: folderModel.DesktopFolderMax,
        DesktopFolderMaxView: DesktopFolderMaxView
    };
});