/**
 * Created by Administrator on 2014/10/13.
 */
define(function (require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var compositeApp_tpl = require("compositeApp_tpl");
    var compositeIcon_tpl = require("compositeIcon_tpl");
    var compositeAppAdd_tpl = require("compositeAppAdd_tpl");
    var compositeMenu_tpl = require("compositeMenu_tpl");
    var compositeSelectApp_tpl = require("compositeSelectApp_tpl");
    var compositeSelectedApp_tpl = require("compositeSelectedApp_tpl");

    var deskEl = require("app/desktop/desktopElement");

    /*
    * 复合应用视图
    * */
    var CompositeAppContainer = Backbone.View.extend({
        el: "div.desktop_composite",
        templateComposite: _.template(compositeApp_tpl),
        templateCompositeIcon: _.template(compositeIcon_tpl),
        templateCompositeAppAdd: _.template(compositeAppAdd_tpl),
        templateCompositeMenu: _.template(compositeMenu_tpl),
        templateCompositeSelectApp: _.template(compositeSelectApp_tpl),
        templateCompositeSelectedApp: _.template(compositeSelectedApp_tpl),
        events: {
            "click": "compositeClick",
            "click .step_1 .window_apply_list li": "chooseIconClick",
            "click .step_1 .window_apply_form .window_blue": "setNameAndIcon",
            "click .step_1 .window_apply_form .window_gray": "closeView", //cancel
            "click .step_1 .window_apply_form .window_green": "saveName", //editName
            "click .step_1 .window_header_oper .oper3": "closeView",  //close         
            "click .step_2 .widnow_menu_list li": "menuClick",
            "click .step_2 .window_apply_left .window_apply_con li": "selectAppClick",
            "click .step_2 .window_header_return": "returnBack", //back
            "click .step_2 .window_header_oper .oper3": "closeView", //close
            "click .step_2 .window_btn_wrap .window_blue": "saveView" //save
        },
        setModel: function (model, systemList, appList) {
            this.model = model;
            this.systemList = systemList;
            this.appList = appList;
            this.listenTo(this.systemList, 'add', this.addPageSystemList);
            this.listenTo(this.appList, 'add', this.addPageAppList);
            this.listenTo(this.appList, 'reset', this.resetPageAppList);
            this.render();

            var view = this;

            //复合应用销毁逻辑
            PubSub.unsubscribe(config.DestroyCompositeViewEvent);
            PubSub.subscribe(config.DestroyCompositeViewEvent, function (message, data) {
                view.destroy();
            });
        },
        destroy: function () {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
            //this.remove();
        },
        /*
        * 桌面容器模型
        * */
        render: function () {
            this.$el.empty();
            this.initCompositeIcon();
            this.initCompositeMenu();
            this.initCompositeApps();
            this.makeSearchUi();
            this.bindScrollPage();
            this.showAndPosition();
            this.compsotieAppDrag();
            this.eidtNameSaveButton()
        },
        compsotieAppDrag: function () {
            this.$el.find(".desktop_window").draggable({
                handle: ".window_header"
            });
        },
        compositeClick: function (event) {
            event.stopPropagation();
        },
        addPageSystemList: function (system) {
            var $menuItem = $(this.templateCompositeMenu(system.attributes));
            this.$el.find(".step_2").find(".widnow_menu_list").append($menuItem);
            $menuItem.data("data", system);
            if (system.isActive) {
                $menuItem.addClass("active");

                config.PageHelper.Type = "ListField";
                config.PageHelper.PageIndex = 1;
                config.PageHelper.FieldId = system.get("fieldId");
                PubSub.publishSync(config.AppStorePageEvent);
            }
        },
        addPageAppList: function (model) {
            var $element = $(this.templateCompositeSelectApp(model.attributes));

            this.$el.find(".step_2").find(".window_apply_left .window_apply_con").append($element);

            $element.find("img").error(function () {
                $(this).attr("src", config.AppDefaultIcon);
            });

            $element.data("data", model);

            var $lilist = this.$el.find(".step_2").find(".window_apply_right .window_apply_con").find("li");
            var minicon = '<span class="sign"></span>';
            $lilist.each(function (i) {
                var data = $(this).data("data");
                if (model.get("appId") == data.get("appId")) {
                    $element.append(minicon);
                }
            });

            //搜索文本高亮
            this.setHeightKeyWord($element);
        },
        resetPageAppList: function () {
            this.$el.find(".step_2").find(".window_apply_left .window_apply_con").empty();
        },
        chooseIconClick: function (event) {
            event.stopPropagation();

            this.$el.find(".step_1 .window_apply_list li").find(".sign").remove();
            var $element = $(event.currentTarget);
            var minicon = '<span class="sign"></span>';
            $element.append(minicon);
        },
        /*
        * 菜单点击事件
        * */
        menuClick: function (event) {
            event.stopPropagation();

            var $element = $(event.currentTarget);
            $element.siblings().removeClass("active");
            $element.addClass("active");
            var field = $element.data("data");
            this.$el.find(".step_2").find(".window_apply_left .window_apply_con").empty();
            this.$el.find(".step_2").find(".search_input input").val("").trigger("change");
            this.$el.find(".step_2").find(".search_del").hide();
            this.$el.find(".step_2").find(".search_icon").show();
            this.$el.find(".step_2").find(".window_apply_left .window_apply_title").show();
            this.$el.find(".step_2").find(".window_apply_left .window_apply_result").hide();

            config.PageHelper.Type = "ListField";
            config.PageHelper.PageIndex = 1;
            config.PageHelper.FieldId = field.get("fieldId");
            PubSub.publishSync(config.AppStorePageEvent);
        },
        /*
        * 初始化复合应用位置
        * */
        showAndPosition: function () {
            var width = util.postion.Param.CompositeAppSize.Width;
            var height = util.postion.Param.CompositeAppSize.Height;
            this.$el.find(".step_1").css({
                left: (util.postion.Param.Screen.Width - width) / 2,
                top: (util.postion.Param.Screen.Height - height) / 2
            }).width(width).height(height).hide();
            this.$el.find(".step_2").css({
                left: (util.postion.Param.Screen.Width - width) / 2,
                top: (util.postion.Param.Screen.Height - height) / 2
            }).width(width).height(height).hide();
            this.$el.find(".step_2").find(".window_apply").height(height - 92);
            this.$el.find(".step_2").find(".window_apply_left .window_apply_con").height(height - 92 - 47);
            this.$el.find(".step_2").find(".window_apply_right .window_apply_con").height(height - 92 - 47);
            this.$el.show();
            this.$el.find(".step_1").hide().effect("fade", "slow").show();
        },
        /*
        * 编辑状态显示名称
        * */
        eidtNameSaveButton : function(){
            if (!this.model.isNewModel) {
                this.$el.find(".step_1").find(".window_header_title1").html("编辑复合应用");
                this.$el.find(".step_1").find(".window_green").show();
            }else{
                var minicon = '<span class="sign"></span>';
                this.$el.find(".step_1 .window_apply_list li:eq(0)").append(minicon);
            }
        },
        /*
        * 复合应用的图标选择
        * */
        initCompositeIcon: function () {
            var _this = this;
            this.$el.append(this.templateComposite());
            var $applyList = this.$el.find(".step_1").find(".window_apply_list");
            _.each(config.CompositeIcons, function (icon) {
                var $icon = $(_this.templateCompositeIcon(icon));
                $applyList.append($icon);
                $icon.data("data", icon);
            });

            var $compositeName = this.$el.find(".step_1").find(".composite_name");
            var $lilist = this.$el.find(".step_1 .window_apply_list li");
            if (this.model.isNewModel) {
                $compositeName.val("");
            } else {
                $compositeName.val(this.model.get("name"));
                $lilist.each(function (i) {
                    var data = $(this).data("data");
                    if (data.iconPath == _this.model.get("appIconPath")) {
                        $(this).click();
                    }
                });
            }
        },
        initCompositeApps: function () {
            this.model.get("compositeApps").each(this.addSelectedApp, this);
            this.selectedAppOperateIcon();
        },
        /*
        * 复合应用系统
        * */
        initCompositeMenu: function () {
            this.$el.append(this.templateCompositeAppAdd());
            this.$el.find(".step_2").hide();
        },
        /*
        * 复合应用添加应用
        * */
        setNameAndIcon: function (event) {
            event.stopPropagation();

            var $compositeInput = this.$el.find(".step_1").find(".composite_name");
            var $appNameTitle = this.$el.find(".step_1").find(".app_name_title");
            var $appNameTops = this.$el.find(".step_1").find(".window_tips");
            if ($compositeInput.val() == "" || $compositeInput.val().length > 10) {
                $appNameTitle.addClass("text_error");
                $appNameTops.addClass("text_error");
                $compositeInput.addClass("window_input_error");
                return false;
            } else {
                $appNameTitle.removeClass("text_error");
                $appNameTops.removeClass("text_error");
                $compositeInput.removeClass("window_input_error");
            }


            if (this.model.isNewModel) {
                var $selectSign = this.$el.find(".step_1 .window_apply_list li").find(".sign");
                var $appIconTitle = this.$el.find(".step_1").find(".app_icon_title");
                if ($selectSign.length == 0) {
                    $appIconTitle.addClass("text_error");
                    return false;
                } else {
                    $appIconTitle.removeClass("text_error");
                }
            }


            this.$el.find(".step_1").hide();
            this.$el.find(".step_2").show();

            return true;
        },
        /*
        * 复合应用窗口关闭
        * */
        closeView: function (event) {
            this.$el.hide();
        },
        /*
        * 编辑保存复合应用
        * */
        saveName: function (event) {
            event.stopPropagation();

            if(this.setNameAndIcon(event) == false){
                return;
            }

            if(this.model.isNewModel == false)
            {
                var compositeName = this.$el.find(".step_1").find(".composite_name").val();
                this.model.set("name",util.inputCheck(compositeName));

                var $selectSign = this.$el.find(".step_1 .window_apply_list li").find(".sign");
                if ($selectSign.length > 0) {
                    var data = $selectSign.first().parent().data("data");
                    this.model.set("appIconPath", data.iconPath);
                }
            }
            this.closeView();
        },
        /*
        * 选择应用触发事件
        * */
        selectAppClick: function (event) {
            event.stopPropagation();

            var $element = $(event.currentTarget);
            var element = $element.data("data");
            var isHaveSign = $element.find(".sign").length;
            if (isHaveSign > 0) {
                $element.find(".sign").remove();
                var lilist = this.$el.find(".step_2").find(".window_apply_right .window_apply_con").find("li");
                lilist.each(function (i) {
                    var data = $(this).data("data");
                    if (data.get("appId") == element.get("appId")) {
                        $(this).remove();
                    }
                });
            }
            else {
                var strVar = "<span class=\"sign\"><\/span>";
                $element.append(strVar);
                //添加应用至桌面
                var appElement = new deskEl.DesktopElement({
                    id: "A" + util.getNewId(), //appElementFromStore.get("id"),
                    name: element.get("appName"),
                    appId: element.get("appId"),
                    sysIconPath: element.get("iconPath"),
                    appIconPath: element.get("appIconPath"),
                    appCommand: element.get("appCommand"),
                    loginType: element.get("loginType"),
                    param: element.get("param"),
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: element.get("appType"),
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: element.get("openType"),
                    systemId: element.get("systemId"),
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: 0,
                        left: 0
                    }
                });
                this.addSelectedApp(appElement);
            }

            this.selectedAppOperateIcon();
        },

        /*
        * 添加已选择应用
        * */
        addSelectedApp: function (appElement) {
            var $element = $(this.templateCompositeSelectedApp(appElement.attributes));
            this.$el.find(".step_2").find(".window_apply_right .window_apply_con").append($element);
            $element.find("img").error(function () {
                $(this).attr("src", config.AppDefaultIcon);
            });
            $element.data("data", appElement);
        },

        /*
        * 已选择应用的操作按钮初始化
        * */
        selectedAppOperateIcon: function () {
            this.$el.find(".step_2").find(".window_apply_right .window_apply_con li .oper a").show();
            var first = this.$el.find(".step_2").find(".window_apply_right .window_apply_con li:first");
            var last = this.$el.find(".step_2").find(".window_apply_right .window_apply_con li:last");
            first.find(".oper_top").hide();
            first.find(".oper_up").hide();
            last.find(".oper_bottom").hide();
            last.find(".oper_down").hide();
            this.toUpOrDown();
        },

        /*
        * 已选择应用的操作
        * */
        toUpOrDown: function () {
            var _this = this;
            var lilist = this.$el.find(".step_2").find(".window_apply_right .window_apply_con li");
            lilist.find(".oper_top").unbind("click").click(function () {
                var obj = $(this).parent().parent().detach();
                var first = _this.$el.find(".window_apply_right .window_apply_con li:first");
                first.before(obj);
                _this.selectedAppOperateIcon();
            });
            lilist.find(".oper_up").unbind("click").click(function () {
                var obj = $(this).parent().parent();
                var prevobj = obj.prev().detach();
                obj.after(prevobj);
                _this.selectedAppOperateIcon();
            });
            lilist.find(".oper_bottom").unbind("click").click(function () {
                var obj = $(this).parent().parent().detach();
                var last = _this.$el.find(".window_apply_right .window_apply_con li:last");
                last.after(obj);
                _this.selectedAppOperateIcon();
            });
            lilist.find(".oper_down").unbind("click").click(function () {
                var obj = $(this).parent().parent();
                var nextobj = obj.next().detach();
                obj.before(nextobj);
                _this.selectedAppOperateIcon();
            });
            lilist.find(".oper_del").unbind("click").click(function () {
                var element = $(this).parent().parent().data("data");
                var rightlilist = _this.$el.find(".step_2").find(".window_apply_left .window_apply_con").find("li");
                rightlilist.each(function (i) {
                    var data = $(this).data("data");
                    if (data.get("appId") == element.get("appId")) {
                        $(this).find(".sign").remove();
                    }
                });
                $(this).parent().parent().remove();
                _this.selectedAppOperateIcon();
            });
        },

        /*
        * 搜索
        * */
        makeSearchUi: function () {
            var _this = this;

            var searchKey = "";
            _this.$el.find(".step_2").find(".widnow_search_bg").append("<a href=\"javascript:void(0)\" class=\"search_del\" style=\"display:none;\"></a>");
            _this.$el.find(".step_2").find(".search_input input").keyup(function () {
                if(searchKey == $(this).val()) return;

                if ($(this).val() != "") {
                    _this.$el.find(".step_2").find(".search_icon").hide();
                    _this.$el.find(".step_2").find(".search_del").show();

                    config.PageHelper.Type = "Search";

                } else {
                    _this.$el.find(".step_2").find(".search_del").hide();
                    _this.$el.find(".step_2").find(".search_icon").show();

                    config.PageHelper.Type = "ListField"
                }

                config.PageHelper.PageIndex = 1;
                config.PageHelper.SearchKey = util.inputCheck($(this).val());

                _this.$el.find(".step_2").find(".window_apply_left .window_apply_con").scrollTop(0);

                PubSub.publishSync(config.ResetCompositeAppEvent);
                PubSub.publishSync(config.AppStorePageEvent);

                searchKey = $(this).val();
            }).change(function(){
                searchKey =  $(this).val();
            });

            _this.$el.find(".step_2").find(".search_del").click(function () {
                _this.$el.find(".step_2").find(".search_input input").val("").trigger("change");
                _this.$el.find(".step_2").find(".search_del").hide();
                _this.$el.find(".step_2").find(".search_icon").show();


                config.PageHelper.Type = "List";
                config.PageHelper.PageIndex = 1;
                config.PageHelper.SearchKey = "";

                _this.$el.find(".step_2").find(".window_apply_left .window_apply_con").scrollTop(0);



                PubSub.publishSync(config.ResetCompositeAppEvent);
                PubSub.publishSync(config.AppStorePageEvent);
            });

        },
        /*
        * 搜索文本高亮
        * */
        setHeightKeyWord: function ($element) {
            var _this = this;
            var regex;
            var btn = _this.$el.find(".step_2").find(".search_input input");
            //var texts = _this.$el.find(".step_2").find(".window_apply_high");
            $element.highlightRegex();
            try { regex = new RegExp(btn.val()) }
            catch (e) { btn.addClass('error') }
            if (typeof regex !== 'undefined') {
                btn.removeClass('error');
                if (btn.val() != '')
                    $element.highlightRegex(regex);
            }
        },
        /*
        * 搜索结果
        * */
        showSearch: function (count) {
            this.$el.find(".step_2").find(".window_apply_left .window_apply_result").show();
            this.$el.find(".step_2").find(".window_apply_left .window_apply_title").hide();
            this.$el.find(".step_2").find(".window_apply_left .window_apply_result span.count").text(count);
            this.$el.find(".step_2").find(".window_apply_left .window_apply_result span.key").text(config.PageHelper.SearchKey);
            this.$el.find(".store_list").hide();
            this.$el.find(".store_search").show();
        },
        bindScrollPage: function () {
            this.$el.find(".step_2").find(".window_apply_left .window_apply_con").scroll(function () {
                var $scrollElement = $(this);
                var scrollElement = $scrollElement[0];
                if ((scrollElement.scrollHeight - scrollElement.scrollTop - $scrollElement.height()) <= 0) {
                    PubSub.publishSync(config.AppStorePageEvent);
                }
            });
        },
        /*
        * 返回
        * */
        returnBack: function (event) {
            event.stopPropagation();

            this.$el.find(".step_1").show();
            this.$el.find(".step_2").hide();
        },
        /*
        * 保存
        * */
        saveView: function (event) {
            event.stopPropagation();

            if (this.model.isNewModel) {
                var id = "C" + util.getNewId();
                this.model.set("id", id);
                this.model.set("appId", id);
                this.model.set("appType", config.ElementType.Composite);

                var screenWidth = util.postion.Param.Screen.Width;
                var screenHeight = util.postion.Param.Screen.Height;

                var pos = {
                    top: screenHeight / 2,
                    left: screenWidth / 2
                };

                this.model.set("position", {
                    width: 64,
                    height: 94,
                    top: pos.top,
                    left: pos.left
                });
            }

            var compositeName = this.$el.find(".step_1").find(".composite_name").val();
            this.model.set("name", util.inputCheck(compositeName));

            var $selectSign = this.$el.find(".step_1 .window_apply_list li").find(".sign");
            if ($selectSign.length > 0) {
                var data = $selectSign.first().parent().data("data");
                this.model.set("appIconPath", data.iconPath);
            }


            var compositeElments = new deskEl.DesktopElements();
            var $lilist = this.$el.find(".step_2").find(".window_apply_right .window_apply_con").find("li");
            if ($lilist.length > 0) {
                $lilist.each(function (i) {
                    var model = $(this).data("data");
                    model.set("index",i);
                    compositeElments.add(model.clone());
                });
            }
            this.model.set("compositeApps", compositeElments);

            if(this.model.isNewModel){
                PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."), this.model);
            }

            this.closeView();
        }
    });


    module.exports = {
        CompositeAppContainer: CompositeAppContainer
    };
});