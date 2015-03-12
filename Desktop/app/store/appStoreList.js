/**
 * Created by 盖玉龙 on 2014/10/13. 应用中心的组件元素
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");
    var json2 = require("json2");

    var composite = require("app/desktop/desktopComposite");
    var application  = require("app/desktop/desktopApplication");
    var widget = require("app/desktop/desktopWidget");
    var element = require("app/desktop/desktopElement");

    var appStoreList_tpl = require("appStoreList_tpl");
    var appStoreGroup_tpl = require("appStoreGroup_tpl");

    /*
	*应用中心的应用元素
    */
    var AppStoreList = Backbone.Model.extend({defaults:{
        id: "",
        appId:"",
        appName:"",
        systemId: "",
        iconPath:"",
        appType: "",
        appIconPath: "",
        appCommand: "",
        //登录类型（如：third 第三方）
        loginType: "",
        param: "",
        openType: 0,
        //是否可访问
        isAccess:true,
        delFlag: 0,
        url:""
    }});
	
	/*
	*应用中心的应用元素集合
    */
    var AppStoreLists = Backbone.Collection.extend({
    	model:AppStoreList
    });

    /*
     *应用中心的搜索组元素
     */
    var AppStoreGroup = Backbone.Model.extend({defaults:{
        id: "",
        systemId: "",
        systemName:"",
        appList: new AppStoreLists(),
        count:0
    }});

    /*
     *应用中心的搜索组元素集合
     */
    var AppStoreGroups = Backbone.Collection.extend({
        model:AppStoreGroup
    });


    /*
	*应用中心的应用元素视图
    */
    var AppStoreListView = Backbone.View.extend({
    	templateList:_.template(appStoreList_tpl),
        templateGroup:_.template(appStoreGroup_tpl),
        events:{
            "click li a.add":"addAppToDesktop",//添加到桌面应用
            "click li":"addSelectedApp"

        },
    	setModel:function(listModel,groupModel){
            this.modelList = listModel;
            this.modelGroup = groupModel;

            this.appIdList = util.getLayersAppIds();

            this.listenTo(this.modelList, 'add', this.addAppStoreListElement);
            this.listenTo(this.modelList, 'reset', this.resetAppStoreList);
            this.listenTo(this.modelGroup, 'add', this.addAppStoreGroup);
            this.listenTo(this.modelGroup, 'reset', this.resetAppStoreGroup);
            this.render();

            var view = this;
            //复合应用销毁逻辑
            PubSub.unsubscribe(config.DestroyStoreListEvent);
            PubSub.subscribe(config.DestroyStoreListEvent,function(message,data){
                view.destroy();
            });
    	},
        destroy: function() {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
        },
    	render:function(){
            this.modelList.each(this.addAppStoreListElement,this);
            this.modelGroup.each(this.addAppStoreGroup,this);
    	},
        showList:function(){
            if(util.postion.Param.IsAppStoreGuid){
                $(".desktop_store .window_apply_result").hide();
                $(".desktop_store .window_apply_left .window_apply_searchResult").empty().hide();
                $(".desktop_store .window_apply_left .window_apply_title").html("").text("可选应用");
                this.$el.show();
            }else{
                this.$el.find(".store_search").empty().hide();
                $(".desktop_store .window_con_result").hide();
                this.$el.find(".store_list").show();
            }

        },
        showSearch:function(count){
            if(util.postion.Param.IsAppStoreGuid){

               // $(".desktop_store .window_apply_result").show();
                $(".desktop_store .window_apply_result span.count").text(count);
                $(".desktop_store .window_apply_result span.key").text(config.PageHelper.SearchKey);
                $(".desktop_store .window_apply_left .window_apply_title").html( $(".desktop_store .window_apply_result").html());
                $(".desktop_store .window_apply_left .window_apply_title span.key").css("color","red");
               this.$el.hide();
                $(".desktop_store .window_apply_left .window_apply_searchResult").show();
            }else{
                $(".desktop_store .window_con_result").show();
                $(".desktop_store .window_con_result span.count").text(count);
                $(".desktop_store .window_con_result span.key").text(config.PageHelper.SearchKey);

                this.$el.find(".store_list").hide();
                this.$el.find(".store_search").show();
            }

        },
        resetAppStoreList:function(){
            if(util.postion.Param.IsAppStoreGuid){
                this.$el.empty();
            }else{
                this.$el.find(".store_list ul.window_con_list").empty();
            }

        },
    	addAppStoreListElement:function(element){
            var view = this;
            var appElement = this.templateList(element.attributes);
            seajs.log(element.attributes);
            var $appElement = $(appElement);
            $appElement.data("data",element);
            $appElement.data("exist",false);
            //如果是复合应用
            if(config.PageHelper.AppType == config.ElementType.Widget){
                $appElement.addClass("widget");
            }
            var appData = $appElement.data("data");
            if(appData.get("appName").length>10){
                $appElement.find("h5").text(appData.get("appName").substring(0,9)+"...")
            }
            $appElement.attr("title",appData.get("appName"));
            $.each(view.appIdList,function(i,appId){
                if($appElement.data("data").get("appId") == appId){

                    $appElement.find("a").text("已添加");
                    $appElement.find("a").addClass("add1");
                    $appElement.data("exist",true);
                }
            });

            if(util.postion.Param.IsAppStoreGuid){
                $appElement.find("a").hide();
                this.$el.append($appElement);
                if($appElement.data("exist") == true){
                    $appElement.attr("disabled",true);
                   // $appElement.css("color","red");
                    $appElement.bind("click",function(){return false;});
                }
            }else{
                this.$el.find(".store_list ul.window_con_list").append($appElement);
                 //是否未配置
                if(element.get("isAccess") == false){
                        $appElement.find("a").text("未配置");
                        $appElement.find("a").addClass("add1");
                        $appElement.data("exist",true);
                }
		        this.dragAppElementEvent($appElement);
                if($appElement.data("exist") == true){
                    $appElement.draggable("disable");
                }
            }
            $appElement.find("img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });


    	},
        resetAppStoreGroup:function(){
            this.$el.find(".store_search").empty();
        },
	 /*
        * 添加已选应用
        * */
        addSelectedApp:function(event){
            var view  = this;
            if(!util.postion.Param.IsAppStoreGuid){

            }else{

                $(".guid_tip2").hide();
                $(".guid_tip3").show();

                var $element = $(event.currentTarget);
                var element = $element.data("data");
                var appElement = $element.clone();
                if($element.data("selected")){
                    $element.find(".sign").remove();
                    $element.data("selected",false);

                    var lilist = $(".window_apply_right .window_apply_con").find("li");
                    lilist.each(function (i) {
                        var data = $(this).data("data");
                        if (data.get("appId") == element.get("appId")) {
                            $(this).remove();
                        }
                    });
                }else{
                    $element.append("<span class=\"sign\"></span>");
                    $element.data("selected",true);

                    appElement.find(".sign").remove();
                    appElement.append("<span class=\"oper\"><a class=\"oper_del\" href=\"javascript:void(0)\"><\/a><\/span>");
                    appElement.data("data",$element.data("data"));
                    $(".window_apply_right .window_apply_con").append(appElement);
                    appElement.unbind("click").click(function(){
                        var lilist =  $(".window_apply_left .window_apply_con:visible").find("li");//view.$el.find("li");
                        lilist.each(function (i) {
                            var data = $(this).data("data");
                            if (data.get("appId") == appElement.data("data").get("appId")) {
                                $(this).find(".sign").remove();
                            }
                        });
                        $(this).remove();
                    });
                }
            }



        },
        /*
         * 搜索文本高亮
         * */
        setHeightKeyWord: function ($appElement) {
            var regex;
            var btn = $(".desktop_store").find(".search_input input");
            $appElement.highlightRegex();
            try { regex = new RegExp(btn.val()) }
            catch (e) { btn.addClass('error') }
            if (typeof regex !== 'undefined') {
                btn.removeClass('error');
                if (btn.val() != '')
                    $appElement.highlightRegex(regex);
            }
        },
        addAppStoreGroup:function(element){
            var view = this;

            var groupContainer = this.templateGroup(element.attributes);
            var $groupContainer = $(groupContainer);
            if(util.postion.Param.IsAppStoreGuid){
                element.get("appList").each(function(app,index){
                    var appElement = view.templateList(app.attributes);
                    var $appElement = $(appElement);
                    $appElement.data("data",app);
                    $appElement.data("exist",false);
                    $appElement.find("a").remove();
                    var appData = $appElement.data("data");
                    if(appData.get("appName").length>10){
                        $appElement.find("h5").text(appData.get("appName").substring(0,9)+"...")
                    }
                    $appElement.attr("title",appData.get("appName"));
                    $(".desktop_store .window_apply_left .window_apply_searchResult").append($appElement);
                    $appElement.unbind("click").click(function(event){
                        view.addSelectedApp(event);
                    });
                });
                return;
            }else{
                this.$el.find(".store_search").append($groupContainer);
            }



            element.get("appList").each(function(app,index){
                var appElement = view.templateList(app.attributes);
                var $appElement = $(appElement);
                $appElement.data("data",app);
                $appElement.data("exist",false);
                var appData = $appElement.data("data");
                if(appData.get("appName").length>10){
                    $appElement.find("h5").text(appData.get("appName").substring(0,9)+"...")
                }
                $appElement.attr("title",appData.get("appName"));
                $groupContainer.find("ul.window_con_list").append($appElement);
                $appElement.find("img").error(function(){
                    $(this).attr("src",config.AppDefaultIcon);
                });

                $.each(view.appIdList,function(i,appId){
                    if($appElement.data("data").get("appId") == appId){
                        $appElement.find("a").text("已添加");
                        $appElement.find("a").addClass("add1");
                        $appElement.data("exist",true);
                    }
                });

                //是否未配置
                if(app.get("isAccess") == false){
                    $appElement.find("a").text("未配置");
                    $appElement.find("a").addClass("add1");
                    $appElement.data("exist",true);
                }

                view.dragAppElementEvent($appElement);
                if($appElement.data("exist") == true){
                    $appElement.draggable("disable");
                }

                view.setHeightKeyWord($appElement);
            });
        },
        addAppToDesktop:function(event){

            var $element = $(event.currentTarget);
            if($element.parent().data("exist") == true){
                return;
            }

            var $storewindow = $(".desktop_store .desktop_window");
            var windowWidth = $storewindow.width();
            var windowheight = $storewindow.height();
            var windowLeft = parseInt($storewindow.css('left').replace(/px/, ''));
            var windowtop = parseInt($storewindow.css('top').replace(/px/, ''));

            var screenWidth = util.postion.Param.Screen.Width;
            var screenHeight = util.postion.Param.Screen.Height;

            if(this.addRow == undefined)
                this.addRow = 0;
            if(this.addCol == undefined)
                this.addCol = 0;

            var pos = {
                top : 0,
                left : 0
            };

            if((windowLeft + windowWidth + 100)>screenWidth)
            {
                pos.top = screenHeight/2;
                pos.left = screenWidth/2;
            }else{
                pos.top = windowtop  + this.addRow * util.postion.Param.Element.Height/3;
                pos.left = windowLeft + windowWidth + 10 + this.addCol * util.postion.Param.Element.Width ;

                this.addRow = this.addRow + 1;

                if( (this.addRow * util.postion.Param.Element.Height/3 )> windowheight){
                    this.addRow = 0;
                    this.addCol = this.addCol + 1;
                }
            }

            var appElementFromStore =   $element.parent().data("data");
            if (appElementFromStore.get("appType") == config.ElementType.Application) {
                //添加应用至桌面
                var appElementConvert = new application.DesktopApplication({
                    id: "A" + util.getNewId(),//appElementFromStore.get("id"),
                    name: appElementFromStore.get("appName"),
                    appId: appElementFromStore.get("appId"),
                    sysIconPath: appElementFromStore.get("iconPath"),
                    appIconPath: appElementFromStore.get("appIconPath"),
                    appCommand: appElementFromStore.get("appCommand"),
                    loginType: appElementFromStore.get("loginType"),
                    param: appElementFromStore.get("param"),
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: appElementFromStore.get("appType"),
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: appElementFromStore.get("openType"),
                    systemId: appElementFromStore.get("systemId"),
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: pos.top,
                        left: pos.left
                    }
                });

                PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."), appElementConvert);
            }

            if(appElementFromStore.get("appType") == config.ElementType.Composite){

                var compositeElments = new element.DesktopElements();

                var compsositeConvert = new composite.DesktopComposite({
                    id: "A" + util.getNewId(),//appElementFromStore.get("id"),
                    name: appElementFromStore.get("appName"),
                    appId: appElementFromStore.get("appId"),
                    appIconPath: appElementFromStore.get("appIconPath"),
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: appElementFromStore.get("appType"),
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: appElementFromStore.get("openType"),
                    systemId: appElementFromStore.get("systemId"),
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: pos.top,
                        left: pos.left
                    },
                    compositeApps:compositeElments
                });

                var paramArray = json2.parse(appElementFromStore.get("param"));
                $.each(paramArray,function(n,app){
                    compositeElments.add(new application.DesktopApplication({
                        id: "C" + util.getNewId(),
                        name: app.Name,
                        appId: app.AppID,
                        sysIconPath: app.IconPath,
                        appIconPath: app.AppIconPath,
                        appCommand: app.AppCommand,
                        //登录类型
                        loginType: app.LoginType,
                        param: app.param,
                        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                        appType: 0,
                        //0:BS 1:CS 2:独立，3内部启动
                        openType: app.OpenType,
                        systemId: app.SystemID
                    }));
                });

                PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."), compsositeConvert);
            }

            if(appElementFromStore.get("appType") == config.ElementType.Widget){
           // if (appElementFromStore.get("appType") == config.ElementType.Application){
                var desktopWidgetId = "W" + util.getNewId();
                var desktopWidget = new widget.DesktopWidget({
                    id:desktopWidgetId,
                    appId: desktopWidgetId,
                    name: appElementFromStore.get("appName"),
                    appType:1,
                    // position:toPos,
                    url:appElementFromStore.get("url")
                });
                desktopWidget.set("position", {
                    width: util.postion.Param.Widget.Width,
                    height: util.postion.Param.Widget.Height,
                    top: 0,
                    left: 0
                });
                PubSub.publishSync([util.getActiveLayerId(),config.CreateDesktopFloatEvent].join("."),desktopWidget);
            }

            $element.parent().find("a").text("已添加");
            $element.parent().find("a").addClass("add1");
            $element.parent().data("exist",true);
            $element.parent().draggable("disable");

            //this.$desktopAllELement = util.getAllLayers().find(".layer_element");
            this.appIdList = util.getLayersAppIds();
        },
        /*
        * 拖拽
        * */
        dragAppElementEvent:function($element){
            var view = this;

            var lastScrollHeight = 0;
            $element.draggable({
                helper:"clone",
                revert:"invalid",
                cursor:"context-menu",
                containment:"window",
                start:function(event,ui){
                    lastScrollHeight = $(".desktop_store").find(".window_con_height")[0].scrollTop;
                    ui.helper.find(".add").hide();
                    ui.helper.siblings().hide();
                    ui.helper.find("h5").css({"color":"#FFFFFF"});
                    $(".desktop_store .window_con_group").not(ui.helper.parent().parent()).hide();
                    $(".desktop_store .window_header").hide();
                    $(".desktop_store .window_left").hide();
                    $(".desktop_store .window_tab_menu").hide();
                    $(".desktop_store .window_con_item").hide();
                    $(".desktop_store .window_con_head").hide();
                    $(".desktop_store .desktop_window .window_right").css("background","none").css("borderLeft","0px");
                    $(".desktop_store .desktop_window").css("background","none");
                    $(".desktop_store .loadmore").hide();
                },
                drag:function(event,ui){},
                stop:function(event,ui){
                    ui.helper.find(".add").show();
                    ui.helper.siblings().show();
                    $(".desktop_store .window_header").show();
                    $(".desktop_store .window_left").show();
                    $(".desktop_store .window_tab_menu").show();
                    $(".desktop_store .window_con_item").show();
                    $(".desktop_store .window_con_head").show();
                    $(".desktop_store .window_con_group").show();
                    $(".desktop_store .desktop_window .window_right").css("background","#FFFFFF").css("borderLeft","1px");
                    $(".desktop_store .desktop_window").css("background","rgba(255, 255, 255, 0.86)");
                    $(".desktop_store .loadmore").show();
                    $(".desktop_store").find(".window_con_height").scrollTop(lastScrollHeight);

                    //view.$desktopAllELement = util.getAllLayers().find(".layer_element");
                    view.appIdList = util.getLayersAppIds();
                }
            }).data("from","store");
        }
    });

    module.exports = {
        AppStoreList:AppStoreList,
        AppStoreLists:AppStoreLists,
        AppStoreGroup:AppStoreGroup,
        AppStoreGroups:AppStoreGroups,
        AppStoreListView:AppStoreListView
    };
});