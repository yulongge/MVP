/**
 * Created by Administrator on 2014/9/29.
 */
define(function(require, exports, module){

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");
    var json2 = require("json2");

    var MvpService = require("mvpService");

    var desktop_tpl = require("desktop_tpl");
    var desktopPopMenu_tpl = require("desktopPopMenu_tpl");
    var folderPopMenu_tpl = require("folderPopMenu_tpl");
    var compositePopMenu_tpl = require("compositePopMenu_tpl");
    var applicationPopMenu_tpl = require("applicationPopMenu_tpl");
    var warnMessage_tpl = require("warnMessage_tpl");

    var appStoreGuidStep1_tpl = require("appStoreGuidStep1_tpl");
    var appStoreGuidStep2_tpl = require("appStoreGuidStep2_tpl");
    var guid_tpl = require("guid_tpl");

    var elBase = require("app/desktop/desktopElBase");
    var foldermax  = require("app/desktop/desktopFolder");

    /*
     * 桌面容器模型
     * */
    var DesktopContainer = Backbone.Model.extend({defaults:{
        theme:"",
        definedSkin:{
            url:"",
            style:"",
            data:[]
        },
        WebScale:1
    }});

    /*
     * 桌面容器视图
     * */
    var DesktopContainerView = Backbone.View.extend({
        el: "body",
        /*
         * 模板
         * */
        template: _.template(desktop_tpl),
        template_deskMenu: _.template(desktopPopMenu_tpl),
        template_appMenu: _.template(applicationPopMenu_tpl),
        template_comMenu: _.template(compositePopMenu_tpl),
        template_folderMenu: _.template(folderPopMenu_tpl),
        temolate_warnMessage: _.template(warnMessage_tpl),
        template_styleMenu: _.template("<% for(var n in menus) { %><li><a href='javascript:void(0)'><img src='<%= menus[n].bgUrl %>' data='<%= menus[n].data %>' alt='<%= menus[n].name %>' /><%= menus[n].name %></a></li><% } %>"),
        template_Guid_step1: _.template(appStoreGuidStep1_tpl),
        template_Guid_step2: _.template(appStoreGuidStep2_tpl),
        template_Guid: _.template(guid_tpl),
        /*
         * 事件绑定
         * */
        events: {
            "click": "bodyClick",
            "click span.button_add": "openStore",
            "click span.button_del": "removeThings",
            "click li.change_skin ul.popmenu_list_sec li": "changeStyleEvent",
            "click li.pxdesktop": "tidyDesktopEvent",
            "click li.delete_desktop": "deleteDesktopEvent",
            "click li.create_folder": "createFolderEvent" ,
            "click li.save_desktop": "saveDesktop",
            "click li.zldesktop": "groupAppEvent",
            "click li.refresh_desktop": "refreshDesktopEvent",
            "click li.create_compositeApp": "createCompositeAppEvent",
            "click li.edit_systemIcon": "reSelectSystemEvent",
            "click li.addClientApp": "addClientApp",
            "click li.changeSize":"changeSizeTheme"



        },
        /*
         * 桌面容器模型绑定
         * */
        setModel:function(model){
            this.model = model;
            this.model.bind("change", this.changeBackground, this);
            this.render();
            this.rightContextMenu();
            this.hideAllPopThings();
            //this.openStoreRender();
            //this.initGuidEvent();
        },
        /*
        * 释放视图
        * */
        destroy: function() {
            this.remove();
            this.model.off('change', this.changeBackground, this);
        },
        /*
         * 渲染桌面容器
         * */
        render:function(){

            util.importCssOrJs("static/style/desktopBig.css",false);
            util.importCssOrJs("static/style/folderBig.css",false);

            this.$el.html(this.template(this.model.attributes));
            this.$el.append(this.template_deskMenu());
            this.$el.append(this.template_appMenu());
            this.$el.append(this.template_comMenu());
            this.$el.append(this.template_folderMenu());
            this.renderStyleMenu();

            this.$el.find(".desktop_store").on("contextmenu",function(){return false;});
            this.$el.find(".desktop_composite").on("contextmenu",function(){return false;});
            this.$el.find(".desktop_message").on("contextmenu",function(){return false;});
            this.$el.find(".desktop_selectsystem").on("contextmenu",function(){return false;});

            //桌面变更
            var saveDesktopInterval = null;
            PubSub.subscribe(config.DesktopIsChangedEvent,function(message,data){
                if(config.IsInitFinish == false) return;

                if(saveDesktopInterval){
                    clearTimeout(saveDesktopInterval);
                }
                saveDesktopInterval = setTimeout(function(){
                    PubSub.publishSync(config.DesktopConfigSaveEvent);
                },500);
            });

            //保存桌面
            var view = this;
            PubSub.subscribe(config.DesktopConfigSaveEvent,function(message,data){
                var theme = view.model.get("theme");
                var definedSkin = view.model.get("definedSkin");
                var WebScale = view.model.get("WebScale");
                var layers = util.getLayers(view.$el);

                seajs.log(layers);

                PubSub.publish(config.SaveAdapterEvent,[layers,theme,definedSkin,WebScale]);
            });
            //提示信息
            PubSub.subscribe(config.ShowWarnMessageEvent,function(message,data){
                view.$el.find(".desktop_mask_layer").show();
                var $desktopMessage = view.$el.find(".desktop_message");
                $desktopMessage.append(view.temolate_warnMessage(data));
                $desktopMessage.find(".desktop_window").css({
                    left:(util.postion.Param.Screen.Width-util.postion.Param.WarnMessageSize.Width)/2,
                    top:(util.postion.Param.Screen.Height-util.postion.Param.WarnMessageSize.Height)/2
                }).width(util.postion.Param.WarnMessageSize.Width).height(util.postion.Param.WarnMessageSize.Height);
                if(data.cancelShow!=undefined){
                    $desktopMessage.find(".desktop_window").find(".window_gray").hide();
                }
                $desktopMessage.find(".desktop_window").find(".window_blue").unbind("click").click(function(){
                    data.confirm();
                    view.$el.find(".desktop_mask_layer").hide();
                    $desktopMessage.find(".desktop_window").remove();
                    $desktopMessage.hide();
                });
                $desktopMessage.find(".desktop_window").find(".window_gray").unbind("click").click(function(){
                    data.cancel();
                    view.$el.find(".desktop_mask_layer").hide();
                    $desktopMessage.find(".desktop_window").remove();
                    $desktopMessage.hide();
                });
                $desktopMessage.find(".oper3").unbind("click").click(function(){
                    $desktopMessage.find(".desktop_window").find(".window_gray").click();
                });
                $desktopMessage.find(".config_shade_con").height(util.postion.Param.WarnMessageSize.Height - 130);
                $desktopMessage.show();
            });

            PubSub.subscribe(config.InitGuid,function(message,data){
                view.initGuid(data);
            });

            //改变主题大小
            PubSub.unsubscribe(config.ChangeSizeCallBack);
            PubSub.subscribe(config.ChangeSizeCallBack,function(message,data){
                view.changeSize(data);
            });
            PubSub.unsubscribe(config.ChangeSize);
            PubSub.subscribe(config.ChangeSize,function(message,data){
                PubSub.publishSync(config.HideDesktopPopThings);
                MvpService.call(config.ChangeSize,data);
                //view.changeSize(data);
            });

            //设置选择系统的菜单
            var userLoginType = MvpService.get(config.GetLoginType);
            if(userLoginType != config.UserLoginType_MVP){
                this.$el.find(".edit_systemIcon").hide();
            }else{
                this.$el.find(".edit_systemIcon").show();
            }
        },
        /*
         * 背景主题设置菜单渲染
         * */
        renderStyleMenu:function(){
            this.$el.find("ul.popmenu_list_sec").html(this.template_styleMenu({"menus": config.ThemeStyle}));
        },

         changeSize:function(data){
           // var $element = $(event.currentTarget);

           if(data == 1.25){
                util.postion.Param.AppStoreSize=util.postion.Param.AppStoreBigSize;
                util.postion.Param.CompositeAppSize=util.postion.Param.CompositeAppBigSize;
                util.postion.Param.WarnMessageSize=util.postion.Param.WarnMessageBigSize;

                util.importCssOrJs("static/style/desktopBig.css",true);
                util.importCssOrJs("static/style/folderBig.css",true);
                this.model.set("WebScale",1.25);
            }else{
                util.postion.Param.AppStoreSize = util.postion.Param.AppStoreNormalSize;
                util.postion.Param.CompositeAppSize=util.postion.Param.CompositeAppNormalSize;
                util.postion.Param.WarnMessageSize=util.postion.Param.WarnMessageNormalSize;
              /*  $element.find("a").attr("value","1.25");
                $element.find("a").text("大");*/
                util.importCssOrJs("static/style/desktopBig.css",false);
                util.importCssOrJs("static/style/folderBig.css",false);
                this.model.set("WebScale",1);
            }


        },
         /*
         * 背景色变更
         * */
        changeBackground:function(){
            var data = this.model.get("theme");
            var theme = _.find(config.ThemeStyle,function (theme) { return theme.data == data; });
            if(theme == undefined){
                theme = _.first(config.ThemeStyle);
            }
            if(theme.data == "userDefined"){
                var definedSkin = this.model.get("definedSkin");
                if(definedSkin == undefined){
                    var tempData ={};
                    tempData.url = "static/images/desktop_bg_all.jpg";
                    tempData.style = "fill";
                    tempData.data = [];
                    this.model.set("definedSkin",tempData);
                    definedSkin = tempData;
                }
                if(definedSkin.url == ""){return;}
                this.$el.find(".desktop_image").css("backgroundImage","url('"+definedSkin.url+"')");
                this.$el.find(".desktop_image").removeClass("desktop_fill desktop_adapt desktop_stretch desktop_tile desktop_center");
                this.$el.find(".desktop_image").addClass("desktop_"+definedSkin.style);
            }else{
                this.$el.find(".desktop_bg").css("backgroundImage","url("+theme.bgUrl+")");
                this.$el.find(".desktop_bg").addClass("desktop_stretch");
            }
            seajs.log("changeBackground cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 自定义桌面
         * */
        definedBackground:function(data){
            var fileData = data[0][0];
            var fileName = fileData.FileName;
            var stretch = fileData.Stretch;
            var filename = fileName.replace(/\\/g,"\/");
            this.$el.find(".desktop_image").css("backgroundImage","url('"+filename+"')");
            this.$el.find(".desktop_image").removeClass("desktop_fill desktop_adapt desktop_stretch desktop_tile desktop_center");
            this.$el.find(".desktop_image").addClass("desktop_"+stretch);
            //config.DefinedSkinStyle = data;

           var tempData ={};
           // tempData.data = "userDefined";
            tempData.url = filename;
            tempData.style = stretch;
            tempData.data = data;
           // this.model.set("theme", tempData);
            this.model.set("theme","userDefined");
            this.model.set("definedSkin",tempData);

            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 点击事件
         * */
        bodyClick:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
        },
        /*
        * 隐藏所有的活动行为
        * */
        hideAllPopThings:function(){
            PubSub.subscribe(config.HideDesktopPopThings,function(message,data){
                //移除遮罩层
                $(".desktop_mask_layer").hide();
                //移除删除
                $(".layer_del").remove();
                //异常右键
                $(".desktop_popmenu").hide();
                //隐藏应用中心
                $(".desktop_store").hide();
                //隐藏复合应用
                $(".desktop_composite").hide();
                //释放应用中心监听事件
                PubSub.publishSync(config.DestroyStoreContainerEvent);
                PubSub.publishSync(config.DestroyStoreListEvent);
                PubSub.publishSync(config.DestroyStoreSystemEvent);
                PubSub.publishSync(config.DestroyStoreTypeEvent);

                //释放复合应用订阅事件
                PubSub.publishSync(config.DestroyCompositeViewEvent);
                //移除弹出文件夹
                PubSub.publishSync([util.getActiveLayerId(),config.RemovePopFolderEvent].join("."));
            });
        },
        /*
         * 初始化向导页面
         * */
        initGuidContainer:function(data){
           // var data = {"Citys":[{"Countys":[{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"1","Name":"County1"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"2","Name":"County2"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"3","Name":"County3"}],"Id":"1","Name":"City1"},{"Countys":[{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"1","Name":"County1"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"2","Name":"County2"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"3","Name":"County3"}],"Id":"2","Name":"City2"},{"Countys":[{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"1","Name":"County1"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"2","Name":"County2"},{"Powereds":[{"Id":"1","Name":"Powered1"},{"Id":"2","Name":"Powered2"},{"Id":"3","Name":"Powered3"}],"Id":"3","Name":"County3"}],"Id":"3","Name":"City3"}],"Teams":[{"Id":"1","Name":"Team1"}]};


            var view = this;
            view.$el.append(this.template_Guid());
            view.initGuidPosition(util.postion.Param.Guid.Width,util.postion.Param.Guid.Height);
            view.$el.find(".window_clock_btn").click(function(e){
                e.stopPropagation();
                view.$el.find("ul").hide();
                $(this).next().show();
            });
            $(".city_select .window_clock_list1").empty();
            _.each(data.Teams,function(v,i){
                var name = v.Name;
                var id = v.Id;
                var itemTemplate = "<li id="+id+">"+name+"<\/li>";
                $(".teams_select .window_clock_list1").append(itemTemplate);
                $(".teams_select .window_clock_list1").find("li:last").data("data",v);

            });

            $(".teams_select .window_clock_list1 li").click(function(){
                var selectedData = {};
                selectedData.name = $(this).text();
                selectedData.id = $(this).attr("id");
                $(".teams_select .window_clock_txt").data("data",selectedData);
                $(".teams_select .window_clock_txt").text($(this).text());
            });

            _.each(data.Citys,function(v,i){
                var name = v.Name;
                var id = v.Id;
                var itemTemplate = "<li id="+id+">"+name+"<\/li>";
                $(".city_select .window_clock_list1").append(itemTemplate);
                $(".city_select .window_clock_list1").find("li:last").data("data",v);

            });
            $(".city_select .window_clock_list1 li").click(function(){
                var data =  $(this).data("data");
                var tempdata = data.Countys;
                $(".country_select .window_clock_list1").empty();
                _.each(tempdata,function(v,i){
                    var name =v.Name;
                    var id = v.Id;
                    var itemTemplate = "<li id="+id+">"+name+"<\/li>";
                    $(".country_select .window_clock_list1").append(itemTemplate);
                    $(".country_select .window_clock_list1").find("li:last").data("data",v);
                });
                var selectedData = {};
                selectedData.name = $(this).text();
                selectedData.id = $(this).attr("id");
                $(".city_select .window_clock_txt").data("data",selectedData);
                $(".city_select .window_clock_txt").text($(this).text());

                $(".country_select .window_clock_list1 li").click(function(){
                    var data =  $(this).data("data");
                    var tempdata = data.Powereds;
                    $(".powereds_select .window_clock_list1").empty();
                    _.each(tempdata,function(v,i){
                        var name =v.Name;
                        var id = v.Id;
                        var itemTemplate = "<li id="+id+">"+name+"<\/li>";
                        $(".powereds_select .window_clock_list1").append(itemTemplate);
                        $(".powereds_select .window_clock_list1").find("li:last").data("data",v);
                    });
                    var selectedData = {};
                    selectedData.name = $(this).text();
                    selectedData.id = $(this).attr("id");
                    $(".country_select .window_clock_txt").data("data",selectedData);
                    $(".country_select .window_clock_txt").text($(this).text());

                    $(".powereds_select .window_clock_list1 li").click(function(){
                        var data =  $(this).data("data");
                        var tempdata = data.Teams;
                        $(".teams_select .window_clock_list1").empty();
                        var selectedData = {};
                        selectedData.name = $(this).text();
                        selectedData.id = $(this).attr("id");
                        $(".powereds_select .window_clock_txt").data("data",selectedData);
                        $(".powereds_select .window_clock_txt").text($(this).text());
                    });


                });



            });
            $(".window_btn_wrap1").click(function(){
                //{"CityId":"1","CountyId":"1","PoweredId":"1","TeamId":"1","IsTeamLeader":true}
                var sendData = {};
                if($(".city_select .window_clock_txt").data("data")!=undefined){
                    sendData.CityId =  $(".city_select .window_clock_txt").data("data").id;
                }else{
                    alert("请选择市级");
                    return;
                }
                if($(".country_select .window_clock_txt").data("data")!=undefined){
                    sendData.CountyId =  $(".country_select .window_clock_txt").data("data").id;
                }else{
                    alert("请选择县级");
                    return;
                }
                if($(".powereds_select .window_clock_txt").data("data")!=undefined){
                    sendData.PoweredId =  $(".powereds_select .window_clock_txt").data("data").id;
                }else{
                    alert("请选择供电所");
                    return;
                }
                if($(".teams_select .window_clock_txt").data("data")!=undefined){
                    sendData.TeamId =  $(".teams_select .window_clock_txt").data("data").id;
                }else{
                    alert("请选择班组");
                    return;
                }

                sendData.IsTeamLeader =  $(".identity_radio input:radio:checked").val();
               //sendData.IsTeamLeader =  $(".city_select .window_clock_txt").data("data").id;
                PubSub.publishSync(config.GuidSender,sendData);
                PubSub.publishSync(config.HideDesktopPopThings);
                view.$el.find(".desktop_window").remove();
            });


        },
        /*
         * 页面加载时，向导的位置和大小
         * */
        initGuid:function(data){
            this.initGuidContainer(data);
        },
        initGuidEvent:function(){
            PubSub.publishSync(config.GuidGetData);
        },
        /*
         * 页面加载时，向导的位置和大小
         * */
        initGuidPosition:function(width,height){
            var view = this;
            this.$el.find(".desktop_window").css({
                left:(util.postion.Param.Screen.Width-width)/2,
                top:(util.postion.Param.Screen.Height-height)/2
            }).width(width).height(height);
            $(".desktop_mask_layer").show();
            $(".desktop_window").click(function(e){
                e.stopPropagation();
                view.$el.find("ul").hide();
            });
            $(".desktop_mask_layer").click(function(e){
                e.stopPropagation();
            });
            $(".desktop_window .window_header_oper .oper3").click(function(){
                $(".desktop_window").remove();
                $(".desktop_mask_layer").hide();
            });
        },
        /*
         * 页面加载时，打开应用中心
         * */

        openStoreRender:function(){
            var view = this;
            this.$el.append(this.template_Guid_step1());
            this.initGuidPosition(util.postion.Param.GuidStep1.Width,util.postion.Param.GuidStep1.Height);
            $(".desktop_window").find(".oper3").unbind("click").click(function(e){
                view.$el.find(".desktop_window").remove();
                $(".desktop_mask_layer").hide();
            });
            $(".desktop_window").find(".window_blue").unbind("click").click(function(e){
                e.stopPropagation();
                view.$el.find(".desktop_window").remove();
                view.$el.append(view.template_Guid_step2());
                view.initGuidPosition(util.postion.Param.GuidStep2.Width,util.postion.Param.GuidStep2.Height);
                view.$el.find(".oper3").unbind("click").click(function(e){
                    view.$el.find(".desktop_window").remove();
                    $(".desktop_mask_layer").hide();
                });
                view.$el.find(".desktop_window .window_desktop_box .custom").unbind("click").click(function(e){
                    e.stopPropagation();
                    view.$el.find(".desktop_window").remove();
                    PubSub.publishSync(config.HideDesktopPopThings);
                });
                view.$el.find(".desktop_window .window_desktop_box .def").unbind("click").click(function(e){
                    e.stopPropagation();
                    view.$el.find(".desktop_window").remove();
                    $(".desktop_mask_layer").click(function(e){
                        e.stopPropagation();
                    });
                    PubSub.publishSync(config.GetSystems);
                    PubSub.publishSync(config.HideDesktopPopThings);
                    PubSub.publishSync(config.OpenAppStoreEvent);
                    $(".desktop_mask_layer").show();
                    util.postion.Param.IsAppStoreGuid = true;
                    $(".guid_tip1").show();
                });
            });

        },
        /*
         * 打开应用中心
         * */
        openStore:function(event){
            event.stopPropagation();
            util.postion.Param.IsAppStoreGuid = false;
            PubSub.publishSync(config.GetSystems);

            PubSub.publishSync(config.HideDesktopPopThings);
            PubSub.publishSync(config.OpenAppStoreEvent);
        },
        /*
        * 移除桌面元件
        * */
        removeThings:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
            var $layerDelElements = $(".layer_del");
            if($layerDelElements.length == 0){
                this.$el.find(".layer_element .del_before").each(function(){
                    var del_str = '<div class="layer_del"><a href="javascript:void(0)"></a></div>';
                    var $delElement = $(del_str);

                    $delElement.unbind("click").bind("click",function(event){
                        event.stopPropagation();
                        var $parentElment = $delElement.parent();
                        var data = $parentElment.data("data");
                        var isLock = $parentElment.data("lock");
                        var activeLayerid = util.getActiveLayerId();
                        if(data.get("lock")){
                            var data = {};
                            data.title = "温馨提醒";
                            data.msg = "此应用已锁，无法删除，请解锁，在进行删除操作！";
                            data.confirm = function(){};
                            data.cancel = function(){};
                            PubSub.publishSync(config.ShowWarnMessageEvent,data);
                            return;
                        }

                        if(data.get("appType") == config.ElementType.Application){
                            if($parentElment.data("from") == "desktop"){
                                //删除桌面应用
                                PubSub.publishSync([activeLayerid,config.RemoveDesktopElementEvent].join("."),data);
                            }else if($parentElment.data("from") == "folder"){

                                var folderId = $parentElment.data("folder");
                                var forder_lock = $parentElment.parents(".g_file").data("data");

                                if(forder_lock.get("lock")){
                                    var data = {};
                                    data.title = "温馨提醒";
                                    data.msg = "已锁文件夹内的应用禁止删除！";
                                    data.confirm = function(){};
                                    data.cancel = function(){};
                                    PubSub.publishSync(config.ShowWarnMessageEvent,data);
                                    return;
                                }
                                //删除文件夹应用
                                PubSub.publishSync([activeLayerid,folderId,config.RemoveFolderAppEvent].join("."),data);
                            }
                        }else if(data.get("appType") == config.ElementType.Folder){
                            //移除文件夹,最大化调用
							 var warmData = {};
							warmData.title = "温馨提醒";
							warmData.msg = "您确定要删除整个文件夹及里边的应用！";
							warmData.confirm = function(){};
							warmData.cancel = function(){};
							//PubSub.publishSync(config.ShowWarnMessageEvent,data);
                            if(data.get("folderType") == config.FolderType_MAX){
								
								if(data.get("folderApps").length<=0){
									 PubSub.publishSync([activeLayerid,config.RemoveDesktopFloatEvent].join("."),data);
									 return;
								}
								warmData.confirm = function(){	 
									 PubSub.publishSync([activeLayerid,config.RemoveDesktopFloatEvent].join("."),data)
                                    return;
							    };
								PubSub.publishSync(config.ShowWarnMessageEvent,warmData);

                               
                            }else if(data.get("folderType") == config.FolderType_MIN){
								
								if(data.get("folderApps").length<=0){
									PubSub.publishSync([activeLayerid,config.RemoveDesktopElementEvent].join("."),data);
									return;
								}
								warmData.confirm = function(){
									 PubSub.publishSync([activeLayerid,config.RemoveDesktopElementEvent].join("."),data);
							    };
								PubSub.publishSync(config.ShowWarnMessageEvent,warmData);
                                
                            }
                        }else if(data.get("appType") == config.ElementType.Composite){
                            //移除复合应用
                            PubSub.publishSync([activeLayerid,config.RemoveDesktopElementEvent].join("."),data);
                        }
                        if(config.CurrentLayoutType == config.LayoutType.Grid){
                            PubSub.publishSync([activeLayerid,config.ResetSortableCellEvent].join("."));
                        }
                    });

                    if($(this).parent().data("data").get("lock")){
                        return;
                    }else{
                        if($(this).parent().parents(".g_file").length>0){
                            if($(this).parent().parents(".g_file").data("data").get("lock")){
                                return;
                            }
                        }
                        $(this).after($delElement);
                    }

                });
            }else{
                $layerDelElements.remove();
            }
        },
        /*
         * 右键菜单
         * */
        rightContextMenu:function(){
            document.onselectstart = new Function("event.preventDefault();");
            var $desktoppopmenu = $('.default_popmenu');
            var $popmenumenu = $desktoppopmenu.find('#popmenu_menu');
            //var $popmenusec = $desktoppopmenu.find('.popmenu_list_sec');
            $('body').on('contextmenu', function (event) {
                event.stopPropagation();
                $popmenumenu.menu("collapseAll",null,true);
                PubSub.publishSync(config.HideDesktopPopThings);
                //$popmenusec.hide();
                $desktoppopmenu.show();
                var x = event.clientX;
                var y = event.clientY;
                var menuitem = $popmenumenu.children('li');
                var length= menuitem.length;
                var itemHeight = menuitem.height();
                var menuHeight = length*itemHeight;
                var menuWidth =  $popmenumenu.width();
                var sHeight = util.postion.Param.Screen.Height - 30;
                var sWidth = util.postion.Param.Screen.Width - 30;
                if(y+menuHeight>sHeight){
                    y = sHeight-menuHeight;
                }
                if(x+menuWidth>sWidth){
                    x = sWidth -menuWidth;
                }
                $desktoppopmenu.css({ left: x, top: y });

                //调试版本显示刷新菜单
                if(MvpService.isDebug())
                    $desktoppopmenu.find(".refresh_desktop").show();

                return false
            });
            //右键菜单
            $popmenumenu.menu();
        },
        /*
         * 改变主题事件
         * */
        changeStyleEvent:function(event){
            var data =  $(event.currentTarget).children("a").children("img").attr("data");
            if(data == "userDefined"){
                var definedSkin = this.model.get("definedSkin");
                PubSub.publishSync(config.HideDesktopPopThings);
                PubSub.publish(config.DefinedSkin,definedSkin.data);

                return;
            }
            this.model.set("theme", data);
            //config.DefinedSkinStyle = [];
        },
        /*
         * 整理桌面事件
         * */
        tidyDesktopEvent:function(event){
            PubSub.publishSync([util.getActiveLayerId(), config.TidyDesktopEvent].join("."));
        },
        /*
        * 确认删除桌面
        * */
        confirmDeleteDesktop:function(){
            if($(".desktop_layers").find(".desktop_layer").length == 1){
               // alert("The Last One!");
                PubSub.publishSync(config.RemoveLayerEvent,util.getActiveLayerId());
                $(".desktop_bullets_add").trigger("click");
                return;
            }
            PubSub.publishSync(config.RemoveLayerEvent,util.getActiveLayerId());
        },

        /*
         * 取消删除桌面
         * */
        cancelDeleteDestop:function(){
            return false;
        },

        /*
        * 删除桌面
        * */
        deleteDesktopEvent:function(event){
            var view  = this;
            var data = {};
            data.title = "温馨提醒";
            data.msg = "您确定要删除当前桌面及桌面上已有的应用及内容吗?";
            data.confirm = function(){
                view.confirmDeleteDesktop();
            };
            data.cancel = function(){
               view.cancelDeleteDestop();
            };
           PubSub.publishSync(config.ShowWarnMessageEvent,data);

        },
        /*
        * 创建文件夹
        * */
        createFolderEvent:function(event){
            var position = {
                top: Math.max(event.pageY - util.postion.Param.Folder.Height/2, 0),
                left: Math.max(event.pageX - util.postion.Param.Folder.Width/2, 0),
                width: util.postion.Param.Folder.Width,
                height: util.postion.Param.Folder.Height
            };
            var activeLayerid = util.getActiveLayerId();
            var folder = new foldermax.DesktopFolderMax();
            var folderId = "F" + util.getNewId();
            folder.set({
                id: folderId,
                appId: folderId,
                name: "文件夹",
                appType:5,
                position:position,
                folderType:config.FolderType_MAX,
                folderLayout:config.FolderLayout_Grid,
                folderApps:new elBase.DesktopElements()
            });
            //创建文件夹
            PubSub.publishSync([activeLayerid,config.CreateDesktopFloatEvent].join("."),folder);
        },
        /*
        * 分组应用到文件夹
        * */
        groupAppEvent:function(event){
            PubSub.publishSync([util.getActiveLayerId(),config.GroupAppToFolderEvent].join("."));
        },
        /*
         * 刷新桌面
         * */
        refreshDesktopEvent:function(event){
            window.location.reload(true);
        },
        /*
        * 复合应用
        * */
        createCompositeAppEvent:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
            PubSub.publishSync(config.OpenCompositeEvent);
        },
        /*
         * 选择系统
         * */
        reSelectSystemEvent:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
            PubSub.publishSync(config.SelectSystem,true);
        },
        /*
         * 添加本地应用程序
         * */
        addClientApp:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
            PubSub.publish(config.AddClientApp,[]);

        },
        /*
         * 元素大小变更
         * */
        changeSizeTheme:function(event){
            event.stopPropagation();
            PubSub.publishSync(config.HideDesktopPopThings);
            var $element = $(event.currentTarget);
            var value = $element.find("a").attr("value");
            var data =Number(value);
            if(data == 1.25){
                $element.find("a").attr("value","1");
                $element.find("a").text("大");
            }else{
                $element.find("a").attr("value","1.25");
                $element.find("a").text("小");
            }
            PubSub.publish(config.ChangeSize,data);
        },
        /*
         * 添加收藏应用
         * */
        addFavoriteApp:function(event){

            var data = {
                id: "A" + util.getNewId(), //appElementFromStore.get("id"),
                Name: "收藏",
                AppID:  util.getNewId(),
                IconPath: "http://portal4.aostar.sgcc.com.cn//resources/upload/8a6e50704841fae80148441e0b0c014f.png",
                AppCommand:"",
                param: "",
                //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                AppType:0,
                //0:BS 1:CS 2:独立，3内部启动
                OpenType:"",
                SystemID: "",
                position: {
                    width: util.postion.Param.Element.Width,
                    height: util.postion.Param.Element.Height
                }
            };
            PubSub.publishSync(config.FavoriteAppCallBack,data);
        },
        /*
        * 保存桌面
        * */
        saveDesktop:function(event){
            seajs.log("saveDesktop cause changed");

            PubSub.publishSync(config.DesktopIsChangedEvent);
        }
    });

    module.exports = {
        DesktopContainer: DesktopContainer,
        DesktopContainerView: DesktopContainerView
    };
});