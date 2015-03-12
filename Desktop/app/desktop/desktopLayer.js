/**
 * Created by Administrator on 2014/9/29.
 */
define(function (require, exports, module) {

    seajs.log("初始化：" + module.id);

    var json2 = require("json2");

    var util = require("app/util");
    var config = require("app/config");

    var element = require("app/desktop/desktopElement");
    var composite = require("app/desktop/desktopComposite");
    var application = require("app/desktop/desktopApplication");
    var widget = require("app/desktop/desktopWidget");

    /*
    * 虚拟桌面模型
    * */
    var DesktopLayer = Backbone.Model.extend({ defaults: {
        id: null,
        isActive: false
    }
    });

    /*
    * 虚拟桌面集合
    * */
    var DesktopLayers = Backbone.Collection.extend({
        model: DesktopLayer
    });

    /*
    * 虚拟桌面视图
    * */
    var DesktopLayersView = Backbone.View.extend({
        el: "div.desktop_main",
        /*
        * 模板
        * */
        templateLayer: _.template("<div class='desktop_layer' id='<%= id %>'></div>"),
        tempalteSwitcher: _.template("<a class='layer_switcher' href='javascript:void(0)' did='<%= id %>'><span></span></a>"),
        /*
        * 事件绑定
        * */
        events: {
            "click div.desktop_slide_left": "slideLeft",
            "click div.desktop_slide_right": "slideRight",
            "click a.desktop_bullets_add": "addNewLayer",
            "click a.layer_switcher": "switchLayer",
            "mousemove": "overLayerHelperMoveEvent",
            "mouseup": "overLayerFinishEvent"
        },
        /*
        * 虚拟桌面模型绑定
        * */
        setModel: function (model) {
            this.model = model;
            this.listenTo(this.model, 'add', this.addLayer);
            this.listenTo(this.model, 'remove', this.removeLayer);
            this.render();
            this.slideInit();

            var view = this;
            //删除桌面-右键菜单
            PubSub.subscribe(config.RemoveLayerEvent, function (message, data) {
                var desktops = view.model.where({ id: data });
                if (desktops.length == 1) {
                    view.model.remove(desktops[0]);
                }
            });

            //添加桌面
            PubSub.subscribe(config.CreateLayerEvent, function (message, data) {
                PubSub.publishSync(config.CreateNewLayerEvent, [view.model,data]);
            });


            //设置桌面顺序
            PubSub.subscribe(config.SetLayerIndex, function (message, data) {
                var selectLayerId = data[0];
                var newIndex =data[1];

                var switcherIds = [];
                 view.$el.find(".desktop_bullets .layer_switcher").each(function(i,s){
                     switcherIds.push($(s).attr("did"));
                 });

                var currentIndex = switcherIds.indexOf(selectLayerId);
                util.arrayMoveIndex(switcherIds,currentIndex,newIndex);

                if(switcherIds.length != util.getAllLayers().length) return;

                view.$el.find(".desktop_bullets .layer_switcher").each(function(i,s){
                    $(s).attr("did",switcherIds[i]);
                });

                var activeLayerId = util.getActiveLayerId();

                view.$el.find(".desktop_bullets a").removeClass("p_active");
                view.$el.find(".desktop_bullets a[did=" + activeLayerId + "]").addClass("p_active");

            });


        },

        /*
        * 释放视图
        * */
        destroy: function () {
            this.remove();
        },
        /*
        * 渲染虚拟桌面
        * */
        render: function () {
            this.model.each(this.addLayer, this);
            this.dropElementEvent();
            this.slideDragOverEvent();
        },
        /*
        * 添加虚拟桌面
        * */
        addLayer: function (layer) {
            var div = this.templateLayer(layer.attributes);
            var btn = this.tempalteSwitcher(layer.attributes);
            this.$el.find(".desktop_layers").append(div);
            this.$el.find(".desktop_bullets").append(btn);

            //设置当前选中状态
            var id = layer.get("id");
            var isActive = layer.get("isActive");
            var $layer = this.$el.find("div#" + id);

            if (isActive) {
                this.$el.find("div.desktop_layer").css({ left: util.postion.Param.Screen.Width + "px" }).hide();
                this.$el.find(".desktop_bullets a").removeClass("p_active");

                $layer.css({ left: "0px" }).show();
                this.$el.find(".desktop_bullets a[did=" + id + "]").addClass("p_active");
            } else {
                $layer.css({ left: util.postion.Param.Screen.Width + "px" }).hide();
                this.$el.find(".desktop_bullets a[did=" + id + "]").removeClass("p_active");
            }
            //每次增加设置slide位置
            this.slideInit();

            $layer.data("data", layer);
            //整理桌面作用域缩小到具体桌面
            PubSub.subscribe([id, config.TidyDesktopEvent].join("."), function (message, data) {
                config.IsInitFinish = false;

                var activeLayerid = util.getActiveLayerId();

                var position = {};
                //TODO:整理桌面元素，支持
                //PubSub.publishSync([activeLayerid,config.TidyElementsEvent].join(".") ,position);
                //整理文件夹
                PubSub.publishSync([activeLayerid, config.TidyFloatsEvent].join("."), position);

                config.IsInitFinish = true;

                seajs.log("TidyDesktopEvent cause changed");
                PubSub.publishSync(config.DesktopIsChangedEvent);

            });

            seajs.log("addLayer cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
        * 移除虚拟桌面
        * */
        removeLayer: function (layer) {
            var id = layer.get("id");
            var theLayer = $("#" + id);
            var theButtlet = $(".desktop_bullets").find("a[did=" + id + "]");
            var preLayer = theLayer.prev(".desktop_layer");
            var nextLayer = theLayer.next(".desktop_layer");
            var nextButtlet = theButtlet.next();
            var preButtlet = theButtlet.prev();
            theLayer.remove();
            theButtlet.remove();

            if (preLayer.length > 0) {
                preButtlet.trigger("click");
            } else {
                nextButtlet.trigger("click");
            }
            //移除虚拟桌面回调，清除注册事件
            PubSub.publishSync(config.RemoveLayerCallBack, id);

            seajs.log("removeLayer cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
        * 新增虚拟桌面
        * */
        addNewLayer: function () {
            var switcherLength = this.$el.find(".layer_switcher").length;
            if(switcherLength >= 10){
                var data = {};
                data.title = "温馨提醒";
                data.msg = "抱歉，最多只可以添加十个桌面！";
                data.confirm = function(){};
                data.cancel = function(){};
                PubSub.publishSync(config.ShowWarnMessageEvent,data);
                return;
            }

            var desktopId = "L" + util.getNewId();
            var desktopLayer = new DesktopLayer({
                id: desktopId,
                isActive: true
            });

            PubSub.publishSync(config.CreateNewLayerEvent, [this.model,desktopLayer]);

        },
        /*
        * 切换虚拟桌面
        * */
        switchLayer: function (ev) {
            var selectId = $(ev.currentTarget).attr("did");
            var activeId = $('.p_active').attr("did");
            var $activeLayer = $(".desktop_layer#" + activeId);

            if (selectId == activeId) return;

            var $layerswitchers = $('.layer_switcher');
            var selectIndex = $layerswitchers.index($(ev.currentTarget));
            var activeIndex = $layerswitchers.index($("a.p_active"));

            if (selectIndex > activeIndex) {
                $activeLayer.animate({ left: (-util.postion.Param.Screen.Width) + "px" }, 250, function () {
                    $activeLayer.css("left",util.postion.Param.Screen.Width + "px").hide();
                });
            } else {
                $activeLayer.animate({ left: util.postion.Param.Screen.Width + "px" }, 250, function () {
                    $activeLayer.css("left",util.postion.Param.Screen.Width + "px").hide();
                });
            }

            var $desktopBullets = $(".desktop_bullets");

            if (!$(ev.currentTarget).hasClass('p_active') || $(".desktop_layer").hasClass('p_active_animation')) {
                $desktopBullets.find('a.p_active').removeClass("p_active");
                $desktopBullets.find('a[did="' + selectId + '"]').addClass("p_active");

                var $selectLayer = $('.desktop_layer#' + selectId);

                if (selectIndex < activeIndex) {
                    $selectLayer.css("left", (-util.postion.Param.Screen.Width) + "px");
                    $selectLayer.show().animate({ left: "0px" }, 250, function () {
                    });
                } else {
                    $selectLayer.css("left", util.postion.Param.Screen.Width + "px");
                    $selectLayer.show().animate({ left: "0px" }, 250, function () {
                    });
                }
            }

            if (selectIndex == 0) {
                this.$el.find(".desktop_slide_left").hide();
                this.$el.find(".desktop_slide_right").show();
            } else if (selectIndex + 1 == $layerswitchers.length) {
                this.$el.find(".desktop_slide_right").hide();
                this.$el.find(".desktop_slide_left").show();
            } else {
                this.$el.find(".desktop_slide_left").show();
                this.$el.find(".desktop_slide_right").show();
            }
        },
        /*
        * 初始化边栏切换按钮
        * */
        slideInit: function () {
            var $layerswitchers = this.$el.find('.layer_switcher');
            if ($layerswitchers.length <= 1) {
                this.$el.find(".desktop_slide_left").hide();
                this.$el.find(".desktop_slide_right").hide();
            } else {
                var activeIndex = $layerswitchers.index($("a.p_active"));
                if (activeIndex == 0) {
                    this.$el.find(".desktop_slide_left").hide();
                    this.$el.find(".desktop_slide_right").show();
                } else if (activeIndex + 1 == $layerswitchers.length) {
                    this.$el.find(".desktop_slide_right").hide();
                    this.$el.find(".desktop_slide_left").show();
                } else {
                    this.$el.find(".desktop_slide_left").show();
                    this.$el.find(".desktop_slide_right").show();
                }
            }
        },
        /*
        * 左切换虚拟桌面
        * */
        slideLeft: function () {
            var $layerswitchers = $('.layer_switcher');
            var activeIndex = $layerswitchers.index($("a.p_active"));
            if (activeIndex > 0) {
                var activeId = $('.p_active').prev().attr("did");
                $(".desktop_bullets a[did=" + activeId + "]").click();
            }
        },
        /*
        * 右切换虚拟桌面
        * */
        slideRight: function () {
            var $layerswitchers = $('.layer_switcher');
            var activeIndex = $layerswitchers.index($("a.p_active"));
            if (activeIndex + 1 <= $layerswitchers.length) {
                var activeId = $('.p_active').next().attr("did");
                $(".desktop_bullets a[did=" + activeId + "]").click();
            }
        },
        /*
        * 图标切换桌面
        * */
        slideDragOverEvent: function () {
            var view = this;

            this.$el.find(".rightBorder,.leftBorder").bind("mouseover", function () {
                // 这样控制只有桌面的元素才能拖拽到其他页面，应用中心的跨平拖拽逻辑就暂时忽略了，
                // 还有文件夹内的图标想要直接拖到下一屏幕需要搞单独一下
                if (config.OverLayer.IsELementMoving == false) return;

                var firstOverLayer = config.OverLayer.IsToOtherLayer ==  false;
                if(firstOverLayer){
                    var originELement = config.OverLayer.DragOverUi.helper;
                    config.OverLayer.DragOverAnchor = originELement.clone(true).off();
                    var element =  config.OverLayer.DragOverAnchor.data("data");
                    var position = {
                        "top":originELement.position.top - 20,
                        "left":originELement.position.left - originELement.width()/2
                    };

                    if(element.get("appType") == config.ElementType.Folder && element.get("folderType") == config.FolderType_MAX||element.get("appType") == config.ElementType.Widget){
                        config.OverLayer.DragOverOrigin.draggable("cancel");
                        PubSub.publishSync([util.getActiveLayerId(),config.RemoveDesktopFloatEvent].join("."),element);
                    }
                    else{
                        config.OverLayer.DragOverOrigin.sortable("cancel");
                        PubSub.publishSync([util.getActiveLayerId(),config.RemoveDesktopElementEvent].join("."),element);
                    }

                    view.$el.append(config.OverLayer.DragOverAnchor);
                    config.OverLayer.DragOverAnchor.css(position);
                }

                var isDecRight = $(this).hasClass("rightBorder");
                if (isDecRight) {
                    view.slideRight();
                } else {
                    view.slideLeft();
                }

                config.OverLayer.IsELementMoving = true;
                config.OverLayer.IsToOtherLayer = true;
            });
        },
        /*
        * 跨屏幕拖拽移动逻辑
        * */
        overLayerHelperMoveEvent:function(event){
            if(event.which != 1) return;
            if(config.OverLayer.IsToOtherLayer == false) return;

            var width = config.OverLayer.DragOverAnchor.width();
            config.OverLayer.DragOverAnchor.css({"top":event.clientY - 20,"left":event.clientX - width/2})
        },
        /*
        * 跨屏幕拖拽完成
        * */
        overLayerFinishEvent:function(event){

            if(config.OverLayer.IsELementMoving == false ||
                config.OverLayer.IsToOtherLayer == false) return;

            var element = config.OverLayer.DragOverAnchor.data("data");

            var position = {
                left : config.OverLayer.DragOverAnchor.offset().left,
                top : config.OverLayer.DragOverAnchor.offset().top,
                width: config.OverLayer.DragOverAnchor.width(),
                height: config.OverLayer.DragOverAnchor.height()
            };
            var toPostion = util.postion.checkBoundary(position);

            element.get("position").left = toPostion.left;
            element.get("position").top = toPostion.top;

            if(element.get("appType") == config.ElementType.Folder && element.get("folderType") == config.FolderType_MAX||element.get("appType") == config.ElementType.Widget){
                PubSub.publishSync([util.getActiveLayerId(),config.CreateDesktopFloatEvent].join("."),element);
            }
            else{
                PubSub.publishSync([util.getActiveLayerId(),config.CreateDesktopElementEvent].join("."),element);
            }


            config.OverLayer.DragOverAnchor.remove();
            config.OverLayer.IsELementMoving = false;
            config.OverLayer.IsToOtherLayer = false;
        },
        /*
        * 拖放事件
        * */
        dropElementEvent: function () {
            this.$el.droppable({
                accept: ".g_file .layer_button,.appstore_list_app li",
                greedy: true,
                over: function (event, ui) {
                },
                drop: function (event, ui) {
                    var $appElement = ui.draggable;
                    var from = $appElement.data("from");
                    var layerId = util.getActiveLayerId();
                    var x = event.clientX;
                    var y = event.clientY;
                    var pos = {
                        top: y - util.postion.Param.Element.Height / 2,
                        left: x - util.postion.Param.Element.Width / 2,
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height
                    };
                    //边缘检测
                    var toPos = util.postion.checkBoundary(pos);


                    if (from == "folder") {
                        if ($appElement.data("outfolder") == false) return;

                        var appElementFromFolder = $appElement.data("data");
                        var forlderId = $appElement.data("folder");
                        var forlder = $("#" + forlderId).data("data");
                        if(appElementFromFolder.get("lock")||forlder.get("lock")){
                            var data = {};
                            data.title = "温馨提醒";
                            data.msg = "此应用已锁，请解锁，再放入桌面中";
                            data.confirm = function(){};
                            data.cancel = function(){};
                            PubSub.publishSync(config.ShowWarnMessageEvent,data);
                            return;
                        }

                        appElementFromFolder.set("position", {
                            width: util.postion.Param.Element.Width,
                            height: util.postion.Param.Element.Height,
                            top: toPos.top,
                            left: toPos.left
                        });

                        //移除文件夹中的应用
                        PubSub.publishSync([layerId, $appElement.data("folder"), config.RemoveFolderAppEvent].join("."), appElementFromFolder);
                        //添加应用至桌面
                        PubSub.publishSync([layerId, config.CreateDesktopElementEvent].join("."), appElementFromFolder);
                    } else if (from == "store") {

                        if($appElement.data("exist") == false){
                            $appElement.draggable("disable");
                            $appElement.find("a").text("已添加");
                            $appElement.find("a").addClass("add1");
                            $appElement.data("exist",true);
                        }

                        var appElementFromStore = $appElement.data("data");
                        //如果是复合应用
                        if (appElementFromStore.get("appType") == config.ElementType.Widget){
                       // if(config.PageHelper.AppType == config.ElementType.Widget){
                            var toPos = util.postion.checkBoundary(pos);
                           // var activeLayerid = util.getActiveLayerId();
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
                                top: toPos.top,
                                left: toPos.left
                            });
                            PubSub.publishSync([layerId,config.CreateDesktopFloatEvent].join("."),desktopWidget);
                            return;
                        }
                        if (appElementFromStore.get("appType") == config.ElementType.Application) {
                            //添加应用至桌面
                            var appElementConvert = new application.DesktopApplication({
                                id: "A" + util.getNewId(), //appElementFromStore.get("id"),
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
                                    top: toPos.top,
                                    left: toPos.left
                                }
                            });

                            PubSub.publishSync([layerId, config.CreateDesktopElementEvent].join("."), appElementConvert);
                        }

                        if (appElementFromStore.get("appType") == config.ElementType.Composite) {

                            var compositeElments = new element.DesktopElements();
                            var compsositeConvert = new composite.DesktopComposite({
                                id: "A" + util.getNewId(), //appElementFromStore.get("id"),
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
                                    top: toPos.top,
                                    left: toPos.left
                                },
                                compositeApps: compositeElments
                            });

                            var paramArray = json2.parse(appElementFromStore.get("param"));
                            $.each(paramArray, function (n, app) {
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
                                    x: app.OpenType,
                                    systemId: app.SystemID
                                }));
                            });

                            PubSub.publishSync([layerId, config.CreateDesktopElementEvent].join("."), compsositeConvert);
                        }


                    }
                }
            });
        }
    });

    module.exports = {
        DesktopLayer: DesktopLayer,
        DesktopLayers: DesktopLayers,
        DesktopLayersView: DesktopLayersView
    };
});